// import { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql'
import { ExpressContextFunctionArgument } from '@apollo/server/express4'
import jwt from 'jsonwebtoken'
import { createUserLoader } from 'gql/resolvers/loaders/createUserLoader'
import User from 'models/userModel'
import Todo from 'models/todoModel'

import { User as UserType } from 'types'

const models = {
  User,
  Todo
}

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// Rather than manually creating a Context type, we can instead implement
// a createContext() function that can infer most of the context, but needs
// a little help in some cases.
//
// In addition to passing the user through context, it's also common to pass
// a models object that contains all of the DB models. One could import them
// into a resolver files using ESM syntax. Scott Moss is a big fan of passing
// models through the context. He argues that  it makes testing much easier when
// you can simply inject a dummy model as an argument vs having to mock a model
// as a module.
//
// The same logic applies to loaders. It would also be very tedious to module mock the
// loader in unit tests.
//
///////////////////////////////////////////////////////////////////////////

export type ContextTypeUser = Omit<UserType, 'password'>

export const createContext = async (
  expressContextFunctionArgument: ExpressContextFunctionArgument
) => {
  const { req, res } = expressContextFunctionArgument

  let user: Omit<UserType, 'password'> | null = null

  const userLoader = createUserLoader()

  const token = req.cookies.token

  if (!token || typeof token !== 'string') {
    return {
      req,
      res,
      models,
      user,
      userLoader
    }
  }

  try {
    // jwt.verify() will throw an error if the token is invalid.
    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as jwt.JwtPayload

    const userId = decoded.id
    // Rather than using the limited user info that's on the decoded token,
    // it's better to use the decoded token to get the actual user from the
    // database, which is the ultimate source of truth.
    user = await User.findById(userId).select('-password').lean().exec()

    return { req, res, models, user, userLoader }
  } catch {
    return { req, res, models, user, userLoader }
  }
}
