import { ApolloError } from '@apollo/client'

export type GraphQLErrors = ApolloError['graphQLErrors']

export function getFormErrors<T = Record<string, string>>(
  graphQLErrors: GraphQLErrors
): T | undefined {
  if (!graphQLErrors) {
    return undefined
  }

  return graphQLErrors.find((error) => {
    return error?.extensions?.code === 'FORM_ERRORS'
  })?.extensions?.formErrors as T | undefined
}
