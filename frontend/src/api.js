import axios from 'axios'

// In dev, Vite proxies /api to the Flask backend (see vite.config.js).
// In production, nginx.conf proxies /api to the api container.
// Set VITE_API_URL only if the API lives on a different origin than this app.
const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL })

// Attach the stored token, if any, to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('taskflow_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// The backend's token_required decorator returns 401 for a missing,
// invalid, or expired token. Treat all three the same: sign the user out.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('taskflow_token')
      localStorage.removeItem('taskflow_user')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (name, email, password) =>
    api.post('/auth/register', { name, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password })
}

export const taskApi = {
  list: () => api.get('/tasks'),
  create: (task) => api.post('/tasks', task),
  update: (id, patch) => api.patch(`/tasks/${id}`, patch),
  remove: (id) => api.delete(`/tasks/${id}`)
}

export default api