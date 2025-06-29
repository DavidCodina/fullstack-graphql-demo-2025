import { Response } from 'express'
export * from './zod'

/* ======================
        sleep()
====================== */
// Used in API calls to test/simulate a slow call
// Example: await sleep(4000)

export const sleep = async (delay = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, delay)) // eslint-disable-line
}

/* ======================
  handleServerError()
====================== */
// Log error to Sentry...

export const handleServerError = (res: Response, err: unknown) => {
  const isDevelopment = process.env.NODE_ENV === 'development' ? true : false
  let message = 'Server error.'

  if (isDevelopment) {
    if (err instanceof Error) {
      message = err.message
      console.log({ name: err.name, message: message, stack: err.stack })
    } else {
      console.log(err)
    }
  }

  return res.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    data: null,
    message: message,
    success: false
  })
}
