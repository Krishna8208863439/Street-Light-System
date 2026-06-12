import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const getStatus = () => api.get('/simulation/status').then(r => r.data)
export const toggleTime = () => api.post('/simulation/toggle-time').then(r => r.data)
export const triggerMotion = (light_id, object_type) =>
  api.post('/simulation/trigger-motion', { light_id, object_type }).then(r => r.data)
export const getMetrics = () => api.get('/simulation/metrics').then(r => r.data)
export const getLogs = () => api.get('/simulation/logs').then(r => r.data)

