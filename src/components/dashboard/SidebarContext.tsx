'use client'

import { createContext, useContext, useState, useCallback } from 'react'

interface SidebarContextType {
  mobileOpen: boolean
  collapsed: boolean
  setMobileOpen: (open: boolean) => void
  setCollapsed: (collapsed: boolean) => void
  toggleMobile: () => void
  toggleCollapsed: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  mobileOpen: false,
  collapsed: false,
  setMobileOpen: () => {},
  setCollapsed: () => {},
  toggleMobile: () => {},
  toggleCollapsed: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), [])
  const toggleCollapsed = useCallback(() => setCollapsed((v) => !v), [])

  return (
    <SidebarContext.Provider
      value={{ mobileOpen, collapsed, setMobileOpen, setCollapsed, toggleMobile, toggleCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
