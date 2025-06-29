import { useNavigate, useParams } from 'react-router'
import { useQuery, useMutation } from '@apollo/client'
import { toast } from 'react-toastify'
import { Pencil, Trash2 } from 'lucide-react'

import { GET_TODO, GET_TODOS } from 'queries/todoQueries'
import { DELETE_TODO } from 'mutations'
import { useTitle } from 'hooks'
import { Alert, Button, HR, Page, PageContainer, Spinner } from 'components'
import { Todo } from 'types'

type GetTodoData = {
  result: Todo
}

type DeleteTodoData = {
  result: Todo
}

/* ========================================================================
                              PageTodo
======================================================================== */

const PageTodo = () => {
  useTitle('Todo')
  const navigate = useNavigate()
  const { id } = useParams()

  const { error, loading, data } = useQuery<GetTodoData>(GET_TODO, {
    variables: { id }
  })

  const [deleteTodo, { loading: deletingTodo }] = useMutation<DeleteTodoData>(
    DELETE_TODO,
    {
      variables: { id: id },
      onCompleted(data) {
        const { result: deletedTodo } = data
        console.log('data returned from deleteTodo(): ', deletedTodo)
        toast.success('The todo has been deleted!')
        navigate('/todos')
      },

      onError(errors) {
        if (import.meta.env.DEV === true) {
          console.log(errors)
        }
        toast.error('Unable to delete the todo!')
      },

      // Refetch queries (or update cache).
      // https://www.apollographql.com/blog/apollo-client/caching/when-to-use-refetch-queries/
      // The above article suggests using the update() function to instead update the cache.
      refetchQueries: [{ query: GET_TODOS }]
    }
  )

  /* ======================
        handleDelete()
  ====================== */

  const handleDelete = () => {
    deleteTodo()
  }

  /* ======================
       renderTodo()
  ====================== */

  const renderTodo = () => {
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
            {error?.message ? error?.message : 'Unable to get the todo!'}
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

    const todo = data?.result
    // Handle todo being null, undefined
    if (!todo || typeof todo !== 'object') {
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

          <p className='text-sm'>Unable to get the todo!</p>
        </Alert>
      )
    }

    if (typeof todo === 'object') {
      return (
        <section
          className='mx-auto mb-3 rounded-lg border border-stone-300 p-3'
          style={{ backgroundColor: '#fafafa', fontSize: 14, maxWidth: 800 }}
        >
          <h5 className='font-bold text-blue-500'>{todo?.title}:</h5>

          <h6
            className='font-bold text-blue-500'
            style={{ fontSize: 14, marginBottom: 25 }}
          >
            Completed:{' '}
            <span
              className={todo?.completed ? 'text-green-500' : 'text-red-500'}
            >
              {todo?.completed?.toString()}
            </span>
          </h6>

          {todo?.body && <p> {todo?.body}</p>}

          <div className='flex justify-center gap-2'>
            <Button
              className='btn-blue btn-sm'
              onClick={() => {
                navigate(`/todos/${todo.id}/update`)
              }}
              style={{ minWidth: 150 }}
              title='Edit Todo'
            >
              <Pencil className='pointer-events-none mr-1 size-[1.25em]' />
              Edit Todo
            </Button>

            <Button
              className='btn-red btn-sm'
              leftSection={
                <Trash2 className='pointer-events-none mr-1 size-[1.25em]' />
              }
              loading={deletingTodo}
              onClick={handleDelete}
              style={{ minWidth: 150 }}
              title='Delete Todo'
            >
              Delete Todo
            </Button>
          </div>
        </section>
      )
    }

    return null
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
            Todo
          </span>
          <span
            className='bg-gradient-to-r from-violet-700 to-sky-400 bg-clip-text text-transparent'
            style={{
              position: 'relative'
            }}
          >
            Todo
          </span>
        </h1>

        {id && (
          <h5
            className='text-center font-bold text-blue-500'
            style={{
              margin: '-10px auto 25px auto',
              textShadow: '0px 1px 1px rgba(0,0,0,0.25)'
            }}
          >
            {id && ` ${id}`}
          </h5>
        )}

        <HR style={{ marginBottom: 50 }} />

        {renderTodo()}

        <Button
          color='blue'
          className='btn-blue btn-sm mx-auto block'
          onClick={() => navigate('/todos')}
          style={{ minWidth: 150 }}
        >
          Back To Todos
        </Button>
      </PageContainer>
    </Page>
  )
}

export default PageTodo
