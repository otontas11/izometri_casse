import axios from 'axios'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
  headers: {
    Accept: 'application/json',
  },
  timeout: 10_000,
})

