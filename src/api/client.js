import axios from 'axios'

export const ACCESS_KEY = 'vision_access_token'
export const REFRESH_KEY = 'vision_refresh_token'

const baseURL = import.meta.env.VITE_API_URL || ''

const client = axios.create({ baseURL })

export function saveTokens({ accessToken, refreshToken }) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// one refresh at a time, even if several requests fail together
let refreshPromise = null

function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem(REFRESH_KEY)
    refreshPromise = axios
      .post(`${baseURL}/api/auth/refresh`, { refreshToken })
      .then(({ data }) => {
        saveTokens(data)
        return data.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const url = original?.url || ''
    const isAuthCall = url.includes('/api/auth/login') || url.includes('/api/auth/refresh')
    const tokenProblem = (status === 401 || status === 403) && !isAuthCall && !original._retry

    if (!tokenProblem || !localStorage.getItem(REFRESH_KEY)) {
      return Promise.reject(error)
    }

    original._retry = true
    try {
      const newToken = await refreshAccessToken()
      original.headers.Authorization = `Bearer ${newToken}`
      return client(original) // replay the failed request
    } catch {
      clearTokens()
      window.location.href = '/login'
      return Promise.reject(error)
    }
  }
)

export default client