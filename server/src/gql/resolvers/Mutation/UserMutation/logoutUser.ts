import { cookieOptions } from './token-utils'
import { AnyResolver } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// mutation LogoutUser {
//   logoutUser {
//     message
//     success
//   }
// }
//
///////////////////////////////////////////////////////////////////////////

export const logoutUser: AnyResolver = async (
  _parent,
  _args,
  context
): Promise<{ message: string; success: true }> => {
  const { req, res, user } = context
  const token = req?.cookies.token || ''

  // In cases where we delete the user from the client, logOutUser() is called AFTER the
  // user is deleted. This means there won't necessarily be a user at this point. Moreover,
  // as a general practice, this resolver should NOT be wrapped in an authenticate().
  if (user && user._id) {
    // If the token property does not exist in the document, using $unset
    // to remove it won’t cause an error. It will simply do nothing.
    await context.models.User.updateOne(
      { _id: user._id },
      { $unset: { token: 1 } }
    )
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  // ⚠️ What to do if there's no token in cookies?
  //
  // If there's no token in cookies, this could be a bug in the client-side logic
  // such that the request is failing to include the cookie. If using
  // Apollo Sandbox, this happens when one fails to toggle the 'Include Cookies'
  // switch to on in the settings. It could also happen if the user decides to
  // manually clear the cookies.
  //
  // So... should no token be considered a 400 error? Generally, it's not considered
  // a 400 error. Why success makes sense:
  //
  //   - Idempotent behavior: Logout should be idempotent - calling it multiple times should have the
  //     same result. If there's no token, the user is already in the desired state (logged out).
  //
  //   - Better user experience: Users won't see confusing error messages if they accidentally trigger logout
  //     twice or if there are race conditions between multiple tabs/devices.
  //
  //   - Semantic correctness: The user's intent is "make me logged out" - and they already are. Mission accomplished.
  //
  ///////////////////////////////////////////////////////////////////////////
  if (!token) {
    return {
      message: 'Log out successful.',
      success: true
    }
  } else {
    // https://www.youtube.com/watch?v=4TtAGhr61VI&list=PL0Zuz27SZ-6P4dQUsoDatjEGpmBpcOW8V&index=10
    // Dave Gray mentions at 23:10 that you have to pass in all of the same options when clearing the cookie.
    // The cookie options MUST MATCH those that it was originally sent with. Some people instead do:
    // res.cookie('token', '', { httpOnly: true, expires: new Date(0) })
    res?.clearCookie('token', cookieOptions)
  }

  return {
    message: 'Log out successful.',
    success: true
  }
}
