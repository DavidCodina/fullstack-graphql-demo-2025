# MERN GraphQL Demo

This project is split into two main folders: client and server. Each should run independently and should be opened in their own Terminal window.

**Auth:** This project implements a custom JWT authentication system that includes role-based access control for admins. Additionally, it uses a `BroadcastChannel` instance on the client to manage cross-tab comms during the logout process. It does not use a refresh token strategy. Instead, it uses a single token-per-session and all tokens are stored on the user document in a `tokens` array. This `tokens` array is treated as a whitelist mechanism such that a session's respective token is removed through the log out process, or can be manually revoked by the administrator. By using an array of `tokens` rather than a single `token`, this app supports multiple concurrent
user sessions across different devices and/or browsers types.

Overall, this approach deviates from a fully stateless JWT implementation, but works well for the current project.

**Comments Disclaimer:** Many files in this project have verbose comments. If this were an actual production app, I would not include so many comments. While they are helpful, they also obscure the natural readability of the code.

# server

...

# client

**Forms Disclaimer:** The forms are a little verbose because I'm not currently using React Hook Form or Zod. I decided to just do it all from scratch for this project. In a production app I would likely use third-party libraries.

...
