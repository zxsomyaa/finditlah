import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-ink" />
      </div>
    )
  }

  // Not logged in → log in first, then come back here
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return <Outlet />
}
