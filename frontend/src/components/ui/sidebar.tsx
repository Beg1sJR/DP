"use client"

import Link from "next/link"
import Image from "next/image";
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { useSidebar } from "@/context/SidebarContext"
import {
  LayoutDashboard,
  ShieldAlert,
  BarChart2,
  FileText,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  Brain,
  Lock,
} from "lucide-react"

const Sidebar = () => {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const { collapsed, toggleSidebar } = useSidebar()

  const isAdmin = user?.role === "ADMIN"
  const hasAnalystAccess = user?.role === "ANALYST" || isAdmin

  const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard size={18} />, label: "Панель управления" },
    { href: "/threats", icon: <ShieldAlert size={18} />, label: "Угрозы", onlyAnalyst: true },
    { href: "/analytics", icon: <BarChart2 size={18} />, label: "Аналитика" },
    { href: "/forecast", icon: <Brain size={18} />, label: "Прогноз", onlyAnalyst: true },
    { href: "/reports", icon: <FileText size={18} />, label: "Отчеты", onlyAnalyst: true },
    { href: "/admin", icon: <Lock size={18} />, label: "Администрирование", onlyAdmin: true },
    { href: "/settings", icon: <Settings size={18} />, label: "Настройки" },
  ]

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-gradient-to-b from-black to-gray-900 text-white z-50 flex flex-col justify-between transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      } border-r border-gray-800/50`}
    >
      <div>
        <div className="p-5 flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center">
              {/* <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center mr-2 overflow-hidden"> */}
              <Image
                src="/logo.png"
                alt="Логотип"
                width={35}
                height={35}
                className="object-contain"
              />
             {/* </div> */}
            <div className="text-lg font-bold">Luminaris</div>
          </div>
          )}
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-emerald-400 ml-auto bg-gray-800/30 rounded-full p-1.5"
            aria-label="Свернуть меню"
            title="Свернуть меню"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        <div className={`px-4 pb-4 ${collapsed ? 'hidden' : 'flex'} items-center gap-2 mb-4`}>
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-emerald-400">Система активна</span>
        </div>

        <nav className="flex flex-col gap-1.5 px-3">
          {navItems.map(({ href, icon, label, onlyAnalyst, onlyAdmin }) => {
            if (onlyAnalyst && !hasAnalystAccess) return null
            if (onlyAdmin && !isAdmin) return null

            const isActive = pathname === href

            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-900/30"
                    : "text-gray-300 hover:bg-gray-800/60 hover:text-white"
                }`}
              >
                {icon}
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>
      </div>



      <div className="text-xs px-4 pb-6 pt-4 border-t border-gray-800/50 bg-black/20">
        {!collapsed && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-xs">👤</span>
              </div>
              <span className="text-gray-300">{user?.username || 'Пользователь'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <span className="text-xs">🔐</span>
              </div>
              <span className="text-gray-300">{user?.role || 'Аналитик'}</span>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className={`flex items-center gap-2 text-sm rounded-md py-2 px-2 w-full ${
            collapsed ? "justify-center" : ""
          } bg-red-900/20 hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-colors`}
        >
          <LogOut size={18} />
          {!collapsed && <span>Выйти</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar