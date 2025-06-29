import { GraphQLError } from 'graphql'
import { ObjectId } from 'mongodb'
// https://www.apollographql.com/docs/apollo-server/data/errors/
// https://www.youtube.com/watch?v=OtmKA3-e9Z8

import { authenticate } from '../../../authenticate' // Avoid circular dependency with relative import
import { codes } from '../../../codes' // Avoid circular dependency with relative import
import { User } from 'types'

//# The cascade deletion of todos should be on a hook, not here.

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
//
// Note: this mutation is returning UnsafeUser (similar to updating and currentUser).
// No userId is required here because the mutation is intended for
// the user to delete themself (not for admin).
//
// When we delete the user, we also want to delete any associated todos.
// That's pretty simple. Sometimes handling the related entities is a bit
// more complex. For example, in the Laith Harb Udemy tutorial there was
// an eCommerce demo that had products and product categories. Each product
// potentially had an associated category. In the case of deleting a category, we
// don't want to delete all associated products. Instead, we need to perform an
// updateMany() operation such that for all products with that category, we would
// then change the categoryId field value to undefined, or whatever it is we need to do in
// Mongoose to remove the optional field.
//
///////////////////////////////////////////////////////////////////////////

export const deleteUser = authenticate(
  async (_parent, args, context): Promise<User> => {
    const userId = context?.user?._id

    // ObjectId Check
    if (!ObjectId.isValid(userId)) {
      throw new GraphQLError('Invalid ObjectId.', {
        extensions: {
          code: codes.INVALID_INPUT
        }
      })
    }

    // deleteUser() is actually returning UnsafeUser
    const user = await context.models.User.findById(userId)
      .select({
        password: 0,
        token: 0
      })
      .exec()

    // Existence Check
    // This preempts this error:  "Cannot read properties of null (reading 'deleteOne')"
    if (!user) {
      throw new GraphQLError('Resource not found.', {
        extensions: { code: codes.NOT_FOUND }
      })
    }

    await context.models.Todo.deleteMany({ user: userId }).lean().exec() // => { acknowledged: true, deletedCount: 3 }

    //# deleteTodo implements an authorization check.
    //# Do we need that here?

    const _deleteResult = await user.deleteOne() // => { acknowledged: true, deletedCount: 1 }

    // On more than one occassion I've seen people return true for the value of
    // a deleted entity. I'm not a big fan of that. I prefer to return the entity.

    // Here we could just pass back deletedUser and hope that the
    // associated TypeDef doesn't expose anything sensitive/unsafe.
    // However, it'b better to make sure we remove any sensitive data
    // in advance.

    return user
  }
)
