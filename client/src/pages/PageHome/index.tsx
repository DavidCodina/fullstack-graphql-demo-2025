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

        <article className='mx-auto mb-6 max-w-4xl rounded-xl border border-neutral-500 bg-white p-4 shadow'>
          <h2 className='text-3xl font-black text-blue-500'>Next Steps</h2>

          <p className='mb-4'>
            1. Implement{' '}
            <code className='text-pink-500'>apollo-upload-client</code> on the
            React side when updating a user. Currently, there is no update user
            form, so you'll also need to build that out. Then see{' '}
            <a
              className='text-blue-500 underline'
              href='https://www.youtube.com/watch?v=BcZ_ItGplfE'
              target='_blank'
              rel='noopener noreferrer'
            >
              Classsed tutorial
            </a>{' '}
            at 8 minutes in for the{' '}
            <code className='text-pink-500'>apollo-upload-client</code> part.
            Consult with Gemini Deep Research and others... Make sure to
            implement logic that prevents CSRF attacks.
          </p>

          <p className='mb-4'>3. Work on Apollo Client notes.</p>

          <p className='mb-4'>
            <strong className='text-blue-500'>Bonus:</strong> Review Scott Moss
            on GQL testing.
          </p>

          <p className='mb-4'>
            <strong className='text-blue-500'>Bonus:</strong> Review
            Subscriptions and Directives and Security.
          </p>
        </article>
      </PageContainer>
    </Page>
  )
}

export default PageHome
