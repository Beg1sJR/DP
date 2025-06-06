"use client"

import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { JSX, useEffect, type FC } from "react"

export default function withAuth<P extends JSX.IntrinsicAttributes>(
  Component: FC<P>,
  allowedRoles?: string[]
): FC<P> {
  const AuthenticatedComponent: FC<P> = (props) => {
    const { user, loaded } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!loaded) return
      if (!user) {
        router.replace("/login")
      } else if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace("/unauthorized")
      }
    }, [loaded, user, router])

    if (!loaded) return null
    if (!user) return null
    if (allowedRoles && !allowedRoles.includes(user.role)) return null

    return <Component {...props} />
  }

  return AuthenticatedComponent
}