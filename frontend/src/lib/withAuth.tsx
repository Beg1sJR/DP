"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import type { FC, ReactNode } from "react"

type PropsWithChildren = {
  children?: ReactNode
}

export default function withAuth<P extends PropsWithChildren>(
  Component: FC<P>,
  allowedRoles?: string[]
): FC<P> {
  const AuthenticatedComponent: FC<P> = (props) => {
    const { user, loaded } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loaded) return

      if (!user) {
        // ❌ Не авторизован → на /login
        router.replace("/login")
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        // 🔒 Авторизован, но нет доступа по роли → на /unauthorized
        router.replace("/unauthorized")
      }
    }, [loaded, user, router])

    // Пока не загружено
    if (!loaded) return null

    // Не показываем, если не авторизован
    if (!user) return null

    // Не показываем, если роль не разрешена
    if (allowedRoles && !allowedRoles.includes(user.role)) return null

    return <Component {...props} />
  }

  return AuthenticatedComponent
}
