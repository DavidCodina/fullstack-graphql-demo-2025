import { Router, Request, Response /*, NextFunction */ } from 'express'
import User from 'models/userModel'
import authMiddleware from 'middleware/authMiddleware'
import { handleServerError } from 'utils'
import { ResBody, User as UserType } from 'types'

const router = Router()

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// This route and controller demonstrate that the Express authMiddleware
// works outside of the GraphQL implementation. Even though the user logs in
// through the system baked into GraphQL, the httpOnly cookie can still be
// accessed by Express endpoints.
//
// Thus on the client we can do this:
//
//   React.useEffect(() => {
//     fetch('http://localhost:5000/api/users/current', { credentials: 'include' })
//       .then((res) => res.json())
//       .then((result) => {
//         console.log(result)
//         return result
//       })
//     .catch((err) => err)
//   }, [])
//
///////////////////////////////////////////////////////////////////////////

const getCurrentUser = async (
  req: Request,
  res: Response<ResBody<Omit<UserType, 'password'> | null>>
) => {
  const user = req.user

  try {
    if (!user) {
      return res.status(404).json({
        code: 'NOT_FOUND',
        data: null,
        message: 'Resource not found.',
        success: false
      })
    }

    return res.status(200).json({
      code: 'OK',
      data: user,
      message: 'Request successful.',
      success: true
    })
  } catch (err) {
    return handleServerError(res, err)
  }
}

/* ========================================================================

======================================================================== */

router.get('/current', authMiddleware, getCurrentUser)

export default router
