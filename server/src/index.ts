import path from 'path'
import { createServer } from 'http'
import express from 'express'
import * as dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
////////////////////////////////////////////////////////////////////////////////
//
// https://www.npmjs.com/package/graphql-upload
// Note: Use apollo-upload-client on the React side for uploading images.
// See here: https://www.apollographql.com/docs/react/data/file-uploads
// graphql-upload must be used with an actual Express server.
// It will not work with just startStandaloneServer.
//
////////////////////////////////////////////////////////////////////////////////
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'
// import morgan from 'morgan'

////////////////////////////////////////////////////////////////////////////////
//
// When working with bundlers like ESBuild, command line errors often point toward the
// bundled index.js file. This happens because the bundler transforms your code and combines
// it into a single file, and the error is thrown in the context of the transformed code,
// not the original source code. This can be challenging when one is debugging.
//
// Another solution if you get an error is to simply run:  "test:build": "tsc -noEmit",
// Thus in nodemon.json I changed this:
//
//   "exec": "npm run build && node ./dist/index.js",
//
// To:
//
//   "exec": "npm run test:build && npm run build && node ./dist/index.js",
//
// But actually, there's a better solution (make sure sourcemap:true in esbuild config):
//
//   import 'source-map-support/register'
//
////////////////////////////////////////////////////////////////////////////////
import 'source-map-support/register'

import { ApolloServer } from '@apollo/server'
// https://www.apollographql.com/docs/apollo-server/integrations/integration-index
// https://www.npmjs.com/package/@as-integrations/express4
// Apollo maintains an integration between Apollo Server and Express, the most popular Node.js
// web framework. The integration with Express v4 is published as @as-integrations/express4...
// The Express v4 integration is also included in the main @apollo/server package, exported from
// @apollo/server/express4. Its behavior is identical to the @as-integrations/express4.

import {
  expressMiddleware as apolloMiddleware
  // ExpressContextFunctionArgument
} from '@apollo/server/express4'

import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'

import { errorHandler, notFound } from 'middleware/errorMiddleware'
import indexRoute from './routes'
import { connectDB } from 'utils/db'
import userRoutes from './routes/userRoutes'
// Don't name folder graphql because it will conflict with the npm package.
import { typeDefs, resolvers, createContext } from 'gql'
import { Context } from 'types'

dotenv.config()

