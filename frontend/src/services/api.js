import axios from 'axios'

// Get backend API URL from environment or default to proxy in dev
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.PROD 
    ? `${API_BASE_URL}/api`
    : '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Could add auth token here in Phase 2
    // const token = localStorage.getItem('token')
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`
    // }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      // Server responded with error
      console.error('API Error:', error.response.data)
      return Promise.reject(error.response.data)
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.request)
      return Promise.reject({ message: 'Network error. Please check your connection.' })
    } else {
      // Something else happened
      console.error('Error:', error.message)
      return Promise.reject({ message: error.message })
    }
  }
)

// API methods
export const slotsAPI = {
  getAll: () => api.get('/slots'),
  get: (slotId) => api.get(`/slots/${slotId}`),
  update: (slotId, data) => api.put(`/slots/${slotId}`, data),
  clear: (slotId) => api.delete(`/slots/${slotId}`),
}

export const scenesAPI = {
  getAll: () => api.get('/scenes'),
  get: (id) => api.get(`/scenes/${id}`),
  create: (data) => api.post('/scenes', data),
  update: (id, data) => api.put(`/scenes/${id}`, data),
  delete: (id) => api.delete(`/scenes/${id}`),
  load: (id) => api.post(`/scenes/${id}/load`),
  capture: (id) => api.post(`/scenes/${id}/capture`),
}

export const imagesAPI = {
  getAll: (params) => api.get('/images', { params }),
  get: (id) => api.get(`/images/${id}`),
  upload: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  addUrl: (url, name) => api.post('/images/url', { url, name }),
  update: (id, data) => api.put(`/images/${id}`, data),
  delete: (id) => api.delete(`/images/${id}`),
}

export const systemAPI = {
  health: () => api.get('/health'),
  status: () => api.get('/status'),
}

export default api
