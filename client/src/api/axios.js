import axios from 'axios'

const TOKEN_STORAGE_KEY = 'videotube_tokens'

export const getStoredTokens = () => {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const storeTokens = (tokens) => {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens))
}

export const clearTokens = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
})

// Attach the access token to every outgoing request
api.interceptors.request.use((config) => {
  const tokens = getStoredTokens()
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`
  }
  return config
})

let refreshPromise = null

const isAuthEndpoint = (url = '') =>
  url.includes('/users/login') ||
  url.includes('/users/register') ||
  url.includes('/users/refresh-token') ||
  url.includes('/users/logout')

// On a 401, refresh the access token once and retry the original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (
      status !== 401 ||
      originalRequest?._retry ||
      isAuthEndpoint(originalRequest?.url)
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = api
          .post('/users/refresh-token')
          .finally(() => {
            refreshPromise = null
          })
      }

      const refreshResponse = await refreshPromise
      const tokens = refreshResponse.data?.data
      if (!tokens?.accessToken) {
        throw new Error('Token refresh failed')
      }

      storeTokens(tokens)
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      clearTokens()
      window.dispatchEvent(new CustomEvent('auth:logout'))
      return Promise.reject(refreshError)
    }
  },
)

export default api
