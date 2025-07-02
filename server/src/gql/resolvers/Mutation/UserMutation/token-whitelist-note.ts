/*

When a user logs in or registers, a JWT is created and assigned to an httpOnly cookie on the 
response object. Additionally, a `tokens` array has been added to the user document in the database.

Technically, this isn't necessary and JWT auth systems are often intended to be stateless.
That said, the `tokens` array functions as a revocation mechanism that supports multiple
concurrent sessions (i.e., different browsers, different devices, etc).


authenticate.ts now not only performs a basic user check, but also a whitelist check:

  if (!token || typeof token !== 'string' || !context.user.tokens || !Array.isArray(context.user.tokens) || !context.user.tokens.includes(token)) {
    throw new GraphQLError('Whitelist check failed.', { extensions: { code: codes.UNAUTHORIZED } })
  }


The absence of the specific token is an indication that the user has logged out of the session or that the 
session  has been revoked. Thus, regardless of whether or not the httpOnly cookie has a valid JWT, the 
specific token must also exist in the `tokens` array.

=========================

=========================

This is known as a stateful revocation mechanism. It's a form of a "token allow-list" 
(the opposite of a blacklist/deny-list). Instead of keeping a list of revoked tokens, 
you keep a list of valid ones. It’s similar to how refresh tokens are often managed, 
but you're doing it with access tokens.

Pros:
  - Immediate revocation: You can kill a session instantly by removing the token.
  - Simple to implement: No need for a separate blacklist collection or Redis.
  - Supports granularity of revocation  (e.g., logging out of a laptop but remaining logged in on a phone). 

Cons (?):

  - It's often said that a downside to this approach is that checking for the presence of token in the database, 
    requires an additional database lookup on every single authenticated request. However, we're ALREADY
    getting the user document from the database. This is just a property on the user document. Thus, in the
    current implementation, we're not adding any extra work for the database.

  - One potential drawback of this system is the need to more carefully manage the `tokens` array.
    For example, it's possible to accumulate a number of expired tokens over time. Ultimately, we'd 
    also need some kind of cleanup process to remove expired tokens. One way to achieve this is through
    a cron job. Another approach would be to perform a check on all tokens when a login occurs. The latter
    approach seems like it would work fine, but has yet to be implemented.

=========================
  refreshTokens revisited
=========================

Standard JWT Auth Flow with Refresh Tokens

  1. Credentials (e.g., email + password) are submitted to your /login endpoint.

  2. Creates a short-lived accessToken (e.g., 15 minutes).

  3. Creates a long-lived refreshToken (e.g., 7 days or more).

  4. Store the refreshToken in the database, typically in a RefreshToken model or embedded in the user document.
     Revoke refresh token to kill session.

  5. Sends both tokens to the client.
    - accessToken → HttpOnly, Secure, SameSite cookie.
    - refreshToken → also in an HttpOnly cookie (standard practice), 
      or optionally stored in-memory on mobile/native clients. 

Why Store the Refresh Token in the Database?

=========================

Storing the refreshToken server-side allows you to:

  - Revoke sessions (e.g., logout, suspicious activity).
  - Track multiple sessions per user (device-specific refresh tokens).
  - Rotate tokens securely (detect reuse of old refresh tokens).

=========================

Refresh Flow:

  Rather than getting an expired accessToken, sending back a 401, then rquesting a new accessToken,
  it's easier to simply handle the logic directly within the context BEFORE authenticate.ts runs.

=========================

Why Send the Refresh Token to the Client at All?

If we're going to store the refreshToken in the database (e.g., user.refreshToken), then why bother sending it to 
the client in an httpOnly cookie. Why not just send the accessToken only? In other words, if you're already storing 
the refresh token in the database, it might seem redundant to also send it to the client in an httpOnly cookie. 
But here's the key:

   - The refresh token is a client-held credential —it proves the client is still authorized to request a new access token.

So even though the server stores a copy (or a hashed version) for validation, the client still needs to present it when the 
access token expires. Without it, the server has no way to verify that the client is still authenticated.


=========================

accessToken exposure vs refreshToken exposure:

One of the things that generally confused me about sending both tokens to the client
as httpOnly cookies is that they seemed equally exposed since they're both sent with 
every request.

The idea that is often not discussed is that refresh tokens are generally scoped to a specific 
path to avoid unnecessary exposure (i.e., '/refresh-token'). This reduces overall CSRF risk, and
minimizes the attack surface. Conversely, if both tokens are scoped identically, they are equally 
exposed —which undermines the refresh token’s role as a safer, longer-lived credential.

Thus, if your refresh token is being sent with the same frequency and exposure as your access token, 
then its role as a safer, long-lived credential is indeed undermined. At that point, you’re essentially 
treating both tokens as bearer credentials with similar risk profiles.
You’ve added complexity (rotation, refresh endpoint) without gaining isolation.

So... With this in mind, is the original approach just as good?
In this case, it's arguably better.

   - You’re not pretending the refresh token is safer when it’s not.
   - You’ve centralized session control in a single token list.
   - You’ve avoided the complexity of refresh token rotation and reuse detection.
   - You’ve kept the flow simple and auditable.

If you’re going to send both tokens with equal frequency, then your original long-lived access token + whitelist model is cleaner, more honest, and easier to manage. I


*/
