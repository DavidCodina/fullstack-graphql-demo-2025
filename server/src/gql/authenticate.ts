import {
  GraphQLError,
  GraphQLFieldResolver /* , GraphQLResolveInfo */
} from 'graphql'
import { codes } from './codes' // Avoid circular dependency with relative import
import { Context, ContextWithUser } from 'types'

//! type ContextWithUser = Required<Context>
type AuthenticatedResolver = GraphQLFieldResolver<any, ContextWithUser, any>
type AuthenticationChecker = GraphQLFieldResolver<any, Context, any>
type Authenticate = (next: AuthenticatedResolver) => AuthenticationChecker

///////////////////////////////////////////////////////////////////////////
//
// In Advanced GraphQL, v2 section 2.4 Scott Moss creates these higher order
// functions (HOFs) to help manage authentication and authorization. The following
// GitHub repo shows them being used to wrap other resolvers:
//
//   https://github.com/FrontendMasters/advanced-gql-v2/blob/solution/src/resolvers.js
//
// This pattern standardizes the authentication error behavior, but currying
// functions are admittedly confusing to read. At its core this is just a function
// that returns a function, but it's also correct to say that:
//
//   function A is a higher-order function (HOF) that takes in function B and
//   returns function C, which returns the execution of function B.
//
// authenticate takes in the next resolver and returns the authenticationChecker.
// authenticationChecker() checks for user and either errors out or
// calls the next resolver. The next resolver at that point is authenticated.
// However, it's still necesary to convince Typescript of this by typecasting context.
//
// Note: When a resolver is wrapped in authenticate, the inferred type of that resolver
// will be AuthenticationChecker, which is kind of weird, but it works.
//
///////////////////////////////////////////////////////////////////////////

export const authenticate: Authenticate = (next) => {
  const authenticationChecker: AuthenticationChecker = (
    source,
    args,
    context,
    info
  ) => {
    if (!context.user) {
      throw new GraphQLError('Authentication is required.', {
        ///////////////////////////////////////////////////////////////////////////
        //
        // Kind of confusing with HTTP status codes, but when authentication fails,
        // it's a 401 Unauthorized. Conversely, when authorization fails it's a 403 Forbidden.
        // So some genius decided:
        //
        //  Unauthenticated --> 'UNAUTHORIZED'
        //  Unauthorized    --> 'FORBIDDEN'
        //
        ///////////////////////////////////////////////////////////////////////////
        extensions: { code: codes.UNAUTHORIZED }
      })
    }
    return next(source, args, context as ContextWithUser, info)
  }

  return authenticationChecker
}
