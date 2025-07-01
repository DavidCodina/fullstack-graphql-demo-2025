import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs'

import Query from './Query/index.js'
import Mutation from './Mutation/index.js'

import User from './User'
import UnsafeUser from './UnsafeUser'
import Todo from './Todo'

/* ========================================================================
                                resolvers
======================================================================== */
// resolvers are simply functions that are intended to resolve queries.
// The main issue I have with this code is there's no try / catch wrappers,
// and there's no custom error messages. It's just a different way of doing things...

export const resolvers = {
  Upload: GraphQLUpload, // 👈 This line makes the Upload scalar work
  Query: Query,
  Mutation: Mutation,

  User: User,
  UnsafeUser: UnsafeUser,
  Todo: Todo
}
