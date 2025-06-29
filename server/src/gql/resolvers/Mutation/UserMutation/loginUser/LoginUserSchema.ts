import { z } from 'zod'

/* ========================================================================

======================================================================== */

export const LoginUserSchema = z.object({
  email: z.string().email('A valid email is required.'),
  password: z.string().min(1, 'Password required.')
})
