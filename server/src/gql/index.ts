///////////////////////////////////////////////////////////////////////////
//
// ⚠️ Gotcha: Circular Dependencies
//
// In most cases, the order of export * from ... in a barrel file shouldn't matter,
// unless one of the files depends on something being exported from another file in the barrel
// (which is rare and not best practice). In my case, I was creating a circular dependency because:
//
//   1. authenticate.ts was doing: import { codes } from 'gql'
//   2. paginatedTodos.ts and other resolvers were doing: import { authenticate } from 'gql'
//
// This can cause some exports to be undefined at runtime.
//
// By exporting core utilities first you ensure it's available before any other files import it.
// That said, this fix only works if the circular dependency is only about initialization order.
// But if the files are truly interdependent, this is just a band-aid, not a cure.
//
// Is the current folder structure an anti-pattern, or bad practice?
// Not necessarily. The "bad practice" is when files exported in the barrel import from the barrel itself.
// Thus, even though changing the order of the exports fixes the issue, the real solution is to use
// relative import syntax when importing from the same directory.
// Inside your "barrelled" files, always import directly from the source, not the barrel.
//
// Note: TkDodo's blog has a post where he criticizes barrel files in general.
// https://tkdodo.eu/blog/please-stop-using-barrel-files
//
///////////////////////////////////////////////////////////////////////////

export * from './codes'
export * from './authenticate'
export * from './authorize'

export * from './resolvers'
export * from './typeDefs'
export * from './createContext'
export * from './reduceBadUserInputErrorsPlugin'
