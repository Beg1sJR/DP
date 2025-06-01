"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { jwtDecode } from "jwt-decode"
import { API } from "@/lib/axios"

interface TokenPayload {
  sub: string
  username: string
  role: string
  company_id: string
  exp: number
}

type User = {
  username: string
  token: string
  role: string
  companyId: string
  companyName: string
}

type AuthContextType = {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loaded: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loaded, setLoaded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const username = localStorage.getItem("username")
    const role = localStorage.getItem("role")
    const companyId = localStorage.getItem("companyId")
    const companyName = localStorage.getItem("companyName")

    if (token && username && role && companyId && companyName) {
      setUser({ token, username, role, companyId, companyName })
    }

    setLoaded(true)
  }, [])

  const redirectByRole = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        router.replace("/superadmin")
        break
      case "ADMIN":
        router.replace("/admin")
        break
      case "ANALYST":
      case "VIEWER":
        router.replace("/dashboard")
        break
      default:
        router.replace("/")
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const res = await API.post("/auth/login", { username, password })
      const { access_token } = res.data

      const payload = jwtDecode<TokenPayload>(access_token)
      const role = payload.role
      const companyId = payload.company_id

      const profileRes = await API.get("/auth/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      })

      const companyName = profileRes.data.company_name

      // сохраняем
      localStorage.setItem("token", access_token)
      localStorage.setItem("username", username)
      localStorage.setItem("role", role)
      localStorage.setItem("companyId", companyId)
      localStorage.setItem("companyName", companyName)

      setUser({ token: access_token, username, role, companyId, companyName })
      redirectByRole(role)
    } catch (error) {
      console.error("Login error:", error)
      toast.error("Ошибка авторизации")
    }
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loaded }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
