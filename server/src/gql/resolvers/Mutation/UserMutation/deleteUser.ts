import { GraphQLError } from 'graphql'
import { ObjectId } from 'mongodb'

import { authenticate } from '../../../authenticate' // Avoid circular dependency with relative import
import { codes } from '../../../codes' // Avoid circular dependency with relative import
import { User } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// Note: this mutation is returning UnsafeUser (similar to updating and currentUser).
// No userId is required here because the mutation is intended for
// the user to delete themself (not for admin).
//
//   mutation DeleteUser {
//     result: deleteUser {
//       id
//       name
//       email
//       role
//       todos {
//         id
//         title
//       }
//       createdAt
//       updatedAt
//     }
//   }
//
///////////////////////////////////////////////////////////////////////////

export const deleteUser = authenticate(
  async (_parent, _args, context): Promise<User> => {
    const userId = context?.user?._id

    /* ======================
          ObjectId Check
    ====================== */
    ///////////////////////////////////////////////////////////////////////////
    //
    // ⚠️ For custom application-level errors, it's recommended to use your own unique codes...
    // Initially, I was using 'BAD_REQUEST', but in Apollo that typically means the entire
    // request was malformed, unparseable, or fundamentally incorrect before it even got to
    // the point of your resolver's business logic. The more appropriate built-in error
    // would be 'BAD_USER_INPUT'. However, even then it's still probably better to have some
    // kind of custom error code for this that differentiates it from system-generated errors.
    // Thus, in this application 'INVALID_INPUT' is used for custom errors when there is bad
    // user input.
    //
    ///////////////////////////////////////////////////////////////////////////

    if (!ObjectId.isValid(userId)) {
      throw new GraphQLError('Invalid ObjectId.', {
        extensions: {
          code: codes.INVALID_INPUT
        }
      })
    }

    // deleteUser() is actually returning UnsafeUser
    const user = await context.models.User.findById(userId)
      .select({
        password: 0,
        tokens: 0
      })
      .exec()

    /* ======================
         Existence Check
    ====================== */
    // This preempts this error:  "Cannot read properties of null (reading 'deleteOne')"

    if (!user) {
      throw new GraphQLError('Resource not found.', {
        extensions: { code: codes.NOT_FOUND }
      })
    }

    // Deletion cascades should be handled by Mongoose middleware hooks, not locally.
    // ❌ await context.models.Todo.deleteMany({ user: userId }).lean().exec()
    //    => { acknowledged: true, deletedCount: 3 }

    // You do not need an explicit "is this user allowed to delete this user" check
    // because you literally just used that userId to fetch the user.
    /* const _deleteResult = */ await user.deleteOne() // => { acknowledged: true, deletedCount: 1 }

    return user
  }
)
