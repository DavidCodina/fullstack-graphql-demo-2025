import React, { useState, Fragment } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useQuery, useMutation } from '@apollo/client'
import { toast } from 'react-toastify'
import { TriangleAlert } from 'lucide-react'

import { cn } from 'utils'
import { Alert, Button, Spinner } from 'components'
import { UPDATE_TODO } from 'mutations'
import { GET_TODO } from 'queries/todoQueries'
import { Todo } from 'types'

type UpdateTodoFormProps = {
  style?: React.CSSProperties
}

type GetTodoData = {
  result: Todo
}

type UpdateTodoData = {
  result: Todo
}

/* ========================================================================
                              UpdateTodoForm
======================================================================== */

export const UpdateTodoForm = ({ style }: UpdateTodoFormProps) => {
  const navigate = useNavigate()
  const { id } = useParams()

  const { error, loading, data } = useQuery<GetTodoData>(GET_TODO, {
    variables: { id },
    onCompleted(data) {
      const { result: todo } = data

      if (todo?.title) {
        setTitle(todo.title)
      }

      if (todo?.body) {
        setBody(todo.body)
      }

      if (typeof todo?.completed === 'boolean') {
        setCompleted(todo.completed)
      }
    }
  })

  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [titleError, setTitleError] = useState('')

  const [body, setBody] = useState('')
  const [bodyTouched, setBodyTouched] = useState(false)
  const [bodyError, setBodyError] = useState('')

  const [completed, setCompleted] = useState(false)
  const [completedTouched, setCompletedTouched] = useState(false)
  const [completedError, setCompletedError] = useState('')

  // Derived state - used to conditionally disable submit button
  const isErrors =
    titleError !== '' || bodyError !== '' || completedError !== ''
  const allTouched = titleTouched && bodyTouched && completedTouched

  /* ======================
        updateTodo()
  ====================== */

  const updateTodoInput = { id, title, body, completed }

  const [updateTodo, { loading: updatingTodo }] = useMutation<UpdateTodoData>(
    UPDATE_TODO,
    {
      variables: { input: updateTodoInput },

      onCompleted(data) {
        const { result: _todo } = data

        setTitle('')
        setTitleTouched(false)
        setTitleError('')

        setBody('')
        setBodyTouched(false)
        setBodyError('')

        setCompleted(false)
        setCompletedTouched(false)
        setCompletedError('')

        toast.success('The todo has been updated!')
        navigate(`/todos/${id}`)
      },

      onError(error) {
        const {
          // name,
          // message,
          graphQLErrors
          // clientErrors,
          // protocolErrors,
          // networkError,
          // extraInfo
        } = error

        const formErrors = graphQLErrors.find((error) => {
          return error?.extensions?.code === 'FORM_ERRORS'
        })?.extensions?.formErrors as
          | { title?: string; body?: string; completed?: string }
          | undefined

        if (formErrors && typeof formErrors === 'object') {
          if (formErrors.title) {
            setTitleError(formErrors.title)
          }

          if (formErrors.body) {
            setBodyError(formErrors.body)
          }

          if (formErrors.completed) {
            setCompletedError(formErrors.completed)
          }
        }

        if (import.meta.env.DEV === true) {
          console.log({ error })
        }
        toast.error('Unable to update the todo!')
      }

      ///////////////////////////////////////////////////////////////////////////
      //
      // ⚠️ When updating a todo, Apollo Client is smart enough to understand that
      // the todo we just updated is the same one in the cache. Consequently, it
      // will update it automatically. Therefore, it may not be necessary to refetch
      // the individual todo, or maybe even the todos list. However, I think we do need to
      // refetch the list of todos list.
      //
      // In any case, I think it's important that the client side GET_TODO, GET_TODOS, and UPDATE_TODO
      // all return the samy payload. I think that helps inform the Apollo Client.
      //
      // When creating a todo we definitely need to refetch or do an optimisic/pessimistic update.
      // . Maybe there's some sort of internal logic that knows to update that part of any associated cache automatically (???).
      //
      ///////////////////////////////////////////////////////////////////////////
      // refetchQueries: [{ query: GET_TODOS }]
    }
  )

  /* ======================
      validateTitle()
  ====================== */

  const validateTitle = (value?: string) => {
    value = typeof value === 'string' ? value : title
    let error = ''

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      error = 'A title is required.'
      setTitleError(error)
      return error
    }

    // Otherwise unset the title error in state and return ''
    setTitleError('')
    return ''
  }

  /* ======================
      validateBody()
  ====================== */

  const validateBody = (_value?: string) => {
    // value = typeof value === 'string' ? value : body
    // let error = ''

    // If there were validation rules, they'd go here.
    // It's still a good idea to create this function because
    // it allows us to reset errors that were set by the server.
    // It's just good because it future proofs the form.

    setBodyError('')
    return ''
  }

  /* ======================
      validateCompleted()
  ====================== */

  const validateCompleted = (_value?: boolean) => {
    // value = typeof value === 'boolean' ? value : completed

    // if (value === false) {
    //   setCompletedError('The checkbox must be checked!')
    //   return 'The checkbox must be checked!'
    // }

    setCompletedError('')
    return ''
  }

  /* ======================
        validate()
  ====================== */

  const validate = () => {
    const errors: string[] = []

    // Set true on all toucher functions.
    const touchers: React.Dispatch<React.SetStateAction<boolean>>[] = [
      setTitleTouched,
      setBodyTouched,
      setCompletedTouched
    ]

    touchers.forEach((toucher) => {
      toucher(true)
    })

    const validators: (() => string)[] = [
      validateTitle,
      validateBody,
      validateCompleted
    ]

    validators.forEach((validator) => {
      const error = validator()
      if (error) {
        errors.push(error)
      }
    })

    // Return early if errors
    if (errors.length >= 1) {
      toast.error('Form validation errors found!')
      return { isValid: false, errors: errors }
    }

    return { isValid: true, errors: null }
  }

  /* ======================
        handleSubmit()
  ====================== */

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault()

    const { isValid } = validate()

    if (!isValid) {
      return
    }

    // Note that even if updateTodo() results in an error,
    // it will not go to the catch() block. This is why
    // it's better to use onCompleted() & onError().
    updateTodo()
  }

  /* ======================
    renderUpdateTodoForm()
  ====================== */
  // In this case, we only want to render the form once the data is
  // there to be injected into the form.

  const renderUpdateTodoForm = () => {
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
        <form
          className='mx-auto mb-4 overflow-hidden rounded-lg border border-neutral-400 bg-[#fafafa] p-4 shadow'
          style={{ maxWidth: 800, ...style }}
        >
          <div className='mb-4'>
            <label className='text-sm font-bold text-blue-500' htmlFor='title'>
              Title <sup className='text-red-500'>*</sup>
            </label>

            <input
              autoComplete='off'
              className={cn(
                'form-control form-control-sm',
                titleError && 'is-invalid',
                titleTouched && !titleError && 'is-valid'
              )}
              id='title'
              name='title'
              onBlur={(e) => {
                if (!titleTouched) {
                  setTitleTouched(true)
                }
                validateTitle(e.target.value)
              }}
              onChange={(e) => {
                setTitle(e.target.value)

                if (titleTouched) {
                  validateTitle(e.target.value)
                }
              }}
              placeholder='Title...'
              spellCheck={false}
              type='text'
              value={title}
            />

            <div className='invalid-feedback'>{titleError}</div>
          </div>

          <div className='mb-4'>
            <label className='text-sm font-bold text-blue-500' htmlFor='body'>
              Body
            </label>

            <textarea
              autoComplete='off'
              className={cn(
                'form-control form-control-sm',
                bodyError && 'is-invalid',
                bodyTouched && !bodyError && 'is-valid'
              )}
              id='body'
              name='body'
              onBlur={(e) => {
                if (!bodyTouched) {
                  setBodyTouched(true)
                }
                validateBody(e.target.value)
              }}
              onChange={(e) => {
                setBody(e.target.value)

                if (bodyTouched) {
                  validateBody(e.target.value)
                }
              }}
              placeholder='Optional description...'
              spellCheck={false}
              style={{ height: 150 }}
              value={body}
            />

            <div className='invalid-feedback'>{bodyError}</div>
          </div>

          {/* ============================== */}

          <div className='form-check mb-4'>
            <input
              checked={completed}
              className={cn(
                'form-control form-control-sm',
                completedError && 'is-invalid',
                completedTouched && !completedError && 'is-valid'
              )}
              id='completed'
              name='completed'
              onBlur={(e) => {
                if (!completedTouched) {
                  setCompletedTouched(true)
                }
                validateCompleted(e.target.checked)
              }}
              onChange={(e) => {
                setCompleted(e.target.checked)

                if (completedTouched) {
                  validateCompleted(e.target.checked)
                }
              }}
              type='checkbox'
            />

            <label
              htmlFor='completed'
              className='text-sm font-bold text-blue-500'
            >
              Completed
            </label>

            <div className='invalid-feedback'>{completedError}</div>
          </div>

          {/* ============================== */}

          {updatingTodo ? (
            <Button
              className='btn-green btn-sm block w-full'
              disabled
              type='button'
            >
              <span
                aria-hidden='true'
                className='spinner-border spinner-border-sm mr-2'
                role='status'
              ></span>
              Updating Todo...
            </Button>
          ) : (
            <Button
              className='btn-green btn-sm flex w-full'
              // The submit button is disabled here when there are errors, but
              // only when all fields have been touched. All fields will have
              // been touched either manually or after the first time the button
              // has been clicked.
              disabled={allTouched && isErrors ? true : false}
              onClick={handleSubmit}
              type='button'
            >
              {allTouched && isErrors ? (
                <Fragment>
                  <TriangleAlert className='pointer-events-none size-[1.25em]' />{' '}
                  Please Fix Errors...
                </Fragment>
              ) : (
                'Update Todo'
              )}
            </Button>
          )}
        </form>
      )
    }

    return null
  }

  /* ======================
          return
  ====================== */

  return renderUpdateTodoForm()
}
