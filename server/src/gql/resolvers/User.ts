import { AnyResolver } from 'types'

///////////////////////////////////////////////////////////////////////////
//
// This resolver instructs GraphQL how to resolve a request for todos
// when selected from within a user.
//
// ⚠️ There is a contradiction in the API logic such that each user's todos
// are private to the user when requested directly. However, if a user is
// queried for, one can currently get the associated todos.
//
// This issue has been left in intentionally. It highlights the need to be
// careful when designing GraphQL APIs, so that you don't unintentionally
// expose private data
//
/////////////////////////
//
// Regarding n+1 :
//
// In this case, each todo will be unique. Conversely,n the Todo resolver
// there's the possibility that we would be making duplicate requests for
// the same user across multiple todos. However, in this case there's
// no possibility that we will be making duplicate requests for todos.
// Rather, each todo will be unique. Therefore, there's no need to
// use DataLoader.
//
///////////////////////////////////////////////////////////////////////////

const User = {
  // For todos inside of a user, only get that user's todos.
  todos: async (parent, _args, context) => {
    // 1. Get the id of the user
    const userId = parent.id

    // 2. Use the id of the user to make Mongoose request for user data.
    const todos = await context.models.Todo.find({ user: userId })
    return todos
  },

  createdAt: (parent: any) => {
    return parent.createdAt.toISOString()
  },
  updatedAt: (parent: any) => {
    return parent.updatedAt.toISOString()
  }
} satisfies Record<string, AnyResolver>
// satisfies is useful here not for its ability to narrow the type,
// but because it allows us to define the type of the field resolvers
// without typecasting and without moving the functions out of User.

export default User
