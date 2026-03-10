import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/auth.js'

function RequireAuth({ children }) {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />
  }

  return children
}

export default RequireAuth

