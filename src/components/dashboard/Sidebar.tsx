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
  Settings,
  ChevronLeft,
  Building2,
  Upload,
  CreditCard,
  X,
} from 'lucide-react'
import { useSidebar } from './SidebarContext'

interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  /** Additional paths that should mark this item as active */
  childPaths?: string[]
}

const mainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
]

const moduleNavigation: NavItem[] = [
  {
    name: 'Documentos',
    href: '/dashboard/documentos',
    icon: Upload,
    childPaths: ['/dashboard/clasificador'],
  },
  {
    name: 'Tributario',
    href: '/dashboard/f29',
    icon: FileSpreadsheet,
    childPaths: ['/dashboard/procesos', '/dashboard/pipeline'],
  },
  {
    name: 'Automatización',
    href: '/dashboard/bots',
    icon: Bot,
    childPaths: ['/dashboard/sii'],
  },
  {
    name: 'Bancos',
    href: '/dashboard/bancos',
    icon: CreditCard,
    childPaths: ['/dashboard/conciliacion', '/dashboard/parametrizacion', '/dashboard/monedas'],
  },
  {
    name: 'Inteligencia',
    href: '/dashboard/inteligencia',
    icon: Brain,
    childPaths: ['/dashboard/chat', '/dashboard/alertas', '/dashboard/analytics', '/dashboard/reportes'],
  },
]

const bottomNavigation: NavItem[] = [
  { name: 'Configuración', href: '/dashboard/configuracion', icon: Settings },
]

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === '/dashboard') return pathname === '/dashboard'
  if (pathname === item.href) return true
  return item.childPaths?.some((p) => pathname.startsWith(p)) ?? false
}

function NavLink({
  item,
  pathname,
  collapsed,
  onClick,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
  onClick: () => void
}) {
  const isActive = isItemActive(pathname, item)
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'group flex items-center rounded-lg transition-all duration-200',
        collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5',
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
}

function SidebarContent() {
  const pathname = usePathname()
  const { collapsed, toggleCollapsed, setMobileOpen } = useSidebar()
  const handleNavClick = () => setMobileOpen(false)

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
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-0.5">
          {mainNavigation.map((item) => (
            <NavLink key={item.name} item={item} pathname={pathname} collapsed={collapsed} onClick={handleNavClick} />
          ))}
        </div>

        {/* Separator */}
        {collapsed ? (
          <div className="mx-auto my-3 w-4 border-t border-white/10" />
        ) : (
          <div className="my-3 mx-2 border-t border-white/10" />
        )}

        <div className="space-y-0.5">
          {moduleNavigation.map((item) => (
            <NavLink key={item.name} item={item} pathname={pathname} collapsed={collapsed} onClick={handleNavClick} />
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-white/5 px-3 py-4">
        <div className="space-y-1">
          {bottomNavigation.map((item) => (
            <NavLink key={item.name} item={item} pathname={pathname} collapsed={collapsed} onClick={handleNavClick} />
          ))}
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
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 transition-transform duration-300 ease-out md:hidden',
          'bg-[#0a1628] border-r border-white/5',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent />
      </aside>

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
