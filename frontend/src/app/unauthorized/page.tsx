"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Shield, ArrowLeft, Clock } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useEffect, useState } from "react"

export default function UnauthorizedPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [username, setUsername] = useState<string>("Гость")
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date())
  
  // Форматирование даты и времени
  const formattedDate = currentDateTime.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
  
  const formattedTime = currentDateTime.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
  
  // Установка имени пользователя из контекста аутентификации
  useEffect(() => {
    if (user && user.username) {
      setUsername(user.username)
    } else {
      // Если пользователь не определен, используем "Гость"
      setUsername("Гость")
    }
  }, [user])
  
  // Обновление текущего времени каждую минуту
  useEffect(() => {
    // Устанавливаем начальное время
    setCurrentDateTime(new Date())
    
    // Обновляем время каждую минуту
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 60000)
    
    // Очистка интервала при размонтировании компонента
    return () => clearInterval(timer)
  }, [])

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-black to-gray-900 text-white flex flex-col overflow-hidden">
      <div className="w-full flex justify-end items-center p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-emerald-400">Система активна</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-full">
            <Clock size={12} className="text-gray-400 mr-1" />
            <span className="text-xs text-gray-400">{formattedDate}</span>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <span className="text-xs text-gray-400">{formattedTime}</span>
            <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
            <span className="text-xs text-emerald-400">{username}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center">
        <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <Shield size={40} className="text-red-400" />
          </div>
          
          <h1 className="text-3xl font-bold mb-3">Доступ запрещён</h1>
          
          <p className="text-gray-400 mb-6">
            У вас недостаточно прав для доступа к запрашиваемой странице. Пожалуйста, свяжитесь с администратором для получения доступа или вернитесь на главную страницу.
          </p>
          
          <div className="flex flex-col md:flex-row gap-3 justify-center">
            <Button 
              onClick={() => router.push("/")}
              className="bg-gray-800 hover:bg-gray-700 text-white gap-2"
            >
              <ArrowLeft size={16} />
              Вернуться на главную
            </Button>
          </div>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-500 py-3">
        Luminaris Security System • Powered by AI • v3.2.24
      </div>
    </main>
  )
}