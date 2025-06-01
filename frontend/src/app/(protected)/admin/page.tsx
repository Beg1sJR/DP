"use client"

import { useEffect, useState } from "react"
import { API } from "@/lib/axios"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import withAuth from "@/lib/withAuth"
import { Users, UserPlus, Shield,  Lock, User, RefreshCw, Search, UserCheck } from "lucide-react"

type User = {
  id: number
  username: string
  role: string
}

function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"ANALYST" | "VIEWER">("ANALYST")
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [companyName, setCompanyName] = useState("")

  // Динамические дата/время и имя пользователя
  const [formattedDate, setFormattedDate] = useState('')
  const [formattedTime, setFormattedTime] = useState('')
  const [usernameCurrent, setUsernameCurrent] = useState('')

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
    setUsernameCurrent(typeof window !== "undefined" && window.localStorage.getItem("username") || "Гость")
  }, [])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await API.get("/admin/users")
      setUsers(res.data)
      setCompanyName(res.data[0]?.company_name || "Ваша компания")
    } catch  {
      toast.error("Не удалось загрузить список пользователей")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleCreate = async () => {
    if (!username || !password || !role) {
      toast.error("Заполните все поля")
      return
    }

    try {
      setLoading(true)
      await API.post("/admin/create-user", { username, password, role })
      toast.success("Пользователь создан")
      setUsername("")
      setPassword("")
      setRole("ANALYST")
      fetchUsers()
    } catch {
      toast.error("Ошибка при создании пользователя")
    } finally {
      setLoading(false)
    }
  }
  
  // Функция для фильтрации пользователей по поисковому запросу
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Функция для получения цвета бейджа роли
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return "bg-emerald-900/40 border-emerald-800/40 text-emerald-400";
      case 'ANALYST':
        return "bg-blue-900/40 border-blue-800/40 text-blue-400";
      case 'VIEWER':
        return "bg-purple-900/40 border-purple-800/40 text-purple-400";
      default:
        return "bg-gray-900/40 border-gray-800/40 text-gray-400";
    }
  };
  
  // Функция для получения иконки роли
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield size={14} />;
      case 'ANALYST':
        return <UserCheck size={14} />;
      case 'VIEWER':
        return <User size={14} />;
      default:
        return <User size={14} />;
    }
  };

  return (
    <main className="p-6 bg-gradient-to-b from-black to-gray-900 text-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-700 to-emerald-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-emerald-900/20">
            <Lock size={20} />
          </div>
          <h1 className="text-2xl font-bold">Панель администратора</h1>
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
            <span className="text-xs text-emerald-400">{usernameCurrent}</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 mb-8">
        <p className="text-sm text-gray-300 mb-4 flex items-center">
          <Shield size={16} className="text-emerald-400 mr-2" />
          Вы в панели администратора компании <span className="text-emerald-400 font-semibold ml-1">{companyName}</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gray-800/50 border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Пользователей</p>
              <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center">
                <Users size={16} className="text-blue-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold">{users.length}</h2>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Администраторов</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-900/30 flex items-center justify-center">
                <Shield size={16} className="text-emerald-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold">{users.filter(u => u.role === 'ADMIN').length}</h2>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Аналитиков</p>
              <div className="w-8 h-8 rounded-lg bg-blue-900/30 flex items-center justify-center">
                <UserCheck size={16} className="text-blue-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold">{users.filter(u => u.role === 'ANALYST').length}</h2>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700/50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Наблюдателей</p>
              <div className="w-8 h-8 rounded-lg bg-purple-900/30 flex items-center justify-center">
                <User size={16} className="text-purple-400" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold">{users.filter(u => u.role === 'VIEWER').length}</h2>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 h-full">
            <div className="flex items-center mb-5">
              <UserPlus size={20} className="text-emerald-400 mr-2" />
              <h2 className="text-lg font-medium">Создание пользователя</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Логин пользователя</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User size={16} className="text-gray-500" />
                  </div>
                  <Input 
                    placeholder="Введите логин" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    className="bg-gray-800 border-gray-700 focus:border-emerald-600 text-white pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Пароль</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Lock size={16} className="text-gray-500" />
                  </div>
                  <Input 
                    placeholder="Введите пароль" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="bg-gray-800 border-gray-700 focus:border-emerald-600 text-white pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Роль</label>
                <Select value={role} onValueChange={(v: "ANALYST" | "VIEWER") => setRole(v)}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 focus:border-emerald-600 text-white">
                    <SelectValue placeholder="Выберите роль" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="ANALYST" className="hover:bg-gray-700 focus:bg-gray-700">ANALYST</SelectItem>
                    <SelectItem value="VIEWER" className="hover:bg-gray-700 focus:bg-gray-700">VIEWER</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                onClick={handleCreate} 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Создание...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Создать пользователя</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-2">
          <div className="bg-gray-900/70 border border-gray-800/60 rounded-xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center">
                <Users size={20} className="text-emerald-400 mr-2" />
                <h2 className="text-lg font-medium">Список пользователей</h2>
              </div>
              
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search size={16} className="text-gray-500" />
                </div>
                <Input 
                  placeholder="Поиск пользователей..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800 border-gray-700 pl-10 text-white"
                />
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Загрузка пользователей...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <Users size={24} className="text-gray-600" />
                </div>
                {searchTerm ? (
                  <p className="text-gray-400">Нет пользователей, соответствующих поиску &quot;{searchTerm}&quot;</p>
                ) : (
                  <p className="text-gray-400">Список пользователей пуст</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-800">
                  <div>ID</div>
                  <div>Пользователь</div>
                  <div>Роль</div>
                </div>
                {filteredUsers.map((user) => (
                  <div key={user.id} className="bg-gray-800/50 border border-gray-700/30 rounded-lg p-4 grid grid-cols-3 gap-4 items-center hover:bg-gray-800/80 transition-colors">
                    <div className="text-gray-400">#{user.id}</div>
                    <div className="font-medium flex items-center">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      {user.username}
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${getRoleColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </div>
                    <div className="flex gap-2">

                    </div>
                  </div>
                ))}
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

export default withAuth(AdminPanel, ["ADMIN"])