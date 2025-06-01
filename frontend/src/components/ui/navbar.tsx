// src/components/ui/navbar.tsx
"use client"

import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <header className="w-full px-6 py-4 bg-zinc-900 text-white flex justify-between items-center shadow-sm border-b border-zinc-800">
      <div className="flex items-center gap-2 text-sm font-medium">
        <User className="w-4 h-4 text-muted-foreground" />
        {user?.username}
      </div>

      <Button onClick={logout} variant="ghost" className="text-red-400 hover:text-red-300">
        <LogOut className="w-4 h-4 mr-2" />
        Выйти
      </Button>
    </header>
  )
}
