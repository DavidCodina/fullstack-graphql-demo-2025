import { gql } from '@apollo/client'

const GET_USERS = gql`
  query getUsers {
    result: users {
      id
      name
      email
      createdAt
      updatedAt
    }
  }
`

const GET_USER = gql`
  query getUser($id: ID!) {
    result: user(id: $id) {
      id
      name
      email
      createdAt
      updatedAt
    }
  }
`

const GET_CURRENT_USER = gql`
  query getCurrentUser {
    result: currentUser {
      id
      name
      email
      role
      createdAt
      updatedAt
    }
  }
`

export { GET_USERS, GET_USER, GET_CURRENT_USER }
