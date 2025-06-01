// app/superadmin/layout.tsx
"use client"

import { useAuth } from "@/context/AuthContext"
import { ReactNode } from "react"

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0f1c] via-[#1a1a2a] to-black text-white">
      <header className="flex justify-between items-center px-8 py-6 border-b border-white/10 bg-[#111] shadow-md">
        <div>
          <h1 className="text-2xl font-bold">🛡 SuperAdmin Panel</h1>
          <p className="text-sm text-gray-400 mt-1">
            Добро пожаловать, {user?.username || "пользователь"}
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-red-400 hover:text-red-300 border border-red-400 px-4 py-1 rounded-md"
        >
          Выйти
        </button>
      </header>

      <main>{children}</main>
    </div>
  )
}
