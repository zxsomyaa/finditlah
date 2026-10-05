import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase-client"
import { redeemReferral } from "@/lib/rewards"

const AuthContext = createContext(/** @type {any} */ (null))

/**
 * People who sign in with Google skip the signup form, so they don't get a
 * `profiles` row there. Create one the first time we see them.
 * @param {any} user
 */
async function ensureProfile(user) {
  if (!user) return
  try {
    const { data } = await supabase.from("profiles").select("id").eq("id", user.id).maybeSingle()
    if (data) return
    const meta = user.user_metadata || {}
    const username = meta.full_name || meta.name || (user.email || "").split("@")[0] || "FindItLah user"
    const { error } = await supabase.from("profiles").insert({ id: user.id, username, email: user.email })
    if (error) return
    // A friend's referral link opened before choosing "Sign up with Google"
    const ref = localStorage.getItem("fil-ref")
    if (ref) {
      await redeemReferral(ref)
      localStorage.removeItem("fil-ref")
    }
  } catch (err) {
    console.error("Couldn't create profile", err)
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(/** @type {any} */ (null))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data?.user || null)
      setLoading(false)
      ensureProfile(data?.user)
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null)
      if (event === "SIGNED_IN") ensureProfile(session?.user)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const login = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signup = async (email, password) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }


  const logout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
