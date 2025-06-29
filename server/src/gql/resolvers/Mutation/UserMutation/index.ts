import { createUser } from './createUser'
import { loginUser } from './loginUser'
import { updateUser } from './updateUser'
import { deleteUser } from './deleteUser'
import { logoutUser } from './logoutUser'

/* ========================================================================
                              UserMutation
======================================================================== */

export const UserMutation = {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  logoutUser
}
