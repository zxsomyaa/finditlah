import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"

export default function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  // not logged in → send to login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}