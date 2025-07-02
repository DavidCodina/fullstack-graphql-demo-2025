/* ========================================================================
                                  userTypeDefs
======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// Note: the #graphql comment helps VS Code understand that it's not merely
// A normal template literal string. Consequently, it then is colored
// and formatted (syntax highlighting) as a like GraphQL.
//
// Generally, I just return the resource. However, if it's a mutation and
// that mutation uses the 'errors as data' pattern then I will return a *Response.
//
///////////////////////////////////////////////////////////////////////////

//# Prefer firstName and lastName

//# Add username and active fields...

// Adding #graphql to the beginning of a template literal
// provides GraphQL syntax highlighting in supporting IDEs.
export const userTypeDefs = `#graphql

  # =======================
  #     Entry Points
  # =======================

  type Query {
    users: [User!]
    user(id: ID!): User
    currentUser: UnsafeUser
    # In this case, session data is merely the decoded token.
    # However, we could add user data onto the session as well.
    # Just make sure this matches what's returned from createUser and loginUser.
    session: Session
  }

  type Mutation {
    createUser(input: CreateUserInput!): Session

    # This should return the same value as currentUser. Why?
    # The client may take the resullt and store it as the current user.
    updateUser(input: UpdateUserInput!): UnsafeUser

    # This version of deleteUser() is intended for the user. 
    # For that reason, we don't need to pass in an id.
    # Instead, the server will read the user's id off of
    # the token in the authorization header.
    # Omit parens when no args are used.
    deleteUser: UnsafeUser
    loginUser(input: LoginInput!): Session
    logoutUser: LogoutResponse
  }


  # Suppose we want to trigger an event whenever we create a new user
  # type Subscription {
  #  userCreated: UnsafeUser!
  # }

  # =======================
  #         User
  # =======================
  # Quoted comments like the one below show up in the Schema:Reference 
  # section of the Apollo Sandbox.

  enum Role {
    USER
    ADMIN
  }

  "We can add descriptions here within quotes like this..."
  type User {
    id: ID!
    "Descriptions can also be inserted on the filed level."
    name: String! 
    email: String!
    image: String
    todos: [Todo!]
    createdAt: String!
    updatedAt: String!
  }

  # includes role, but still not token
  type UnsafeUser {
    id: ID!
    name: String! 
    email: String!
    role: Role!
    image: String
    todos: [Todo!]!
    createdAt: String!
    updatedAt: String!
  }


  # =======================
  #       Session
  # =======================

  type Session {
    id: ID!
    role: Role!
    exp: Int!
    iat: Int!
  }

  # =======================
  #        Create
  # =======================

  input CreateUserInput {
    name: String!
    email: String!
    password: String!
    confirmPassword: String!
  }

  # =======================
  #        Update
  # =======================

  # In this case there's no longer an id property because we
  # will only allow the authenticated user to update themself.
  input UpdateUserInput {
    name: String
    email: String
    password: String
    confirmPassword: String
    # As an alternative, you could also use String and then pass a base64 encoded image.
    image: Upload
  }

  # =======================
  #        Login 
  # =======================

  input LoginInput {
    email: String!
    password: String!
  }

  # =======================
  #        Logout
  # =======================

  type LogoutResponse {
    message: String!
    success: Boolean!  
  }
`
