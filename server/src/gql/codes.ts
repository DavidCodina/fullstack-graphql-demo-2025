/** Custom error codes */
export const codes = {
  ///////////////////////////////////////////////////////////////////////////
  //
  // In REST API's it sometimes makes sense to send back a code even for successful operations:
  // { code, data, message, success }. However, in the case of Apollo Server, we're only using
  // codes for errors.
  //
  ///////////////////////////////////////////////////////////////////////////

  /** Use this in REST APIs ONLY - NOT in GraphQLErrors. */
  OK: 'OK',

  /** Use this in REST APIs ONLY - NOT in GraphQLErrors. */
  CREATED: 'CREATED',

  /** Use this in REST APIs ONLY - NOT in GraphQLErrors. */
  UPDATED: 'UPDATED',

  /** Use this in REST APIs ONLY - NOT in GraphQLErrors. */
  DELETED: 'DELETED',

  ///////////////////////////////////////////////////////////////////////////
  //
  // In other apps, BAD_REQUEST makes sense here.
  // However, because we're using GraphQL it's best to only use custom error codes,
  // and not built-in error codes. This helps distinguish where the error came from.
  //
  //   ❌ BAD_REQUEST: 'BAD_REQUEST'
  //
  ///////////////////////////////////////////////////////////////////////////

  /** Use this when an invalid argument was passed to the resolver (i.e., bad ObjectId).
   * Note: use `FORM_ERRORS` when the invalid value is part of form validation.
   */
  INVALID_INPUT: 'INVALID_INPUT',
  /** Use this when the invalid value(s) are part of server-side form input validation.
   * Additionally, send back an extensions.formErrors object with the GraphQLError.
   */
  FORM_ERRORS: 'FORM_ERRORS',

  /** Use this as an opaque error code for all failed login attempts. */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  /** Use this when authentication fails. */
  UNAUTHORIZED: 'UNAUTHORIZED',

  /** Use this when authorization fails. This may be used for RBAC or when a
   * reources associated user id does not match the current user's id.
   */
  FORBIDDEN: 'FORBIDDEN',

  /** Use this when a resource is not found. */
  NOT_FOUND: 'NOT_FOUND',

  ///////////////////////////////////////////////////////////////////////////
  //
  // Generally speaking, even 'SERVER_ERROR' should not be needed most of the time.
  // Apollo resolvers automatically catch errors without needing a try/catch. This
  // means that most of the time you won't be using a try/catch, which means that
  // most of th time you won't need to use 'SERVER_ERROR'.
  //
  //   ❌ INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  //
  ///////////////////////////////////////////////////////////////////////////

  /** Use this ONLY when you're manually rethrowing within a catch block.
   * Generally, this shouldn't be needed because try/catch is unnecessary in Apollo resolvers.
   */
  SERVER_ERROR: 'SERVER_ERROR'
} as const
