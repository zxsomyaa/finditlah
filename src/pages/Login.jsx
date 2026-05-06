import { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import { useNavigate, Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Mail, Lock } from "lucide-react"
import { supabase } from "@/lib/supabase-client"

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      navigate("/")
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* 🔥 FORGOT PASSWORD */
  const handleForgotPassword = async () => {
    if (!email) {
      alert("Enter your email first")
      return
    }

    try {
      setResetLoading(true)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      alert("Password reset email sent! Check your inbox.")
    } catch (err) {
      console.error(err)
      alert(err.message || "Failed to send reset email")
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >

        <div className="bg-white rounded-3xl shadow-lg p-8 text-center">

          {/* Logo */}
          <img
            src="/assets/logo.png"
            alt="logo"
            className="w-16 mx-auto mb-4"
          />

          {/* Tagline */}
          <p className="text-gray-700 text-base italic font-medium mb-6 leading-relaxed">
            Find what matters. Return what counts.
          </p>

          {/* FORM */}
          <form onSubmit={handleLogin} className="space-y-4 text-left">

            {/* EMAIL */}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {/* FORGOT PASSWORD */}
            <div className="text-right text-sm">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-gray-500 hover:text-blue-600 disabled:opacity-50"
              >
                {resetLoading ? "Sending..." : "Forgot Password?"}
              </button>
            </div>

            {/* ERROR */}
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

          </form>

          {/* SIGNUP */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Need an account?{" "}
            <Link to="/signup" className="text-blue-600 font-semibold">
              Sign up
            </Link>
          </p>

        </div>
      </motion.div>
    </div>
  )
}