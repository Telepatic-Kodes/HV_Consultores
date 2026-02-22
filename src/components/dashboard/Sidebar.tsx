'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  Brain,
  FileSpreadsheet,
  Bot,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  Building2,
  Upload,
  Landmark,
  CreditCard,
  ArrowLeftRight,
  Settings2,
  Coins,
  Workflow,
  AlertTriangle,
  X,
  TrendingUp,
  ClipboardList,
} from 'lucide-react'
import { useSidebar } from './SidebarContext'

interface NavGroup {
  label: string
  items: { name: string; href: string; icon: LucideIcon }[]
}

const navigation: NavGroup[] = [
  {
    label: 'General',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
    ],
  },
  {
    label: 'HV-Class',
    items: [
      { name: 'Documentos', href: '/dashboard/documentos', icon: Upload },
      { name: 'Clasificador IA', href: '/dashboard/clasificador', icon: Brain },
    ],
  },
  {
    label: 'HV-F29',
    items: [
      { name: 'F29', href: '/dashboard/f29', icon: FileSpreadsheet },
      { name: 'Procesos', href: '/dashboard/procesos', icon: ClipboardList },
      { name: 'Pipeline', href: '/dashboard/pipeline', icon: Workflow },
    ],
  },
  {
    label: 'HV-Bot',
    items: [
      { name: 'Bots RPA', href: '/dashboard/bots', icon: Bot },
      { name: 'SII RPA', href: '/dashboard/sii', icon: Landmark },
    ],
  },
  {
    label: 'HV-Bancos',
    items: [
      { name: 'Cartolas', href: '/dashboard/bancos', icon: CreditCard },
      { name: 'Conciliación', href: '/dashboard/conciliacion', icon: ArrowLeftRight },
      { name: 'Parametrización', href: '/dashboard/parametrizacion', icon: Settings2 },
      { name: 'Monedas', href: '/dashboard/monedas', icon: Coins },
    ],
  },
  {
    label: 'HV-Chat',
    items: [
      { name: 'Chat IA', href: '/dashboard/chat', icon: MessageSquare },
      { name: 'Alertas', href: '/dashboard/alertas', icon: AlertTriangle },
      { name: 'Analítica', href: '/dashboard/analytics', icon: TrendingUp },
      { name: 'Reportes', href: '/dashboard/reportes', icon: BarChart3 },
    ],
  },
]

const bottomNavigation = [
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

function SidebarContent() {
  const pathname = usePathname()
  const { collapsed, toggleCollapsed, setMobileOpen } = useSidebar()
  const handleNavClick = () => {
    // Close mobile sidebar on navigation
    setMobileOpen(false)
  }

  return (
    <div className="flex h-full flex-col">
      {/* Logo Header */}
      <div className={cn(
        'flex h-16 items-center border-b border-white/5',
        collapsed ? 'justify-center px-2' : 'justify-between px-5'
      )}>
        <Link href="/dashboard" className="flex items-center gap-3" onClick={handleNavClick}>
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
        {/* Mobile close button */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {navigation.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && 'mt-4')}>
            {!collapsed && (
              <span className="block px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </span>
            )}
            {collapsed && groupIndex > 0 && (
              <div className="mx-auto mb-2 w-4 border-t border-white/10" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'group flex items-center rounded-lg transition-all duration-200',
                      collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    )}
                  >
                    <div className={cn(
                      'flex items-center justify-center transition-transform duration-200',
                      isActive && 'scale-110',
                      !isActive && 'group-hover:scale-105'
                    )}>
                      <item.icon className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        isActive && 'text-secondary'
                      )} />
                    </div>
                    {!collapsed && (
                      <span className="text-[13px] font-medium">{item.name}</span>
                    )}
                    {isActive && !collapsed && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-secondary" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
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
                onClick={handleNavClick}
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

        </div>
      </div>

      {/* Collapse Toggle — desktop only */}
      <div className="hidden md:block border-t border-white/5 p-3">
        <button
          onClick={toggleCollapsed}
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
  )
}

export function Sidebar() {
  const { mobileOpen, collapsed, setMobileOpen } = useSidebar()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar (drawer) */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 transition-transform duration-300 ease-out md:hidden',
          'bg-[#0a1628] border-r border-white/5',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-out hidden md:block',
          'bg-[#0a1628] border-r border-white/5',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
