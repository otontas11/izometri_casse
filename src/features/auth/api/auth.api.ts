import axios from 'axios'

import { toApiRequestError } from '@/api/apiError'
import { auth0Config } from '@/config/auth0.config'

interface Auth0PasswordResetRequest {
  client_id: string
  connection: string
  email: string
}

const requestAuth0PasswordResetEmail = async (emailAddress: string) => {
  const passwordResetRequest: Auth0PasswordResetRequest = {
    client_id: auth0Config.clientId,
    connection: auth0Config.databaseConnection,
    email: emailAddress,
  }

  try {
    await axios.post<string>(`https://${auth0Config.domain}/dbconnections/change_password`, passwordResetRequest, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    })
  } catch (requestError) {
    throw toApiRequestError(requestError)
  }
}

export const authApi = {
  requestAuth0PasswordResetEmail,
}
