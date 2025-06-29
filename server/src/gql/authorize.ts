import { GraphQLError, GraphQLFieldResolver } from 'graphql'

import { codes } from './codes' // Avoid circular dependency with relative import
import { Context, ContextWithUser, Role } from 'types'

//! type ContextWithUser = Required<Context>
type AuthenticatedResolver = GraphQLFieldResolver<any, ContextWithUser, any>
type AuthorizedResolver = AuthenticatedResolver
type AuthorizationChecker = GraphQLFieldResolver<any, Required<Context>, any>
type Authorize = (role: Role, next: AuthorizedResolver) => AuthorizationChecker

///////////////////////////////////////////////////////////////////////////
//
// In Advanced GraphQL, v2 section 2.4 Scott Moss creates these higher order
// functions (HOFs) to help manage authentication and authorization. The following
// GitHub repo shows them being used to wrap other resolvers:
//
//   https://github.com/FrontendMasters/advanced-gql-v2/blob/solution/src/resolvers.js
//
// This pattern standardizes the authorization error behavior, but
// currying functions are admittedly confusing to read.
//
///////////////////////////////////////////////////////////////////////////

export const authorize: Authorize = (role, next) => {
  const authorizationChecker: AuthorizationChecker = (
    source,
    args,
    context,
    info
  ) => {
    if (!context.user) {
      throw new GraphQLError(
        'context.user was not found during authorization.',
        {
          extensions: { code: codes.UNAUTHORIZED }
        }
      )
    }

    if (context.user.role !== role) {
      throw new GraphQLError('Authorization is required.', {
        extensions: { code: codes.FORBIDDEN }
      })
    }
    return next(source, args, context as ContextWithUser, info)
  }

  return authorizationChecker
}
