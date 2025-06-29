/* ========================================================================
                                  AdminTypeDefs
======================================================================== */

export const adminTypeDefs = `#graphql

  type Query {
    admin: AdminTest
  }

  # type Mutation {}

  # =======================
  #      
  # =======================

  type AdminTest {
    name: String!
    role: String!
    message: String!
  }
`
