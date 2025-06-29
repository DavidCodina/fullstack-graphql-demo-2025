import { UserMutation } from './UserMutation'
import { TodoMutation } from './TodoMutation'

const Mutation = {
  ...UserMutation,
  ...TodoMutation
}

export default Mutation
