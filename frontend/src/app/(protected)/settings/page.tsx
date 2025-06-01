"use client"

import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import withAuth from "@/lib/withAuth"
import { Settings, Clock, Globe, MapPin, ChevronRight, Shield, Bell } from "lucide-react"

type LoginEntry = {
  id: number
  ip_address: string
  country: string
  city: string
  timestamp: string
  success: boolean 
}

function SettingsPage() {
  const [history, setHistory] = useState<LoginEntry[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Динамические данные пользователя
  const [formattedDate, setFormattedDate] = useState('')
  const [formattedTime, setFormattedTime] = useState('')
  const [username, setUsername] = useState('')
  const [userRole, setUserRole] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    const now = new Date()
    setFormattedDate(now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }))
    setFormattedTime(now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }))

    // Получаем из localStorage (или замени на свой способ получения)
    setUsername(localStorage.getItem("username") || "Гость")
    setUserRole(localStorage.getItem("role") || "ANALYST") // по умолчанию ANALYST
    setUserId(localStorage.getItem("user_id") || "") // по умолчанию пусто
  }, [])

  useEffect(() => {
    setLoading(true)
    API.get("/settings/login-history/last5")
      .then((res) => setHistory(res.data))
      .catch(() => console.error("Ошибка при загрузке истории входов"))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-900/20">
            <Settings size={20} />
          </div>
          <h1 className="text-2xl font-bold">Настройки профиля</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-emerald-400">Система активна</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full">
            <span className="text-xs text-gray-400">{formattedDate}</span>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <span className="text-xs text-gray-400">{formattedTime}</span>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <span className="text-xs text-emerald-400">{username}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mr-4 text-2xl font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{username}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-emerald-900/40 text-emerald-400 border border-emerald-800/40">
                    <Shield size={10} className="mr-1" />
                    {userRole}
                  </span>
                  <span className="text-xs text-gray-400">{userId && <>ID: {userId}</>}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <Button 
                variant="outline"
                className="w-full bg-gray-800/60 border-gray-700/40 hover:bg-gray-800 text-white justify-start"
                onClick={() => {}}
              >
                <Bell className="mr-2 h-4 w-4 text-blue-400" />
                Настройки уведомлений
              </Button>
              
              <Button 
                variant="outline"
                className="w-full bg-gray-800/60 border-gray-700/40 hover:bg-gray-800 text-white justify-between"
                onClick={() => router.push("/settings/login-history")}
              >
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-purple-400" />
                  История входов
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </Button>
              
              <hr className="border-gray-800" />

            </div>
          </div>
        </div>
        
        <div className="md:col-span-2">
          <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center">
                <Clock size={18} className="text-emerald-400 mr-2" />
                <h2 className="text-lg font-medium">История входов</h2>
              </div>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                <p className="text-gray-400 text-sm">Загрузка истории входов...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                  <Clock size={24} className="text-gray-600" />
                </div>
                <p className="text-gray-400">История входов пуста</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((entry, i) => (
                  <div
                    key={entry.id ?? i }
                    className="bg-gray-800/50 border border-gray-700/40 rounded-lg p-4 hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row justify-between gap-3">
                      <div className="flex items-center">
                        <div className="mr-3 p-2 bg-gray-900/80 rounded-lg">
                          <Globe size={22} className="text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-1">Вход в систему</div>
                          <div className="flex items-center text-xs text-gray-400">
                            <MapPin size={12} className="mr-1" />
                            {entry.country}{entry.city ? `, ${entry.city}` : ""}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className="text-sm text-gray-300">{new Date(entry.timestamp).toLocaleDateString('ru-RU')}</div>
                        <div className="text-xs text-gray-500">{new Date(entry.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-400 rounded border border-blue-800/30">
                          IP: {entry.ip_address}
                        </span>
                        {entry.success ? (
                          <span className="px-1.5 py-0.5 bg-green-900/30 text-green-400 rounded border border-green-800/30">
                            Успешно
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 bg-red-900/30 text-red-400 rounded border border-red-800/30">
                            Ошибка входа
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500 py-3">
        Luminaris Security System • Powered by AI 
      </div>
    </main>
  )
}

export default withAuth(SettingsPage, ["ANALYST", "VIEWER", "ADMIN"])