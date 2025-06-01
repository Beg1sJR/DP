// src/app/superadmin/company/[id]/page.tsx
"use client"

import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { BarChart, ShieldAlert, User, FileText } from "lucide-react"
import {
Chart as ChartJS,
CategoryScale,
LinearScale,
BarElement,
Tooltip,
Legend,
} from "chart.js"
import { Bar } from "react-chartjs-2"
// import { Card } from "@/components/ui/card"
import withAuth from "@/lib/withAuth"
// import Link from "next/link"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

type CompanyDashboard = {
companyName: string
userCount: number
logCount: number
analyzedCount: number
highRiskCount: number
forecast: {
attack_type: string
confidence: number
expected_time: string
target_ip: string
reasoning: string
} | null
top_3_attacks: [string, number][]
recent_logs: {
id: number
ip: string
log_text: string
attack_type: string
probability: number
recommendation: string
}[]
}

function SuperAdminCompanyDashboard() {
const { id } = useParams()
const [data, setData] = useState<CompanyDashboard | null>(null)

useEffect(() => {
const fetch = async () => {
try {
    const res = await API.get(`/superadmin/company-data/${id}`)
    setData(res.data)
} catch {
console.error("Не удалось загрузить аналитику компании")
}
}
fetch()
}, [id])

if (!data) return <div className="p-6 text-white">Загрузка...</div>

const cards = [
{
title: "Логов всего",
value: data.logCount,
icon: <FileText size={28} />,
color: "bg-blue-600",
},
{
title: "Проанализировано",
value: data.analyzedCount,
icon: <BarChart size={28} />,
color: "bg-indigo-600",
},
{
title: "Высокий риск",
value: data.highRiskCount,
icon: <ShieldAlert size={28} />,
color: "bg-red-600",
},
{
title: "Пользователей",
value: data.userCount,
icon: <User size={28} />,
color: "bg-green-600",
},
]

const top3Data = {
labels: data.top_3_attacks.map(([label]) => label),
datasets: [
{
label: "ТОП атак",
data: data.top_3_attacks.map(([, count]) => count),
backgroundColor: "#3b82f6",
},
],
}

const chartOptions = {
indexAxis: "y" as const,
scales: {
x: {
ticks: { color: "#ccc" },
grid: { color: "#333" },
},
y: {
ticks: { color: "#ccc" },
grid: { color: "#333" },
},
},
plugins: {
legend: { labels: { color: "#fff" } },
},
responsive: true,
maintainAspectRatio: false,
}

return (
<main className="p-6 bg-background text-foreground w-full min-w-0 overflow-x-hidden">
<h1 className="text-2xl font-bold mb-6">📊 Компания: {data.companyName}</h1>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
    {cards.map((card) => (
      <div
        key={card.title}
        className="bg-white/5 border border-white/10 rounded-xl p-6 hover:shadow-lg transition duration-200"
      >
        <div className={`w-12 h-12 ${card.color} rounded-md flex items-center justify-center mb-4`}>
          {card.icon}
        </div>
        <div className="text-3xl font-bold">{card.value}</div>
        <div className="text-sm text-gray-400 mt-1">{card.title}</div>
      </div>
    ))}
  </div>

  {data.forecast && (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-10 overflow-x-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">🤖 AI прогноз</h2>
      </div>
      <div className="text-sm text-gray-300 space-y-2">
        <div><span className="text-white font-medium">Тип:</span> {data.forecast.attack_type}</div>
        <div><span className="text-white font-medium">Уверенность:</span> {data.forecast.confidence}%</div>
        <div><span className="text-white font-medium">Время:</span> {new Date(data.forecast.expected_time).toLocaleString()}</div>
        <div><span className="text-white font-medium">Цель:</span> {data.forecast.target_ip}</div>
        <div className="text-white/80 italic mt-2">💡 {data.forecast.reasoning}</div>
      </div>
    </div>
  )}

  <div className="bg-white/5 border border-white/10 rounded-xl p-6 w-full overflow-x-hidden mb-10">
    <h2 className="text-lg font-semibold mb-4">📌 Топ 3 атак</h2>
    <div className="w-full h-64">
      <Bar data={top3Data} options={chartOptions} />
    </div>
  </div>

  <div className="bg-white/5 border border-white/10 rounded-xl p-6 w-full overflow-x-hidden">
    <h2 className="text-lg font-semibold mb-4">🕒 Последние события</h2>
    <ul className="space-y-4">
      {data.recent_logs.length === 0 ? (
        <p className="text-sm text-gray-400">Нет логов.</p>
      ) : (
        data.recent_logs.map((log) => (
          <li
            key={log.id}
            className="border border-white/10 rounded-lg p-4 bg-white/5 flex flex-col gap-2"
          >
            <div className="text-sm text-gray-300">
              <span className="font-semibold text-white">IP:</span> {log.ip}
            </div>
            <div className="text-sm text-gray-300">
              <span className="font-semibold text-white">Лог:</span> {log.log_text}
            </div>
            <div className="flex gap-3 flex-wrap text-sm">
              <span className="text-blue-400">
                Тип: {log.attack_type === "Нет атаки" ? "—" : log.attack_type}
              </span>
              <span className={`${
                log.probability >= 70
                  ? "text-red-400"
                  : log.probability > 0
                  ? "text-yellow-400"
                  : "text-gray-400"
              }`}>
                Уверенность: {log.probability}%
              </span>
            </div>
            {log.recommendation && (
              <p className="text-sm text-white/80 italic">💡 {log.recommendation}</p>
            )}
          </li>
        ))
      )}
    </ul>
  </div>
</main>
)
} 
export default withAuth(SuperAdminCompanyDashboard, ["SUPER_ADMIN"])
