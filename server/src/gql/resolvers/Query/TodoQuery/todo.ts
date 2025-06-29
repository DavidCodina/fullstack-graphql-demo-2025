import { GraphQLError } from 'graphql'
import { ObjectId } from 'mongodb'

import { authenticate } from '../../../authenticate'
import { codes } from '../../../codes' // Avoid circular dependency with relative import
import { Todo } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// query getTodo($id: ID!) {
//   todo(id: $id) {
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
//   "id" : "63fcf8347139c4c4f84ec6c2"
// }
//
///////////////////////////////////////////////////////////////////////////

export const todo = authenticate(
  async (_parent, args: { id: string }, context, _info): Promise<Todo> => {
    const { id: todoId } = args

    // ObjectId Check
    if (!ObjectId.isValid(todoId)) {
      throw new GraphQLError('Invalid ObjectId.', {
        extensions: {
          code: codes.INVALID_INPUT
        }
      })
    }

    const userId = context.user._id
    const todo = await context.models.Todo.findById(todoId).exec()

    // Existence Check
    if (!todo) {
      throw new GraphQLError('Resource not found.', {
        extensions: { code: codes.NOT_FOUND }
      })
    }

    // Authorization Check
    // ⚠️ It's crucial that you do an existence check first. Otherwise, this error will also be
    // triggered when the resource is not found, which ends up leading to confusion on the client.
    // That said, it seems unlikely that userId and the todo.user would be different at this point.
    if (!userId.equals(todo?.user)) {
      throw new GraphQLError('Authorization required.', {
        extensions: {
          code: codes.FORBIDDEN
        }
      })
    }

    return todo
  }
)
