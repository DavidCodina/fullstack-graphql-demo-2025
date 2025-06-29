import { useQuery } from '@apollo/client'

import { GET_ADMIN } from 'queries'
import { useTitle } from 'hooks'
import { Alert, HR, Page, PageContainer, Spinner } from 'components'
import { Role } from 'types'

type GetAdminData = {
  result: {
    message: string
    name: string
    role: Role
  }
}

/* ========================================================================
                                PageAdmin
======================================================================== */

const PageAdmin = () => {
  useTitle('Admin')

  const { data, error, loading } = useQuery<GetAdminData>(GET_ADMIN, {
    onError(error) {
      const { graphQLErrors, networkError, clientErrors, protocolErrors } =
        error
      if (import.meta.env.DEV === true) {
        console.log('errors from admin useQuery()')
        console.log({
          graphQLErrors,
          networkError,
          clientErrors,
          protocolErrors
        })
      }
    }
  })

  /* ======================
      renderContent()
  ====================== */

  const renderContent = () => {
    if (error) {
      return (
        <Alert
          className='alert-red mx-auto mb-12 max-w-2xl'
          leftSection={
            <svg
              style={{ height: '3em' }}
              fill='currentColor'
              viewBox='0 0 16 16'
            >
              <path d='M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z' />
              <path d='M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z' />
            </svg>
          }
        >
          <Alert.Heading>Error:</Alert.Heading>

          <p className='text-sm'>
            {error?.message ? error?.message : 'Unable to get admin data!'}
          </p>
        </Alert>
      )
    }

    if (loading) {
      return (
        <div className='flex min-h-[300px] items-center justify-center'>
          <Spinner className='border-[2.5px] text-violet-800' size={50} />
        </div>
      )
    }

    if (data) {
      return (
        <pre className='mx-auto max-w-lg rounded-xl border border-neutral-500 bg-white p-4 shadow'>
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      )
    }
  }

  /* ======================
          return
  ====================== */

  return (
    <Page>
      <PageContainer>
        <h1
          className='text-center text-5xl font-black'
          style={{ position: 'relative', marginBottom: 24 }}
        >
          <span
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              textShadow:
                '0px 0px 1px rgba(0,0,0,1), 0px 0px 1px rgba(0,0,0,1)',
              width: '100%',
              height: '100%'
            }}
          >
            Admin
          </span>
          <span
            className='bg-gradient-to-r from-violet-700 to-sky-400 bg-clip-text text-transparent'
            style={{
              position: 'relative'
            }}
          >
            Admin
          </span>
        </h1>

        <HR style={{ marginBottom: 50 }} />

        {renderContent()}
      </PageContainer>
    </Page>
  )
}

export default PageAdmin
