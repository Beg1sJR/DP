"use client"

import withAuth from "@/lib/withAuth"
import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Shield,Search} from "lucide-react"

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useRouter } from "next/navigation"
// import { useAuth } from "@/context/AuthContext"

type AnalyzedLog = {
  id: number
  attack_type: string
  probability: number
  status: string
  ip: string
  timestamp: string
}

function ThreatsPage() {
  const [logs, setLogs] = useState<AnalyzedLog[]>([])
  const [typeFilter, setTypeFilter] = useState("Все")
  const [statusFilter, setStatusFilter] = useState("Все")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  // const { user } = useAuth()

  // Используем текущее время и имя пользователя из среды (или через useAuth, когда будет готово)
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [username, setUsername] = useState('')

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      console.log("No token for WS");
      return;
    }
  
    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = "localhost:8000";
    const wsUrl = `${wsProtocol}://${wsHost}/ws/threats?token=${token}`;
    const ws = new WebSocket(wsUrl);
  
    ws.onopen = () => {
      console.log("WS OPEN");
    };
    ws.onclose = (e) => {
      console.log("WS CLOSE", e);
    };
    ws.onerror = (e) => {
      console.log("WS ERROR", e);
    };
    ws.onmessage = (event) => {
      console.log("WS MESSAGE:", event.data);
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "threats_update") {
          if (msg.threats) setLogs(msg.threats);
        }
      } catch(err)  {
        console.log("WS PARSE ERROR", err)
      }
    };
  
    return () => {
      ws.close();
    };
  }, []);
  

  useEffect(() => {
    // Устанавливаем дату и время при монтировании компонента
    const now = new Date()
    setCurrentDate(now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }))
    setCurrentTime(now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    }))

    // Здесь можно использовать хук авторизации для получения имени пользователя
    // Например, если будет useAuth: setUsername(user?.username || '')
    setUsername(typeof window !== "undefined" && window.localStorage.getItem("username") || "Гость")
  }, [])

  useEffect(() => {
    setIsLoading(true)
    API.get("/logs/analyzed")
      .then((res) => setLogs(res.data))
      .finally(() => setIsLoading(false))
  }, [])

  const filtered = logs.filter((log) => {
    return (
      (typeFilter === "Все" || log.attack_type === typeFilter) &&
      (statusFilter === "Все" || log.status === statusFilter)
    )
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Активна":
        return "bg-red-600 hover:bg-red-500"
      case "Заблокирована":
        return "bg-emerald-600 hover:bg-emerald-500"
      default:
        return "bg-gray-600 hover:bg-gray-500"
    }
  }

  const getThreathLevel = (probability: number) => {
    if (probability >= 80) {
      return { color: "text-red-400", label: "Критический" };
    } else if (probability >= 60) {
      return { color: "text-orange-400", label: "Высокий" };
    } else if (probability >= 40) {
      return { color: "text-yellow-400", label: "Средний" };
    } else {
      return { color: "text-blue-400", label: "Низкий" };
    }
  }

  return (
    <main className="p-6 bg-gradient-to-b from-black to-gray-900 text-white space-y-6 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-900/20">
            <ShieldAlert size={20} />
          </div>
          <h1 className="text-2xl font-bold">Обнаруженные угрозы</h1>
        </div>
        
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
            <span className="text-xs text-emerald-400">{username}</span>
          </div>
        </div>
      </div>

      {/* Stats Summary
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-4 flex items-center">
          <div className="bg-blue-900/30 p-2 rounded-lg mr-3">
            <Shield size={20} className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{logs.length}</div>
            <div className="text-xs text-gray-400">Всего угроз</div>
          </div>
        </div>
        <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-4 flex items-center">
          <div className="bg-red-900/30 p-2 rounded-lg mr-3">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{logs.filter(log => log.status === "Активна").length}</div>
            <div className="text-xs text-gray-400">Активных угроз</div>
          </div>
        </div>
        <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-4 flex items-center">
          <div className="bg-emerald-900/30 p-2 rounded-lg mr-3">
            <Shield size={20} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{logs.filter(log => log.status === "Заблокирована").length}</div>
            <div className="text-xs text-gray-400">Блокировано</div>
          </div>
        </div>
        <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-4 flex items-center">
          <div className="bg-purple-900/30 p-2 rounded-lg mr-3">
            <Filter size={20} className="text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-bold">{filtered.length}</div>
            <div className="text-xs text-gray-400">После фильтрации</div>
          </div>
        </div>
      </div> */}

      {/* Filters */}
      <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-5">
        <div className="flex items-center mb-4">
          <Search size={18} className="text-emerald-400 mr-2" />
          <h2 className="text-lg font-medium">Фильтрация угроз</h2>
        </div>
        
        <div className="flex gap-4 flex-wrap">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Тип атаки" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="Все" className="hover:bg-gray-700">Все типы</SelectItem>
              {[...new Set(logs.map((l) => l.attack_type))].map((type) => (
                <SelectItem key={type} value={type} className="hover:bg-gray-700">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              {["Все", "Активна", "Заблокирована"].map((v) => (
                <SelectItem key={v} value={v} className="hover:bg-gray-700">
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="ml-auto text-xs text-gray-400 flex items-center">
            Найдено: {filtered.length} записей
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Загрузка данных...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-800/80 rounded-full flex items-center justify-center mb-4">
              <Shield size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-400">Нет угроз, соответствующих фильтрам</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-800/80 text-gray-300 border-b border-gray-700">
                  <th className="px-6 py-3 text-left">Тип</th>
                  <th className="px-6 py-3 text-left">Уверенность</th>
                  <th className="px-6 py-3 text-left">Источник</th>
                  <th className="px-6 py-3 text-left">Время</th>
                  <th className="px-6 py-3 text-left">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => {
                  const threatLevel = getThreathLevel(log.probability);
                  return (
                    <tr
                      key={log.id}
                      className="border-b border-gray-800/80 hover:bg-gray-800/40 transition-colors cursor-pointer"
                      onClick={() => router.push(`/threats/${log.id}`)}
                    >
                      <td className="px-6 py-4 flex items-center">
                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        {log.attack_type}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`mr-2 inline-block w-2 h-2 rounded-full ${
                            log.probability >= 80 ? "bg-red-500" :
                            log.probability >= 60 ? "bg-orange-500" :
                            log.probability >= 40 ? "bg-yellow-500" : "bg-blue-500"
                          }`}></div>
                          <span className={threatLevel.color}>{log.probability}%</span>
                          <span className="text-gray-500 text-xs ml-1">({threatLevel.label})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center mr-2 text-xs">IP</div>
                          {log.ip ?? "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`${getStatusColor(log.status)} transition-colors`}>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${log.status === "Активна" ? "bg-red-300 animate-pulse" : "bg-emerald-200"}`}></div>
                            {log.status}
                          </div>
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="text-center text-xs text-gray-500 py-3">
        Luminaris Security System • Powered by AI 
      </div>
    </main>
  )
}

export default withAuth(ThreatsPage, ["ANALYST", "VIEWER", "ADMIN"])