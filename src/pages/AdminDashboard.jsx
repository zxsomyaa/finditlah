import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase-client"

import {
  Loader2,
  Users,
  Package,
  CheckCircle,
  AlertCircle,
  Trash2,
  Search,
} from "lucide-react"

const ADMIN_EMAIL = "somyamehta15@gmail.com"

export default function AdminDashboard() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState("")

  // 👤 current user
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ["admin-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser()
      return data.user
    },
  })

  // 👥 profiles
  const { data: profiles = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["profiles-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      return data || []
    },
  })

  // 📦 items
  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ["items-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("Item").select("*")
      return data || []
    },
  })

  // 🗑 delete user (profile only)
  const deleteUser = useMutation({
    mutationFn: async (id) => {
      await supabase.from("profiles").delete().eq("id", id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles-admin"] })
    },
  })

  // 🗑 delete item
  const deleteItem = useMutation({
    mutationFn: async (id) => {
      await supabase.from("Item").delete().eq("id", id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items-admin"] })
    },
  })

  if (loadingUser || loadingUsers || loadingItems) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  // 🔐 ADMIN CHECK
  if (userData?.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold">Not Authorized</h1>
          <p className="text-muted-foreground">
            You do not have access to this page.
          </p>
        </div>
      </div>
    )
  }

  // 📊 stats
  const resolved = items.filter(i => i.status === "resolved").length
  const active = items.filter(i => i.status === "active").length

  const filteredUsers = profiles.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-background p-6">

      <h1 className="text-2xl font-bold mb-6">
        Admin Control Panel
      </h1>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">

        <Card icon={<Users />} label="Users" value={profiles.length} />
        <Card icon={<Package />} label="Items" value={items.length} />
        <Card icon={<CheckCircle />} label="Resolved" value={resolved} />
        <Card icon={<AlertCircle />} label="Active" value={active} />

      </div>

      {/* SEARCH */}
      <div className="flex items-center gap-2 mb-4 border p-2 rounded-lg">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          className="w-full outline-none bg-transparent"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* USERS */}
      <div className="bg-card border rounded-xl p-4 mb-6">
        <h2 className="font-semibold mb-3">Users</h2>

        {filteredUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No users found</p>
        ) : (
          filteredUsers.map((u) => (
            <div
              key={u.id}
              className="flex justify-between py-2 border-b last:border-none"
            >
              <div>
                <p className="font-medium">{u.username || "No username"}</p>
                <p className="text-xs text-muted-foreground">{u.id}</p>
              </div>

              <button
                onClick={() => deleteUser.mutate(u.id)}
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* ITEMS */}
      <div className="bg-card border rounded-xl p-4">
        <h2 className="font-semibold mb-3">Items</h2>

        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items found</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between py-2 border-b last:border-none"
            >
              <div>
                <p className="font-medium">{item.title || "Untitled"}</p>
                <p className="text-xs text-muted-foreground">{item.status}</p>
              </div>

              <button
                onClick={() => deleteItem.mutate(item.id)}
                className="text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

    </div>
  )
}

/* CARD */
function Card({ icon, label, value }) {
  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm">{label}</span>
      </div>

      <p className="text-2xl font-bold mt-2">
        {value}
      </p>
    </div>
  )
}