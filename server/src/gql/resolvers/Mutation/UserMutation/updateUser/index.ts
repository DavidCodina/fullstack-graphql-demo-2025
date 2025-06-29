import { GraphQLError } from 'graphql'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

import { getZodErrors } from 'utils'
import { authenticate } from '../../../../authenticate' // Avoid circular dependency with relative import
import { codes } from '../../../../codes' // Avoid circular dependency with relative import
import { getUpdateUserSchema } from './getUpdateUserSchema'
import { User } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// mutation UpdateUser($input: UpdateUserInput!) {
//   updateUser(input: $input) {
//     id
//     name
//     email
//     role
//     createdAt
//     updatedAt
//   }
// }
//
// {
//   "input": {
//     "name": "DaveMan"
//   }
// }
//
// Note: updateUser ultimately, responds back with { user } (AKA UnsafeUser).
// Why? It's conceivable, that a client may for some reason
// take the response data and save it as THE user (i.e., the same as currentUser).
// This is why I'm returning UnsafeUser. Because the end user could
// potentially be using it in the same areas as the data from currentUser.
//
///////////////////////////////////////////////////////////////////////////

export const updateUser = authenticate(
  async (_parent, args, context): Promise<User> => {
    const userId = context?.user?._id

    /* ======================
        ObjectId Check
  ====================== */

    if (!ObjectId.isValid(userId)) {
      throw new GraphQLError('Invalid ObjectId.', {
        extensions: {
          code: codes.INVALID_INPUT
        }
      })
    }

    const { name, email, password, confirmPassword } = args.input
    ///////////////////////////////////////////////////////////////////////////
    //
    // A client form may initialize field values as ''. If they then inadvertently send those
    // values, the Zod validation's optional() method WILL validate against them.
    // In this specific case, '' is never an allowed value. Consequently, we can preempt this
    // by setting '' values to undefined in the resolver.
    //
    //   let { name, email, password, confirmPassword } = args.input
    //   name = name || undefined
    //   email = email || undefined
    //   password = password || undefined
    //   confirmPassword = confirmPassword || undefined
    //
    // It may seem more idiomatic to handle the transformation in the Zod schema:
    //
    //    .transform((val) => val || undefined).optional()
    //
    //  However, this inevitably leads to complications with methods like .min(), .email(), etc.
    //
    // In any case, it's not really the responsibility of the server to preempt this issue.
    // If the client sends us '' values, we simply send them back an error.
    // The server's job is to validate that the data it receives is correct, not to guess what
    // the client "really meant" when it sends empty strings.
    //
    ///////////////////////////////////////////////////////////////////////////

    const user = await context.models.User.findById(userId).exec()

    /* ======================
        Existence Check
  ====================== */

    if (!user) {
      throw new GraphQLError('Resource not found.', {
        extensions: { code: codes.NOT_FOUND }
      })
    }

    /* ======================
          Validation
  ====================== */

    const existingUser = await context.models.User.findOne({
      email: new RegExp(`^${email}$`, 'i')
    })
      .lean()
      .exec()

    const UpdateUserSchema = getUpdateUserSchema({
      userId,
      existingUser,
      password
    })

    const validationResult = UpdateUserSchema.safeParse({
      name,
      email,
      password,
      confirmPassword
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
        Update User
  ====================== */
    // At this point, we know that the values are not empty strings.
    // However, they may or may not exist since they're optional in
    // the Zod schema.

    if (validated.name) {
      user.name = validated.name
    }

    if (validated.email) {
      user.email = validated.email
    }

    if (validated.password) {
      const hashedPassword = await bcrypt.hash(validated.password, 10)
      user.password = hashedPassword
    }

    const updatedUser = await user.save()

    //# ??? Sanitize the user as was done in deleting user.

    return updatedUser
  }
)
