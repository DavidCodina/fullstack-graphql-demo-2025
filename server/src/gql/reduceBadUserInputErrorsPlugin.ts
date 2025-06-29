import { GraphQLError } from 'graphql'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// Let's assume, we have the following CreateTodoInput:
//
//   input CreateTodoInput {
//     title: String!
//     body: String!
//   }
//
// This means that Apollo server will automatically validate that `title` and `body` are strings,
// and that they are provided. Assuming that neither input fields are provided, then Apollo server
// will immediately send back the following errors:
//
//  [
//    {
//      message: "Variable \"$input\" got invalid value {}; Field \"title\" of required type \"String!\" was not provided.",
//      extensions: { code: 'BAD_USER_INPUT'
//    },
//    {
//      message: "Variable \"$input\" got invalid value {}; Field \"body\" of required type \"String!\" was not provided.",
//      extensions: { code: 'BAD_USER_INPUT'
//    },
//  ]
//
// In other words, Apollo server would never even get to the phase were it executed the resolver function.
// This is one of the major benefits of GraphQL - we get basic validation for free! That said, we may still want
// to perform additional validation checks. For example, are the strings empty? Is `title` a duplicate? etc.
//
// That said, it can be confusing on the client-side when receiving multiple GraphQLErrors.
// This is a known pain point.
// One solution to this is to omit the non-nullable operator (!) from the input fields:
// Consequently, the actual CreateTodoInput is as follows:
//
//   input CreateTodoInput {
//     title: String
//     body: String
//   }
//
// Then fine-grained validation and error handling can be implemented within the resolver function.
// This way we have a consistent and predictable error handling strategy.
//
// The downside to omitting ! on arguments or individual input fields when they are actually required
// is that it inaccurately represents the schema when viewed/treated as documentation. Consequently,
// it's probably best NOT to omit the non-nullable operator (!).
//
// Alternative: we can look for specific errors that have a code of 'BAD_USER_INPUT'
// https://www.apollographql.com/docs/apollo-server/data/errors#bad_user_input
//
// Then reduce them into a single GraphQLError with a value of extensions.badUserInputErrors. The
// following plugin does exactly that. This will also be triggered when an argument or input field
// is provided, but is of the incorrect type.
//
// Conclusion:
//
// This plugin attempts to make life easier for the client-side developer. However,
// it's also doing something that is generally not expected. Ultimately, this seems
// like a bad idea. It's much better if the client-side code has its own strategy
// for handling multiple simultaneous errors.
//
///////////////////////////////////////////////////////////////////////////

export const reduceBadUserInputErrorsPlugin = {
  __name: 'ReduceBadUserInputErrorsPlugin', // ? Why are we Pascal casing here?
  async requestDidStart() {
    // console.log('🔌 Plugin ran...')
    return {
      async didEncounterErrors(requestContext: any) {
        // console.log('requestContext:', Object.keys(requestContext))
        let { errors } = requestContext

        // The reason for iterating backwards (from the end to the start)
        // when removing items from an array is to avoid accidentally skipping
        // elements or running into index issues.
        if (Array.isArray(errors) && errors.length > 0) {
          const badUserInputErrors: Record<string, string> = {}

          for (let i = errors.length - 1; i >= 0; i--) {
            const err = errors[i]
            const isBadUserInputError =
              err?.extensions?.code === 'BAD_USER_INPUT'

            ///////////////////////////////////////////////////////////////////////////
            //
            // Parse the message to find the variable name and possibly also the field name for input objects.
            // ⚠️ This strategy is brittle and dependent on Apollo server maintaining a consistent
            // error message format. Moreover, it assumes that that the issue is either at the level
            // of a variable or a field inside an input that is only one level deep. If the error occurs
            // at a deeper level, this will not necessarily catch it, or potentially overwrite multiple
            // errors that share the same variable. In other words, it hasn't been tested on inputs with
            // deeper nesting. That said, for simple use cases this is a pretty useful plugin.
            //
            // In any case, it's worth noting that 'BAD_USER_INPUT' errors generally indicate an issue with
            // the developer's client-side consumption of the API, rather than the end user's actual input.
            // If the client-side developer handles client-side validation correctly, then in practice most
            // if not all 'BAD_USER_INPUT' cases will be eliminated ahead of time.
            //
            // Finally, when performing further validation within the resolvers, do not throw GraphQLErrors
            // with a code of 'BAD_USER_INPUT'. Instead, use a custom code like 'FORM_ERRORS', "INPUT_ERROR", etc.
            // Reserve 'BAD_USER_INPUT' for auto-generated Apollo server errors.
            //
            ///////////////////////////////////////////////////////////////////////////
            const variableMatch = err.message.match(/Variable\s+"\$(.+?)"/)
            const fieldMatch = err.message.match(/Field\s+"(.+?)"\s+of/)

            if (isBadUserInputError && variableMatch && variableMatch[1]) {
              let key = variableMatch[1]

              if (fieldMatch && fieldMatch[1]) {
                key = `${variableMatch[1]}.${fieldMatch[1]}`
              }

              badUserInputErrors[key] = err.message
              errors.splice(i, 1)
            }
          }

          if (Object.keys(badUserInputErrors).length > 0) {
            const badUserInputErrorKeys = Object.keys(badUserInputErrors).map(
              (key) => `\`${key}\``
            )

            const badUserInputError = new GraphQLError(
              `The following variable argument type(s) or variable input field(s) are invalid: ${badUserInputErrorKeys.join(
                ', '
              )}.`,
              {
                extensions: {
                  code: 'BAD_USER_INPUT',
                  badUserInputErrors
                }
              }
            )

            errors.push(badUserInputError)
          }
        }
      }
    }
  }
}
