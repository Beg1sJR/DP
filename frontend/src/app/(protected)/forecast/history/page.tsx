"use client"

import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { useRouter } from "next/navigation"
import withAuth from "@/lib/withAuth"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CalendarClock, Shield, BarChart2, Calendar, History, Clock, Brain, AlertTriangle } from "lucide-react"

type Forecast = {
  id: number
  attack_type: string
  confidence: number
  expected_time: string
  target_ip: string
  reasoning: string
  created_at: string
}

function ForecastHistoryPage() {
  const [forecasts, setForecasts] = useState<Forecast[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Динамические дата, время, имя пользователя
  const [formattedDate, setFormattedDate] = useState('')
  const [formattedTime, setFormattedTime] = useState('')
  const [username, setUsername] = useState('')

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
    API.get("/forecast/all")
      .then((res) => setForecasts(res.data))
      .finally(() => setLoading(false))
  }, [])
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return {
      text: "text-red-400",
      bg: "bg-red-900/20", 
      border: "border-red-800/30"
    };
    if (confidence >= 60) return {
      text: "text-orange-400",
      bg: "bg-orange-900/20", 
      border: "border-orange-800/30"
    };
    if (confidence >= 40) return {
      text: "text-yellow-400", 
      bg: "bg-yellow-900/20", 
      border: "border-yellow-800/30"
    };
    return {
      text: "text-blue-400", 
      bg: "bg-blue-900/20", 
      border: "border-blue-800/30"
    };
  };
  
  // Проверяем, произошло ли уже ожидаемое событие
  const hasEventOccurred = (expectedTime: string) => {
    return new Date(expectedTime) < new Date();
  };

  return (
    <main className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-900/20">
            <History size={20} />
          </div>
          <h1 className="text-2xl font-bold">История прогнозов</h1>
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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button
          onClick={() => router.back()}
          className="bg-gray-800/60 hover:bg-gray-700/60 text-white gap-2"
        >
          <ArrowLeft size={16} />
          Назад к прогнозам
        </Button>
        
        <div className="ml-auto text-sm text-gray-400">
          Найдено прогнозов: {forecasts.length}
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Загрузка истории прогнозов...</p>
        </div>
      ) : forecasts.length === 0 ? (
        <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-16 flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Calendar size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-300 text-lg mb-2">Нет доступных прогнозов</p>
          <p className="text-gray-500 max-w-md text-center">
            История будет заполняться по мере того, как система будет генерировать новые прогнозы угроз.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {forecasts.map((f) => {
            const confidenceStyle = getConfidenceColor(f.confidence);
            const isExpired = hasEventOccurred(f.expected_time);
            
            return (
              <div
                key={f.id}
                className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 hover:bg-gray-900/80 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-lg bg-emerald-900/30 flex items-center justify-center mr-3">
                      <Brain size={20} className="text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">{f.attack_type}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-gray-400">
                          {new Date(f.created_at).toLocaleDateString("ru-RU", {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                        <Clock size={14} className="text-gray-400 ml-2" />
                        <span className="text-gray-400">
                          {new Date(f.created_at).toLocaleTimeString("ru-RU", {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 ${confidenceStyle.bg} ${confidenceStyle.border}`}>
                      <BarChart2 size={14} className={confidenceStyle.text} />
                      <span className={`${confidenceStyle.text} font-medium`}>{f.confidence}%</span>
                    </div>
                    
                    {isExpired ? (
                      <div className="bg-red-900/30 border border-red-800/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-400" />
                        <span className="text-red-400 font-medium">Событие наступило</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-900/30 border border-emerald-800/30 px-3 py-1.5 rounded-full flex items-center gap-2">
                        <Shield size={14} className="text-emerald-400" />
                        <span className="text-emerald-400 font-medium">Активный прогноз</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Ожидаемое время атаки</div>
                      <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 flex items-center gap-2">
                        <CalendarClock size={18} className={isExpired ? "text-red-400" : "text-emerald-400"} />
                        <div>
                          {new Date(f.expected_time).toLocaleString("ru-RU", {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Целевой IP</div>
                      <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-3 font-mono">
                        {f.target_ip}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-gray-400 mb-1">Обоснование прогноза</div>
                    <div className={`${confidenceStyle.bg} ${confidenceStyle.border} rounded-lg p-3`}>
                      <p className="text-sm text-white/80 whitespace-pre-wrap line-clamp-4">
                        {f.reasoning}
                      </p>
                    </div>
                  </div>
                </div>
                
              </div>
            )
          })}
        </div>
      )}
      
      <div className="text-center text-xs text-gray-500 py-6 mt-4">
        Luminaris Security System • Powered by AI 
      </div>
    </main>
  )
}

export default withAuth(ForecastHistoryPage, ["ANALYST", "VIEWER", "ADMIN"])