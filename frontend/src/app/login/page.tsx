"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { Eye, EyeOff, User, Lock, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image";

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!username || !password) {
      setError("Введите логин и пароль")
      setLoading(false)
      return
    }

    try {
      await login(username, password)
    } catch (err) {
      console.error("Login error:", err)
      setError("Ошибка входа")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white px-4 relative overflow-hidden">
      {/* Background gradient dots pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-emerald-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse delay-500"></div>
      </div>

      {/* Logo in top left corner */}
      <div className="fixed top-6 left-6 flex items-center z-20">
              {/* <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-2 overflow-hidden"> */}
              <Image
                src="/logo.png"
                alt="Логотип"
                width={35}
                height={35}
                className="object-contain"
              />
             {/* </div> */}
        <h1 className="text-xl font-semibold text-white">Luminaris</h1>
      </div>
      

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="mb-6"></div>
          
          <div className="space-y-2 mb-8">
            <h2 className="text-4xl font-bold text-white">
              Защищенный
            </h2>
            <div className="flex items-center justify-center gap-2">
              <span className="text-4xl font-bold text-white">вход в</span>
              <span className="text-4xl font-bold text-emerald-400 border-2 border-emerald-400 px-4 py-1 rounded-full">
                систему
              </span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/30 border border-gray-700/50 rounded-2xl p-8 backdrop-blur-sm">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Логин
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Введите логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 pl-11 h-12 rounded-lg focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  placeholder="Введите пароль"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-gray-900/50 border border-gray-700 text-white placeholder-gray-500 pl-11 pr-12 h-12 rounded-lg focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-sm text-red-400 text-center">{error}</p>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg border border-emerald-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Вход..." : "Войти в систему"}
            </Button>
          </form>

          {/* Home Link Button */}
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-emerald-400 text-sm flex items-center justify-center gap-2 mx-auto"
              onClick={() => router.push("/")}
            >
              <Home size={16} />
              Вернуться на главную страницу
            </Button>
          </div>
        </div>
        
        <div className="text-center mt-6 text-xs text-gray-500">
          Luminaris Security System
        </div>
      </div>
    </main>
  )
}