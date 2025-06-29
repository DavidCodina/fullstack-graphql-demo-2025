import * as React from 'react'
import { useApolloClient, useMutation, useQuery } from '@apollo/client'
import { toast } from 'react-toastify'

import { GET_SESSION } from 'queries'
import { LOGOUT_USER } from 'mutations'
import { Session } from 'types'

type AuthSuccessHandler = (session: Session) => void

type MaybeSession = Session | null

type GetSessionData = {
  result: MaybeSession
}

type LogOutUserData = {
  result: { message: string; success: true }
}

export type AuthContextValue = {
  session: MaybeSession
  sessionLoading: boolean
  isAuthenticated: boolean
  handleAuthSuccess: AuthSuccessHandler
  logOut: () => void
  isLoggingOut: boolean
}

export const AuthContext = React.createContext({} as AuthContextValue)
export const AuthConsumer = AuthContext.Consumer

// React.useEffect(() => {
//   setTimeout(() => {
//     // console.log('Apollo cache:', client.extract())
//     const sessionCache = client.readQuery({ query: GET_SESSION })
//     console.log('GET_SESSION cache:', sessionCache)
//   }, 3000)
// }, [])

type AuthProviderProps = {
  children: React.ReactNode
  resetApollo: () => void
}

/* ========================================================================
                                AuthProvider
======================================================================== */
//# Possibly use exp in the idle timer implmentation.

