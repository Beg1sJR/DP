"use client"

import { useEffect, useState, useRef } from "react"
import { API } from "@/lib/axios"
import { Line, Pie, Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js"
import withAuth from "@/lib/withAuth"
import { BarChart2, Globe, Shield, Terminal, AlertTriangle } from "lucide-react"
// import Chart from "chart.js/auto";

type Metrics = {
  cpu: {
    percent: number;
    count_logical: number;
    count_physical: number;
    freq: { current: number; min: number; max: number; }
  };
  memory: {
    total: number;
    used: number;
    available: number;
    free: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    percent: number;
  };
  net: {
    bytes_sent: number;
    bytes_recv: number;
  };
  temperatures?: {
    [sensor: string]: Array<{ label: string; current: number; }>
  };
};

const MAX_POINTS = 60; // сколько точек в истории графика


type GeoItem = {
  country: string
  [key: string]: unknown
}

ChartJS.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
  BarElement
)

type ActivityData = number[]
type CountryData = Record<string, number>
type SeverityData = {
  windows: Record<string, number>
  syslog: Record<string, number>
}

function AnalyticsPage() {
  const [activity, setActivity] = useState<ActivityData>([])
  const [geo, setGeo] = useState<CountryData>({})
  const [severity, setSeverity] = useState<SeverityData>({ windows: {}, syslog: {} })
  const [attackTypes, setAttackTypes] = useState<Record<string, number>>({})
  const [riskLevels, setRiskLevels] = useState<Record<string, number>>({})
  const [mitreData, setMitreData] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Реальные дата, время, имя пользователя
  const [currentDate, setCurrentDate] = useState('')
  const [currentTime, setCurrentTime] = useState('')
  const [username, setUsername] = useState('')


  const [cpu, setCpu] = useState<number[]>([]);
  const [mem, setMem] = useState<number[]>([]);
  const [disk, setDisk] = useState<number[]>([]);
  const [netSent, setNetSent] = useState<number[]>([]);
  const [netRecv, setNetRecv] = useState<number[]>([]);
  const [temps, setTemps] = useState<{ [label: string]: number[] }>({});
  const lastNet = useRef<{ sent: number, recv: number } | null>(null);

  const labels = Array(cpu.length).fill(0).map((_, i) => `${i * 2}s`);


  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('http://localhost:8000/system/metrics', {
        headers: {
          "Authorization": "Bearer " + localStorage.getItem("token")
        }
      });
      
      if (!res.ok) return;
      const json: Metrics = await res.json();

      setCpu(prev => [...prev.slice(-MAX_POINTS + 1), json.cpu.percent]);
      setMem(prev => [...prev.slice(-MAX_POINTS + 1), json.memory.percent]);
      setDisk(prev => [...prev.slice(-MAX_POINTS + 1), json.disk.percent]);

      // Для сети считаем скорость (Bps)
      if (lastNet.current) {
        setNetSent(prev => [...prev.slice(-MAX_POINTS + 1), (json.net.bytes_sent - lastNet.current!.sent) / 2]);
        setNetRecv(prev => [...prev.slice(-MAX_POINTS + 1), (json.net.bytes_recv - lastNet.current!.recv) / 2]);
      }
      lastNet.current = { sent: json.net.bytes_sent, recv: json.net.bytes_recv };

      // Температуры
      if (json.temperatures) {
        const newTemps: { [label: string]: number[] } = { ...temps };
        Object.entries(json.temperatures).forEach(([sensor, arr]) => {
          arr.forEach(({ label, current }) => {
            const key = label || sensor;
            if (!newTemps[key]) newTemps[key] = [];
            newTemps[key] = [...newTemps[key].slice(-MAX_POINTS + 1), current];
          });
        });
        setTemps(newTemps);
      }
    }, 2000);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

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
    setIsLoading(true)
    Promise.all([
      API.get("/analytics/hourly-activity"),
      API.get("/analytics/geolocation"),
      API.get("/analytics/severity"),
      API.get("/analytics/summary")
    ]).then(([activityRes, geoRes, severityRes, summaryRes]) => {
      setActivity(activityRes.data.hourly_activity)
      
      const counts = geoRes.data.geodata.reduce((acc: CountryData, item: GeoItem) => {
        acc[item.country] = (acc[item.country] || 0) + 1
        return acc
      }, {})
      console.log("GEO COUNTS:", counts);

      setGeo(counts)
      
      setSeverity(severityRes.data)
      setAttackTypes(summaryRes.data.attack_types)
      setRiskLevels(summaryRes.data.risk_levels)
      setMitreData(summaryRes.data.top_mitre)
    }).finally(() => {
      setIsLoading(false)
    })
  }, [])

  useEffect(() => {
    console.log("ANALYTICS WS useEffect RUN");

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
    const wsHost = "localhost:8000";
    const wsUrl = `${wsProtocol}://${wsHost}/ws/analytics?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WS OPEN (analytics)");
    };
    ws.onclose = (e) => {
      console.log("WS CLOSE (analytics)", e);
    };
    ws.onerror = (e) => {
      console.log("WS ERROR (analytics)", e);
    };
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "analytics_update") {
          // activity
          if (Array.isArray(msg.activity)) setActivity(msg.activity);

          // geo: массив или объект
          if (msg.geo) {
            // если массив — привести к объекту {country: count}
            if (Array.isArray(msg.geo)) {
              const counts = msg.geo.reduce((acc: CountryData, item: GeoItem) => {
                acc[item.country] = (acc[item.country] || 0) + 1
                return acc
              }, {})
              console.log("WS GEO DATA:", msg.geo);
              setGeo(counts);
            } else {
              setGeo(msg.geo);
            }
          }

          // severity
          if (msg.severity) setSeverity(msg.severity);

          // attack_types
          if (msg.attack_types) setAttackTypes(msg.attack_types);

          // risk_levels
          if (msg.risk_levels) setRiskLevels(msg.risk_levels);

          // mitre_data
          if (msg.mitre_data) setMitreData(msg.mitre_data);
        }
      } catch (err) {
        console.log("WS PARSE ERROR (analytics)", err)
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Updated chart options for Luminaris theme
  const barOptions = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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
    scales: {
      x: { 
        ticks: { color: "#9ca3af", font: { size: 10 } }, 
        grid: { color: "rgba(75, 85, 99, 0.2)" } 
      },
      y: { 
        ticks: { color: "#d1d5db", font: { size: 10 } }, 
        grid: { color: "rgba(75, 85, 99, 0.1)" } 
      },
    },
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: "#d1d5db",
          padding: 20,
          font: { size: 11 },
          boxWidth: 14,
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#e5e7eb",
        borderColor: "#4b5563",
        borderWidth: 1,
        padding: 10,
      }
    },
  }

  const chartBox = "bg-gray-900/70 border border-gray-800/60 rounded-xl p-5 flex flex-col min-h-[320px]"

  // Luminaris theme colors
  const emeraldPrimary = "#10b981"
  const emeraldLight = "#34d399"
  // const emeraldSecondary = "#047857"
  
  const chartColors = {
    emerald: emeraldPrimary,
    blue: "#3b82f6",
    red: "#ef4444",
    yellow: "#f59e0b",
    purple: "#8b5cf6",
    pink: "#ec4899",
    indigo: "#6366f1",
    cyan: "#06b6d4",
    orange: "#f97316",
    lime: "#84cc16"
  }

  return (
    <div className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-900/20">
            <BarChart2 size={20} />
          </div>
          <h1 className="text-2xl font-bold">Аналитика безопасности</h1>
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

      {/* Main analytics dashboard */}
      
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[400px]">
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Загрузка аналитических данных...</p>
        </div>
      ) : (
        <>
          {/* Activity chart - full width */}
          <div className={`${chartBox} mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-emerald-900/30 rounded-md flex items-center justify-center mr-3">
                  <BarChart2 size={16} className="text-emerald-400" />
                </div>
                <h2 className="font-semibold">Активность по часам</h2>
              </div>
              <span className="text-xs text-gray-400">Количество инцидентов за последние 24 часа</span>
            </div>
            {activity.length ? (
              <div className="flex-grow">
                <Line
                  data={{
                    labels: [...Array(24).keys()].map((h) => `${h}:00`),
                    datasets: [
                      {
                        label: "Активность",
                        data: activity,
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        borderColor: emeraldPrimary,
                        pointBackgroundColor: emeraldLight,
                        pointBorderColor: emeraldPrimary,
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false,
                      },
                      tooltip: {
                        backgroundColor: "rgba(17, 24, 39, 0.8)",
                        titleColor: "#ffffff",
                        bodyColor: "#e5e7eb",
                        borderColor: "#4b5563",
                        borderWidth: 1,
                        padding: 10,
                      }
                    },
                    scales: {
                      x: { 
                        ticks: { color: "#9ca3af", font: { size: 10 } }, 
                        grid: { color: "rgba(75, 85, 99, 0.2)" } 
                      },
                      y: { 
                        ticks: { color: "#d1d5db", font: { size: 10 } }, 
                        grid: { color: "rgba(75, 85, 99, 0.1)" } 
                      },
                    },
                  }}
                  height={200}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center flex-grow">
                <p className="text-gray-500">Нет данных за выбранный период</p>
              </div>
            )}
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Geo distribution */}
            <div className={chartBox}>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-900/30 rounded-md flex items-center justify-center mr-3">
                  <Globe size={16} className="text-blue-400" />
                </div>
                <h2 className="font-semibold">Географическое распределение</h2>
              </div>
              <div className="flex-grow">
                {Object.keys(geo).length ? (
                  <Pie
                    data={{
                      labels: Object.keys(geo),
                      datasets: [
                        {
                          data: Object.values(geo),
                          backgroundColor: [
                            chartColors.emerald, 
                            chartColors.blue, 
                            chartColors.purple, 
                            chartColors.orange, 
                            chartColors.cyan, 
                            chartColors.lime
                          ],
                          borderColor: "#111827",
                          borderWidth: 1,
                        },
                      ],
                    }}
                    options={pieOptions}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Нет данных для отображения</p>
                  </div>
                )}
              </div>
            </div>

            {/* Windows Severity */}
            <div className={chartBox}>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-indigo-900/30 rounded-md flex items-center justify-center mr-3">
                  <Terminal size={16} className="text-indigo-400" />
                </div>
                <h2 className="font-semibold">Уровни Windows</h2>
              </div>
              <div className="flex-grow">
                {Object.keys(severity.windows).length ? (
                  <Bar
                    data={{
                      labels: Object.keys(severity.windows),
                      datasets: [{
                        data: Object.values(severity.windows),
                        backgroundColor: chartColors.blue,
                        borderRadius: 4,
                        barThickness: 16,
                      }],
                    }}
                    options={barOptions}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Нет данных для отображения</p>
                  </div>
                )}
              </div>
            </div>

            {/* Syslog Severity */}
            <div className={chartBox}>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-emerald-900/30 rounded-md flex items-center justify-center mr-3">
                  <Terminal size={16} className="text-emerald-400" />
                </div>
                <h2 className="font-semibold">Уровни Syslog</h2>
              </div>
              <div className="flex-grow">
                {Object.keys(severity.syslog).length ? (
                  <Bar
                    data={{
                      labels: Object.keys(severity.syslog),
                      datasets: [{
                        data: Object.values(severity.syslog),
                        backgroundColor: chartColors.emerald,
                        borderRadius: 4,
                        barThickness: 16,
                      }],
                    }}
                    options={barOptions}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Нет данных для отображения</p>
                  </div>
                )}
              </div>
            </div>

            {/* Attack Types */}
            <div className={chartBox}>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-red-900/30 rounded-md flex items-center justify-center mr-3">
                  <AlertTriangle size={16} className="text-red-400" />
                </div>
                <h2 className="font-semibold">Типы атак</h2>
              </div>
              <div className="flex-grow">
                {Object.keys(attackTypes).length ? (
                  <Pie
                    data={{
                      labels: Object.keys(attackTypes),
                      datasets: [{
                        data: Object.values(attackTypes),
                        backgroundColor: [
                          chartColors.red, 
                          chartColors.emerald, 
                          chartColors.blue, 
                          chartColors.orange, 
                          chartColors.purple
                        ],
                        borderColor: "#111827",
                        borderWidth: 1,
                      }],
                    }}
                    options={pieOptions}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Нет данных для отображения</p>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Levels */}
            <div className={chartBox}>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-orange-900/30 rounded-md flex items-center justify-center mr-3">
                  <AlertTriangle size={16} className="text-orange-400" />
                </div>
                <h2 className="font-semibold">Уровни риска</h2>
              </div>
              <div className="flex-grow">
                {Object.keys(riskLevels).length ? (
                  <Bar
                    data={{
                      labels: Object.keys(riskLevels),
                      datasets: [{
                        data: Object.values(riskLevels),
                        backgroundColor: [chartColors.emerald, chartColors.orange, chartColors.red],
                        borderRadius: 4,
                        barThickness: 20,
                      }],
                    }}
                    options={barOptions}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Нет данных для отображения</p>
                  </div>
                )}
              </div>
            </div>

            {/* MITRE Data */}
            <div className={chartBox}>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-900/30 rounded-md flex items-center justify-center mr-3">
                  <Shield size={16} className="text-purple-400" />
                </div>
                <h2 className="font-semibold">MITRE ATT&CK</h2>
              </div>
              <div className="flex-grow">
                {Object.keys(mitreData).length ? (
                  <Bar
                    data={{
                      labels: Object.keys(mitreData).map((m) => m.length > 24 ? m.slice(0, 22) + "…" : m),
                      datasets: [{
                        data: Object.values(mitreData),
                        backgroundColor: chartColors.purple,
                        borderRadius: 4,
                        barThickness: 18,
                      }],
                    }}
                    options={barOptions}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Нет данных для отображения</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      
    {/* System monitoring section */}
<div className="mt-8">
  <div className="flex items-center mb-6">
    <div className="w-10 h-10 bg-gradient-to-r from-cyan-700 to-cyan-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-cyan-900/20">
      <Terminal size={20} />
    </div>
    <h2 className="text-xl font-bold">Мониторинг системы</h2>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
    {/* CPU */}
    <div className={chartBox}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-emerald-900/30 rounded-md flex items-center justify-center mr-3">
            <BarChart2 size={16} className="text-emerald-400" />
          </div>
          <h3 className="font-semibold">CPU</h3>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-emerald-400">
            {cpu.length ? cpu[cpu.length - 1].toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-gray-400">
            {typeof window !== 'undefined' && cpu.length > 0 && (() => {
              const lastValue = cpu[cpu.length - 1];
              return lastValue > 80 ? 'Высокая' : lastValue > 50 ? 'Средняя' : 'Низкая';
            })()}
          </div>
        </div>
      </div>
      <div className="mb-3">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>Логич. ядра: <span className="text-white font-mono">12</span></div>
          <div>Физич. ядра: <span className="text-white font-mono">6</span></div>
          <div>Частота: <span className="text-white font-mono">2.7 ГГц</span></div>
          <div>Макс.: <span className="text-white font-mono">2.7 ГГц</span></div>
        </div>
      </div>
      <div className="flex-grow">
        <Line
          data={{
            labels,
            datasets: [{
              label: "CPU",
              data: cpu,
              borderColor: chartColors.emerald,
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { ...pieOptions.plugins.tooltip } },
            scales: {
              x: { display: false },
              y: {
                min: 0,
                max: 100,
                ticks: { color: "#9ca3af", font: { size: 9 } },
                grid: { color: "rgba(75, 85, 99, 0.2)" }
              }
            }
          }}
          height={120}
        />
      </div>
    </div>

    {/* Memory */}
    <div className={chartBox}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-blue-900/30 rounded-md flex items-center justify-center mr-3">
            <BarChart2 size={16} className="text-blue-400" />
          </div>
          <h3 className="font-semibold">Память</h3>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-blue-400">
            {mem.length ? mem[mem.length - 1].toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-gray-400">
            {typeof window !== 'undefined' && mem.length > 0 && (() => {
              const lastValue = mem[mem.length - 1];
              return lastValue > 90 ? 'Критич.' : lastValue > 70 ? 'Высокая' : 'Норма';
            })()}
          </div>
        </div>
      </div>
      <div className="mb-3">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>Всего: <span className="text-white font-mono">15.7 ГБ</span></div>
          <div>Используется: <span className="text-white font-mono">15.0 ГБ</span></div>
          <div>Доступно: <span className="text-white font-mono">747 МБ</span></div>
          <div>Свободно: <span className="text-white font-mono">747 МБ</span></div>
        </div>
      </div>
      <div className="flex-grow">
        <Line
          data={{
            labels,
            datasets: [{
              label: "Memory",
              data: mem,
              borderColor: chartColors.blue,
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { ...pieOptions.plugins.tooltip } },
            scales: {
              x: { display: false },
              y: {
                min: 0,
                max: 100,
                ticks: { color: "#9ca3af", font: { size: 9 } },
                grid: { color: "rgba(75, 85, 99, 0.2)" }
              }
            }
          }}
          height={120}
        />
      </div>
    </div>

    {/* Disk */}
    <div className={chartBox}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-red-900/30 rounded-md flex items-center justify-center mr-3">
            <BarChart2 size={16} className="text-red-400" />
          </div>
          <h3 className="font-semibold">Диск</h3>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-red-400">
            {disk.length ? disk[disk.length - 1].toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-gray-400">
            {typeof window !== 'undefined' && disk.length > 0 && (() => {
              const lastValue = disk[disk.length - 1];
              return lastValue > 90 ? 'Заполнен' : lastValue > 70 ? 'Высокий' : 'Норма';
            })()}
          </div>
        </div>
      </div>
      <div className="mb-3">
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>Всего: <span className="text-white font-mono">474 ГБ</span></div>
          <div>Используется: <span className="text-white font-mono">378 ГБ</span></div>
          <div>Свободно: <span className="text-white font-mono">96 ГБ</span></div>
          <div>Занято: <span className="text-white font-mono">79.7%</span></div>
        </div>
      </div>
      <div className="flex-grow">
        <Line
          data={{
            labels,
            datasets: [{
              label: "Disk",
              data: disk,
              borderColor: chartColors.red,
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 4,
            }]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { ...pieOptions.plugins.tooltip } },
            scales: {
              x: { display: false },
              y: {
                min: 0,
                max: 100,
                ticks: { color: "#9ca3af", font: { size: 9 } },
                grid: { color: "rgba(75, 85, 99, 0.2)" }
              }
            }
          }}
          height={120}
        />
      </div>
    </div>

    {/* Network */}
    <div className={`${chartBox} lg:col-span-2 xl:col-span-3`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-purple-900/30 rounded-md flex items-center justify-center mr-3">
            <Globe size={16} className="text-purple-400" />
          </div>
          <h3 className="font-semibold">Сетевая активность</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">Отправлено</div>
            <div className="text-sm font-mono text-yellow-400">
              {netSent.length ? (netSent[netSent.length - 1] / 1024).toFixed(1) : '0.0'} КБ/с
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Получено</div>
            <div className="text-sm font-mono text-indigo-400">
              {netRecv.length ? (netRecv[netRecv.length - 1] / 1024).toFixed(1) : '0.0'} КБ/с
            </div>
          </div>
        </div>
      </div>
      <div className="mb-3">
        <div className="grid grid-cols-4 gap-4 text-xs text-gray-400">
          <div>Всего отправлено: <span className="text-white font-mono">867 МБ</span></div>
          <div>Всего получено: <span className="text-white font-mono">17.0 ГБ</span></div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            Исходящий трафик
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
            Входящий трафик
          </div>
        </div>
      </div>
      <div className="flex-grow">
        <Line
          data={{
            labels,
            datasets: [
              {
                label: "Отправлено",
                data: netSent.map(v => v / 1024), // Convert to KB/s
                borderColor: chartColors.yellow,
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
              },
              {
                label: "Получено",
                data: netRecv.map(v => v / 1024), // Convert to KB/s
                borderColor: chartColors.indigo,
                backgroundColor: "rgba(99, 102, 241, 0.1)",
                fill: false,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
              }
            ]
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: "top" as const,
                labels: {
                  color: "#d1d5db",
                  padding: 20,
                  font: { size: 11 },
                  boxWidth: 14,
                },
              },
              tooltip: { ...pieOptions.plugins.tooltip }
            },
            scales: {
              x: {
                ticks: { color: "#9ca3af", font: { size: 10 } },
                grid: { color: "rgba(75, 85, 99, 0.2)" }
              },
              y: {
                ticks: {
                  color: "#d1d5db",
                  font: { size: 10 },
                  callback: function(value) {
                    return value + ' КБ/с';
                  }
                },
                grid: { color: "rgba(75, 85, 99, 0.1)" }
              }
            }
          }}
          height={180}
        />
      </div>
    </div>

    {/* Temperature sensors if available */}
    {Object.keys(temps).map(label => (
      <div key={label} className={chartBox}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-900/30 rounded-md flex items-center justify-center mr-3">
              <AlertTriangle size={16} className="text-orange-400" />
            </div>
            <h3 className="font-semibold">Температура {label}</h3>
          </div>
          <div className="text-right">
            <div className="text-sm font-mono text-orange-400">
              {temps[label]?.length ? temps[label][temps[label].length - 1].toFixed(1) : '0.0'}°C
            </div>
            <div className="text-xs text-gray-400">
              {typeof window !== 'undefined' && temps[label]?.length > 0 && (() => {
                const lastValue = temps[label][temps[label].length - 1];
                return lastValue > 80 ? 'Горячо' : lastValue > 60 ? 'Тепло' : 'Норма';
              })()}
            </div>
          </div>
        </div>
        <div className="flex-grow">
          <Line
            data={{
              labels,
              datasets: [{
                label: `Температура ${label}`,
                data: temps[label] || [],
                borderColor: chartColors.orange,
                backgroundColor: "rgba(249, 115, 22, 0.1)",
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
              }]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { ...pieOptions.plugins.tooltip } },
              scales: {
                x: { display: false },
                y: {
                  ticks: {
                    color: "#9ca3af",
                    font: { size: 9 },
                    callback: function(value) {
                      return value + '°C';
                    }
                  },
                  grid: { color: "rgba(75, 85, 99, 0.2)" }
                }
              }
            }}
            height={120}
          />
        </div>
      </div>
    ))}
  </div>
</div>

      <div className="text-center text-xs text-gray-500 py-3">
        Luminaris Security System • Powered by AI 
      </div>
    </div>
  )
}

export default withAuth(AnalyticsPage, ["ANALYST", "VIEWER", "ADMIN"])