import { TodoQuery } from './TodoQuery'
import { UserQuery } from './UserQuery'
import { AdminQuery } from './AdminQuery'

const Query = {
  ...UserQuery,
  ...TodoQuery,
  ...AdminQuery
}

export default Query
