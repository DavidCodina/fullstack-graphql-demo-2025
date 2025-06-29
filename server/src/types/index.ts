import mongoose from 'mongoose'
import { GraphQLFieldResolver /*, GraphQLResolveInfo */ } from 'graphql'
import { createContext } from '../gql/createContext'
import { codes } from 'gql'

type Code = (typeof codes)[keyof typeof codes]

// This is used in each of the controllers to create a custom ResBody. For example:
// export const createOrder = async (req: Request, res: Response<ResBody<OrderType | null>>) => { ... }
export type ResBody<DataType> = {
  data: DataType
  message: string
  success: boolean
  errors?: Record<string, string> | null
  // 99.99% of the time, `code` implies an error code (i.e., 'ORDER_EXISTS', 'STOCK_ERRORS_FOUND', etc.)
  // However, Stripe uses the naming convention of `code` and I've followed that convention for my own codes.
  code?: Code
  // I like adding this because it makes the type more flexible, while still being informative.
  // That said, if you need additional properties, it's MUCH safer to write a custom
  // type for that clientAPI function.
  // [key: string]: any
}

export type Role = 'USER' | 'ADMIN'

export type Session = {
  id: string
  role: Role
  exp: number
  iat: number
}

export type User = {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  password: string
  role: Role
  token?: string
  createdAt: string
  updatedAt: string
}

export type ContextTypeUser = Omit<User, 'password' | 'token'>

export type Todo = {
  _id: mongoose.Types.ObjectId
  title: string
  body: string
  completed: boolean
  // Previously, I was doing this:  mongoose.Types.ObjectId | User
  // However, it's generally easier to leave it as mongoose.Types.ObjectId.
  // Then if you decide to populate the user in a specific case, you can also
  // Typecast the result.
  user: mongoose.Types.ObjectId
  createdAt: string
  updatedAt: string
}

export type Context = Awaited<ReturnType<typeof createContext>>

/** Used to typecast the return value of authenticate and authorize functions. */
export type ContextWithUser = Omit<Context, 'user'> & {
  user: ContextTypeUser
}

/** A maximally wide resolver type. */
export type AnyResolver = GraphQLFieldResolver<any, Context, any>
