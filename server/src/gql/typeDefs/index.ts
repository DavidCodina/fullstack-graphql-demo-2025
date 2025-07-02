import { userTypeDefs } from './UserTypeDefs'
import { todoTypeDefs } from './TodoTypeDefs'
import { adminTypeDefs } from './AdminTypeDefs'

const generalTypeDefs = `#graphql
  scalar Upload
`

// Combine type definitions into an array.
export const typeDefs = [
  generalTypeDefs,
  userTypeDefs,
  todoTypeDefs,
  adminTypeDefs
]