export const AuthProvider = ({ children, resetApollo }: AuthProviderProps) => {
  const client = useApolloClient()

  /* ======================
        state & refs
  ====================== */

  // isLoggingOut is read by <PrivateRoutes /> to conditionally apply/omit the redirect
  // search parameter such that when a user logs out, redirect="..." is NOT set if isLoggingOut.
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)

  const { data, loading: sessionLoading } = useQuery<GetSessionData>(
    GET_SESSION,
    {}
  )

  const session = data?.result || null
  const isAuthenticated = session ? true : false

  /* ======================
        serverLogout
  ====================== */

  const [logoutUser] = useMutation<LogOutUserData>(LOGOUT_USER, {
    // If the user logs out from a public page, it's not immediately evident
    // that it was successful because there's no redirect. Thus, toast a success message.
    onCompleted(data) {
      const { result: _logoutUserData } = data
      toast.success('Log out successful!')
    },

    ///////////////////////////////////////////////////////////////////////////
    //
    // ⚠️ Dead Backend:
    //
    // The server logoutUser resolver never throws an error.
    // It always returns { message: string, success: true }.
    // However, if the server is down you'll get cack a networkError.
    // It's also possible that the internet is down. Whatever the case,
    // if there's an error here, then we need to toast something to the user:
    //
    // Should we continue with client-side logout if the server never responds?
    // Yes, you should still proceed with the client-side logout. Why?
    // Because from the user's perspective, they hit "logout" and expect to be logged out,
    // regardless of server status. If you don't clear the client state, they might stay
    // "logged in" on the frontend, which is a security risk and a confusing UX.
    //
    // - Proceed with the client-side logout (clear cache, update state, etc.)
    // - Show a toast:
    //
    //   "You have been logged out locally, but the server could not be reached.
    //   If this device is shared, please ensure you are fully logged out later."
    //
    // This is both transparent and secure. It also helps users understand that something went wrong,
    // but they're safe on this device. If you don't log out on the client, the user is stuck in limbo.
    // That's a worse experience and a potential security issue.
    //
    // TL;DR
    //
    //   - Always clear client state on logout, even if the server is unreachable.
    //   - Show a toast if the server can't be reached, so the user knows what's up.
    //   - Never leave the user "logged in" on the client if they hit logout.
    //
    // All of the client-side logout logic still happend in logOut() below.
    // Thus, all we need to do here is create a toast notfiication.
    //
    ///////////////////////////////////////////////////////////////////////////

    onError(error) {
      toast.error(
        'You have been logged out locally, but the server could not be reached. If this device is shared, please ensure you are fully logged out later.',
        {
          autoClose: false
        }
      )

      if (import.meta.env.DEV === true) {
        console.log({ error })
      }
    }
  })

  /* ======================
          logOut()
  ====================== */

  const logOut = async () => {
    const _response = await logoutUser()

    ///////////////////////////////////////////////////////////////////////////
    //
    // If the server is down, then there will be NO response.data.result.
    // In such cases, if you're reading from the response make sure to use
    // the `?` operator. Otherwise, you'll potentially create a runtime error.
    //
    //   const result = response?.data?.result
    //   console.log('result from serverLogout:', result)
    //
    // Note that logoutUser() itself will never throw an error directly.
    // That said, there may still be errors in the response.
    //
    ///////////////////////////////////////////////////////////////////////////

    setIsLoggingOut(true)

    ///////////////////////////////////////////////////////////////////////////
    //
    // Clear Application State And Caches:
    //
    // When logging out, it's crucial to clear all of the caches.
    // Otherwise, you can log out of one person's account and into another's and
    // end up seeing the last user's data, etc. (very bad)! In order to implement
    // useApolloClient(), make sure that <ApolloProvider> wraps <AuthProvider> and not
    // the other way around.
    //
    //   https://www.apollographql.com/docs/react/api/react/hooks/#useapolloclient
    //   https://www.apollographql.com/docs/react/caching/advanced-topics/#resetting-the-cache
    //
    // To reset the cache without refetching active queries, use client.clearStore(), NOT client.resetStore().
    // The latter approach will actually end up refetching which is not what we want. We don't want the additional
    // network requests, especially since queries may fail due to a lack of authentication. See here for
    // rationale that may have have led to the creation of client.clearStore():
    //
    //   https://github.com/apollographql/apollo-client/issues/2774
    //
    /////////////////////////
    //
    // ⚠️ Gotcha: client.clearStore() does completely wipe the Apollo cache, but here's the catch -
    // while client.clearStore() successfully prevents new network requests from active queries,
    // it does not automatically update the data property of currently active useQuery hooks.
    // This means that components which remain mounted after clearStore() is called will continue
    // to display the stale, old data that was present in the cache before the clearing operation.
    //  This kind of begs the question: what's even the point of client.clearStoreButOnlyKindOf() ?
    //
    // Calling client.clearStore() in Apollo Client does clear the in-memory cache, but it does not reset
    // the internal state of active useQuery() hooks. As a result, components using useQuery() may continue to
    // hold onto and display the old data, even though the cache itself is empty. This is a known limitation
    // and has been discussed in the Apollo community and GitHub issues. In fact, this is arguablye one of
    // Apollo Client's most notorious pain points - the disconnect between cache clearing and active query state.
    //
    //   https://github.com/apollographql/apollo-client/issues/11547
    //   https://community.apollographql.com/t/resetstore-behavior-and-sign-out-best-practices/7328
    //
    // Why This Happens?
    //
    //   Active useQuery() hooks: These hooks maintain their own state and do not automatically
    //   re-render orreset just because the cache was cleared externally.
    //
    // This is actually a known limitation with Apollo Client. The useQuery hook is designed to be reactive to cache changes that happen
    // through normal Apollo operations (like mutations, cache updates, etc.), but it doesn't automatically detect when the entire cache
    // is cleared externally. The useQuery() hook has its own internal state that doesn't automatically sync with cache clears.
    // This is one of those Apollo Client quirks that catches everyone off guard - the cache is cleared, but the hooks don't know about it!
    // It's totally whack, but that's just how it works.
    //
    // What Actually Works:
    //
    // Given the limitations of client.resetStore() and client.clearStore() when used in isolation for authentication flows,
    // a more sophisticated approach is required.  One reliable way to ensure all cached data and all active queries are fully
    // reset is to destroy and recreate the Apollo Client instance. However, this doesn't feel idiomatic.
    //
    //   resetApollo() // 🤯 Nuclear approach
    //
    // Another strategy is to manually clear the session, which will cause the application to redirect to the
    // login page if the user was previously on a protected page.
    //
    //   client.writeQuery({ query: GET_SESSION, data: { result: null } })
    //
    // If the user was on a public page, then they won't be redirected because that is handled from within PrivateRoutes.tsx.
    //
    // Next, call client.clearStore() and for good measure, make sure to call client.reFetchObservableQueries()
    // from withing the setTimeout. This last step will ensure that all stale data in useQuery() hooks is removed.
    // And if you're on the login page, then there shouldn't even be any observable queries to refetch, except GET_SESSION.
    //
    //   client.clearStore()
    //
    //   setTimeout(() => {
    //     setIsLoggingOut(false)
    //     client.reFetchObservableQueries() // Triggers background refetches without activating loading flags.
    //   }, 1500)
    //
    // While this approach works, and is more idiomatic, it also feels less assured and absolute.
    // Conversely, resetApollo() is absolutely reliable, predictable and still a legitimate practice.
    //
    ///////////////////////////////////////////////////////////////////////////

    // console.log('BEFORE cache:', client.extract())
    // console.log('BEFORE sessionCache:', client.readQuery({ query: GET_SESSION }))

    // No need to call client.clearStore() here. Instead,
    // resetApollo() generates a brand new ApolloClient instance.
    // ❌ client.clearStore()
    resetApollo()

    setTimeout(() => {
      setIsLoggingOut(false)

      // console.log('AFTER cache:', client.extract())
      // console.log('AFTER sessionCache:', client.readQuery({ query: GET_SESSION }))
    }, 1500)
  }

  /* ======================
      handleAuthSuccess()
  ====================== */
  // https://www.youtube.com/watch?v=0Z68AHS011Y at 20:00 & 35:45.
  // handleAuthSuccess() is called in the onCompleted() callback
  // when the user logs in or registers.

  const handleAuthSuccess: AuthSuccessHandler = (session) => {
    // console.log('Writing to the GET_SESSION query...')
    client.writeQuery({
      query: GET_SESSION,
      data: { result: session }
    })
    // console.log('GET_SESSION cache:', client.readQuery({ query: GET_SESSION }))
  }

  /* ======================
          return
  ====================== */

  return (
    <AuthContext.Provider
      value={{
        session: session,
        sessionLoading,
        isAuthenticated,
        handleAuthSuccess,
        logOut,
        isLoggingOut
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const value = React.useContext(AuthContext)
  return value
}
