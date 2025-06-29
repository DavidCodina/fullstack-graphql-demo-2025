import jwt from 'jsonwebtoken'
// import { sleep } from 'utils'
import { AnyResolver, Session } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// query Session {
//   result: session {
//     id
//     role
//     exp
//     iat
//   }
// }
//
// When the client mounts, it makes a request for the session data.
// In this case, the session data is merely the decoded token.
// Note: this should match exactly what's passed back when the user registers
// or logs in.
//
// Arguably, this is more of an auth query than a user query, but for simplicity
// I've generally lumped all authentication and user logic together. On the other
// hand, one can also think of this as a getUserSession() controller.
//
///////////////////////////////////////////////////////////////////////////

export const session: AnyResolver = async (
  _parent,
  _args,
  context
): Promise<Session | null> => {
  // await sleep(5000)
  const { req } = context

  const token = req.cookies.token
  let decoded: jwt.JwtPayload | null = null

  if (!token || typeof token !== 'string') {
    return null
  }

  try {
    // jwt.verify() will throw an error if the token is invalid.
    decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as jwt.JwtPayload

    // The decoded JWT actually contains { id, role, exp, iat } already, but just to
    // be explicit, I'm adding it to a session object. Moreover, I'm typecasting it as
    // a Session type because I know it's a going to be a valid Session object.
    const session = {
      id: decoded.id,
      role: decoded.role,
      exp: decoded.exp,
      iat: decoded.iat
    } as Session

    return session
  } catch (err) {
    return null
  }
}
