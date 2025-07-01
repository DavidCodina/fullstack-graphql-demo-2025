import { AnyResolver } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// The Laith Harb Udemy tutorial section 9 (video 75) discusses the n+1 problem.
// Suppose you're making a call for all posts and there are 100.
// That only requires one database query. However, if you're also getting
// the associated user, then that could be as many as 100 (n) additional queries.
// This is suboptimal. The solution is to to batch and cache the request for users.
// This can be done with the help of a DataLoader: https://www.npmjs.com/package/dataloader
//
// Here are a few other tutorials on the subject. I got the implementation up and running.
// But really need to deep-dive on this subject. In particular, I'm a little wary of the
// caching feature, which might potentially result in incorrect or stale data.
//
//   https://www.youtube.com/watch?v=1fcj1jNCx0g
//   https://www.youtube.com/watch?v=_FQ1ZEWIn2s
//   https://www.youtube.com/watch?v=uCbFMZYQbxE
//   https://www.youtube.com/watch?v=GWugdZES05U
//   https://www.youtube.com/watch?v=-uSDpEp5uJc
//
///////////////////////////////////////////////////////////////////////////

const Todo = {
  user: async (parent, _args, context) => {
    const userLoader = context.userLoader

    ///////////////////////////////////////////////////////////////////////////
    //
    // Here userId is a MongoDB ObjectId. If you pass that into userLoader.load(userId),
    // then caching across distinct HTTP requests will NEVER work because ObjectIds
    // are different object instances each time. The equality check is a strict identity
    // check of referential equality. That said, we DO NOT want cross-request caching.
    //
    // Ultimately, we only want per-request caching, but that decision should not be made here indadvertently.
    // Instead, per-request caching is implmented explicitly by creating an ephemeral instance in the top-level
    // Apollo context.
    //
    ///////////////////////////////////////////////////////////////////////////
    const userId = parent.user
    const userIdString = userId.toString()
    return userLoader.load(userIdString)
  },
  createdAt: (parent: any) => {
    return parent.createdAt.toISOString()
  },
  updatedAt: (parent: any) => {
    return parent.updatedAt.toISOString()
  }
} satisfies Record<string, AnyResolver>

///////////////////////////////////////////////////////////////////////////
//
// This was the resolver prior to implementing userLoader.
// Very important: notice that password, token, and roles are all omitted
// from the each user object. Thus, someone can query for all users and we
// will not have to worry about accidentally exposing sensitive info.
//
// const Todo = {
//   user: async (parent, _args, context) => {
//     const userId = parent.user
//
//     const user = await context.models.User.findById(userId, '-password -tokens -role').exec() // .select('-password -tokens -role')
//
//     const time = new Date().toLocaleTimeString(undefined, {
//       hour: 'numeric',
//       minute: '2-digit',
//       second: '2-digit',
//       fractionalSecondDigits: 3
//     })
//
//     console.log(`\nGot user from database at ${time}: ${user?.name}`)
//
//     return user
//   },
//   createdAt: (parent: any) => {
//     return parent.createdAt.toISOString()
//   },
//   updatedAt: (parent: any) => {
//     return parent.updatedAt.toISOString()
//   }
// } satisfies Record<string, AnyResolver>
//
///////////////////////////////////////////////////////////////////////////

export default Todo
