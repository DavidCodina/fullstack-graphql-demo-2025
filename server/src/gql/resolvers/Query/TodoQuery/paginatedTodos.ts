import { authenticate } from '../../../authenticate' // Avoid circular dependency with relative import
import { Todo } from 'types'

type PaginatedTodosData = {
  todos: Todo[]
  count: number
  nextPage: number | null
  previousPage: number | null
  isNextPage: boolean
  isPreviousPage: boolean
  pages: number
  currentPage: number
}

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// Example 1: Query with default pagination (i.e., page is 1, limit is Infinity).
// Note: If you have something commented out in the Apollo Sandbox Variables tab,
// it can lead to an error.
//
//   query PaginatedTodos {
//     paginatedTodos {
//       todos {
//         id
//         title
//         body
//         completed
//         createdAt
//         updatedAt
//       }
//       count
//       nextPage
//       previousPage
//       isNextPage
//       isPreviousPage
//       pages
//       currentPage
//     }
//   }
//
// Example 2: Query with custom pagination.
//
//   query PaginatedTodos($input: PaginatedTodosInput) {
//     paginatedTodos(input: $input)  {
//       todos {
//         id
//         title
//         body
//         completed
//         createdAt
//         updatedAt
//       }
//       count
//       nextPage
//       previousPage
//       isNextPage
//       isPreviousPage
//       pages
//       currentPage
//     }
//   }
//
//   {
//     "input": {
//       "limit": 3,
//       "page": 1
//     }
//   }
//
// Assuming that there are 12 todos, the expected result should be that we
// get back 'Todo 12', 'Todo 11', and 'Todo 10',
//
// Note: One shortcoming of offset-based pagination is that it assumes that
// item positions are static. However, that's not always the case. Let's say
// for example that while looking at our current result, a new todo is added.
// Now suppose we did this:
//
// {
//   "input": {
//     "limit": 3,
//     "page": 2
//   }
// }
//
// One might expect we'd get back 'Todo 9', 'Todo 8', and 'Todo 7'. However,
// because a new todo was just added we'd actually get back:
// 'Todo 10', 'Todo 9', and 'Todo 8'. This problem is avoided by using cursor-based pagination,
// which avoids overlap and is generally considered more accurate when dealing with dynamic data.
// There are different ways to create a cursor. The simplest way is to use the id of the
// last item in the group. That said, cursor-based pagination is also more complex to implement.
// This example does not implement cursor-based pagination.
//
// See Mirko Nasato's tutorial in GraphQL By Example in section 11, "Pagination Strategies" (72).
//
///////////////////////////////////////////////////////////////////////////

export const paginatedTodos = authenticate(
  async (
    _parent,
    args: { input?: { page: number; limit: number } },
    context,
    _info
  ): Promise<PaginatedTodosData> => {
    const userId = context.user._id

    // Set default values for pagination
    const page = args.input?.page || 1
    const limit = args.input?.limit || Infinity

    // Calculate pagination indexes
    const startIndex = (page - 1) * limit
    const endIndex = page * limit

    // Create base query
    // Sort by date in reverse chronological order.
    let query = context.models.Todo.find({ user: userId }).sort({
      createdAt: -1
    })

    // Get total count for pagination calculations
    const count = await context.models.Todo.countDocuments({ user: userId })

    // Calculate pagination metadata
    const isPreviousPage = startIndex > 0
    const isNextPage = endIndex < count

    const previousPage = page > 1 ? page - 1 : null
    const isMoreItems = endIndex < count
    const nextPage = isMoreItems ? page + 1 : null

    // Because we are using Infinity as the default limit, we need to have 1
    // as a fallback in cases where Math.ceil(count / limit) is 0.
    const pages = Math.ceil(count / limit) || 1

    // Apply pagination to query
    query = query.limit(limit).skip(startIndex)

    // Execute query
    const todos = await query.exec()

    return {
      todos,
      count,
      nextPage,
      previousPage,
      isNextPage,
      isPreviousPage,
      pages,
      currentPage: page
    }
  }
)
