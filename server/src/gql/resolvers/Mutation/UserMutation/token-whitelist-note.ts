/*

When a user logs in or registers, a JWT is created and assigned to an httpOnly cookie on the response.
Additionally, a `tokens` array has been added  to the user document in the database.

Technically, this isn't necessary and JWT auth systems are often intended to be stateless.
That said, the `tokens` array can function as a revocation mechanism that supports multiple
concurrent sessions (i.e., different browsers, different devices, etc).


authenticate.ts now not only performs a basic user check, but also a whitelist check:

  if (!token || typeof token !== 'string' || !context.user.tokens || !Array.isArray(context.user.tokens) ||  !context.user.tokens.includes(token)) {
    throw new GraphQLError('Whitelist check failed.', { extensions: { code: codes.UNAUTHORIZED } })
  }


The absence of the specific token is an indication that the user's authentication status has been revoked or
that the user is no longer logged into that session. Thus, regardless of whether or not the httpOnly cookie has
a valid JWT, the specific token must also exist in the `tokens` array.

=========================

=========================

This is known as a stateful revocation mechanism. It's a form of a "token allow-list" 
(the opposite of a blacklist/deny-list). Instead of keeping a list of revoked tokens, 
you keep a list of valid ones. It’s similar to how refresh tokens are often managed, 
but you’re doing it with access tokens.

Pros:
  - Immediate revocation: You can kill a session instantly by removing the token.
  - Simple to implement: No need for a separate blacklist collection or Redis.
  - Supports Granularity of Revocation  (e.g., logging out of a laptop but remaining logged in on a phone) 

Cons (?):

  - It's often said that a downside to this approach is that checking for the presence of token in the database, 
    requires an additional database lookup on every single authenticated request. However, we're ALREADY
    getting the user document from the database. This is just a property on the user document. Thus, in the
    current implementation, we're not adding any extra work for the database.

=========================

=========================

One potential drawback of this system is the need to more carefully manage the `tokens` array.
For example, it's possible to accumulate a number of expired tokens over time. Ultimately, we'd 
also need some kind of cleanup process to remove expired tokens. One way to achieve this is through
a cron job. Another approach would be to perform a check on all tokens when a login occurs. The latter
approach seems like it would work fine, but has yet to be implemented.








*/
