import { ApolloError } from '@apollo/client'

export type GraphQLErrors = ApolloError['graphQLErrors']
export type GraphQLError = GraphQLErrors[number]

// This should match the Code type used on the server.
export type Code =
  | 'OK'
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'INVALID_INPUT'
  | 'FORM_ERRORS'
  | 'INVALID_CREDENTIALS'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SERVER_ERROR'

export type API_Response<T = unknown> = Promise<{
  data: T
  message: string
  success: boolean
  errors?: Record<string, string> | null
  // 99.99% of the time, `code` implies an error code (i.e., 'ORDER_EXISTS', 'STOCK_ERRORS_FOUND', etc.)
  // However, Stripe uses the naming convention of `code` and I've followed that convention for my own codes.
  code?: Code
  // I like adding this because it makes the type more flexible, while still being informative.
  // That said, if you need additional properties, it's MUCH safer to write a custom
  // API_Response type for that clientAPI function (i.e., see getCartProducts.ts).
  [key: string]: any
}>

export type Role = 'USER' | 'ADMIN'

export type Session = {
  id: string
  role: Role
  exp: number
  iat: number
}

export type User = {
  id: string
  name: string
  email: string
  createdAt: string
  updatedAt: string
}

export type UnsafeUser = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
  updatedAt: string
}

export type Todo = {
  id: string
  title: string
  body: string
  completed: boolean
  user: User
  createdAt: string
  updatedAt: string
}
