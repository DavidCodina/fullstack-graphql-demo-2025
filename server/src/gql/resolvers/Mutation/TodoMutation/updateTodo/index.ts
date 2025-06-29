import { GraphQLError } from 'graphql'
import { ObjectId } from 'mongodb'

import { getZodErrors } from 'utils'
import { authenticate } from '../../../../authenticate' // Avoid circular dependency with relative import
import { codes } from '../../../../codes' // Avoid circular dependency with relative import
import { UpdateTodoSchema } from './UpdateTodoSchema'
import { Todo } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// mutation UpdateTodo($input: UpdateTodoInput!) {
//   updateTodo(input: $input) {
//     id
//     title
//     body
//     completed
//     user {
//       id
//       name
//       email
//     }
//   }
// }
//
// {
//   "input": {
//     "id": "684da71e39907c90c8e91b2f",
//     "title": "Todo 10 (Updated)"
//   }
// }
//
///////////////////////////////////////////////////////////////////////////

export const updateTodo = authenticate(
  async (_parent, args, context, _info): Promise<Todo> => {
    const { id: todoId, title, body, completed } = args.input

    /* ======================
          ObjectId Check
    ====================== */

    ///////////////////////////////////////////////////////////////////////////
    //
    // ⚠️ For custom application-level errors, it's recommended to use your own unique codes...
    // Initially, I was using 'BAD_REQUEST', but in Apollo that typically means the entire
    // request was malformed, unparseable, or fundamentally incorrect before it even got to
    // the point of your resolver's business logic. The more appropriate built-in error
    // would be 'BAD_USER_INPUT'. However, even then it's still probably better to have some
    // kind of custom error code for this that differentiates it from system-generated errors.
    // Thus, in this application 'INVALID_INPUT' is used for custom errors when there is bad
    // user input.
    //
    ///////////////////////////////////////////////////////////////////////////
    if (!ObjectId.isValid(todoId)) {
      throw new GraphQLError('Invalid ObjectId.', {
        extensions: {
          code: codes.INVALID_INPUT
        }
      })
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // It's also possible to update a document like this.
    // However, with this approach, you will NOT get back the document:
    //
    //   const update = {}
    //   if (typeof title === 'string') { update.title = title }
    //   if (typeof body === 'string') { update.body = body}
    //   if (typeof completed === 'boolean') { update.completed = completed }
    //   const result = await Todo.updateOne({ _id: id }, { $set: update })
    //
    // Or you could do this, but it will actually update the document, but pass
    // you back the previous, non-updated version:
    //
    //   const oldTodo = await Todo.findOneAndUpdate({ _id: id }, update)
    //
    ///////////////////////////////////////////////////////////////////////////

    const todo = await context.models.Todo.findById(todoId).exec()

    /* ======================
         Existence Check
    ====================== */

    if (!todo) {
      throw new GraphQLError('Resource not found.', {
        extensions: { code: codes.NOT_FOUND }
      })
    }

    const userId = context.user._id

    /* ======================
        Authorization Check
    ====================== */

    if (!userId.equals(todo?.user)) {
      throw new GraphQLError('Authorization required.', {
        extensions: { code: codes.FORBIDDEN }
      })
    }

    /* ======================
          Validation
    ====================== */

    const validationResult = UpdateTodoSchema.safeParse({
      title,
      body,
      completed
    })

    // Leverage the discriminated union.
    // Prior to this, validationResult.data is ?.
    if (!validationResult.success) {
      // At this point, we know that there are errors, and getZodErrors()
      // ALWAYS return an object. This pretty much guarantees that there
      // will be at least one property in formErrors - unless something
      // very unexpected happens in the getZodErrors() utility.
      const formErrors = getZodErrors(validationResult.error)

      throw new GraphQLError('There were one or more form errors.', {
        extensions: {
          code: codes.FORM_ERRORS,
          formErrors: formErrors
        }
      })
    }

    // At this point data is assured, but any given field may be undefined.
    const validated = validationResult.data

    /* ======================

    ====================== */

    if (typeof validated.title === 'string') {
      todo.title = validated.title
    }

    if (typeof validated.body === 'string') {
      todo.body = validated.body
    }

    if (typeof validated.completed === 'boolean') {
      todo.completed = completed
    }

    ///////////////////////////////////////////////////////////////////////////
    //
    // It's also possible to update a document like this.
    // However, with this approach, you will NOT get back the document:
    //
    //   const update = {}
    //   if (typeof title === 'string') { update.title = title }
    //   if (typeof body === 'string') { update.body = body}
    //   const result = await Todo.updateOne({ _id: id }, { $set: update })
    //
    // Or you could do this, but it will actually update the document, but pass
    // you back the previous, non-updated version:
    //
    //   const oldTodo = await Todo.findOneAndUpdate({ _id: todoId }, update)
    //
    ///////////////////////////////////////////////////////////////////////////

    const updatedTodo = await todo.save()

    return updatedTodo
  }
)
