import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'
import Spinner from './Spinner'

export default function ProtectedRoute({ children }) {
  const { status } = useSelector((state) => state.auth)
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return children
}
