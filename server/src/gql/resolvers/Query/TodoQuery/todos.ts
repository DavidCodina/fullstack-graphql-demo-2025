import { authenticate } from '../../../authenticate' // Avoid circular dependency with relative import
import { Todo } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// query GetTodos {
//   todos {
//     id
//     title
//     body
//     completed
//     user {
//       id
//       name
//       email
//     }
//     createdAt
//     updatedAt
//   }
// }
//
///////////////////////////////////////////////////////////////////////////

export const todos = authenticate(
  async (_parent, _args, context, _info): Promise<Todo[]> => {
    const userId = context.user._id
    const todos = await context.models.Todo.find({ user: userId }).sort({
      createdAt: -1
    })
    return todos
  }
)
