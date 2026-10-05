import { useState } from "react"
import { useNavigate, useSearchParams, Link, useLocation } from "react-router-dom"
import { Eye, EyeOff, Loader2, Gift } from "lucide-react"
import { supabase } from "@/lib/supabase-client"
import { redeemReferral } from "@/lib/rewards"
import AuthShell from "@/components/site/AuthShell"
import { inputClass } from "@/components/site/parts"

export default function Signup() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get("ref")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // Remember the referral code so it still counts after they confirm their email.
  if (referralCode) {
    try { localStorage.setItem("fil-ref", referralCode) } catch (_e) { /* ignore */ }
  }

  /** @param {React.FormEvent<HTMLFormElement>} e */
  const handleSignup = async (e) => {
    e.preventDefault()
    setError("")
    if (!username.trim()) return setError("Please choose a username.")
    if (password.length < 8) return setError("Your password needs at least 8 characters.")
    setLoading(true)

    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      const user = data.user
      if (!user) throw new Error("Couldn't create your account. Please try again.")

      // Save profile (the profile may already exist if a session started straight away)
      const { error: profileError } = await supabase.from("profiles").insert({ id: user.id, username, email })
      if (profileError) {
        if (profileError.code === "23505") {
          await supabase.from("profiles").update({ username }).eq("id", user.id)
        } else {
          throw profileError
        }
      }

      if (referralCode) {
        try {
          await redeemReferral(referralCode)
          localStorage.removeItem("fil-ref")
        } catch (referralErr) {
          console.error(referralErr)
        }
      }

      navigate("/login", { state: location.state })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
        <p className="-mt-2 text-muted-foreground">Join FindItLah to post, chat and buy.</p>

        {referralCode && (
          <p className="flex items-center gap-2 rounded-xl bg-lost-soft px-3 py-2.5 text-sm text-lost">
            <Gift size={16} className="shrink-0" /> You were invited by a friend. Sign up and they&apos;ll earn reward points!
          </p>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 text-sm font-bold">Username
            <input id="signup-username" autoComplete="username" className={inputClass} placeholder="e.g. alextan" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">Email
            <input id="signup-email" type="email" autoComplete="email" className={inputClass} placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold">Password
            <span className="relative">
              <input id="signup-password" type={showPassword ? "text" : "password"} autoComplete="new-password" className={`${inputClass} pr-12`} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {error && <p role="alert" className="rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>}

          <button type="submit" disabled={loading} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-ink font-bold text-white disabled:opacity-60">
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Creating account…" : "Sign up"}
          </button>
          <p className="text-xs text-muted-foreground">By signing up you agree to our Terms and Privacy Policy.</p>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account? <Link to="/login" state={location.state} className="font-bold text-foreground underline underline-offset-4">Log in</Link>
        </p>
      </div>
    </AuthShell>
  )
}
