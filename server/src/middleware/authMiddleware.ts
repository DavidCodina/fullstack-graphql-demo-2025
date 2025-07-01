import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from 'models/userModel'

/* ========================================================================
                            authMiddleware()           
======================================================================== */
////////////////////////////////////////////////////////////////////////////////
//
// In some examples, I've seen people send both an accessToken and refreshToken as httpOnly cookies.
// However, that doesn't really make sense. Both cookies would be sent across the network with equal
// frequency and are equally secure/vulnerable.
//
// Alternatively, we could store the refreshToken in the database, and use its presence as a gatekeeper.
// However, this idea is not dependent an using a refreshToken. The same approach could work just as well
// with a long-lived accessToken.
//
// The only time a refreshToken really makes sense is when the accessToken is being sent in the response body, stored
// on the client in localStorage, and the refreshToken is being sent as an httpOnly cookie. However, that approach is
// already an anti-pattern.
//
// One of the primary selling points of JWTs is that they can be used as a stateless authentication mechanism in
// distrubted systems, where multiple servers may need to check the validity of tokens. However, if the revocation
// strategy entails always checking for the presence of the token in the database (i.e., increasing coupling), you've
// now made the strategy dependent on all servers having access to the same database.
//
// One could argue that you might as well just be using a Node session. While that may be true, the one argument still
// in favor of this hybrid approachh is that sessions are not possible in a serverless environment like Next.js or
// in cases where our Express server may even be serverless.
//
// Ultimately, how one implements authentication depends heavily on the nuances of the application architecture.
// Conclusion: I don't have a distributed system, and I don't see any benefit at all to using refresh tokens.
// However, I do want some kind of revocation strategy. Moreover, I want something that is compatible with
// stateless architecture in case I ever decide to go that route.
//
/////////////////////////
//
// Example usage:
//
// app.get('/api/protected', authMiddleware, async (req, res) => {
//   return res.status(200).json({ data: {}, message: 'You accessed the protected route.', success: true })
// })
//
///////////////////////////////////////////////////////////////////////////

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token

  // console.log('\nThe token from cookies in authMiddleware.ts: ', token)

  if (!token || typeof token !== 'string') {
    return res.status(401).json({
      data: null,
      message: 'No access token. Authentication failed.',
      success: false
    })
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!, async (err, decoded) => {
    if (err) {
      console.log(err)

      ///////////////////////////////////////////////////////////////////////////
      //
      // https://auth0.com/blog/forbidden-unauthorized-http-status-codes/
      // 401 Unauthorized is the status code to return when the client
      // provides no credentials or invalid credentials.
      //
      // Dave Gray uses 403 at 26:25 of https://www.youtube.com/watch?v=4TtAGhr61VI&list=PL0Zuz27SZ-6P4dQUsoDatjEGpmBpcOW8V&index=10
      // I think that is incorrect.
      //
      ///////////////////////////////////////////////////////////////////////////
      return res.status(401).json({
        data: null,
        message: "The 'access token' is invalid.",
        success: false
      })
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // The naive approach would be to attach decoded to req.user.
    //
    //  req.user = decoded as Request['user']
    //
    // However, if a user updated their info then the data from decoded could be stale
    // until the next time the user logged in. For this reason, it's a better practice
    // to use the decoded._id to get the user directly from the database every time.
    //
    ///////////////////////////////////////////////////////////////////////////

    if (decoded && typeof decoded === 'object' && 'id' in decoded) {
      const userId = decoded.id

      const user = await User.findById(userId, '-password -tokens')
        .lean()
        .exec()
      if (!user) {
        return res.status(401).json({
          data: null,
          message: 'Authentication failed: unable to find user.',
          success: false
        })
      }

      req.user = user
    } else {
      return res.status(401).json({
        data: null,
        message: 'Authentication failed: data missing from decoded cookie.',
        success: false
      })
    }
    next()
  })
}

export default authMiddleware
