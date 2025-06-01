"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, ReactNode } from "react"
import LayoutWithSidebar from "@/components/layout/LayoutWithSidebar"
import { SidebarProvider } from "@/context/SidebarContext"

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const { user, loaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loaded) return

    if (!user) {
      router.replace("/login")
    } else if (!["ANALYST", "VIEWER", "ADMIN"].includes(user.role)) {
      router.replace("/unauthorized")
    }
  }, [loaded, user, router])

  if (!loaded || !user || !["ANALYST", "VIEWER", "ADMIN"].includes(user.role)) return null

  return (
    <SidebarProvider>
      <LayoutWithSidebar>{children}</LayoutWithSidebar>
    </SidebarProvider>
  )
}
