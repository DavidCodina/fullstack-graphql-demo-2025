import User from 'models/userModel'
import Dataloader, { BatchLoadFn } from 'dataloader'

type UserArray = Array<typeof User>
type MappedResults = { [key: string]: any }

/* ======================
    Batching Function
====================== */

const batchUsers: BatchLoadFn<string, Array<UserArray>> = async (
  ids: readonly string[]
) => {
  // console.log('ids from batchUsers()', ids)
  const users = await User.find({ _id: { $in: ids } }).select({
    password: 0,
    tokens: 0,
    roles: 0
  }) //.lean()

  const time = new Date().toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  })

  console.log(`\nGot users from database at ${time}.`)
  console.log(users)

  const mappedResults: MappedResults = {}

  // Create an object of key/value pairs such that each key
  // is an _id and each value is a record (i.e., document in MongoDB).
  users.forEach((user) => {
    mappedResults[user._id.toString()] = user
  })

  ///////////////////////////////////////////////////////////////////////////
  //
  // Use the mappedResults object to then return an array of records
  // that is ordered in the same sequence as the original ids array.
  // Why are we doing this?
  //
  //   https://www.npmjs.com/package/dataloader
  //   There are a few constraints this function must uphold:
  //   - The Array of values must be the same length as the Array of keys.
  //   - Each index in the Array of values must correspond to the same index in the Array of keys.
  //
  ///////////////////////////////////////////////////////////////////////////
  const orderedResults = ids.map((id: string) => mappedResults[id] || null)

  return orderedResults
}

/* ======================
        Dataloader
====================== */
///////////////////////////////////////////////////////////////////////////
//
// Gotcha: Don't Use A Singleton!
//
//   ❌ export const userLoader = new Dataloader(batchUsers)
//
// If you create a singleton of userLoader, then it will cache data across
// distinct HTTP requests. However, the recommened pattern is to create a
// per-request cache instead. Otherwise, you must then solve visibility,
// staleness, and memory-growth problems yourself.
//
// Production guides, on the other hand, stress “one loader per request” to avoid
// leaking data between users and to keep cache invalidation trivial.
// See docs here: https://github.com/graphql/dataloader
//
//   Each DataLoader instance represents a unique cache. Typically instances are created per request.
//
//   DataLoader provides a memoization cache for all loads which occur in a single request to your application.
//
//   Avoid multiple requests from different users using the DataLoader instance, which could result in cached data
//   incorrectly appearing in each request. Typically, DataLoader instances are created when a Request begins,
//   and are not used once the Request ends.
//
// Instead, use createUserLoader() to create an ephemeral userLoader instance within the context:
//
//   context: async ({ req }) => {
//     const userLoader = createUserLoader()
//     return {  userLoader }
//   }
//
// Or import createUserLoader into Post.ts to create an ephemeral instance of userLoader
// directly within the `user` field resolver.
//
///////////////////////////////////////////////////////////////////////////

export const createUserLoader = () => {
  return new Dataloader(batchUsers)
}
