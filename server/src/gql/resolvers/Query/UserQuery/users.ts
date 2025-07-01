// import { GraphQLError, GraphQLResolveInfo } from 'graphql'
import { AnyResolver, User } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// Note: In many of the apollographql.com tutorials, they actually
// specify a dataSources directory that then have classes that
// contain methods for getting various data. dataSources is passed
// through context.
//
// For example, see
// here at :50 : https://www.apollographql.com/tutorials/lift-off-part3/04-resolver-args-parameter
// The point is that the actual services that get the data are abstracted
// in order to keep the resolvers as slim as possible.
//
// query Users {
//   users {
//     id
//     name
//     email
//     todos {
//       id
//       title
//       body
//       user {
//         name
//       }
//     }
//     createdAt
//     updatedAt
//   }
// }
//
// ⚠️ There is a contradiction in the API logic such that each user's todos
// are private to the user when requested directly. However, if a user is
// queried for, one can currently get the associated todos.
//
// This issue has been left in intentionally. It highlights the need to be
// careful when designing GraphQL APIs, so that you don't unintentionally
// expose private data.
//
///////////////////////////////////////////////////////////////////////////

export const users: AnyResolver = async (
  _parent,
  _args,
  context,
  _info
): Promise<User[]> => {
  // The type definition for User does not allow querying for password,
  // token, or role. Therefore, the projection is not technically necessary.
  const users = await context.models.User.find({}, '-password -tokens -role')
    // Always omit token and password from users. Here, we are implementing
    // the projection argument, rather than using: .select('-tokens -password')
    // Below, .sort({ createdAt: -1 }) will return newest first
    .sort({ createdAt: -1 })

  return users
}
