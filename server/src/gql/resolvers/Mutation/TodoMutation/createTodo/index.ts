import { GraphQLError } from 'graphql'
// import { ObjectId } from 'mongodb'

import { getZodErrors } from 'utils'
import { authenticate } from '../../../../authenticate' // Avoid circular dependency with relative import
import { codes } from '../../../../codes' // Avoid circular dependency with relative import
import { CreateTodoSchema } from './CreateTodoSchema'
import { Todo } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
//   mutation CreateTodo($input: CreateTodoInput!) {
//     createTodo(input: $input) {
//       id
//       title
//       body
//       completed
//       user {
//         id
//         name
//         email
//       }
//       createdAt
//       updatedAt
//     }
//   }
//
//   {
//     "input": {
//       "title": "Todo 1",
//       "body": "This is the todo body...",
//    }
//  }
//
///////////////////////////////////////////////////////////////////////////

export const createTodo = authenticate(
  async (
    _parent,
    args: { input: { title: string; body?: string } },
    context
  ): Promise<Todo> => {
    const { title, body } = args.input

    /* ======================
          Validation
    ====================== */

    const validationResult = CreateTodoSchema.safeParse({
      title,
      body
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
        ///////////////////////////////////////////////////////////////////////////
        //
        // https://www.apollographql.com/docs/apollo-server/data/errors/#including-custom-error-details
        // Whenever you throw a GraphQLError, you can add arbitrary fields to the error's extensions object
        // to provide additional context to the client. You specify these fields in an object you provide
        // to the error's constructor.
        //
        // With Apollo client we can pick out these errors as follows:
        //
        //   onError(errors) {
        //     const { graphQLErrors } = errors
        //
        //     const formErrors = (graphQLErrors.find((error) => {
        //       return error?.extensions?.code === 'FORM_ERRORS'
        //     })?.extensions?.formErrors) as { title?: string, body?: string } | undefined
        //
        //     // Do something with field-specific errors...
        //     console.log('formErrors:', formErrors)
        //   }
        //
        // In my opinion this approach works quite well. However, some argue that:
        //
        //  https://engineering.zalando.com/posts/2021/04/modeling-errors-in-graphql.html
        //  The biggest problem we face in modeling these in the extension object is that it's
        //  not discoverable. We use such a powerful language like GraphQL to define each field
        //  in our data structure using Schemas, but when designing the errors, we went back to
        //  a loose mode of not using any of the ideas GraphQL brought us.
        //
        // In other words, the errors are there but it's not immediately evident to the API
        // consumer because they're not defined by a schema, etc. By using 'errors as data'
        // we actually can bake the errors into the schemas, so it's more obvious.
        //
        // The downside of 'errors as data' is that the client has to explicitly check
        // things 'success', 'formErrors', etc. Both approaches are valid, but have trade-offs.
        // The above Zalando article goes into more detail about when/where each approach is
        // the most appropriate. However, I think it's better to maintain consistency, and so
        // I would recommend either adopting on approach OR the other.
        //
        ///////////////////////////////////////////////////////////////////////////
        extensions: {
          code: codes.FORM_ERRORS,
          formErrors: formErrors
        }
      })
    }

    // At this point data is assured.
    const validated = validationResult.data

    /* ======================
          Create Todo
    ====================== */

    const newTodo = await context.models.Todo.create({
      title: validated.title,
      body: validated.body || '',
      user: context?.user?._id
    })

    return newTodo
  }
)
