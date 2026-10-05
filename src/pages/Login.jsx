import { useState } from "react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/AuthContext"
import { supabase } from "@/lib/supabase-client"
import AuthShell from "@/components/site/AuthShell"
import { inputClass } from "@/components/site/parts"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = /** @type {any} */ (location.state)?.from || "/"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  /** @param {React.FormEvent<HTMLFormElement>} e */
  const handleLogin = async (e) => {
    e.preventDefault()
    setError("")
    setNotice("")
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    setError("")
    setNotice("")
    if (!email) {
      setError("Enter your email above first, then tap Forgot password.")
      return
    }
    try {
      setResetLoading(true)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setNotice("Password reset email sent. Check your inbox.")
    } catch (err) {
      setError((err instanceof Error && err.message) || "Couldn't send the reset email")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="-mt-2 text-muted-foreground">Log in to post, chat and buy.</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 text-sm font-bold">Email
            <input id="login-email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">Password
            <span className="relative">
              <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" className={`${inputClass} pr-12`} value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
          <button type="button" onClick={handleForgotPassword} disabled={resetLoading} className="self-end text-sm font-semibold text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50">
            {resetLoading ? "Sending…" : "Forgot password?"}
          </button>

          {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>}
          {notice && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{notice}</p>}

          <button type="submit" disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ink font-bold text-white disabled:opacity-60">
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          New here? <Link to="/signup" state={location.state} className="font-bold text-foreground underline underline-offset-4">Create an account</Link>
        </p>
        <a href="https://instagram.com/finditlah" target="_blank" rel="noopener noreferrer" className="text-center text-xs text-muted-foreground hover:text-foreground">
          Follow @finditlah on Instagram for updates &amp; upcoming features
        </a>
      </div>
    </AuthShell>
  )
}
