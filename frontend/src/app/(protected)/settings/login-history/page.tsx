"use client"

import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import withAuth from "@/lib/withAuth"
import { Clock, Globe, MapPin, ArrowLeft, Filter, Download, Search, Shield } from "lucide-react"
import { Input } from "@/components/ui/input"

type LoginEntry = {
  id: number
  ip_address: string
  country: string
  city: string
  timestamp: string
  success: boolean 
}

function FullLoginHistoryPage() {
  const [history, setHistory] = useState<LoginEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [formattedDate, setFormattedDate] = useState('')
  const [formattedTime, setFormattedTime] = useState('')
  const [username, setUsername] = useState('')
  const router = useRouter()
  
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
    setUsername(typeof window !== "undefined" && window.localStorage.getItem("username") || "Гость")
  }, [])

  useEffect(() => {
    setLoading(true)
    API.get("/settings/login-history")
      .then((res) => setHistory(res.data))
      .catch(() => console.error("Ошибка при загрузке полной истории входов"))
      .finally(() => setLoading(false))
  }, [])
  
  const filteredHistory = history.filter(entry => 
    entry.ip_address.toLowerCase().includes(searchTerm.toLowerCase()) || 
    entry.country.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (entry.city && entry.city.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <main className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-900/20">
            <Clock size={20} />
          </div>
          <h1 className="text-2xl font-bold">История входов</h1>
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
      
      <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 mb-6">
        <div className="flex items-center mb-5">
          <Shield size={16} className="text-emerald-400 mr-2" />
          <p className="text-sm text-gray-300">
            Система безопасности Luminaris отслеживает все входы в систему для обеспечения максимальной защиты ваших данных
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <Button
            onClick={() => router.push("/settings")}
            className="bg-gray-800 hover:bg-gray-700 text-white border-none flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Назад к настройкам
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search size={16} className="text-gray-500" />
              </div>
              <Input 
                placeholder="Поиск по IP или стране..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-gray-700 pl-10 text-white"
              />
            </div>
            
            <Button 
              variant="outline" 
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
            >
              <Filter size={16} />
            </Button>
            
            <Button 
              variant="outline" 
              className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
            >
              <Download size={16} />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-16">
            <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Загрузка истории входов...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16">
            <div className="w-16 h-16 bg-gray-800 rounded-lg flex items-center justify-center mb-4">
              <Clock size={28} className="text-gray-600" />
            </div>
            {searchTerm ? (
              <p className="text-gray-400">По запросу &quot;{searchTerm}&quot; ничего не найдено</p>
            ) : (
              <p className="text-gray-400">История входов пуста</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-4 px-4 py-2 text-xs text-gray-400 border-b border-gray-800">
              <div>IP-адрес</div>
              <div>Местоположение</div>
              <div>Дата</div>
              <div>Время</div>
            </div>
            {filteredHistory.map((entry, i) => {
              const entryDate = new Date(entry.timestamp);
              return (
                <div
                  key={i}
                  className={`bg-gray-800/50 border border-gray-700/40 rounded-lg p-4 hover:bg-gray-800/80 transition-colors ${
                    i % 2 === 0 ? "bg-gray-800/70" : ""
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div className="flex items-center">
                      <div className="mr-3 p-2 bg-blue-900/30 rounded-lg border border-blue-800/30">
                        <Globe size={16} className="text-blue-400" />
                      </div>
                      <span className="font-mono text-blue-400">{entry.ip_address}</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className="mr-2 p-2 bg-purple-900/30 rounded-lg border border-purple-800/30">
                        <MapPin size={16} className="text-purple-400" />
                      </div>
                      <span>{entry.country}{entry.city ? `, ${entry.city}` : ""}</span>
                    </div>
                    
                    <div className="text-gray-300">
                      {entryDate.toLocaleDateString('ru-RU')}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">
                        {entryDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs border
                          ${entry.success
                            ? "bg-green-900/30 text-green-400 border-green-800/30"
                            : "bg-red-900/30 text-red-400 border-red-800/30"
                          }`
                        }
                      >
                        {entry.success ? "Успешно" : "Ошибка"}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        
        {filteredHistory.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-xs text-gray-400">
            <div>Показано: {filteredHistory.length} из {history.length}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 bg-gray-800 border-gray-700 text-gray-400">
                Предыдущая
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-gray-800 border-gray-700 text-white">
                1
              </Button>
              <Button size="sm" variant="outline" className="h-8 bg-gray-800 border-gray-700 text-gray-400">
                Следующая
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-center text-xs text-gray-500 py-3">
        Luminaris Security System • Powered by AI 
      </div>
    </main>
  )
}

export default withAuth(FullLoginHistoryPage, ["ANALYST", "VIEWER", "ADMIN"])