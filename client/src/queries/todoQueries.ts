import { gql } from '@apollo/client'

const GET_TODOS = gql`
  query getTodos {
    result: todos {
      id
      title
      body
      completed
      user {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`

const GET_TODO = gql`
  query getTodo($id: ID!) {
    result: todo(id: $id) {
      id
      title
      body
      completed
      user {
        id
        name
        email
      }
      createdAt
      updatedAt
    }
  }
`

export { GET_TODOS, GET_TODO }
