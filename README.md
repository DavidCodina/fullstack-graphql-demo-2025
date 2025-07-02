# MERN GraphQL Demo

This project is split into two main folders: client and server. Each should run independently and should be opened in their own Terminal window.

**Auth:** This project implements a custom JWT authentication system that includes role-based access control for admins. Additionally, it uses a `BroadcastChannel` instance on the client to manage cross-tab comms during the logout process. It does not use a refresh token strategy. Instead, it uses a single _token-per-session_ approach, where all tokens are stored on the user document in a `tokens` array.

The `tokens` array is treated as a whitelist mechanism such that a session's respective token is removed during the log out process, or can be manually revoked by the administrator. By using an array of `tokens` rather than a single `token`, this app supports multiple concurrent user sessions across different devices and/or browser types.

In normal access + refresh token implementations, the crucial point that makes the refresh token _safer_ is that it's **scoped to a specific path** (e.g., '/refresh-token' in REST). This minimizes the attack surface and overall CSRF risk. However, it also necessitates additional trips from the server to the client and back to the server again when an access token expires. Conversely, giving both tokens the exact same cookie options defeats the whole point because they are now equally scoped and equally exposed.

In order to avoid the complexity of a true refresh token implementation, I've opted for this **hybrid approach**. Overall, this implementation deviates from a fully stateless JWT auth system, but works well for the current project.

**Comments Disclaimer:** Many files in this project have verbose comments. If this were an actual production app, I would not include so many comments. While they are helpful, they also obscure the natural readability of the code.

# server

...

# client

**Forms Disclaimer:** The forms are a little verbose because I'm not currently using React Hook Form or Zod. I decided to just do it all from scratch for this project. In a production app I would likely use third-party libraries.

...
