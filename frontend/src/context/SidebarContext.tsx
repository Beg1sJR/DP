"use client"

import { createContext, useContext, useEffect, useState } from "react"

type SidebarContextType = {
  collapsed: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  toggleSidebar: () => {},
})

export const SidebarProvider = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("sidebar_collapsed")
    if (stored !== null) {
      setCollapsed(stored === "true")
    }
  }, [])

  const toggleSidebar = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar_collapsed", String(!prev))
      return !prev
    })
  }

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
