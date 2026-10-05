import { Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/lib/AuthContext"
import AuthShell from "@/components/site/AuthShell"
import JoinGate from "@/components/site/JoinGate"

/** Which sign-up message fits the page the visitor tried to open. @param {string} path */
const reasonFor = (path) =>
  path.startsWith("/post") || path.startsWith("/sell") || path.startsWith("/edit-post") ? "post"
  : path.startsWith("/chat") ? "chat"
  : "account"

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

  // Not logged in: invite them to create an account, then bring them straight back here.
  if (!user) {
    const reason = reasonFor(location.pathname)
    return (
      <AuthShell>
        <JoinGate reason={/** @type {any} */ (reason)} tone={location.pathname.startsWith("/sell") ? "t" : "l"} plain />
      </AuthShell>
    )
  }

  return <Outlet />
}
