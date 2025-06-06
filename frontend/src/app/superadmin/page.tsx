"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { API } from "@/lib/axios"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash } from "lucide-react"
import withAuth from "@/lib/withAuth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"

type Company = {
  id: string
  name: string
  user_count: number
}

function SuperAdminPage() {
  const [companyName, setCompanyName] = useState("")
  const [adminUsername, setAdminUsername] = useState("")
  const [adminPassword, setAdminPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [search, setSearch] = useState("")
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const router = useRouter()

  const fetchCompanies = async () => {
    try {
      const res = await API.get("/companies")
      setCompanies(res.data)
    } catch {
      toast.error("Не удалось загрузить список компаний")
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  const handleCreateCompany = async () => {
    if (!companyName || !adminUsername || !adminPassword) {
      toast.error("Пожалуйста, заполните все поля")
      return
    }

    try {
      setLoading(true)
      await API.post("/companies/register-company", {
        company_name: companyName,
        admin_username: adminUsername,
        admin_password: adminPassword,
      })
      toast.success("Компания успешно создана 🎉")
      setCompanyName("")
      setAdminUsername("")
      setAdminPassword("")
      fetchCompanies()
    } catch {
      toast.error("Ошибка при создании компании")
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = (company: Company) => {
    setSelectedCompany(company)
    setShowConfirm(true)
  }

  const handleDeleteConfirmed = async () => {
    if (!selectedCompany) return
    try {
      await API.delete(`/companies/${selectedCompany.id}`)
      toast.success("Компания удалена")
      setCompanies((prev) =>
        prev.filter((c) => c.id !== selectedCompany.id)
      )
      setShowConfirm(false)
    } catch {
      toast.error("Ошибка при удалении компании")
    }
  }

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white p-10">
      <h1 className="text-2xl font-bold mb-6">🛡 SuperAdmin Panel</h1>

      {/* 📦 Создание компании */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-xl max-w-lg space-y-4 mb-10">
        <h2 className="text-xl font-semibold mb-2">Создать компанию</h2>
        <Input
          placeholder="Название компании"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <Input
          placeholder="Имя администратора"
          value={adminUsername}
          onChange={(e) => setAdminUsername(e.target.value)}
        />
        <Input
          type="password"
          placeholder="Пароль администратора"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
        />
        <Button onClick={handleCreateCompany} disabled={loading}>
          {loading ? "Создание..." : "Создать компанию"}
        </Button>
      </div>

      {/* 🏢 Список компаний */}
      <div className="bg-white/5 border border-white/10 p-6 rounded-xl max-w-3xl">
        <h2 className="text-xl font-semibold mb-4">
          Список компаний ({filteredCompanies.length})
        </h2>

        <Input
          placeholder="Поиск по названию..."
          className="mb-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ul className="space-y-3">
          {filteredCompanies.map((company) => (
            <li
              key={company.id}
              className="p-4 border border-white/10 rounded-md bg-white/5 flex justify-between items-center"
            >
              <div>
              <button
                onClick={() => router.push(`/superadmin/company/${company.id}`)}
                className="text-left font-bold text-lg hover:underline"
              >
                {company.name}
              </button>

                <div className="text-sm text-gray-300">
                  ID: <span className="text-white">{company.id}</span>
                </div>
                <div className="text-sm text-gray-300">
                  Пользователей:{" "}
                  <span className="text-white">{company.user_count}</span>
                </div>
              </div>
              <button
                onClick={() => confirmDelete(company)}
                className="text-red-400 hover:text-red-300"
              >
                <Trash size={20} />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 🗑️ Подтверждение удаления */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удалить компанию?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-300">
            Вы уверены, что хотите удалить{" "}
            <strong>{selectedCompany?.name}</strong>?
          </p>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

const ProtectedSuperAdminPanel = withAuth(SuperAdminPage, ["SUPER_ADMIN"]);

export default function Page() {
  return <ProtectedSuperAdminPanel />;
}