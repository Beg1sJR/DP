"use client"

import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { CalendarIcon, FileText, Download, RefreshCw, ChevronDown, ChevronUp, FileSpreadsheet, FileArchive, Clock, Filter, Calendar, BarChart, FileJson } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import withAuth from "@/lib/withAuth"
import { format } from "date-fns"
import { subDays, startOfDay, endOfDay } from "date-fns"
// import { formatDistanceToNow, parseISO } from "date-fns"
import { ru } from "date-fns/locale"


type Report = {
  id: string
  title: string
  content: string
  created_at: string
  insights?: string
  mitre_ids?: string
  stats?: string
}

function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({})

  // Динамические дата и имя пользователя
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
  
  // Функция для переключения состояния развернутости отчета
  const toggleReportExpand = (reportId: string) => {
    setExpandedReports(prev => ({
      ...prev,
      [reportId]: !prev[reportId]
    }));
  };

  const downloadReport = (format: string, id: string) => {
    const token = localStorage.getItem("token")
    if (!token) {
      alert("Вы не авторизованы")
      return
    }



    fetch(`https://dp-production-f7cf.up.railway.app/export/${format}?id=${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Ошибка при загрузке файла")
        return res.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report_${id}.${format === "excel" ? "xlsx" : format}`
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      })
      .catch(() => alert("Не удалось скачать файл"))
  }

  const handleQuickGenerate = async (days: number) => {
    const now = new Date();
    const from = startOfDay(subDays(now, days )); // Начало периода: N-1 дней назад от сегодня
    const to = endOfDay(now);

    setLoading(true)
    try {
      const res = await API.post("/reports/generate", {
        from_date: from.toISOString(),
        to_date: to.toISOString(),
      })
      setReports((prev) => [res.data, ...prev])
    } catch {
      alert("Не удалось создать отчёт")
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (kind: "raw" | "analyzed", format: "csv" | "xlsx", id: string) => {
    try {
      const response = await API.get(`/export/${kind}/${format}`, {
        params: { id },
        responseType: "blob",
      });
  
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${kind}_${id}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert(e);
    }
  };

  useEffect(() => {
    setIsLoading(true)
    API.get("/reports")
      .then((res) => setReports(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])




  const handleGenerate = async () => {
    if (!date?.from || !date?.to) return

    const from = startOfDay(date.from);
    const to = endOfDay(date.to); 

    setLoading(true)
    try {
      const res = await API.post("/reports/generate", {
        from_date: from.toISOString(),
        to_date: to.toISOString(),
      })
      setReports((prev) => [res.data, ...prev])
    } catch {
      alert("Не удалось создать отчёт")
    } finally {
      setLoading(false)
    }
  }

  // const getTimeAgo = (dateString: string) => {
  //   return formatDistanceToNow(parseISO(dateString), { addSuffix: true, locale: ru });
  // };
  


  return (
    <main className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-900/20">
            <FileText size={20} />
          </div>
          <h1 className="text-2xl font-bold">AI-отчёты</h1>
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
      
      <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 mb-8">
        <div className="flex items-center mb-5">
          <Calendar size={20} className="text-emerald-400 mr-2" />
          <h2 className="text-lg font-medium">Создание отчёта</h2>
        </div>
        
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-full md:w-auto">
            <div className="text-sm text-gray-400 mb-2">Выберите период анализа</div>
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn("w-full md:w-[280px] justify-start text-left font-normal bg-gray-800 border-gray-700 hover:bg-gray-700")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-emerald-400" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "dd.MM.yyyy")} — {format(date.to, "dd.MM.yyyy")}
                      </>
                    ) : (
                      format(date.from, "dd.MM.yyyy")
                    )
                  ) : (
                    <span>Выбрать период</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0 bg-gray-800 border-gray-700">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={new Date()}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={2}
                  locale={ru}
                  classNames={{
                    day_selected: "bg-emerald-600 text-white hover:bg-emerald-500",
                    day_today: "bg-gray-700 text-white",
                    day_range_middle: "bg-emerald-900/50 text-white",
                    day_range_end: "bg-emerald-600 text-white",
                    day_range_start: "bg-emerald-600 text-white",
                    day_outside: "text-gray-500",
                    caption: "text-white",
                    nav_button: "text-gray-300 hover:text-white",
                    head_cell: "text-gray-300",
                    table: "text-gray-100",
                    cell: "text-gray-200",
                    day: "hover:bg-gray-700",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="space-y-4 w-full md:w-auto">
            <div>
              <div className="text-sm text-gray-400 mb-2">Быстрый выбор периода</div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleQuickGenerate(1)}
                  disabled={loading}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                >
                  <Clock size={14} className="mr-2" />
                  За вчера
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickGenerate(7)}
                  disabled={loading}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                >
                  <Filter size={14} className="mr-2" />
                  За 7 дней
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickGenerate(30)}
                  disabled={loading}
                  className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white"
                >
                  <BarChart size={14} className="mr-2" />
                  За 30 дней
                </Button>
              </div>
            </div>
          </div>
          
          <div className="ml-auto mt-4 md:mt-0">
            <Button 
              onClick={handleGenerate} 
              disabled={!date || loading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white h-10 px-5 gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Генерация...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Создать отчёт
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center">
            <FileText size={20} className="text-emerald-400 mr-2" />
            <h2 className="text-lg font-medium">История отчётов</h2>
          </div>
          <div className="text-sm text-gray-400">
            Всего отчётов: {reports.length}
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Загрузка отчётов...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-16 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <FileText size={28} className="text-gray-600" />
            </div>
            <p className="text-gray-300 text-lg mb-2">Нет доступных отчётов</p>
            <p className="text-gray-500 max-w-md text-center">
              Создайте свой первый отчёт, выбрав период анализа и нажав кнопку ${"Создать отчёт"}.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 hover:bg-gray-900/90 transition-colors"
              >
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{report.title}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-gray-400">{new Date(report.created_at.endsWith('Z') ? report.created_at : report.created_at + 'Z')
                        .toLocaleDateString('ru-RU')}</span>
                      <Clock size={14} className="text-gray-400 ml-2" />
                      <span className="text-gray-400 ml-2">
                        {new Date(report.created_at + 'Z').toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    
                    </div>
                  </div>
                </div>
                
                {/* Обновленный блок с содержимым отчета и кнопкой показать/скрыть */}
                <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-200 whitespace-pre-wrap">
                    {expandedReports[report.id] || report.content.length <= 500 
                      ? report.content
                      : report.content.substring(0, 500) + '...'}
                  </div>
                  {report.content.length > 500 && (
                    <button 
                      onClick={() => toggleReportExpand(report.id)}
                      className="mt-2 text-emerald-400 text-sm hover:text-emerald-300 flex items-center gap-2"
                    >
                      {expandedReports[report.id] ? (
                        <>Свернуть <ChevronUp size={14} /></>
                      ) : (
                        <>Показать полностью <ChevronDown size={14} /></>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-2">
                      <Download size={16} className="text-emerald-400 mr-2" />
                      <h4 className="font-medium text-gray-300">Текстовый отчёт</h4>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => downloadReport("txt", report.id)}
                        className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white gap-1"
                      >
                        <FileText size={14} />
                        Текстовый формат (.txt)
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <FileJson size={16} className="text-emerald-400 mr-2" />
                      <h4 className="font-medium text-gray-300">Экспорт данных</h4>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline"
                            className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white gap-1"
                          >
                            <FileSpreadsheet size={14} />
                            Raw Data
                            <ChevronDown size={14} className="ml-1 opacity-70" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="bg-gray-800 border-gray-700 text-white p-0 w-auto">
                          <div className="flex flex-col">
                            <Button 
                              variant="ghost" 
                              onClick={() => downloadFile("raw", "csv", report.id)}
                              className="justify-start text-left hover:bg-gray-700 rounded-none"
                            >
                              CSV формат
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => downloadFile("raw", "xlsx", report.id)}
                              className="justify-start text-left hover:bg-gray-700 rounded-none"
                            >
                              Excel формат
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="outline"
                            className="bg-gray-800 border-gray-700 hover:bg-gray-700 text-white gap-1"
                          >
                            <FileArchive size={14} />
                            Analyzed Data
                            <ChevronDown size={14} className="ml-1 opacity-70" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="bg-gray-800 border-gray-700 text-white p-0 w-auto">
                          <div className="flex flex-col">
                            <Button 
                              variant="ghost" 
                              onClick={() => downloadFile("analyzed", "csv", report.id)}
                              className="justify-start text-left hover:bg-gray-700 rounded-none"
                            >
                              CSV формат
                            </Button>
                            <Button 
                              variant="ghost" 
                              onClick={() => downloadFile("analyzed", "xlsx", report.id)}
                              className="justify-start text-left hover:bg-gray-700 rounded-none"
                            >
                              Excel формат
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="text-center text-xs text-gray-500 py-3">
        Luminaris Security System • Powered by AI 
      </div>
    </main>
  )
}

export default withAuth(ReportsPage, ["ANALYST", "VIEWER", "ADMIN"])