/* ========================================================================
                              initializeServer()
======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// Initially, I was using Apollo's startStandAloneServer. However, if you
// need to work with subscriptions then you need to use the expressMiddleware
// implementation instead: https://www.apollographql.com/docs/apollo-server/api/express-middleware
// This version gives you the basic setup, but actually there's a 'full example' at the
// above link that adds in a few more things.
//
//   - createServer (i.e., http.createServer)
//   - ApolloServerPluginDrainHttpServer
//
// For info on how this file was created see here:
//   https://dev.to/uku_lele/graphql-apollo-4-nodejs-express-react-mongodb-typescript-4mga
//   https://selvaganesh93.medium.com/enhancing-express-js-server-with-apollo-graphql-9bbff563dbd0
//
// The Cooper Codes News API was also helpful.
// In fact, he builds out a more complete example.
// https://www.youtube.com/watch?v=0y81xnYGWUg&t=23s
//
/////////////////////////
//
// Many examples often use top-level await, but I was not able to do that
// even after updating the basic settings in tsconfig.json.
//
// Top-level 'await' expressions are only allowed when the 'module' option
// is set to 'es2022', 'esnext', 'system', 'node16', or 'nodenext', and the 'target'
// option is set to 'es2017' or higher.
// Thus do this in tsconfig.json
//
//   "target": "ESNEXT",
//   "module": "ESNEXT",
//   "moduleResolution": "Node",
//
// If you didn't want to use the await syntax, you can also wrap it in an
// async function as 'Mike dev' does at 3:45 here:
//
//   https://www.youtube.com/watch?v=jYYjIWXG1_A&t=968s
//
// In fact, it turns out that top-level await is NOT compatible with ESBuild:
//
//   https://github.com/evanw/esbuild/issues/253
//
/////////////////////////
//
// One of the biggest issues I have with the ESBuild implementation is that errors
// are output against the dist itself, and not the Typescript files. I would like to
// fix this if possible....
//
// This project uses esbuild-node-tsc: https://www.npmjs.com/package/esbuild-node-tsc
// In nodemon.json it has  "exec": "etsc && tsc-alias && node ./dist/index.js",
// The package clearly indicates that this library doesnt do typechecking.
// For typechecking please continue to use tsc.
// This may actually be an ESBuild thing:
//
//   https://github.com/evanw/esbuild/issues/1631
//   https://esbuild.github.io/content-types/#typescript
//   esbuild does not do any type checking so you will still need to run tsc -noEmit in parallel
//   with esbuild to check types. This is not something esbuild does itself.
//
// This means that any errors you encounter will end up happening when you run the
// build and the Terminal output will be relative to the compiled files rather than
// pointing to the correct code in the src files.
//
// That part is super annoying, so what's the advantage of using ESBuild?
// I've found that the configuration for the dev environment is much cleaner.
// For example, in my old ts-node-2023 project the "dev" command looked like this:
//
//    "dev": "tsc && (concurrently \"tsc -w\" \"tsc-alias -w\" \"nodemon --delay 0.25 dist/index.js\")",
//
// It was definitely kind of clunky, and I think it often double-rendered.
// That said, there's definitely not anything wrong with it.
//
// So what's the solution here?
// As esbuild-node-tsc indicates we can use tsc to check errors:
//
//  "test:build": "tsc -noEmit",
//
// However, we can do better than this. Back in nodemon.json do this:
//
//   "exec": "tsc -noEmit && etsc && tsc-alias && node ./dist/index.js",
//
// Now you've got a "dev" script that will break if there's an error and
// show the TYPESCRIPT issue. In other words, it will error out not just
// on actual errors, but also with anything that is wrong in Typescript.
// This is more reminiscent of the way Create React App works. Anytime
// you had a Typescript error it would crash the app on you while in dev mode.
//
// Note: Depending on how your CI/CD pipeline works, you may actually want to add
// "tsc -noEmit && ..." to your actual buld step. In other words, if your CI/CD
// doesn't actually test running the build, then it may be important to run tsc there too.
//
///////////////////////////////////////////////////////////////////////////
;(async function initializeServer() {
  // Call connectDB() BEFORE anything else. Thus if connectDB() fails
  // we do not start the Apollo server and we do call app.listen().
  // Because connectDB() calls process.exit(1) on faiulre,
  // this means that technically there's not really a need for await here.
  await connectDB()

  /* ======================
    Create GraphQL Server
  ====================== */

  const app = express()

  // Our httpServer handles incoming requests to our Express app.
  // Below, we tell Apollo Server to "drain" this httpServer,
  // enabling our servers to shut down gracefully.
  const httpServer = createServer(app)

  const server = new ApolloServer<Context>({
    typeDefs,
    resolvers,

    formatError: (err) => {
      // Sentry configuration goes here (i.e., filtering out user errors, etc.).
      // console.log(err)
      return err
    },
    // I'm not really sure what benefit this adds to
    // the implementation,  but it's how they do.
    // https://www.apollographql.com/docs/apollo-server/api/express-middleware/#example
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
  })

  // Make sure to await server.start().
  // You must call `start()` on the `ApolloServer`
  // instance before passing the instance to `expressMiddleware`
  await server.start()

  /* ======================
      Global Middleware
  ====================== */

  // app.use(morgan('dev'))

  // This gets annoying fast because Apollo sandbox will make continuously calls to the graphql api.
  // app.use(requestLogger)

  // No need to add 'http://localhost:3000' since it's covered
  // by  process.env.NODE_ENV === 'development' check.
  // Otherwise, add allowed domains here...
  const allowOrigins: string[] = []

  const corsOptions = {
    origin: (origin: any, callback: any) => {
      // This should allow all origins during development.
      // This way, we can test Postman calls.
      // An alternative syntax would be: if (!origin) { callback(null, true) }
      if (process.env.NODE_ENV === 'development') {
        // The first arg is the error object.
        // The second arg is the allowed boolean.
        callback(null, true)
        // This else if is saying if the origin URL is in the
        // list of allowedOrigins, then allow it (i.e. callback(null, true))
        // Note: that will also end up disallowing Postman
      } else if (allowOrigins.indexOf(origin) !== -1) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true, // This sets the Access-Control-Allow-Credentials header
    // methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
    // The default may be 204, but some devices have issues with that
    // (Smart TVs, older browsers, etc), so you might want to set it to 200 instead.
    optionsSuccessStatus: 200
  }

  app.use(cors(corsOptions))

  ///////////////////////////////////////////////////////////////////////////
  //
  // Needed for reading req.body. Setting the limit property can help
  // avoid '413 Payload Too Large' errors. I think by default it's 100kb.
  //
  // This will run for every request (including /graphql).
  // BUT: express.json() only parses requests with Content-Type: application/json.
  // If the request is multipart/form-data (which file uploads use), it skips parsing and passes the request along untouched.
  // So, for most setups, having app.use(express.json()) here will not break the
  // graphqlUploadExpress middlware below.
  //
  ///////////////////////////////////////////////////////////////////////////

  app.use(express.json({ limit: '50mb' })) // ???

  // For handling FormData, but should it be true or false?
  app.use(express.urlencoded({ extended: false }))
  app.use(cookieParser())
  app.use('/', express.static(path.join(__dirname, 'public')))

  /* ======================
      GraphQL Routes
  ====================== */
  ///////////////////////////////////////////////////////////////////////////
  //
  // Add the graphql-upload middleware to your Express app BEFORE the Apollo middleware.
  // Note: This middleware should generally be added before express.json() or similar
  // body parsing middleware. However, because express.json() skips multipart/form-data
  // it's actually okay to have the global app.use(express.json()) above.
  // That said, the warning still applies for other body parsers.
  //
  // This middleware runs for every request, but only does its thing for multipart/form-data requests.
  //
  ///////////////////////////////////////////////////////////////////////////

  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }))

  app.use(
    ///////////////////////////////////////////////////////////////////////////
    //
    // Some examples add the URL here: '/graphql' or even just '/'.
    // However, we don't necesarily need to do that.
    //
    // You could just omit the argument entirely, and instead it will
    // use the port set by app.listen() below.
    // I've also seen documentation examples just do this: '/'
    // All that will work fine if you have no other endpoints.
    // However, if you have other REST endpoints, it's important
    // to namespace the different parts of the server.
    //
    ///////////////////////////////////////////////////////////////////////////

    '/graphql',
    // cors<cors.CorsRequest>(corsOptions),

    // Not needed because of the global app.use(express.json()) above.
    // express.json(),

    apolloMiddleware<Context>(server, {
      context: createContext
    })
  )

  /* ======================
        REST Routes
  ====================== */

  app.use('/api', indexRoute)
  app.use('/api/users', userRoutes)
  app.use(notFound)
  app.use(errorHandler)

  /* ======================
          Listener
  ====================== */

  const port = parseInt(process.env?.PORT as string) || 5000

  ///////////////////////////////////////////////////////////////////////////
  //
  // In traditional Express apps with mongoose, we might do domethign like this:
  //
  //   mongoose.connection.once('open', () => {
  //     console.log('Calling app.listen() now that the database is connected.')
  //     app.listen(port, () => console.log(`Server listening on port ${port}!`))
  //   })
  //
  // It's worth considering whether or not we want to also wrap it in
  // mongoose.connection.once() here.
  //
  ///////////////////////////////////////////////////////////////////////////

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: port }, resolve)
  )
  console.log(`\nServer listening on port ${port}.`)
})()
