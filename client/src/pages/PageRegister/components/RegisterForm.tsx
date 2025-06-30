import { useState, Fragment } from 'react'
import { useMutation } from '@apollo/client'
import { toast } from 'react-toastify'
import { Eye, EyeOff, TriangleAlert } from 'lucide-react'

import { cn, getFormErrors } from 'utils'
import { Button } from 'components'
import { useAuthContext } from 'contexts'
import { CREATE_USER } from 'mutations'
import { Session } from 'types'

// The server createUser resolver either throws or returns a Session object.
// Thus, we can confidently set this as the data type on the useMutation() hook.
type CreateUserData = {
  result: Session
}

/* ========================================================================
                              RegisterForm 
======================================================================== */

const RegisterForm = () => {
  /* ======================
        state & refs
  ====================== */

  const { handleAuthSuccess } = useAuthContext()

  const [name, setName] = useState('')
  const [nameTouched, setNameTouched] = useState(false)
  const [nameError, setNameError] = useState('')

  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordType, setPasswordType] = useState('password')

  const [confirmPassword, setConfirmPassword] = useState('')
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false)
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [confirmPasswordType, setConfirmPasswordType] = useState('password')

  // Derived state - used to conditionally disable submit button
  const isErrors =
    nameError !== '' ||
    emailError !== '' ||
    passwordError !== '' ||
    confirmPasswordError !== ''

  const allTouched =
    nameTouched && emailTouched && passwordTouched && confirmPasswordTouched

  /* ======================
        createUser()
  ====================== */

  const createUserInput = {
    name,
    email,
    password,
    confirmPassword
  }

  const [createUser, { loading: creatingUser }] = useMutation<CreateUserData>(
    CREATE_USER,
    {
      variables: { input: createUserInput },

      ///////////////////////////////////////////////////////////////////////////
      //
      // https://www.apollographql.com/docs/react/data/mutations/#the-update-function
      // The tutorial did this to manage the success logic. However, that's
      // actually what onCompleted is for.
      //
      //   update(cache, { data: { createUser: userData } }) {
      //     handleAuthenticationSuccess(userData)
      //     ...
      //   },
      //
      /////////////////////////////////////////////////////////////////////////////

      onCompleted(data) {
        const { result: session } = data

        handleAuthSuccess(session)

        setName('')
        setNameTouched(false)
        setNameError('')

        setEmail('')
        setEmailTouched(false)
        setEmailError('')

        setPassword('')
        setPasswordTouched(false)
        setPasswordError('')

        setConfirmPassword('')
        setConfirmPasswordTouched(false)
        setConfirmPasswordError('')
        toast.success('Registration successful!')
        // Rather than calling navigate('/todos') here, there's a check on
        // the RegisterPage that will then call <Navigate to='/todos' replace />
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

        const formErrors = getFormErrors<{
          name?: string
          email?: string
          password?: string
          confirmPassword?: string
        }>(graphQLErrors)

        if (formErrors && typeof formErrors === 'object') {
          if (formErrors.name) {
            setNameError(formErrors.name)
          }

          if (formErrors.email) {
            setEmailError(formErrors.email)
          }

          if (formErrors.password) {
            setPasswordError(formErrors.password)
          }

          if (formErrors.confirmPassword) {
            setConfirmPasswordError(formErrors.confirmPassword)
          }
        }

        setPassword('')
        setConfirmPassword('')

        if (import.meta.env.DEV === true) {
          console.log({ error })
        }

        toast.error('Unable to register user!')
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
    validatePassword()
  ====================== */

  const validatePassword = (value?: string) => {
    // Gotcha: You can't do value = '' as a default parameter because that will cause
    // the following reassignment to fallback to password state, which in cases of
    // calling the function in the associated onChange will cause a race condition.
    value = typeof value === 'string' ? value : password
    let error = ''

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      error = 'A password is required.'
      setPasswordError(error)
      return error
    }

    setPasswordError('')
    return ''
  }

  /* ======================
  validateConfirmPassword()
  ====================== */

  const validateConfirmPassword = (value?: string, passwordValue?: string) => {
    // value represents the confirmPassword value,
    // while password is the original password value.
    value = typeof value === 'string' ? value : confirmPassword
    passwordValue = typeof passwordValue === 'string' ? passwordValue : password
    let error = ''

    if (!value || (typeof value === 'string' && value.trim() === '')) {
      error = 'Password confirmation is required.'
      setConfirmPasswordError(error)
      return error
    }

    if (value !== passwordValue) {
      error = 'The passwords must match.'
      setConfirmPasswordError(error)
      return error
    }

    setConfirmPasswordError('')
    return ''
  }

  /* ======================
        validate()
  ====================== */

  const validate = () => {
    const errors: string[] = []

    const touchers: React.Dispatch<React.SetStateAction<boolean>>[] = [
      setNameTouched,
      setEmailTouched,
      setPasswordTouched,
      setConfirmPasswordTouched
    ]

    touchers.forEach((toucher) => {
      toucher(true)
    })

    const validators: (() => string)[] = [
      validateName,
      validateEmail,
      validatePassword,
      validateConfirmPassword
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

  const handleSubmit = (e: any) => {
    e.preventDefault()

    const { isValid } = validate()

    // Comment this block out to test server-side validation
    if (!isValid) {
      setPassword('')
      setPasswordType('password')
      setConfirmPassword('')
      setConfirmPasswordType('password')
      return
    }

    // Note that even if createUser() results in an error,
    // it will NOT go to the catch() block. This is why
    // it's better to use onCompleted() & onError().
    createUser()
      .catch((err) => err)
      .finally(() => {
        setPasswordType('password')
        setConfirmPasswordType('password')
      })
  }

  /* ======================
          return
  ====================== */

  return (
    <form
      className='mx-auto mb-4 overflow-hidden rounded-lg border border-neutral-400 bg-[#fafafa] p-4 shadow'
      style={{ maxWidth: 500 }}
    >
      <div className='mb-4'>
        <label className='text-sm font-bold text-blue-500' htmlFor='name'>
          Name: <sup className='text-red-500'>*</sup>
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
          type='text'
          value={name}
        />

        <div className='invalid-feedback'>{nameError}</div>
      </div>

      <div className='mb-4'>
        <label className='text-sm font-bold text-blue-500' htmlFor='email'>
          Email: <sup className='text-red-500'>*</sup>
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

      <div className='mb-4'>
        <label className='text-sm font-bold text-blue-500' htmlFor='password'>
          Password: <sup className='text-red-500'>*</sup>
        </label>

        <div className='input-group'>
          <input
            autoComplete='off'
            className={cn(
              'form-control form-control-sm',
              passwordError && 'is-invalid',
              passwordTouched && !passwordError && 'is-valid'
            )}
            id='password'
            name='password'
            onBlur={(e) => {
              if (!passwordTouched) {
                setPasswordTouched(true)
              }
              validatePassword(e.target.value)

              if (confirmPasswordTouched) {
                // Call validateConfirmPassword(), passing in both values as args.
                // This keeps the validation synced at all times.
                validateConfirmPassword(confirmPassword, e.target.value)
              }
            }}
            onChange={(e) => {
              setPassword(e.target.value)

              if (passwordTouched) {
                validatePassword(e.target.value)
              }

              if (confirmPasswordTouched) {
                // Call validateConfirmPassword(), passing in both values as args.
                // This keeps the validation synced at all times.
                validateConfirmPassword(confirmPassword, e.target.value)
              }
            }}
            placeholder='Password...'
            type={passwordType}
            value={password}
          />

          <Button
            className='btn-outline-blue btn-sm bg-white shadow-none'
            onClick={() => {
              setPasswordType((previousValue) => {
                if (previousValue === 'password') {
                  return 'text'
                }
                return 'password'
              })
            }}
            type='button'
          >
            {passwordType === 'password' ? (
              <Eye className='pointer-events-none mr-1 size-[1.25em]' />
            ) : (
              <EyeOff className='pointer-events-none mr-1 size-[1.25em]' />
            )}
          </Button>
        </div>

        <div className={cn('invalid-feedback', passwordError && 'block')}>
          {passwordError}
        </div>
      </div>

      <div className='mb-3'>
        <label
          className='text-sm font-bold text-blue-500'
          htmlFor='confirm-password'
        >
          Confirm Password: <sup className='text-red-500'>*</sup>
        </label>

        <div className='input-group'>
          <input
            autoComplete='off'
            className={cn(
              'form-control form-control-sm',
              confirmPasswordError && 'is-invalid',
              confirmPasswordTouched && !confirmPasswordError && 'is-valid'
            )}
            id='confirm-password'
            name='confirmPassword'
            onBlur={(e) => {
              if (!confirmPasswordTouched) {
                setConfirmPasswordTouched(true)
              }
              validateConfirmPassword(e.target.value)
            }}
            onChange={(e) => {
              setConfirmPassword(e.target.value)

              if (confirmPasswordTouched) {
                validateConfirmPassword(e.target.value)
              }
            }}
            placeholder='Confirm Password...'
            type={confirmPasswordType}
            value={confirmPassword}
          />

          <Button
            className='btn-outline-blue btn-sm bg-white shadow-none'
            onClick={() => {
              setConfirmPasswordType((previousValue) => {
                if (previousValue === 'password') {
                  return 'text'
                }
                return 'password'
              })
            }}
            type='button'
          >
            {confirmPasswordType === 'password' ? (
              <Eye className='pointer-events-none mr-1 size-[1.25em]' />
            ) : (
              <EyeOff className='pointer-events-none mr-1 size-[1.25em]' />
            )}
          </Button>
        </div>

        <div
          className={cn('invalid-feedback', confirmPasswordError && 'block')}
        >
          {confirmPasswordError}
        </div>
      </div>

      {creatingUser ? (
        <Button
          disabled
          className='btn-green btn-sm block w-full'
          type='button'
        >
          <span
            aria-hidden='true'
            className='spinner-border spinner-border-sm mr-2'
            role='status'
          ></span>
          Registering...
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
            'Register'
          )}
        </Button>
      )}
    </form>
  )
}

export { RegisterForm }
