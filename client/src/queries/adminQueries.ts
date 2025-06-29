import { gql } from '@apollo/client'

const GET_ADMIN = gql`
  query getAdmin {
    result: admin {
      message
      name
      role
    }
  }
`

export { GET_ADMIN }
