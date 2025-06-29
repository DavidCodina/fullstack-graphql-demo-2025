import { GraphQLError } from 'graphql'
import { authenticate } from '../../../authenticate' // Avoid circular dependency with relative import
import { codes } from '../../../codes' // Avoid circular dependency with relative import
import { User } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// query getCurrentUser {
//   currentUser {
//     id
//     name
//     email
//     role
//     todos {
//       id
//       title
//       body
//     }
//     createdAt
//     updatedAt
//   }
// }
//
///////////////////////////////////////////////////////////////////////////

export const currentUser = authenticate(
  async (_parent, _args, context): Promise<User> => {
    // It's still not a bad idea to omit the password even
    // if it's already omitted from type UnsafeUser.
    const user = await context.models.User.findById(context?.user?._id)
      .select({ password: 0, token: 0 })
      .exec()

    // Existence Check
    if (!user) {
      throw new GraphQLError('Resource not found.', {
        extensions: { code: codes.NOT_FOUND }
      })
    }

    return user
  }
)
