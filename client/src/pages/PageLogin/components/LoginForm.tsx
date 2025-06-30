import React, { useState, Fragment } from 'react'
import { useMutation } from '@apollo/client'
import { toast } from 'react-toastify'
import { Eye, EyeOff, TriangleAlert } from 'lucide-react'

import { cn } from 'utils'
import { Button } from 'components'
import { useAuthContext } from 'contexts'
import { LOGIN_USER } from 'mutations'
import { Session } from 'types'

type LoginFormProps = {
  style?: React.CSSProperties
}

// The server loginUser resolver either throws or returns a Session object.
// Thus, we can confidently set this as the data type on the useMutation() hook.
type LoginUserData = {
  result: Session
}

/* ========================================================================
                              LoginForm 
======================================================================== */

const LoginForm = ({ style }: LoginFormProps) => {
  const { handleAuthSuccess } = useAuthContext()

  const [email, setEmail] = useState('')
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [password, setPassword] = useState('')
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordType, setPasswordType] = useState('password')

  // Derived state - used to conditionally disable submit button
  const isErrors = emailError !== '' || passwordError !== ''
  const allTouched = emailTouched && passwordTouched

  /* ======================
        loginUser()
  ====================== */

  const loginInput = { email, password }

  const [loginUser, { loading: loggingIn }] = useMutation<LoginUserData>(
    LOGIN_USER,
    {
      variables: { input: loginInput },
      onCompleted(data) {
        const { result: session } = data

        handleAuthSuccess(session)

        setEmail('')
        setEmailTouched(false)
        setEmailError('')

        setPassword('')
        setPasswordTouched(false)
        setPasswordError('')

        toast.success('User login successful!')
        // Rather than calling navigate('/todos') here, there's a check in
        // the LoginPage that will then call <Navigate to='/todos' replace />
      },

      onError(error) {
        // const {
        //   name,
        //   message,
        //   graphQLErrors,
        //   clientErrors,
        //   protocolErrors,
        //   networkError,
        //   extraInfo
        // } = error

        setPassword('')

        toast.error('Unable to log in! Invalid credentials.')

        if (import.meta.env.DEV === true) {
          console.log({ error })
        }
      }
    }
  )

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
        validate()
  ====================== */

  const validate = () => {
    const errors: string[] = []

    // Set true on all toucher functions.
    const touchers: React.Dispatch<React.SetStateAction<boolean>>[] = [
      setEmailTouched,
      setPasswordTouched
    ]

    touchers.forEach((toucher) => {
      toucher(true)
    })

    const validators: (() => string)[] = [validateEmail, validatePassword]

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

    // Currently, [...nextauth].ts doesn't have any additional validation
    // that checks for empty ('') email or password. It doesn't really need
    // it. If the user doesn't enter the correct credentials, it will fail
    // all the same.
    if (!isValid) {
      setPassword('')
      setPasswordType('password')
      return
    }

    // Note that even if loginUser() results in an error,
    // it will not go to the catch() block. This is why
    // it's better to use onCompleted() & onError().
    loginUser()
      .catch((err) => {
        return err
      })
      .finally(() => {
        setPasswordType('password')
      })
  }

  /* ======================
          return
  ====================== */
  // This form validates each field on submit, onBlur, and onChange (if touched).
  // Implementing validation is a lot of work, but taking the time to do it
  // correctly leads to the best user experience. Ultimately, this process can
  // be simplified through abstracting some of the logic into custom form field
  // components and/or using Formik/react-hook-form. For now, it's all homegrown.

  //# Why does this have a div wrapper, when RegisterForm doesn't ?
  return (
    <div className='mx-auto' style={{ maxWidth: 500, ...style }}>
      <form className='overflow-hidden rounded-lg border border-neutral-400 bg-[#fafafa] p-4 shadow'>
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
            placeholder='Email'
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
              }}
              onChange={(e) => {
                setPassword(e.target.value)

                if (passwordTouched) {
                  validatePassword(e.target.value)
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
                <Eye className='pointer-events-none size-[1.25em]' />
              ) : (
                <EyeOff className='pointer-events-none size-[1.25em]' />
              )}
            </Button>
          </div>

          <div className={cn('invalid-feedback', passwordError && 'block')}>
            {passwordError}
          </div>
        </div>

        {loggingIn ? (
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
            Logging In...
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
              'Log In'
            )}
          </Button>
        )}
      </form>
    </div>
  )
}

export { LoginForm }
