import { useState } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import { supabase } from "@/lib/supabase-client"
import { motion } from "framer-motion"
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Loader2, Gift } from "lucide-react"
import CommunityTagline from "@/components/auth/CommunityTagline"
import AuthShowcase from "@/components/auth/AuthShowcase"
import { redeemReferral } from "@/lib/rewards"

export default function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const referralCode = searchParams.get("ref")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [username, setUsername] = useState("")
  const [error, setError] = useState(/** @type {string | null} */ (null))
  const [loading, setLoading] = useState(false)

  /** @param {React.FormEvent<HTMLFormElement>} e */
  const handleSignup = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // 1. Create auth user
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (authError) throw authError

      const user = data.user

      if (!user) {
        throw new Error("User creation failed. Try again.")
      }

      // 2. Save profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        username,
        email,
      })

      if (profileError) throw profileError

      if (referralCode) {
        try {
          await redeemReferral(referralCode)
        } catch (referralErr) {
          console.error(referralErr)
        }
      }

      navigate("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">

      <div className="relative w-full lg:w-1/2 min-h-screen flex items-center justify-center px-6 sm:px-10 py-12 overflow-hidden">

        {/* Decorative background (mobile only — desktop has the showcase panel) */}
        <div className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary/15 blur-3xl lg:hidden" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-accent/15 blur-3xl lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-sm"
        >

          {/* Brand */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <img src="/assets/logo.png" alt="logo" className="w-6 h-6" />
            </div>
            <span className="font-heading text-lg font-bold text-foreground">FindItLah</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-1.5">
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Join FindItLah to start posting and finding items.
          </p>

          {referralCode && (
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 text-accent text-sm rounded-xl px-3 py-2.5 mb-6">
              <Gift size={16} className="shrink-0" />
              <span>You were invited by a friend — sign up and they'll earn reward points!</span>
            </div>
          )}

          <CommunityTagline />

          {/* FORM */}
          <form onSubmit={handleSignup} className="space-y-4 text-left mt-5">

            {/* Username */}
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                placeholder="Username"
                autoComplete="username"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                className="w-full pl-11 pr-11 py-3 rounded-xl border border-input bg-background text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl px-3 py-2.5">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Login
            </Link>
          </p>

        </motion.div>
      </div>

      <AuthShowcase />
    </div>
  )
}