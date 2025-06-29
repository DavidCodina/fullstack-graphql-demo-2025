import { GraphQLError } from 'graphql'
import { ObjectId } from 'mongodb'

import { authenticate } from '../../../authenticate' // Avoid circular dependency with relative import
import { codes } from '../../../codes' // Avoid circular dependency with relative import
import { Todo } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// mutation DeleteTodo($id: ID!) {
//   deleteTodo(id: $id) {
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
// {
//   "id": "684da72539907c90c8e91b37"
// }
//
///////////////////////////////////////////////////////////////////////////

export const deleteTodo = authenticate(
  async (_parent, args: { id: string }, context): Promise<Todo> => {
    const { id: todoId } = args

    // ObjectId Check
    if (!ObjectId.isValid(todoId)) {
      throw new GraphQLError('Invalid ObjectId.', {
        extensions: {
          code: codes.INVALID_INPUT
        }
      })
    }

    const todo = await context.models.Todo.findById(todoId)

    ///////////////////////////////////////////////////////////////////////////
    //
    // If there is no todo, then calling todo.deleteOne()
    // will cause an "INTERNAL_SERVER_ERROR" :
    // "TypeError: Cannot read properties of null (reading 'deleteOne')"
    // For this reason, we check if the todo exists first.
    //
    ///////////////////////////////////////////////////////////////////////////

    // Existence Check
    if (!todo) {
      throw new GraphQLError('Resource not found.', {
        extensions: { code: codes.NOT_FOUND }
      })
    }

    const userId = context?.user?._id

    // Authorization Check
    if (!userId.equals(todo?.user)) {
      throw new GraphQLError('Authorization required.', {
        extensions: { code: codes.FORBIDDEN }
      })
    }

    const _deleteResult = await todo.deleteOne()

    return todo
  }
)
