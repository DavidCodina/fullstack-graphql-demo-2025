import { gql } from '@apollo/client'

/* ======================
      LOGIN_USER
====================== */

const LOGIN_USER = gql`
  mutation LoginUser($input: LoginInput!) {
    result: loginUser(input: $input) {
      id
      role
      exp
      iat
    }
  }
`

/* ======================
      LOGOUT_USER
====================== */

const LOGOUT_USER = gql`
  mutation LogoutUser {
    result: logoutUser {
      message
      success
    }
  }
`

export { LOGIN_USER, LOGOUT_USER }
