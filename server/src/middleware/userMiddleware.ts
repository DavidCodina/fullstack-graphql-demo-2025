import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import User from 'models/userModel'

/* ======================
      userMiddleware
====================== */
// Middleware that attempts to get the user if there is one, but doesn't protect the endpoint.

const userMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token

  if (token && typeof token === 'string') {
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!,
      async (err, decoded) => {
        if (
          !err &&
          decoded &&
          typeof decoded === 'object' &&
          '_id' in decoded
        ) {
          const userId = decoded._id

          const user = await User.findById(userId, '-password -tokens')
            .lean()
            .exec()
          if (user) {
            req.user = user
          }
        }
        next()
      }
    )
  } else {
    next()
  }
}

export default userMiddleware
