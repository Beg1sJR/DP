"use client"

import withAuth from "@/lib/withAuth"
import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { BarChart, ShieldAlert, User, FileText, LayoutDashboard  } from "lucide-react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"
import Link from "next/link"
import { useSidebar } from "@/context/SidebarContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type AttackType = { name: string; count: number }
type MitreIdType = { mitre_id: string; count: number }
type Stats = {
  total_logs: number
  total_analyzed: number
  attacks_detected: number
  high_risk_attacks: number
  attack_types: AttackType[]
  top_mitre_ids: MitreIdType[]
  top_3_attacks: AttackType[]
}

type RecentLog = {
  id: number
  ip: string
  log_text: string
  attack_type: string
  mitre_id: string | null
  probability: number
  recommendation: string
  country: string | null
  city: string | null
  severity_windows: string | null
  severity_syslog: string | null
  timestamp: string
  status: string
  resolved_by: string | null
  resolved_at: string | null
}

type Forecast = {
  id: number
  attack_type: string
  confidence: number
  expected_time: string
  target_ip: string
  reasoning: string
}

export default withAuth(function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [userCount, setUserCount] = useState<number>(0)
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([])
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const { collapsed } = useSidebar()

  // Динамические дата, время, имя пользователя
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [username, setUsername] = useState('')

  useEffect(() => {
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
    setUsername(typeof window !== "undefined" && window.localStorage.getItem("username") || "Гость")
  }, [])
  
  useEffect(() => {
    API.get("/dashboard/stats").then((res) => setStats(res.data))
    API.get("/companies/user-count").then((res) => setUserCount(res.data.count))
    API.get("/logs/recent").then((res) => setRecentLogs(res.data))
    API.get("/forecast/last").then((res) => setForecast(res.data))
  }, [])
  
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = "localhost:8000";
    const wsUrl = `${wsProtocol}://${wsHost}/ws/dashboard?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WS OPEN (dashboard)");
    };
    ws.onclose = (e) => {
      console.log("WS CLOSE (dashboard)", e);
    };
    ws.onerror = (e) => {
      console.log("WS ERROR (dashboard)", e);
    };
    ws.onmessage = (event) => {
      console.log("WS MESSAGE (dashboard):", event.data);
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "dashboard_update") {
          if (msg.stats) setStats(msg.stats);
          if (typeof msg.userCount === "number") setUserCount(msg.userCount);
          if (msg.recentLogs) setRecentLogs(msg.recentLogs);
          // Если появится прогноз по ws:
          if (msg.forecast) setForecast(msg.forecast);
        }
      } catch (err) {
        console.log("WS PARSE ERROR (dashboard)", err)
      }
    };
    return () => {
      ws.close();
    };
  }, [])

  const cards = [
    {
      title: "Логов всего",
      value: stats?.total_logs ?? 0,
      icon: <FileText size={24} />,
      color: "bg-emerald-600",
      gradient: "from-emerald-600 to-emerald-500",
    },
    {
      title: "Проанализировано",
      value: stats?.total_analyzed ?? 0,
      icon: <BarChart size={24} />,
      color: "bg-emerald-600",
      gradient: "from-emerald-700 to-emerald-600",
    },
    {
      title: "Высокий риск",
      value: stats?.high_risk_attacks ?? 0,
      icon: <ShieldAlert size={24} />,
      color: "bg-red-600",
      gradient: "from-red-700 to-red-600",
    },
    {
      title: "Пользователей",
      value: userCount,
      icon: <User size={24} />,
      color: "bg-emerald-600",
      gradient: "from-blue-700 to-blue-600",
    },
  ]

  // Безопасное использование Array.isArray для всех массивов
  const top3 = Array.isArray(stats?.top_3_attacks) ? stats!.top_3_attacks : []
  const top3Data = {
    labels: top3.map(a => a.name),
    datasets: [
      {
        label: "ТОП атак",
        data: top3.map(a => a.count),
        backgroundColor: "#10b981", // Изумрудный цвет
        borderColor: "#047857",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }

  const chartOptions = {
    indexAxis: "y" as const,
    scales: {
      x: {
        ticks: { color: "#9ca3af" },
        grid: { color: "rgba(75, 85, 99, 0.2)" },
      },
      y: {
        ticks: { color: "#d1d5db" },
        grid: { color: "rgba(75, 85, 99, 0.1)" },
      },
    },
    plugins: {
      legend: { 
        labels: { color: "#f3f4f6" },
        display: false
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "#4b5563",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  }

  return (
    <main className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-w-0 overflow-x-hidden min-h-screen">
      <div className="flex justify-between items-center mb-8">
      <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-900/20">
            <LayoutDashboard size={20} />
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

      {/* Карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 hover:shadow-lg transition-all duration-200 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" style={{background: 'radial-gradient(circle at top right, #10b981, transparent 60%)'}}></div>
            
            <div className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-lg flex items-center justify-center mb-4 shadow-lg`}>
              {card.icon}
            </div>
            <div className="text-3xl font-bold">{card.value.toLocaleString()}</div>
            <div className="text-sm text-gray-400 mt-1">{card.title}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 📈 Топ 3 атак */}
        <div className="lg:col-span-2 bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Топ угроз</h2>
            <Link href="/threats" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              Подробнее →
            </Link>
          </div>
          <div className="w-full h-64">
            {top3.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Нет данных для отображения топ-3 атак
              </div>
            ) : (
              <Bar key={collapsed ? "sidebar-collapsed" : "sidebar-expanded"} data={top3Data} options={chartOptions} />
            )}
          </div>
        </div>

        {/* 🤖 AI прогноз */}
        <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold flex items-center">
              <span className=" w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center mr-2">🤖</span>
              AI прогноз
            </h2>
            <Link href="/forecast" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
              Детали →
            </Link>
          </div>

          {forecast ? (
            <div className="text-sm space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div>
                <span className="text-white/80">Тип:</span>
                <span className="text-white ml-auto font-medium">{forecast.attack_type}</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-white/80">Уверенность:</span>
                <span className="text-white ml-auto font-medium">{forecast.confidence}%</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                <span className="text-white/80">Время:</span>
                <span className="text-white ml-auto font-medium">{new Date(forecast.expected_time).toLocaleString()}</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <span className="text-white/80">Цель:</span>
                <span className="text-white ml-auto font-medium">{forecast.target_ip}</span>
              </div>
              
              <div className="mt-4 p-3 bg-emerald-900/20 border border-emerald-800/30 rounded-md">
                <p className="text-emerald-200 text-sm">{forecast.reasoning}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                <span className="text-xl">✓</span>
              </div>
              <p className="text-sm text-gray-400">Прогнозируемых угроз нет</p>
            </div>
          )}
        </div>
      </div>

      {/* 🕒 Последние события */}
      <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 w-full overflow-hidden mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold flex items-center">
            <span className=" w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center mr-2">🕒</span>
            Последние события
          </h2>
          <Link href="/logs" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            Все события →
          </Link>
        </div>
        
        <ul className="space-y-4">
          {recentLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-3">
                <span className="text-xl">📋</span>
              </div>
              <p className="text-sm text-gray-400">Нет данных о недавних событиях</p>
            </div>
          ) : (
            recentLogs.map((log) => (
              <li
                key={log.id}
                className="border border-gray-800/60 rounded-lg p-4 bg-gray-800/30 flex flex-col gap-2 hover:bg-gray-800/40 transition-colors"
              >
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-gray-400">ID: {log.id}</span>
                  <span className="text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                
                <div className="text-sm text-gray-300">
                  <span className="font-medium text-white">IP:</span> {log.ip}
                  {log.country && <span className="text-xs text-gray-400 ml-2">({log.country})</span>}
                </div>
                
                <div className="text-sm text-gray-300 bg-gray-900/50 p-2 rounded border border-gray-800/40">
                  {log.log_text}
                </div>
                
                <div className="flex gap-3 flex-wrap text-xs mt-1">
                  <span className={`px-2 py-0.5 rounded-full ${
                    log.attack_type === "Нет атаки" 
                      ? "bg-gray-700 text-gray-300" 
                      : "bg-emerald-900/50 text-emerald-300 border border-emerald-800/40"
                  }`}>
                    {log.attack_type === "Нет атаки" ? "Не атака" : log.attack_type}
                  </span>
                  
                  {log.mitre_id && (
                    <span className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-800/40">
                      {log.mitre_id}
                    </span>
                  )}
                  
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      log.probability >= 70
                        ? "bg-red-900/40 text-red-300 border border-red-800/40"
                        : log.probability > 30
                        ? "bg-yellow-900/30 text-yellow-300 border border-yellow-800/30"
                        : "bg-gray-800 text-gray-300"
                    }`}
                  >
                    {log.probability}%
                  </span>
                  
                  <span className={`px-2 py-0.5 rounded-full ml-auto ${
                    log.status === "resolved" 
                      ? "bg-emerald-900/40 text-emerald-300" 
                      : "bg-gray-700 text-gray-300"
                  }`}>
                    {log.status === "resolved" ? "Решено" : "В процессе"}
                  </span>
                </div>
                
                {log.recommendation && (
                  <div className="text-sm text-emerald-200 italic mt-1 p-2 bg-emerald-900/20 rounded border border-emerald-800/30">
                    <span className="font-medium">Рекомендация:</span> {log.recommendation}
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
      
      <div className="text-center text-xs text-gray-500 py-3">
        Luminaris Security System • Powered by AI
      </div>
    </main>
  )
}, ["ANALYST", "VIEWER", "ADMIN"])