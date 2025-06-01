"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import {jwtDecode} from "jwt-decode"
import Image from "next/image";

type DecodedToken = {
  exp: number
  [key: string]: unknown
}

export default function HomePage() {
  const router = useRouter()
  const [isTokenValid, setIsTokenValid] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const decoded: DecodedToken = jwtDecode(token)
      if (decoded.exp * 1000 > Date.now()) {
        setIsTokenValid(true)
      } else {
        localStorage.removeItem("token")
      }
    } catch {
      localStorage.removeItem("token")
    }
  }, [])

  const handleNavigate = () => {
    if (isTokenValid) {
      router.push("/dashboard")
    } else {
      router.push("/login")
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white relative overflow-hidden">
      {/* Header Navigation */}
      <header className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center z-20 ">
          {/* <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mr-3"> */}
            <Image
              src="/logo.png"
              alt="Логотип"
              width={25}
              height={25}
              className="object-contain"
            />
          {/* </div> */}
          <h1 className="text-xl font-semibold text-white">Luminaris</h1>
        </div>
      </header>
      
      {/* Main Content - исправлена структура контейнеров */}
      <div className="container mx-auto px-6 py-16 flex relative">
        {/* Левая половина с текстом */}
        <div className="w-full md:w-1/2 pt-16 relative z-10">
          <h2 className="text-5xl font-bold mb-6">Luminaris</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-xl leading-relaxed">
            Передовая AI-система безопасности для защиты вашего цифрового мира.
            Интеллектуальный мониторинг и контроль доступа нового поколения.
          </p>
          
          <div className="mb-10">
            <Button 
              onClick={handleNavigate}
              className="h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-lg border border-emerald-500 transition-all duration-200"
            >
              {isTokenValid ? "Перейти к панели управления" : "Войти в систему"}
            </Button>
          </div>
        </div>
        
        {/* Правая половина с логотипом - исправлено позиционирование */}
        <div className="absolute right-12 top-1/2 transform -translate-y-1/3 z-10 hidden md:block">
          <div className="relative">
            {/* Градиентный фон */}
            <div className="w-[450px] h-[450px] rounded-full bg-gradient-to-r from-emerald-500 to-blue-500 opacity-60 absolute blur-2xl -z-10"></div>
            
            {/* Логотип */}
            <Image
              src="/logo.png"
              alt="Логотип Luminaris"
              width={400}
              height={400}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>


      {/* Background gradient effect - similar to water reflection */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-emerald-900/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-emerald-900/30 to-transparent 
            transform translate-y-12 blur-md"></div>
      </div>

      {/* Product Cards Section - Dark Theme with Placeholders */}
      <div className="relative z-10 py-16 mt-24 border-t border-gray-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-md overflow-hidden">
              <div className="h-48 bg-gray-800 flex items-center justify-center">
                <svg className="w-12 h-12 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l3 3m0 0l3-3m-3 3v-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-white">
                  Разработано для жизни — сегодня и в будущем
                </h3>
                <p className="text-gray-300 mb-4">
                  Следующее поколение защиты. Ваши цели. Ваши данные и ваша семья. С Luminaris вы станете еще ближе к тому, что успели полюбить.
                </p>
                <button className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded">
                  Проверьте, готов ли ваш ПК
                </button>
              </div>
            </div>
            
            {/* Card 2 */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-md overflow-hidden">
              <div className="h-48 bg-gray-800 flex items-center justify-center">
                <svg className="w-12 h-12 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-white">
                  Luminaris CloudVault
                </h3>
                <p className="text-gray-300 mb-4">
                  Сохраняйте свои файлы и фотографии в CloudVault — они будут доступны с любого устройства и где угодно.
                </p>
                <button className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded">
                  Подробнее
                </button>
              </div>
            </div>
            
            {/* Card 3 */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-md overflow-hidden">
              <div className="h-48 bg-gray-800 flex items-center justify-center">
                <svg className="w-12 h-12 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-white">
                  SecureNotes
                </h3>
                <p className="text-gray-300 mb-4">
                  Приведите свои заметки и дела в порядок с шифрованием на уровне военных стандартов.
                </p>
                <button className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded">
                  Узнать больше
                </button>
              </div>
            </div>
            
            {/* Card 4 */}
            <div className="bg-gray-900/70 border border-gray-800 rounded-md overflow-hidden">
              <div className="h-48 bg-gray-800 flex items-center justify-center">
                <svg className="w-12 h-12 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-3 text-white">
                  Интеллектуальный поиск
                </h3>
                <p className="text-gray-300 mb-4">
                  Поиск видео, картинок, карт, новостей и многого другого с защитой от отслеживания.
                </p>
                <button className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded">
                  Найти сейчас
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile App Section - UPDATED to dark theme */}
      <div className=" ">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            {/* Left text content */}
            <div className="w-full md:w-1/2 pr-0 md:pr-8 mb-10 md:mb-0">
              <h2 className="text-4xl font-bold mb-4 text-white">
                Luminaris для iOS и Android
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Будьте на связи с вашей системой безопасности. Организовывайте мониторинг. Успевайте больше.
              </p>
            </div>
            
            {/* Right mobile screens - UPDATED to position side by side */}
            <div className="w-full md:w-1/2 flex justify-center">
              <div className="flex justify-center items-center space-x-4">
                {/* Android phone mockup */}
                <div className="w-56 h-[480px] bg-black rounded-[24px] overflow-hidden shadow-xl border-4 border-gray-800">
                  <div className="w-full h-full bg-gray-800 p-2">
                    <div className="w-full h-full bg-gray-900 rounded-[18px] flex flex-col">
                      <div className="h-12 flex items-center justify-between px-4">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center mr-2">
                            <svg className="w-4 h-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                            </svg>
                          </div>
                          <span className="text-white text-sm">Контакты</span>
                        </div>
                        <svg className="w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                        </svg>
                      </div>
                      <div className="flex-1 bg-gray-100 p-3 flex flex-col space-y-2">
                        <div className="flex justify-between">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">A</div>
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">B</div>
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">C</div>
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white">D</div>
                        </div>
                        <div className="mt-4 bg-white rounded-lg p-3 shadow">
                          <div className="text-xs font-medium text-gray-900">Уведомление</div>
                          <p className="text-xs text-gray-600">Новое сообщение от системы безопасности</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow">
                          <div className="text-xs font-medium text-gray-900">Информация</div>
                          <p className="text-xs text-gray-600">Система работает стабильно</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* iPhone mockup */}
                <div className="w-[240px] h-[480px] bg-black rounded-[36px] border-4 border-gray-800 overflow-hidden shadow-xl">
                  <div className="w-36 h-6 bg-black absolute top-0 left-1/2 transform -translate-x-1/2 rounded-b-xl z-10"></div>
                  <div className="w-full h-full bg-emerald-600 p-2">
                    <div className="w-full h-full bg-gray-800 rounded-[28px] flex flex-col">
                      <div className="h-14 bg-gray-900 rounded-t-[28px] flex items-center px-4">
                        <p className="text-white text-sm font-medium">Luminaris Security</p>
                      </div>
                      <div className="flex-1 bg-gray-100 p-2">
                        <div className="w-full h-9 bg-white rounded-md mb-2 flex items-center px-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                          <p className="text-xs text-gray-900">Камера 1: Статус активный</p>
                        </div>
                        <div className="w-full h-9 bg-white rounded-md mb-2 flex items-center px-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                          <p className="text-xs text-gray-900">Камера 2: Статус активный</p>
                        </div>
                        <div className="w-full h-9 bg-white rounded-md mb-2 flex items-center px-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                          <p className="text-xs text-gray-900">Датчик движения: Норма</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    
      {/* Footer Section - UPDATED to dark theme */}
      <footer className="relative z-10 ">
          {/* Social Media and Contact */}
          <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0">
              <div className="flex space-x-6">
                <h4 className="text-md font-semibold text-white">Связаться с нами:</h4>
                {/* Social Media Icons */}
                <div className="flex space-x-4">
                  {/* Instagram */}
                  <a href="#" className="text-gray-400 hover:text-emerald-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                  
                  {/* WhatsApp */}
                  <a href="#" className="text-gray-400 hover:text-emerald-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                  
                  {/* Telegram */}
                  <a href="#" className="text-gray-400 hover:text-emerald-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,0c-6.627,0 -12,5.373 -12,12c0,6.627 5.373,12 12,12c6.627,0 12,-5.373 12,-12c0,-6.627 -5.373,-12 -12,-12Zm5.894,8.221l-1.97,9.28c-0.145,0.658 -0.537,0.818 -1.084,0.508l-3,-2.21l-1.446,1.394c-0.14,0.14 -0.376,0.27 -0.536,0.27c-0.37,0 -0.307,-0.137 -0.434,-0.482l-0.974,-3.192l-2.808,-0.877c-0.607,-0.19 -0.617,-0.607 0.125,-0.907l11.019,-4.248c0.502,-0.214 0.997,0.122 0.804,0.801Z"/>
                    </svg>
                  </a>
                  
                  {/* Facebook */}
                  <a href="#" className="text-gray-400 hover:text-emerald-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  
                  {/* YouTube */}
                  <a href="#" className="text-gray-400 hover:text-emerald-500">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
              
              {/* Contact Info */}
              <div className="space-y-2 md:text-right">
                <p className="text-sm"><strong>Email:</strong> info@luminaris.tech</p>
                <p className="text-sm"><strong>Телефон:</strong> +7 (800) 123-45-67</p>
                <p className="text-sm"><strong>Адрес:</strong> г. Москва, ул. Цифровая, д. 42</p>
              </div>
            </div>
          </div>
        
        
        {/* Bottom Footer with Language and Copyright */}
        <div className="bg-gray-800/70 py-4 border-t border-gray-700">
          <div className="container mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 6.627 5.374 12 12 12 6.627 0 12-5.373 12-12 0-6.627-5.373-12-12-12zm1.272 18.15h-2.544v-7.2h2.544v7.2zm-1.272-8.7c-.738 0-1.35-.612-1.35-1.35s.612-1.35 1.35-1.35c.738 0 1.35.612 1.35 1.35s-.612 1.35-1.35 1.35zm7.022 8.7h-2.528v-3.9c0-2.1-2.508-1.944-2.508 0v3.9h-2.514v-7.2h2.514v1.218c1.05-1.95 5.036-2.094 5.036 1.866v4.116z"/>
                  </svg>
                  <span className="text-sm text-gray-300">Русский (Россия)</span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-1 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  <span className="text-sm text-gray-300">Ваши варианты выбора параметров конфиденциальности</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 text-xs">
                <a href="#" className="text-gray-300 hover:text-emerald-500">Связаться с Luminaris</a>
                <a href="#" className="text-gray-300 hover:text-emerald-500">Конфиденциальность</a>
                <a href="#" className="text-gray-300 hover:text-emerald-500">Условия использования</a>
                <a href="#" className="text-gray-300 hover:text-emerald-500">Товарные знаки</a>
                <span className="text-gray-400">© Luminaris 2025</span>
              </div>
            </div>
          </div>
        </div>

        {/* Back to top button */}
        <div className="fixed bottom-16 right-6 z-50">
          <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg">
            <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
            </svg>
          </button>
        </div>
      </footer>
    </main>
  )
}