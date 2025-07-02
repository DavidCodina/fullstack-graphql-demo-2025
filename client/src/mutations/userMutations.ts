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

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    result: updateUser(input: $input) {
      id
      name
      email
      image
      role
      createdAt
      updatedAt
    }
  }
`

/* ======================
      DELETE_USER
====================== */

export const DELETE_USER = gql`
  mutation DeleteUser {
    result: deleteUser {
      id
      name
      email
      image
      role
      createdAt
      updatedAt
    }
  }
`
