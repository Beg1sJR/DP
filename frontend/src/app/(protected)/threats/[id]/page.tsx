// app/(protected)/threats/[id]/page.tsx
"use client"

import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import withAuth from "@/lib/withAuth"
import { AlertTriangle, ArrowLeft, Globe, Shield, Clock, Terminal, Info, CheckCircle, Server,  ExternalLink } from "lucide-react"
// import { useAuth } from "@/context/AuthContext"

type LogDetail = {
  id: number
  attack_type: string
  source: string
  mitre_id: string | null
  probability: number
  recommendation: string
  status: string
  resolved_by: string | null
  resolved_at: string | null
  log_text: string
  ip: string
  country: string
  city: string
  timestamp: string
}

function ThreatDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [log, setLog] = useState<LogDetail | null>(null)
  // const [explanation, setExplanation] = useState("")
  const [explanation] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  // const [isExplaining, setIsExplaining] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  // const { user } = useAuth()
  
  const currentDate = new Date("2025-05-26 19:03:18").toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  const currentTime = new Date("2025-05-26 19:03:18").toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });

  useEffect(() => {
    setIsLoading(true)
    API.get(`/logs/analyzed/${id}`)
      .then((res) => setLog(res.data))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleResolve = async () => {
    try {
      setIsResolving(true)
      await API.patch(`/threats/${id}/resolve`)
      const updated = await API.get(`/logs/analyzed/${id}`)
      setLog(updated.data)
    } finally {
      setIsResolving(false)
    }
  }

  // const handleExplain = async () => {
  //   try {
  //     setIsExplaining(true)
  //     const res = await API.get(`/explain/${id}`)
  //     setExplanation(res.data.explanation)
  //   } finally {
  //     setIsExplaining(false)
  //   }
  // }

  const getSeverityColor = (probability: number) => {
    if (probability >= 80) return {
      badge: "bg-red-900/30 text-red-300 border border-red-800/40",
      dot: "bg-red-500",
      text: "text-red-400",
      label: "Критический"
    }
    if (probability >= 60) return {
      badge: "bg-orange-900/30 text-orange-300 border border-orange-800/40",
      dot: "bg-orange-500",
      text: "text-orange-400",
      label: "Высокий"
    }
    if (probability >= 40) return {
      badge: "bg-yellow-900/30 text-yellow-300 border border-yellow-800/40",
      dot: "bg-yellow-500",
      text: "text-yellow-400",
      label: "Средний"
    }
    return {
      badge: "bg-blue-900/30 text-blue-300 border border-blue-800/40",
      dot: "bg-blue-500",
      text: "text-blue-400",
      label: "Низкий"
    }
  }

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case "Активна":
  //       return "bg-red-600"
  //     case "Заблокирована":
  //       return "bg-emerald-600"
  //     default:
  //       return "bg-gray-600"
  //   }
  // }

  if (isLoading) {
    return (
      <div className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400">Загрузка данных угрозы...</p>
      </div>
    )
  }

  if (!log) {
    return (
      <div className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-600">
          <AlertTriangle size={32} />
        </div>
        <h1 className="text-xl font-bold mb-2">Угроза не найдена</h1>
        <p className="text-gray-400 mb-6">Запись с ID {id} не существует или была удалена</p>
        <Button 
          onClick={() => router.back()}
          className="bg-gray-800 hover:bg-gray-700 text-white"
        >
          <ArrowLeft size={16} className="mr-2" /> Вернуться назад
        </Button>
      </div>
    )
  }

  const severityColors = getSeverityColor(log.probability)

  return (
    <div className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 text-gray-200"
        >
          <ArrowLeft size={16} className="mr-2" /> Назад к списку угроз
        </Button>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-emerald-400">Система активна</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full">
            <span className="text-xs text-gray-400">{currentDate}</span>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <span className="text-xs text-gray-400">{currentTime}</span>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <span className="text-xs text-emerald-400">Beg1sJR</span>
          </div>
        </div>
      </div>

      <div className="flex items-center mb-8">
        <div className="w-12 h-12 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-4 shadow-lg shadow-emerald-900/20">
          <Shield size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Детали угрозы</h1>
          <p className="text-gray-400 text-sm">ID: {log.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info card */}
        <div className="lg:col-span-2 bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full ${severityColors.dot} mr-3`}></div>
              <h2 className="text-xl font-semibold">{log.attack_type}</h2>
            </div>
              {log.status === "Активна" && log.probability > 70 && (
              <Badge className="bg-red-600 px-3 py-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-300 animate-pulse"></div>
                  Активна
                </div>
              </Badge>
            )}
            {log.status === "Заблокирована" && (
              <Badge className="bg-emerald-600 px-3 py-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-200"></div>
                  Заблокирована
                </div>
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {log.mitre_id && (
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-900/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                    <Shield size={16} className="text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">MITRE ID</div>
                    <div className="flex items-center">
                      <span className="text-blue-400 font-medium">{log.mitre_id}</span>
                      <a href={`https://attack.mitre.org/techniques/${log.mitre_id}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 ml-2">
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-purple-900/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                  <Server size={16} className="text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Источник</div>
                  <div className="text-white">{log.source || "Не определен"}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-orange-900/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                  <AlertTriangle size={16} className="text-orange-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Уверенность</div>
                  <div className="flex items-center gap-2">
                    <span className={severityColors.text}>{log.probability}%</span>
                    <Badge className={severityColors.badge}>{severityColors.label}</Badge>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-emerald-900/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                  <Globe size={16} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Локация</div>
                  <div className="text-white">{log.ip}</div>
                  <div className="text-sm text-gray-400">{log.country}, {log.city}</div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 bg-yellow-900/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                  <Clock size={16} className="text-yellow-400" />
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Время обнаружения</div>
                  <div className="text-white">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </div>
              
              {log.resolved_by && (
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-emerald-900/30 rounded-md flex items-center justify-center mr-3 flex-shrink-0">
                    <CheckCircle size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Устранена</div>
                    <div className="text-white">{log.resolved_by}</div>
                    <div className="text-sm text-gray-400">{new Date(log.resolved_at!).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <div className="flex items-center mb-3">
              <Terminal size={16} className="text-gray-400 mr-2" />
              <h3 className="text-lg font-medium">Сырой лог</h3>
            </div>
            <pre className="bg-black/40 p-4 rounded-lg text-sm whitespace-pre-wrap border border-gray-800/40 text-gray-300 overflow-x-auto">
              {log.log_text}
            </pre>
          </div>
        </div>
        
        {/* Recommendations card */}
        <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 space-y-6">
          <div className="flex items-center mb-2">
            <Info size={16} className="text-emerald-400 mr-2" />
            <h3 className="text-lg font-medium">Рекомендации</h3>
          </div>
          
          <div className="p-4 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
            <p className="text-emerald-100 whitespace-pre-wrap text-sm">{log.recommendation}</p>
          </div>
          
          <div className="flex flex-col gap-3 mt-6">
          {log.status === "Активна" && log.probability >= 70 && (
              <Button 
                onClick={handleResolve} 
                disabled={isResolving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-5 gap-2"
              >
                {isResolving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Устранение...</span>
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    <span>Устранить угрозу</span>
                  </>
                )}
              </Button>
            )}
            
            {/* <Button 
              onClick={handleExplain}
              disabled={isExplaining}
              className="bg-gray-800 hover:bg-gray-700 text-white py-5 gap-2"
            >
              {isExplaining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Получение объяснения...</span>
                </>
              ) : (
                <>
                  <Info size={16} />
                  <span>Получить анализ от AI</span>
                </>
              )}
            </Button> */}
            

          </div>
        </div>
      </div>
      
      {/* AI explanation */}
      {explanation && (
        <div className="mt-6 bg-gray-900/70 border border-gray-800/60 rounded-xl p-6">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-blue-900/30 rounded-md flex items-center justify-center mr-3">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-blue-400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4C12 2.89543 12.8954 2 14 2C15.1046 2 16 2.89543 16 4C16 5.10457 15.1046 6 14 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M14 10V6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M9.8 12H11L9.2 18H8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 14H12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M17 12H16L17.8 18H19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 18H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M3 6C3 4.34315 4.34315 3 6 3H14C18.4183 3 22 6.58172 22 11V18C22 19.6569 20.6569 21 19 21H6C4.34315 21 3 19.6569 3 18V6Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">Анализ от искусственного интеллекта</h3>
          </div>
          <div className="p-5 bg-blue-900/10 border border-blue-900/20 rounded-lg">
            <p className="text-gray-100 whitespace-pre-wrap">{explanation}</p>
          </div>
        </div>
      )}
      
      <div className="text-center text-xs text-gray-500 py-6 mt-4">
        Luminaris Security System • Powered by AI 
      </div>
    </div>
  )
}

export default withAuth(ThreatDetailPage, ["ANALYST", "VIEWER", "ADMIN"])