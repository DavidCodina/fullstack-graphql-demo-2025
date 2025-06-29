import { GraphQLError } from 'graphql'
import { ObjectId } from 'mongodb'

import { codes } from '../../../codes' // Avoid circular dependency with relative import
import { AnyResolver, User } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
//   query User($id: ID!) {
//     user(id: $id) {
//       id
//       name
//       email
//       todos {
//         id
//         title
//         body
//       }
//       createdAt
//       updatedAt
//     }
//   }
//
//   {
//     "id": "6675a5a82fa279e53cb79b7e"
//  }
//
///////////////////////////////////////////////////////////////////////////

export const user: AnyResolver = async (
  _parent,
  args,
  context,
  _info
): Promise<User> => {
  const { id } = args

  // ObjectId Check
  if (!ObjectId.isValid(id)) {
    throw new GraphQLError('Invalid ObjectId.', {
      extensions: {
        code: codes.INVALID_INPUT
      }
    })
  }

  ///////////////////////////////////////////////////////////////////////////
  //
  // The type definition for User does not allow querying for password,
  // token, or role. Therefore, the projection is not technically necessary.
  // Nor is using select() necessary:
  //
  //   .select('-token -password')
  //   .select({ password: 0, token: 0, role: 0 })
  //
  ///////////////////////////////////////////////////////////////////////////
  const user = await context.models.User.findById(id, '-password -token -role')

  // Existence Check
  // ⚠️ It's crucial that you do an existence check because the type definition for this
  // resolver is: `user(id: ID!): User!`. If you omit the existence check and the resource
  // is not found, then it will throw  an "INTERNAL_SERVER_ERROR".
  if (!user) {
    throw new GraphQLError('Resource not found.', {
      extensions: { code: codes.NOT_FOUND }
    })
  }

  return user
}
