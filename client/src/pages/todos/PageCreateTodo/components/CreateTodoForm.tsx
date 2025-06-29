import React, { useState, Fragment } from 'react'
import { useNavigate } from 'react-router'
import { useMutation } from '@apollo/client'
import { toast } from 'react-toastify'
import { TriangleAlert } from 'lucide-react'

import { cn } from 'utils'
import { Button } from 'components'
import { CREATE_TODO } from 'mutations'
import { GET_TODOS } from 'queries/todoQueries'
import { Todo } from 'types'

type CreateTodoFormProps = {
  style?: React.CSSProperties
}

type CreateTodoData = {
  result: Todo
}

/* ========================================================================
                              CreateTodoForm
======================================================================== */

const CreateTodoForm = ({ style }: CreateTodoFormProps) => {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [titleTouched, setTitleTouched] = useState(false)
  const [titleError, setTitleError] = useState('')

  const [body, setBody] = useState('')
  const [bodyTouched, setBodyTouched] = useState(false)
  const [bodyError, setBodyError] = useState('')

  // Derived state - used to conditionally disable submit button
  const isErrors = titleError !== '' || bodyError !== ''
  const allTouched = titleTouched && bodyTouched

  /* ======================
        createTodo()
  ====================== */

  const createTodoInput = { title, body }

  // ⚠️ useMutation hook doesn't automatically infer the shape of data,
  // so you typically need to manually type it.
  const [createTodo, { loading: creatingTodo /*, error, data */ }] =
    useMutation<CreateTodoData>(CREATE_TODO, {
      variables: { input: createTodoInput },

      // This ONLY runs on success, which means that the server doesn't
      // need to explicitly pass a success boolean property.
      onCompleted(data) {
        const { result: _todo } = data

        setTitle('')
        setTitleTouched(false)
        setTitleError('')

        setBody('')
        setBodyTouched(false)
        setBodyError('')

        toast.success('The todo has been created!')
        navigate('/todos')
      },

      // If an error occurs here it will likely be an internal server error.
      // form errors are treated as data, and will appear in onCompleted.
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

        //# Create a helper function for this instead.
        //# The helper should have its own helper called isFormErrors().
        const formErrors = graphQLErrors.find((error) => {
          return error?.extensions?.code === 'FORM_ERRORS'
        })?.extensions?.formErrors as
          | { title?: string; body?: string }
          | undefined

        if (formErrors && typeof formErrors === 'object') {
          if (formErrors.title) {
            setTitleError(formErrors.title)
          }

          if (formErrors.body) {
            setBodyError(formErrors.body)
          }
        }

        if (import.meta.env.DEV === true) {
          console.log({ error })
        }
        toast.error('Unable to create the todo!')
      },

      // Refetch queries (or update cache).
      // https://www.apollographql.com/blog/apollo-client/caching/when-to-use-refetch-queries/
      // The above article suggests using the update() function to instead update the cache.
      refetchQueries: [{ query: GET_TODOS }]
    })

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
    // it allows us reset errors that were set by the server.
    // It's just good because it future proofs the form

    setBodyError('')
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
      setBodyTouched
    ]

    touchers.forEach((toucher) => {
      toucher(true)
    })

    const validators: (() => string)[] = [validateTitle, validateBody]

    validators.forEach((validator) => {
      const error = validator()
      if (error) {
        errors.push(error)
      }
    })

    // Return early if errors
    if (errors.length >= 1) {
      // console.log('Returning early from handleSubmit() because of errors.', errors)
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

    // Note that even if createTodo() results in an error,
    // it will not go to the catch() block. This is why
    // it's better to use onCompleted() & onError().
    createTodo()
  }

  /* ======================
    renderCreateTodoForm()
  ====================== */

  const renderCreateTodoForm = () => {
    return (
      <form
        className='mx-auto mb-6 overflow-hidden rounded-lg border border-neutral-400 bg-[#fafafa] p-4 shadow'
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
              validateTitle(e.target.value)
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
              validateBody(e.target.value)
            }}
            placeholder='Optional description...'
            spellCheck={false}
            style={{ height: 150 }}
            value={body}
          />

          <div className='invalid-feedback'>{bodyError}</div>
        </div>

        {creatingTodo ? (
          <Button
            className='btn-green btn-sm block w-full'
            color='green'
            disabled
            type='button'
          >
            <span
              aria-hidden='true'
              className='spinner-border spinner-border-sm mr-2'
              role='status'
            ></span>
            Creating Todo...
          </Button>
        ) : (
          <Button
            className='btn-green btn-sm flex w-full'
            color='green'
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
              'Create Todo'
            )}
          </Button>
        )}
      </form>
    )
  }

  /* ======================
          return
  ====================== */

  return renderCreateTodoForm()
}

export { CreateTodoForm }
