import { authenticate } from '../../../authenticate'
import { authorize } from '../../../authorize'
import { Role } from 'types'

type AdminData = { message: string; name: string; role: Role }

/* ========================================================================

======================================================================== */
///////////////////////////////////////////////////////////////////////////
//
// query Admin {
//   admin {
//     message
//     name
//     role
//   }
// }
//
///////////////////////////////////////////////////////////////////////////

export const admin = authenticate(
  authorize(
    'ADMIN',
    async (_parent, _args, context, _info): Promise<AdminData> => {
      const name = context.user.name
      const role = context.user.role

      return {
        message: 'Admin query successful.',
        name: name,
        role: role
      }
    }
  )
)
