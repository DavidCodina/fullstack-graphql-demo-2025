import jwt from 'jsonwebtoken'
import { CookieOptions } from 'express'

type TokenData = {
  exp: number
  iat: number
  id: string
}

//^ express deprecated res.clearCookie: Passing "options.maxAge" is deprecated. In v5.0.0 of Express,
//^ this option will be ignored, as res.clearCookie will automatically set cookies to expire immediately.
//^ Please update your code to omit this option. dist/index.js:43038:47

/* ======================
      constants
====================== */
// '1d', '30s', etc.

export const tokenExpiration = '1d'
const cookieMaxAge = 24 * 60 * 60 * 1000 // Notice how this matches tokenExpiration

///////////////////////////////////////////////////////////////////////////
//
// ⚠️ Gotcha 1: The cookie was being blocked by Chrome, but not Safari.
// Some AI responses said that Chrome blocks cookies unless you use SameSite: 'none', Secure: true, and serve your app over HTTPS—even on localhost.
// However, the actual solution seemed to be as simple as going to the Sandbox settings --< Connection Settings --> Click Toggle to enable cookies.
//
// ⚠️ Gotcha 2: in the primary index.ts we do this immediately after all the imports:
//
//   dotenv.config()
//
// However, When you run your index.ts, all imports at the top are loaded and executed before any of your own code runs,
// including the dotenv.config() call. If any of those modules (like your cookieOptions or resolvers) reference process.env.NODE_ENV
// at the top level (i.e., outside a function), they will do so before your dotenv.config() runs in index.ts.
// Consequently, this won't work as expected.
//
//   export const cookieOptions: CookieOptions  = { ... }
//
// Instead, you need to make it a function that dynamically returns CookieOptions.
//
///////////////////////////////////////////////////////////////////////////

export const getCookieOptions = (): CookieOptions => {
  return {
    httpOnly: true, // Accessible only by the web server.
    maxAge: cookieMaxAge,

    // domain?: string | undefined;
    // domain: 'http://localhost',
    // https://www.youtube.com/watch?v=4TtAGhr61VI&list=PL0Zuz27SZ-6P4dQUsoDatjEGpmBpcOW8V&index=8
    // Dave Gray uses sameSite:'None' in the tutorial at 19:00, but this seems to break the implementation for me.
    // This should allow cross-site cookies.
    // sameSite: 'None'
    // The tutorial does this, but I don't seem to need it.
    // This should limit to only https.
    // You would want this in production, but it may cause issues during development.
    // This is alluded to briefly in the following Dave Gray tutorial at 31:10
    // https://www.youtube.com/watch?v=4TtAGhr61VI&list=PL0Zuz27SZ-6P4dQUsoDatjEGpmBpcOW8V&index=11

    secure: process.env.NODE_ENV === 'development' ? false : true,

    //# I'm not sure if 'none' is what we want for production.
    //# You also need to consider whether the API is public or private.
    //# Consider this carefully. Generally sameSite: true is probably the
    //# safest. Otherwise, there may be a stronger possibility of CSRF attacks.
    sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none'
  }
}

/* ======================
      decodeToken()
====================== */
// A helper function to quickly decode a JWT token.

export const decodeToken = (token: string, secret: string) => {
  try {
    const decoded = jwt.verify(token, secret)
    return decoded as TokenData
  } catch (_err) {
    return null
  }
}
