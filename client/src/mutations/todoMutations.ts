import { gql } from '@apollo/client'

/* ======================
      CREATE_TODO
====================== */

export const CREATE_TODO = gql`
  mutation CreateTodo($input: CreateTodoInput!) {
    result: createTodo(input: $input) {
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

/* ======================
      UPDATE_TODO
====================== */

export const UPDATE_TODO = gql`
  mutation UpdateTodo($input: UpdateTodoInput!) {
    result: updateTodo(input: $input) {
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

/* ======================
      DELETE_TODO
====================== */

export const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) {
    result: deleteTodo(id: $id) {
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
