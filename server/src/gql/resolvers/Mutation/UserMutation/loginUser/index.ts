import { GraphQLError } from 'graphql'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

import { LoginUserSchema } from './LoginUserSchema'
import { decodeToken, tokenExpiration, getCookieOptions } from '../token-utils'
import { codes } from '../../../../codes' // Avoid circular dependency with relative import
import { AnyResolver, Session } from 'types'

/* ========================================================================

======================================================================== */
////////////////////////////////////////////////////////////////////////////
//
// mutation LoginUser($input: LoginInput!) {
//   result: loginUser(input: $input) {
//      id
//      role
//      exp
//      iat
//   }
// }
//
// {
//   "input": {
//     "email": "david@example.com",
//     "password": "12345"
//   }
// }
//
////////////////////////////////////////////////////////////////////////////

export const loginUser: AnyResolver = async (
  _parent,
  args,
  context
): Promise<Session> => {
  const { res } = context
  const { email, password } = args.input

  /* ======================
          Validation
  ====================== */

  const validationResult = LoginUserSchema.safeParse({
    email,
    password
  })

  if (!validationResult.success) {
    throw new GraphQLError('Invalid credentials. (1)', {
      extensions: {
        code: codes.INVALID_CREDENTIALS
      }
    })
  }

  /* ======================
      Existence Check
  ====================== */

  const existingUser = await context.models.User.findOne({ email }).exec()

  if (!existingUser) {
    throw new GraphQLError('Invalid credentials. (2)', {
      extensions: {
        code: codes.INVALID_CREDENTIALS
      }
    })
  }

  /* ======================
        Match Check
  ====================== */

  const isMatch = await bcrypt.compare(password, existingUser.password)

  if (!isMatch) {
    throw new GraphQLError('Invalid credentials. (3)', {
      extensions: {
        code: codes.INVALID_CREDENTIALS
      }
    })
  }

  /* ======================
          Login
  ====================== */

  // Create access token
  const token = jwt.sign(
    {
      // Mongoose uses an abstraction, so technically, we could use existingUser.id
      id: existingUser._id,
      role: existingUser.role
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: tokenExpiration }
  )

  const decoded = decodeToken(token, process.env.ACCESS_TOKEN_SECRET!)!

  // JWT is stateless by design. However, `tokens` is being
  // used as a whitelist mechanism within authenticate.ts
  existingUser.tokens = [token, ...existingUser.tokens]

  await existingUser.save()

  if (res && res.cookie) {
    res.cookie('token', token, getCookieOptions())
  }

  // This matches exactly what's in the JWT,
  // as well as what's returned from the session query resolver
  // and from the createUser mutation resolver.
  const session = {
    id: existingUser._id.toString(),
    role: existingUser.role,
    exp: decoded.exp,
    iat: decoded.iat
  }

  return session
}
