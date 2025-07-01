import * as React from 'react'
import createUploadLink from 'apollo-upload-client/createUploadLink.mjs'

import { AppProvider, AuthProvider, ThemeProvider } from 'contexts'
import {
  ApolloProvider,
  ApolloClient,
  InMemoryCache
  // createHttpLink
} from '@apollo/client'

const VITE_GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI

if (!VITE_GRAPHQL_URI) {
  throw new Error('VITE_GRAPHQL_URI is not defined.')
}

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
  credentials: 'include'
})

// A utility that generates an ApolloClient instance.
const makeClient = () => {
  const client = new ApolloClient({
    link: uploadLink, // Replaced - link: httpLink,
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
