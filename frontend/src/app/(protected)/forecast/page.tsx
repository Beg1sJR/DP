"use client"

import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { AlertCircle, Loader2, Lightbulb, CalendarClock, ArrowUpRight, ActivitySquare, BarChart, Shield, Brain } from "lucide-react"
import withAuth from "@/lib/withAuth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

type Forecast = {
  id: number
  attack_type: string
  confidence: number
  expected_time: string
  target_ip: string
  reasoning: string
}

function ForecastPage() {
  const router = useRouter()
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState("")

  // Реальные дата/время и имя пользователя
  const [formattedDate, setFormattedDate] = useState('')
  const [formattedTime, setFormattedTime] = useState('')
  const [username, setUsername] = useState('')

  useEffect(() => {
    const now = new Date();
    setFormattedDate(now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }));
    setFormattedTime(now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }));
    setUsername(typeof window !== "undefined" && window.localStorage.getItem("username") || "Гость");
  }, []);

  const fetchLastForecast = async () => {
    try {
      setLoading(true)
      const res = await API.get("/forecast/last")
      setForecast(res.data)
      setError("")
    } catch {
      setForecast(null)
      setError("Нет доступных прогнозов.")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const res = await API.get("/forecast/next-attack")
      setForecast(res.data)
      setError("")
    } catch {
      setError("Не удалось получить прогноз.")
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => {
    fetchLastForecast()
  }, [])
  
  // Calculate time remaining if a forecast exists
  const getTimeRemaining = (expectedTime: string) => {
    const now = new Date();
    const expected = new Date(expectedTime);
    const diffMs = expected.getTime() - now.getTime();
    
    if (diffMs <= 0) return { text: "Событие наступило", color: "text-red-400" };
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHrs < 24) {
      return { 
        text: `${diffHrs}ч ${diffMins}мин до события`, 
        color: "text-red-400" 
      };
    } else if (diffHrs < 72) {
      return { 
        text: `${diffHrs}ч до события`, 
        color: "text-orange-400" 
      };
    } else {
      return { 
        text: `${Math.floor(diffHrs / 24)} дн. до события`, 
        color: "text-emerald-400" 
      };
    }
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-red-400";
    if (confidence >= 60) return "text-orange-400";
    if (confidence >= 40) return "text-yellow-400";
    return "text-blue-400";
  };

  return (
    <main className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-900/20">
            <Brain size={20} />
          </div>
          <h1 className="text-2xl font-bold">Прогноз угроз AI</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 h-full flex flex-col">
          <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <CalendarClock size={20} className="text-emerald-400 mr-2" />
                <h2 className="text-lg font-medium">Прогнозирование угроз</h2>
              </div>
              
              <div className="flex gap-4">
                <Button
                  onClick={() => router.push("/forecast/history")}
                  className="bg-gray-800 hover:bg-gray-700 text-white gap-2"
                >
                  <ActivitySquare size={16} />
                  История прогнозов
                </Button>
                
                <Button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Генерация...
                    </>
                  ) : (
                    <>
                      <ArrowUpRight size={16} />
                      Сгенерировать прогноз
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Загрузка последнего прогноза...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center bg-gray-800/50 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle size={32} className="text-gray-600" />
                </div>
                <p className="text-gray-300 mb-2">{error}</p>
                <p className="text-gray-500 max-w-md">Попробуйте сгенерировать новый прогноз с использованием искусственного интеллекта.</p>
              </div>
            ) : forecast ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{forecast.attack_type}</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <BarChart size={16} className={getConfidenceColor(forecast.confidence)} />
                        <span className={`${getConfidenceColor(forecast.confidence)}`}>
                          {forecast.confidence}% уверенности
                        </span>
                      </div>
                      <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
                      <div className="flex items-center gap-1.5">
                        <CalendarClock size={16} className="text-gray-400" />
                        <span className={getTimeRemaining(forecast.expected_time).color}>
                          {getTimeRemaining(forecast.expected_time).text}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800/60 px-4 py-2 rounded-lg">
                    <div className="text-xs text-gray-400">Цель</div>
                    <div className="text-lg font-mono">{forecast.target_ip}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-2">Ожидаемое время атаки</div>
                  <div className="bg-gray-800/60 border border-gray-700/50 rounded-lg p-4 flex items-center gap-3">
                    <CalendarClock size={20} className="text-emerald-400" />
                    <div className="text-lg">{new Date(forecast.expected_time).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
                    <div className="mx-2 text-gray-500">|</div>
                    <div className="text-lg">{new Date(forecast.expected_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center text-sm text-gray-400 mb-2">
                    <Lightbulb size={16} className="mr-2 text-emerald-400" />
                    Логика прогнозирования AI
                  </div>
                  <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-lg p-4">
                    <p className="text-emerald-100 whitespace-pre-wrap">{forecast.reasoning}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
        
        <div>
          <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 mb-6">
            <div className="flex items-center mb-4">
              <Shield size={20} className="text-emerald-400 mr-2" />
              <h2 className="text-lg font-medium">Рекомендации</h2>
            </div>
            
            {forecast ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-blue-900/20 rounded-lg border border-blue-800/30">
                  <div className="w-6 h-6 rounded-full bg-blue-900/60 flex items-center justify-center text-blue-300">1</div>
                  <p className="text-sm text-blue-200">Мониторинг входящего трафика с указанного IP</p>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-emerald-900/20 rounded-lg border border-emerald-800/30">
                  <div className="w-6 h-6 rounded-full bg-emerald-900/60 flex items-center justify-center text-emerald-300">2</div>
                  <p className="text-sm text-emerald-200">Проверка правил брандмауэра для блокировки подозрительной активности</p>
                </div>
                
                <div className="flex items-center gap-2 p-3 bg-purple-900/20 rounded-lg border border-purple-800/30">
                  <div className="w-6 h-6 rounded-full bg-purple-900/60 flex items-center justify-center text-purple-300">3</div>
                  <p className="text-sm text-purple-200">Обновление сигнатур системы обнаружения вторжений</p>
                </div>
                
                <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50">
                  <p className="text-xs text-gray-400 mb-2">Прогнозирование на базе</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded mx-1">AI</span>
                    </div>
                    
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-3">
                  <Shield size={20} className="text-gray-600" />
                </div>
                <p className="text-gray-400 text-sm">Рекомендации появятся после генерации прогноза</p>
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

const ProtectedForecastPanel = withAuth(ForecastPage, ["ADMIN", "ANALYST"]);

export default function Page() {
  return <ProtectedForecastPanel />;
}