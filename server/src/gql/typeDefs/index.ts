import { userTypeDefs } from './UserTypeDefs'
import { todoTypeDefs } from './TodoTypeDefs'
import { adminTypeDefs } from './AdminTypeDefs'

// Combine type definitions into an array.
export const typeDefs = [userTypeDefs, todoTypeDefs, adminTypeDefs]
