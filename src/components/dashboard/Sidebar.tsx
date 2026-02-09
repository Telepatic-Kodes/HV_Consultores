'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Brain,
  FileSpreadsheet,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  Building2,
  Upload,
  Zap,
  Landmark,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { name: 'Documentos', href: '/dashboard/documentos', icon: Upload },
  { name: 'Clasificador', href: '/dashboard/clasificador', icon: Brain },
  { name: 'F29', href: '/dashboard/f29', icon: FileSpreadsheet },
  { name: 'Bots', href: '/dashboard/bots', icon: Bot },
  { name: 'SII RPA', href: '/dashboard/sii', icon: Landmark },
  { name: 'Bancos', href: '/dashboard/bancos', icon: CreditCard },
  { name: 'Chat', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Reportes', href: '/dashboard/reportes', icon: BarChart3 },
  { name: 'Automatización', href: '/dashboard/documentos/automation', icon: Zap },
]

const bottomNavigation = [
  { name: 'Configuracion', href: '/dashboard/configuracion', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    // Removed Supabase auth logout - demo mode
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-out',
        'bg-[#0a1628] border-r border-white/5',
        collapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo Header */}
        <div className={cn(
          'flex h-16 items-center border-b border-white/5',
          collapsed ? 'justify-center px-2' : 'justify-between px-5'
        )}>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <Building2 className="h-5 w-5 text-white" />
              <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-secondary" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white tracking-wide">
                  HV Consultores
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                  Platform
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-6">
          <div className={cn(
            'mb-4',
            collapsed ? 'px-0' : 'px-2'
          )}>
            {!collapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Menu Principal
              </span>
            )}
          </div>

          <div className="space-y-1">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-lg transition-all duration-200',
                    collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  <div className={cn(
                    'flex items-center justify-center transition-transform duration-200',
                    isActive && 'scale-110',
                    !isActive && 'group-hover:scale-105'
                  )}>
                    <item.icon className={cn(
                      'h-5 w-5 shrink-0',
                      isActive && 'text-secondary'
                    )} />
                  </div>
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-white/5 px-3 py-4">
          <div className="space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center rounded-lg transition-all duration-200',
                    collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && (
                    <span className="text-sm font-medium">{item.name}</span>
                  )}
                </Link>
              )
            })}

            <button
              onClick={handleLogout}
              className={cn(
                'flex w-full items-center rounded-lg transition-all duration-200',
                collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
                'text-slate-400 hover:bg-red-500/10 hover:text-red-400'
              )}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium">Cerrar Sesion</span>
              )}
            </button>
          </div>
        </div>

        {/* Collapse Toggle */}
        <div className="border-t border-white/5 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'flex w-full items-center rounded-lg p-2 transition-all duration-200',
              'text-slate-500 hover:bg-white/5 hover:text-slate-300',
              collapsed && 'justify-center'
            )}
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform duration-300',
                collapsed && 'rotate-180'
              )}
            />
            {!collapsed && (
              <span className="ml-2 text-xs">Colapsar</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
