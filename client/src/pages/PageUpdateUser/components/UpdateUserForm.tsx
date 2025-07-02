import React, { useState, Fragment } from 'react'
import { useNavigate } from 'react-router'
import { useQuery, useMutation } from '@apollo/client'
import { toast } from 'react-toastify'
import { TriangleAlert } from 'lucide-react'

import { cn, getFormErrors } from 'utils'
import { Alert, Button, Spinner } from 'components'

import { GET_CURRENT_USER } from 'queries'
import { UPDATE_USER } from 'mutations'
import { UnsafeUser } from 'types'

type GetCurrentUserData = {
  result: UnsafeUser
}

type UpdateUserData = {
  result: UnsafeUser
}

/* ========================================================================
                              UpdateUserForm
======================================================================== */

export const UpdateUserForm = ({ style }: any) => {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [nameError, setNameError] = useState('')

  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [image, setImage] = useState<File>()
  const [imageTouched, setImageTouched] = useState(false)
  const [imageError, setImageError] = useState('')

  const isErrors = nameError !== '' || emailError !== ''
  const allTouched = nameTouched && emailTouched

  /* ======================

  ====================== */

  const { data, error, loading } = useQuery<GetCurrentUserData>(
    GET_CURRENT_USER,
    {
      onCompleted(data) {
        const { result: currentUser } = data

        if (currentUser.name) {
          setName(currentUser.name)
        }
        if (currentUser.email) {
          setEmail(currentUser.email)
        }
      },

      onError(error) {
        const { graphQLErrors, networkError, clientErrors, protocolErrors } =
          error
        if (import.meta.env.DEV === true) {
          console.log('errors from current user useQuery()')
          console.log({
            graphQLErrors,
            networkError,
            clientErrors,
            protocolErrors
          })
        }
      }
    }
  )

  /* ======================
        updateUser()
  ====================== */
  // If you send '' as a value, then Zod will validate against that.
  // Conversely, if you send undefined, then if Zod allows optional values, it will ignore it.

  const updateUserInput = {
    name: name || undefined,
    email: email || undefined,
    image: image || undefined
  }

  const [updateUser, { loading: updatingUser }] = useMutation<UpdateUserData>(
    UPDATE_USER,
    {
      variables: { input: updateUserInput },

      onCompleted(data) {
        const { result: updatedUser } = data

        setName('')
        setNameTouched(false)
        setNameError('')

        setEmail('')
        setEmailTouched(false)
        setEmailError('')

        setImage(undefined)
        setImageTouched(false)
        setImageError('')

        toast.success('The user has been updated!')

        console.log('\nupdatedUser', updatedUser)
        navigate(`/profile`)
      },

      onError(error) {
        const { graphQLErrors } = error

        const formErrors = getFormErrors<{
          name?: string
          email?: string
          password?: string
          confirmPassword?: string
          image?: string
        }>(graphQLErrors)

        if (formErrors && typeof formErrors === 'object') {
          if (formErrors.name) {
            setNameError(formErrors.name)
          }

          if (formErrors.email) {
            setEmailError(formErrors.email)
          }
        }

        if (import.meta.env.DEV === true) {
          console.log({ error })
        }
        toast.error('Unable to update the user!')
      }
    }
  )

  /* ======================
        validateName()
  ====================== */

  const validateName = (value?: string) => {
    // Gotcha: You can't do value = '' as a default parameter because that will cause
    // the following reassignment to fallback to name state, which in cases of
    // calling the function in the associated onChange will cause a race condition.
    value = typeof value === 'string' ? value : name
    let error = ''

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      error = 'Full name is required.'
      setNameError(error)
      return error
    }

    // Otherwise unset the password error in state and return ''
    setNameError('')
    return ''
  }

  /* ======================
      validateEmail()
  ====================== */
  // This validation function is used by validate(), which is called in handleSubmit().
  // It's also used within the email <input>'s onChange and onBlur handlers. When used
  // by the <input> the value is passed as an argument to avoid race conditions. When
  // used in the handleSubmit() the value argument is omitted, and the value is instead
  // derived from the local state.

  const validateEmail = (value?: string) => {
    // Gotcha: You can't do value = '' as a default parameter because that will cause
    // the following reassignment to fallback to email state, which in cases of
    // calling the function in the associated onChange will cause a race condition.
    value = typeof value === 'string' ? value : email
    let error = ''

    // This regex is taken directly from:
    // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/email#basic_validation
    // However, you may still need to turn off ESLint's: no-useless-escape
    const regex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      error = 'An email is required.'
      setEmailError(error)
      return error
    }

    if (!regex.test(value)) {
      error = 'A valid email is required.'
      setEmailError(error)
      return error
    }

    setEmailError('')
    return ''
  }

  /* ======================
      validateImage()
  ====================== */

  const validateImage = (value?: File) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
    value = value instanceof File ? value : image
    let error = ''

    // A helper to check a value against an array of allowedValues.
    const isOneOf = (value: unknown, allowedValues: unknown[]) => {
      if (allowedValues.indexOf(value) !== -1) {
        return true
      }
      return false
    }

    if (value && value instanceof File) {
      // Despite already having an accept attribute on the input,
      // it's a good idea to manually check file types, etc.
      const isAllowedFileType = isOneOf(value.type, allowedTypes)

      if (!isAllowedFileType) {
        error = `${value.name} uses file type of ${value.type}, which is not allowed.`
        setImageError(error)
        return error
      }
    }

    setImageError('')
    return ''
  }

  /* ======================
        validate()
  ====================== */

  const validate = () => {
    const errors: string[] = []

    // Set true on all toucher functions.
    const touchers: React.Dispatch<React.SetStateAction<boolean>>[] = [
      setNameTouched,
      setEmailTouched,
      setImageTouched
    ]

    touchers.forEach((toucher) => {
      toucher(true)
    })

    const validators: (() => string)[] = [
      validateName,
      validateEmail,
      validateImage
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

    console.log(
      'Calling updateUser() with the following input: ',
      updateUserInput
    )

    updateUser()
  }

  /* ======================
        renderForm()
  ====================== */

  const renderForm = () => {
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
            {error?.message ? error?.message : 'Unable to get the user!'}
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

    const currentUser = data?.result

    if (currentUser) {
      return (
        <>
          <form
            className='mx-auto mb-4 overflow-hidden rounded-lg border border-neutral-400 bg-[#fafafa] p-4 shadow'
            style={{ maxWidth: 800, ...style }}
          >
            <div className='mb-4'>
              <label className='text-sm font-bold text-blue-500' htmlFor='name'>
                Name
              </label>

              <input
                autoComplete='off'
                className={cn(
                  'form-control form-control-sm',
                  nameError && 'is-invalid',
                  nameTouched && !nameError && 'is-valid'
                )}
                id='name'
                name='name'
                onBlur={(e) => {
                  if (!nameTouched) {
                    setNameTouched(true)
                  }
                  validateName(e.target.value)
                }}
                onChange={(e) => {
                  setName(e.target.value)

                  if (nameTouched) {
                    validateName(e.target.value)
                  }
                }}
                placeholder='Name...'
                spellCheck={false}
                type='text'
                value={name}
              />

              <div className='invalid-feedback'>{nameError}</div>
            </div>

            {/* ============================== */}

            <div className='mb-4'>
              <label
                className='text-sm font-bold text-blue-500'
                htmlFor='email'
              >
                Email:
              </label>
              <input
                autoComplete='off'
                className={cn(
                  'form-control form-control-sm',
                  emailError && 'is-invalid',
                  emailTouched && !emailError && 'is-valid'
                )}
                id='email'
                name='email'
                onBlur={(e) => {
                  if (!emailTouched) {
                    setEmailTouched(true)
                  }
                  validateEmail(e.target.value)
                }}
                onChange={(e) => {
                  setEmail(e.target.value)

                  if (emailTouched) {
                    validateEmail(e.target.value)
                  }
                }}
                placeholder='Email...'
                type='email'
                value={email}
              />

              <div className='invalid-feedback'>{emailError}</div>
            </div>

            {/* ============================== */}

            <div className='mb-4'>
              <label
                className='text-sm font-bold text-blue-500'
                htmlFor='image'
              >
                Image:
              </label>
              <input
                accept='image/png, image/jpeg, image/jpg'
                autoComplete='off'
                className={cn(
                  'form-control form-control-sm',
                  imageError && 'is-invalid',
                  imageTouched && !imageError && 'is-valid'
                )}
                id='image'
                name='image'
                onBlur={(e) => {
                  const currentTarget = e.currentTarget
                  const activeElement = document.activeElement

                  if (activeElement === currentTarget) {
                    console.log(
                      'A blur event occurred but on the currentTarget.'
                    )
                    e.preventDefault()
                    e.stopPropagation()
                    return
                  } else {
                    console.log('A true blur event occurred.')
                  }

                  const file = e.target.files?.[0]

                  if (!imageTouched) {
                    setImageTouched(true)
                  }
                  validateImage(file)
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0]

                  setImage(file)

                  if (imageTouched) {
                    validateImage(file)
                  }
                }}
                // placeholder='Image...'
                // spellCheck={false}
                type='file'
              />

              <div className='invalid-feedback'>{imageError}</div>
            </div>

            {/* ============================== */}

            {updatingUser ? (
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
                Updating User...
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
                  'Update User'
                )}
              </Button>
            )}
          </form>
        </>
      )
    }

    return null
  }

  /* ======================
          return
  ====================== */

  return renderForm()
}
