import { useTitle } from 'hooks'
import { HR, Page, PageContainer, Waves } from 'components'

/* ========================================================================
                                PageHome
======================================================================== */

const PageHome = () => {
  useTitle('Home')

  /* ======================
          return
  ====================== */

  return (
    <Page>
      <Waves />

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
            Home
          </span>
          <span
            className='bg-gradient-to-r from-violet-700 to-sky-400 bg-clip-text text-transparent'
            style={{
              position: 'relative'
            }}
          >
            Home
          </span>
        </h1>

        <HR style={{ marginBottom: 50 }} />

        <article className='mx-auto mb-6 rounded-xl border border-neutral-500 bg-white p-4 shadow'>
          <h2 className='text-3xl font-black text-blue-500'>Next Steps</h2>

          <p className='mb-4'>
            1. Create a utility for handling GraphQL errors on the client.
          </p>

          <p className='mb-4'>2 Test Idle Timer</p>

          <p className='mb-4'>
            3. Build out the <code className='text-pink-500'>UPDATE_USER</code>{' '}
            logic on the client.
          </p>

          <p className='mb-4'>4. Work on Apollo Client notes.</p>

          <p className='mb-4'>
            5. Server task: In the deleteUser resolver, move the deletion
            cascade out of resolver and into a mongoose model hook.
          </p>

          <p className='mb-4'>6. Review Scott Moss on GQL testing.</p>

          <p className='mb-4'>
            7. Review Subscriptions and Directives and Security.
          </p>

          <p className='mb-4'>8. Update User type in client types.</p>

          <p className='mb-4'>
            9. Test cross-tab authentication. Possibly find a solution.
          </p>
        </article>
      </PageContainer>
    </Page>
  )
}

export default PageHome
