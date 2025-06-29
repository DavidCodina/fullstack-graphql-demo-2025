import { gql } from '@apollo/client'

/* ======================
      CREATE_USER
====================== */

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    result: createUser(input: $input) {
      id
      role
      exp
      iat
    }
  }
`

/* ======================
      UPDATE_USER
====================== */

//# ...

/* ======================
      DELETE_USER
====================== */

export const DELETE_USER = gql`
  mutation DeleteUser {
    result: deleteUser {
      id
      name
      email
      role
      createdAt
      updatedAt
    }
  }
`
