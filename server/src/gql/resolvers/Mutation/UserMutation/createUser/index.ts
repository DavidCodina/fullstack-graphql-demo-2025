import { GraphQLError } from 'graphql'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
// import { ObjectId } from 'mongodb'

import { codes } from '../../../../codes' // Avoid circular dependency with relative import
import { getZodErrors } from 'utils'
import { decodeToken, tokenExpiration, cookieOptions } from '../token-utils'
import { getCreateUserSchema } from './getCreateUserSchema'
import { AnyResolver, Session } from 'types'

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// Type definition: createUser(input: CreateUserInput!): CreateUserResponse!
//
// mutation CreateUser($input: CreateUserInput!) {
//   createUser(input: $input) {
//     id
//     role
//     exp
//     iat
//   }
// }
//
// {
//   "input": {
//     "name": "David Codina",
//     "email": "david@example.com",
//     "password": "12345",
//     "confirmPassword": "12345"
//   }
// }
//
///////////////////////////////////////////////////////////////////////////

//
export const createUser: AnyResolver = async (
  _parent,
  args,
  context
): Promise<Session> => {
  const { res } = context
  const { name, email, password, confirmPassword } = args.input

  const existingUser = await context.models.User.findOne({
    email: new RegExp(`^${email}$`, 'i')
  })
    .lean()
    .exec()

  /* ======================
          Validation
  ====================== */

  const CreateUserSchema = getCreateUserSchema({
    existingUser,
    password
  })

  const validationResult = CreateUserSchema.safeParse({
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

  // At this point data is assured.
  const validated = validationResult.data

  /* ======================
        Create User
  ====================== */
  // Best practice: use the validated/sanitized data when creating the user.
  // This takes a little bit of trust in Zod, but rest assured that the data
  // is on the validated object.

  const hashedPassword = await bcrypt.hash(validated.password, 10)

  const newUser = new context.models.User({
    name: validated.name,
    // https://www.youtube.com/watch?v=htB2uJCf4ws at 13:15
    // "All emails are technically lowercase."
    // Also, doing this would then work with the unique constraint
    // in the Mongoose model even in the absence of the case-insensitive
    // email regex check done above.
    email: validated.email.toLowerCase(),
    password: hashedPassword
  })

  // Create JWT
  const token = jwt.sign(
    {
      id: newUser._id,
      role: newUser?.role || 'USER'
    },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: tokenExpiration }
  )

  const decoded = decodeToken(token, process.env.ACCESS_TOKEN_SECRET!)!

  // If you're ONLY using an access token, then there's no reason
  // to store it in the databa se.
  newUser.token = token

  // Resave the user now that it has the token
  const savedUser = await newUser.save()

  ////////////////////////////////////////////////////////////////////////////
  //
  // 07/2023 : Previously, I was doing this:
  //
  //   const sanitizedUser = { id: savedUser.id, ...savedUser._doc }
  //   delete sanitizedUser.password
  //   delete sanitizedUser._id
  //   return sanitizedUser
  //
  // The _doc thing came from Cooper Codes:
  // See Cooper Codes tutorial at 23:45:     https://www.youtube.com/watch?v=uPxo9NQLVMI
  // He also uses the pattern here at 18:00: https://www.youtube.com/watch?v=htB2uJCf4ws
  //
  // Gotcha: Even though the GraphQL type does not allow querying for password,
  // it's still a good idea to remove it here. There's a problem though.
  // Mongoose uses an abstraction such that savedUser.id and savedUser._id
  // currently both exist.
  //
  // However, as soon as we do savedUser = savedUser.toObject()
  // the savedUser.id is no longer available. Thus doing this will break the GraphQL
  // requirement that there be an id property:
  //
  //   savedUser = savedUser.toObject()
  //   delete savedUser.password
  //
  // If you really want to remove the password from the document before
  // returning it, you have to do something like this.
  //
  //   const user = await User.findById(newUser._id).select('-password').exec()
  //   return user
  //
  // However, the above solution entails manually creating a sanitizedUser.
  // That said, I decided that it was actually better to ONLY return the token.
  // This is so the data on the client is the same whether from refreshing and
  // getting value from localStorage, or when registering/logging in.
  //
  // Also it's just generally seems better to separate the concerns.
  //
  ////////////////////////////////////////////////////////////////////////////

  if (res && res.cookie) {
    res.cookie('token', token, cookieOptions)
  }

  // This matches exactly what's in the JWT,
  // as well as what's returned from the session query resolver
  // and from the loginUser mutation resolver.
  const session = {
    id: savedUser._id.toString(),
    role: savedUser.role,
    exp: decoded.exp,
    iat: decoded.iat
  }

  return session
}
