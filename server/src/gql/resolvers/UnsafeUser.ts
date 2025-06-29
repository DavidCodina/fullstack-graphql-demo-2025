import { AnyResolver } from 'types'

const UnsafeUser = {
  // For todos inside of a user, only get that user's todos.
  todos: async (parent, _args, context) => {
    // console.log('\ntodos() called for type UnsafeUser.')
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

export default UnsafeUser
