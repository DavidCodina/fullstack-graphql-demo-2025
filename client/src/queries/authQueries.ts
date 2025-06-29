import { gql } from '@apollo/client'

const GET_SESSION = gql`
  query getSession {
    result: session {
      id
      role
      exp
      iat
    }
  }
`

export { GET_SESSION }
