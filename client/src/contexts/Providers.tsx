import * as React from 'react'
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs'

import { AppProvider, AuthProvider, ThemeProvider } from 'contexts'
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache,
  ApolloLink
  // createHttpLink
} from '@apollo/client'
import { onError } from '@apollo/client/link/error'

const VITE_GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI

if (!VITE_GRAPHQL_URI) {
  throw new Error('VITE_GRAPHQL_URI is not defined.')
}

/* ======================
        loggerLink
====================== */

// The function passed to ApolloLink is of type RequestHandler:
// type RequestHandler = (operation: Operation, forward: NextLink) => Observable<FetchResult> | null;
const _loggerLink = new ApolloLink((operation, forward) => {
  return forward(operation).map((response) => {
    console.log(`\n\n[Apollo Logger] Operation: ${operation.operationName}`, {
      variables: operation.variables,
      response
    })
    return response
  })
})

/* ======================
      errorLink
====================== */
///////////////////////////////////////////////////////////////////////////
//
// In theory, errorLink can be used to implement a "silent refresh" pattern.
// It's a bit more involved than doing it in REST, but it’s a well-known Apollo pattern.
// Here’s the high-level flow:
//
//   1. Intercept 'UNAUTHORIZED' errors in errorLink.
//
//   2. If detected, pause the original operation.
//
//   3. Trigger a refresh token mutation (using fetch, or a separate Apollo client instance).
//
//   4. If refresh succeeds, update the access token (usually in memory or localStorage).
//      Actually, the accessToken would be automatically reset by the server in an httpOnly cookie.
//
//   5. Retry the original operation.
//
//   6. If refresh fails, let the error bubble up (user must re-authenticate).
//      To avoid infinite loops, you should mark the operation as “already retried” (e.g., via a custom context property).
//
///////////////////////////////////////////////////////////////////////////

const errorLink = onError((errorResponse) => {
  const {
    graphQLErrors,
    networkError,
    operation
    //, protocolErrors, response, forward
  } = errorResponse
  const isDev = import.meta.env.DEV === true

  if (isDev) {
    if (graphQLErrors) {
      graphQLErrors.forEach((err) => {
        console.error(`[Apollo Error] Operation: ${operation.operationName}`, {
          variables: operation.variables,
          message: err.message,
          code: err.extensions?.code

          // locations: err.locations,
          // path: err.path
        })
      })
    }
    if (networkError) {
      console.error(
        `[Apollo Network Error] Operation: ${operation.operationName}`,
        networkError
      )
    }
  }
})

/* ======================
  Apollo Configuration
====================== */
///////////////////////////////////////////////////////////////////////////
//
// Initially, I was using httpLink, but switched to uploadLink when implementing
// apollo-upload-client (and graphql-upload on the server).
//
//   https://www.apollographql.com/docs/react/api/link/apollo-link-http/
//   const httpLink = createHttpLink({
//     // The Express server uses the '/graphql' namespace in order to differentiate it
//     // from '/api' REST endpoints. If we simply set the Express server to nothing or '/',
//     // then trying to access '/api' would still go to graphql.
//     uri: VITE_GRAPHQL_URI,
//     credentials: 'include'
//   })
//
///////////////////////////////////////////////////////////////////////////

const uploadLink = createUploadLink({
  uri: VITE_GRAPHQL_URI,
  credentials: 'include',
  // ⚠️ When configuring your file upload client, you will need to send a non-empty
  // Apollo-Require-Preflight header or Apollo Server will block the request.
  headers: { 'Apollo-Require-Preflight': 'true' }
})

const makeClient = () => {
  const client = new ApolloClient({
    // Initially, httpLink was replaced by uploadLink,
    // which allows for file uploads. link: httpLink -->  link: uploadLink
    // Then Apollo link was used to create some basic logic for response
    // interception.
    link: ApolloLink.from([errorLink, /*loggerLink, */ uploadLink]),
    cache: new InMemoryCache()
  })

  return client
}

/* ========================================================================
             
======================================================================== */

export const Providers = ({ children }: React.PropsWithChildren) => {
  const [client, setClient] = React.useState(makeClient())
  // const [apolloKey, setApolloKey] = React.useState(0)

  // React.useEffect(() => {
  //   setTimeout(() => { console.log('New Apollo client cache:', client.extract()) }, 3000)
  // }, [client])

  // See AuthContext for why calling client.resetStore() is inappropriate
  // and client.clearStore() is insufficient.
  const resetApollo = () => {
    setClient(makeClient())
    ///////////////////////////////////////////////////////////////////////////
    //
    // Remounting the ApolloProvider may not even be necessary.
    // Resetting the ApolloClient instance itself is the key action.
    // Changing the key on <ApolloProvider> is a React trick to force a remount,
    // but if the client instance changes, Apollo's internal machinery will "reset"
    // everything anyway. Thus, changing the client prop is sufficient for Apollo to
    // use the new client and cache. In fact, if we remount the ApolloProvider, it
    // breaks the isLoggingOut logic in PrivateRoutes.tsx such that the redirect is
    // applied even when logging out.
    //
    // ❌ setApolloKey((v) => v + 1)
    //
    ///////////////////////////////////////////////////////////////////////////
  }

  return (
    <ApolloProvider client={client} /* key={apolloKey} */>
      <AppProvider>
        <AuthProvider resetApollo={resetApollo}>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </AppProvider>
    </ApolloProvider>
  )
}
