import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import api, {
  clearTokens,
  getStoredTokens,
  storeTokens,
} from '../../api/axios'

const applyAuthResponse = (state, { payload }) => {
  const { user, accessToken, refreshToken } = payload
  if (accessToken && refreshToken) {
    storeTokens({ accessToken, refreshToken })
  }
  state.user = user
  state.status = 'authenticated'
  state.error = null
}

export const register = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      await api.post('/users/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // Registration does not issue tokens — log in right after
      const { username, email, password } = Object.fromEntries(formData.entries())
      const loginResult = await api.post('/users/login', {
        username,
        email,
        password,
      })
      return loginResult.data.data
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Registration failed',
      )
    }
  },
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/login', credentials)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed')
    }
  },
)

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/users/logout')
  } finally {
    clearTokens()
  }
})

// Restore the session from stored tokens or the refresh-token cookie
export const restoreSession = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      if (!getStoredTokens()) {
        // No access token in storage — the refresh cookie may still be valid
        const refreshResponse = await api.post('/users/refresh-token')
        const tokens = refreshResponse.data?.data
        if (tokens?.accessToken) {
          storeTokens(tokens)
        }
      }
      const response = await api.get('/users/current-user')
      return response.data.data
    } catch {
      clearTokens()
      return rejectWithValue('No active session')
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    status: 'loading', // 'loading' | 'authenticated' | 'guest'
    error: null,
  },
  reducers: {
    setUser(state, action) {
      state.user = action.payload
      state.status = 'authenticated'
    },
    clearUser(state) {
      state.user = null
      state.status = 'guest'
      state.error = null
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(restoreSession.fulfilled, applyAuthResponse)
      .addCase(restoreSession.rejected, (state) => {
        state.user = null
        state.status = 'guest'
      })
      .addCase(register.pending, (state) => {
        state.error = null
      })
      .addCase(register.fulfilled, applyAuthResponse)
      .addCase(register.rejected, (state, action) => {
        state.error = action.payload
      })
      .addCase(login.pending, (state) => {
        state.error = null
      })
      .addCase(login.fulfilled, applyAuthResponse)
      .addCase(login.rejected, (state, action) => {
        state.error = action.payload
        state.status = 'guest'
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null
        state.status = 'guest'
        state.error = null
      })
  },
})

export const { setUser, clearUser, clearError } = authSlice.actions

export const selectIsAuthenticated = (state) =>
  state.auth.status === 'authenticated'

export default authSlice.reducer
