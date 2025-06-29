/* ========================================================================
-                                 todoTypeDefs
======================================================================== */

export const todoTypeDefs = `#graphql
  # =======================
  #     Entry Points
  # =======================
  
  type Query {
    # In REST APIs, I generally return { code, data, errors, message, success }.
    # However, in GraphQL APIs, it's more idiomatic for queries to return
    # the resource directly. Then if there's an error on the client, it can
    # read from error.graphQLErrors that Apollo client will expose.
    todos: [Todo!]
    paginatedTodos(input: PaginatedTodosInput): PaginatedTodosData

    ###########################################################################
    #
    # Mirko Nasato's GraphQL By Example video 33 @2:00, he argues against making the 
    # returned resource non-nullable. His point is that doing this is a bad practice: 
    #
    #   todo(id: ID!): Todo! 
    #
    # Why? If the ID passed in does not point to an existing todo, then we'll end up with an "INTERNAL_SERVER_ERROR".
    #
    #   "Cannot return null for non-nullable field Query.todo."
    #
    # This can be misleading because the issue is not actually with the server, but with the client who
    # passed in an id for a resource that doesn't exist. However, the issue isn't really with using !, but
    # instead with not handling errors correctly in the resolver. This fix is to always write checks in the
    # resolovers:
    #
    #   if (!todo) {
    #     throw new GraphQLError('Resource not found.', {
    #      extensions: { code: 'NOT_FOUND' }
    #     })
    #   }
    #
    # Conclusion: for queries ALWAYS use the ! modifier and handle the non-existence case 
    # by explicitly throwing an error in the resolver.
    #
    # The real point Mirko is making is with allowing partial data to be returned.
    # Suppose we have the following query:
    # 
    # query User($id: ID!) {
    #    all_users: users {
    #     id
    #     name
    #   }
    #
    #   user(id: $id) {
    #     id
    #     name
    #   }
    # }
    #
    # {
    #   "id": "6675a5a82fa279e53cb79b7f"
    # }
    #
    # If the associated user type definition is defined as: user(id: ID!): User!
    # Then any error in that field will cause the entire query to return null for the data field
    # (i.e., no partial data for all_users)
    #
    # Conversely, if the field is nullable, GraphQL will set that specific field to null and still 
    # return data for other successful fields.  Thus, he argues that all top-level fields should be
    # nullable. An error in one field shouldn't prevent other fields from being returned. GraphQL 
    # is designed for fault tolerance. Conclusion: NEVER use ! resolver return values. Instead, throw
    # GraphQLErrors in the resolvers for null values.
    #
    # Finally, Mirko notes that while you can request multiple fields in a query, in practice 
    # he rarely does this. That way, it's easier to handle the response.
    #
    ###########################################################################

    todo(id: ID!): Todo
  }

  type Mutation {
    ###########################################################################
    #
    # For mutations it's not uncommon to see GraphQL APIs implement the 
    # 'errors as data' pattern. I've seen this done in the official 
    # Apollo Lift-Off Tutorials, and in other tutorials.
    #
    # The official Apollo video tutorials also explicitly define response types like this:
    # See the Lift-off series, part 4.2: https://www.apollographql.com/tutorials/lift-off-part4/03-adding-a-mutation-to-our-schema
    #
    # https://dev.to/fenok/handling-apollo-errors-in-react-apl
    # I've seen others use a union, but this works just as good.
    # Laith Harb uses the 'errors as data' approach in the Udemy
    # tutorial, video 55 at 6:45.
    #
    # Thus we could have something like this:
    #
    #   type Mutation {
    #     createTodo(input: CreateTodoInput!): CreateTodoResponse!
    #   }
    # 
    #   type CreateTodoFormErrors {
    #     title: String
    #     body: String
    #   }
    #
    #   type CreateTodoResponse {
    #     code: String
    #     data: Todo
    #     formErrors: CreateTodoFormErrors
    #     message: String
    #     success: Boolean
    #   }
    # 
    # While this is a valid pattern, it's not really the most idiomatic approach.
    # In fact, it has several drawbacks. First, we have to manually define the 
    # CreateTodoFormErrors type here. Second, it creates a lot of extra work on the client.
    # For example, say the client is using Apollo Client. Then our mutation would look like this:
    #
    #   const [createTodo, { loading: creatingTodo, error }] = useMutation(CREATE_TODO, {
    #     variables: { input: createTodoInput },
    #
    #     onError(errors) {}
    #
    #     onCompleted(data) {
    #       const { createTodo: createTodoResponse } = data
    #       const { data: todo, formErrors, success } = createTodoResponse
    #       if (formErrors) { ... }
    #     }
    #   })
    #
    # The point being that we can no longer simply trust error or onError().
    # Instead, we have to check data.formErrors. This is tedious and unintuitive,
    # and can easily lead to bugs if the consumer doesn't understand the pattern.
    # It's just so much more idiomatic to throw GraphQLErrors!
    #
    ###########################################################################

    createTodo(input: CreateTodoInput!): Todo
    updateTodo(input: UpdateTodoInput!): Todo
    deleteTodo(id: ID!): Todo
  }

  # =======================
  #         Todo
  # =======================

  type Todo {
    id: ID!
    title: String!
    body: String
    completed: Boolean!
    user: User!

    ###########################################################################
    #
    # MongoDB stores your createdAt as a proper JavaScript Date object
    # GraphQL doesn't have a native Date scalar type, only String, Int, Float, Boolean, and ID
    # When GraphQL serializes the Date object using the String type, it calls toString() on the 
    # Date, which converts it to a timestamp string like "1718986387087".
    #
    # While it's acceptable to leave this as it is, it's also possible to use a custom Date scalar.
    # https://graphql.org/learn/schema/#scalar-types
    # The downside with custom scalars is that not all GraphQL implementations support them.
    # So if you want your API to be usable by any client, then it's best to stick with the default scalar types.
    #
    # It's also possible to manually transform the dates from the database BEFORE GraphQL does it for you.
    # Thus, in resolvers/Todo.ts, we can do this:
    #
    #   createdAt: (parent: any) => { return parent.createdAt.toISOString() },
    #   updatedAt: (parent: any) => { return parent.updatedAt.toISOString() }
    #
    # This approach works well. Most clients are likely expecting dates as ISO 8601 strings.
    # However, it's worth asking yourself whether the transformation should happen at the GraphQL level,
    # or at the database level. For example, it may be possible to create a global transformation at the
    # database level as follows:
    #
    #     mongoose.set('toJSON', {
    #       transform: function(doc, ret) {
    #       // Transform any Date fields to ISO strings
    #       Object.keys(ret).forEach(key => {
    #         if (ret[key] instanceof Date) { ret[key] = ret[key].toISOString(); }
    #       });
    #         return ret;
    #      }
    #    });
    # 
    # It may also be possible to create a custom directive that automatically transforms date fields:
    #
    ###########################################################################

    createdAt: String!
    updatedAt: String!
  }

  # =======================
  #       Paginated
  # =======================

  input PaginatedTodosInput {
    page: Int!
    limit: Int!
  } 

  type PaginatedTodosData {
    todos: [Todo!]!
    count: Int!
    nextPage: Int
    previousPage: Int
    isNextPage: Boolean!
    isPreviousPage: Boolean!
    pages: Int!
    currentPage: Int!
  }

  # =======================
  #        Create
  # =======================

  input CreateTodoInput {
    title: String!
    body: String
  }

  # =======================
  #       Update
  # =======================

  input UpdateTodoInput {
    id: ID! # The todo id is required, so we know which post to update.
    title: String
    body: String
    completed: Boolean
  }
`

/*
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';

function dateTransformDirective(schema, directiveName = 'dateTransform') {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const directive = getDirective(schema, fieldConfig, directiveName)?.[0];
      if (directive) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        fieldConfig.resolve = function(source, args, context, info) {
          const result = resolve(source, args, context, info);
          if (result instanceof Date) {
            return result.toISOString();
          }
          return result;
        };
      }
      return fieldConfig;
    }
  });
}

// In your schema:
directive @dateTransform on FIELD_DEFINITION

type Todo {
    createdAt: String! @dateTransform
    updatedAt: String! @dateTransform
}
*/
