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
import withAuth from "@/lib/withAuth";
import { Users, UserPlus, Shield, Lock, User, RefreshCw, Search, UserCheck, Trash2, AlertTriangle, X } from "lucide-react"

type UserType = {
  id: number
  username: string
  role: string
}

type DeleteConfirmation = {
  isOpen: boolean
  user: UserType | null
}

function AdminPanel() {
  const [users, setUsers] = useState<UserType[]>([])
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"ANALYST" | "VIEWER">("ANALYST")
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    user: null
  })

  // Динамические дата/время и имя пользователя
  const [formattedDate, setFormattedDate] = useState('')
  const [formattedTime, setFormattedTime] = useState('')
  const [usernameCurrent, setUsernameCurrent] = useState('')

  const handleDeleteRequest = (user: UserType) => {
    setDeleteConfirmation({
      isOpen: true,
      user: user
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.user) return

    try {
      setLoading(true)
      await API.delete(`/admin/users/${deleteConfirmation.user.id}`)
      toast.success("Пользователь удалён")
      fetchUsers()
      setDeleteConfirmation({ isOpen: false, user: null })
    } catch (e) {
      let message = "Ошибка при удалении пользователя";
      if (
        typeof e === "object" &&
        e !== null &&
        "response" in e &&
        typeof (e as { response?: { data?: { detail?: string } } }).response?.data?.detail === "string"
      ) {
        message = (e as { response: { data: { detail: string } } }).response.data.detail;
      } else if (e instanceof Error) {
        message = e.message;
      }
      toast.error(message);
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, user: null })
  }

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
    } catch {
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
              <div className="overflow-hidden">
                {/* Заголовок таблицы */}
                <div className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-400 border-b border-gray-800/50 bg-gray-800/30 rounded-t-lg">
                  <div className="col-span-2 flex items-center">ID</div>
                  <div className="col-span-5 flex items-center">Пользователь</div>
                  <div className="col-span-3 flex items-center">Роль</div>
                  <div className="col-span-2 flex items-center justify-end">Действия</div>
                </div>

                {/* Список пользователей */}
                <div className="space-y-1 bg-gray-800/20 rounded-b-lg">
                  {filteredUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className={`grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-gray-800/50 transition-all duration-200 border-l-4 border-transparent hover:border-emerald-500/50 ${index === filteredUsers.length - 1 ? 'rounded-b-lg' : ''
                        }`}
                    >
                      {/* ID */}
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded bg-gray-700/50 flex items-center justify-center">
                            <span className="text-xs font-mono text-gray-400">#{user.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Пользователь */}
                      <div className="col-span-5">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center mr-3 shadow-lg">
                            <span className="text-sm font-semibold text-white">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.username}</div>
                            <div className="text-xs text-gray-400">Пользователь системы</div>
                          </div>
                        </div>
                      </div>

                      {/* Роль */}
                      <div className="col-span-3">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {user.role}
                        </span>
                      </div>

                      {/* Действия */}
                      <div className="col-span-2 flex justify-end">
                        {user.role !== "ADMIN" && user.username !== usernameCurrent ? (
                          <button
                            className="p-2.5 bg-red-900/30 hover:bg-red-800/50 rounded-lg transition-all duration-200 border border-red-800/30 hover:border-red-700/50 group"
                            title="Удалить пользователя"
                            onClick={() => handleDeleteRequest(user)}
                            disabled={loading}
                          >
                            <Trash2 size={16} className="text-red-400 group-hover:text-red-300 transition-colors" />
                          </button>
                        ) : (
                          <div className="w-10 h-10 flex items-center justify-center">
                            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Диалоговое окно подтверждения удаления */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Заголовок */}
            <div className="bg-gradient-to-r from-red-900/30 to-red-800/20 border-b border-red-800/30 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-red-900/50 rounded-full flex items-center justify-center mr-3">
                    <AlertTriangle size={24} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Подтверждение удаления</h3>
                    <p className="text-sm text-gray-400">Это действие нельзя отменить</p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteCancel}
                  className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Содержимое */}
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-lg font-semibold text-white">
                    {deleteConfirmation.user?.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-white font-medium">{deleteConfirmation.user?.username}</div>
                  <div className="text-sm text-gray-400">
                    Роль: <span className="text-blue-400">{deleteConfirmation.user?.role}</span>
                  </div>
                </div>
              </div>

              <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-200">
                  Вы уверены, что хотите удалить пользователя <span className="font-semibold text-white">{deleteConfirmation.user?.username}</span>?
                </p>
                <p className="text-xs text-red-300/70 mt-2">
                  Все данные пользователя будут безвозвратно удалены из системы.
                </p>
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteCancel}
                  variant="outline"
                  className="flex-1 bg-gray-800 hover:bg-gray-700 border-gray-600 text-white"
                  disabled={loading}
                >
                  Отмена
                </Button>
                <Button
                  onClick={handleDeleteConfirm}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Удаление...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      Удалить
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-gray-500 py-3">
        Luminaris Security System • Powered by AI
      </div>
    </main>
  )
}

const ProtectedAdminPanel = withAuth(AdminPanel, ["ADMIN"]);

export default function Page() {
  return <ProtectedAdminPanel />;
}