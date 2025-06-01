"use client"

import { useSidebar } from "@/context/SidebarContext"
import Sidebar from "@/components/ui/sidebar"
import { ReactNode } from "react"

export default function LayoutWithSidebar({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar()

  return (
    <div key={collapsed ? "collapsed" : "expanded"} className="flex w-full min-h-screen bg-gradient-to-b from-black to-gray-900 overflow-hidden">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${collapsed ? "ml-20" : "ml-56"} `}>
        <main className="w-full min-w-0 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  )
}
