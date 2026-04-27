import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import useAuthStore from '../store/auth'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token
  if (token) {
    if (!config.headers) {
      config.headers = new axios.AxiosHeaders()
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default request
