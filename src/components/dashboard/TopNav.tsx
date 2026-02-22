'use client'

import { usePathname } from 'next/navigation'
import { Search, Calendar, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotificationsDropdown } from './NotificationsDropdown'
import { ClientSelector } from './ClientSelector'
import { useSidebar } from './SidebarContext'
import Link from 'next/link'

export interface TopNavTab {
  label: string
  href: string
}

interface TopNavProps {
  title: string
  subtitle?: string
  tabs?: TopNavTab[]
}

export function TopNav({ title, subtitle, tabs }: TopNavProps) {
  const { toggleMobile } = useSidebar()

  return (
    <>
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 md:px-8">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Vertical accent line — desktop only */}
        <div className="hidden sm:block h-10 w-0.5 shrink-0 bg-gradient-to-b from-primary to-secondary rounded-full" />

        <div className="min-w-0">
          <h1 className="text-base md:text-lg font-semibold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {subtitle && (
            <div className="hidden sm:flex items-center gap-2 mt-0.5 min-w-0">
              <Calendar className="h-3 w-3 shrink-0 text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Search — large screens only */}
        <div className="relative hidden lg:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Buscar..."
            className="w-48 xl:w-64 pl-10 h-9 bg-muted/30 border-transparent focus:border-primary/30 focus:bg-background"
          />
        </div>

        {/* Client selector — large screens only */}
        <div className="hidden lg:block">
          <ClientSelector />
        </div>

        {/* Divider — large screens only */}
        <div className="hidden lg:block h-6 w-px bg-border/60" />

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User */}
        <Link href="/dashboard/configuracion">
          <Button variant="ghost" size="icon" className="relative group">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-primary/10 group-hover:ring-primary/30 transition-all">
              <span className="text-xs font-semibold text-primary">HV</span>
            </div>
            <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
          </Button>
        </Link>
      </div>
    </header>
    {tabs && tabs.length > 0 && <TabBar tabs={tabs as TopNavTab[]} />}
    </>
  )
}

function TabBar({ tabs }: { tabs: TopNavTab[] }) {
  const pathname = usePathname()

  return (
    <div className="sticky top-16 z-20 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-1 px-4 md:px-8 overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'relative whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
              )}
            >
              {tab.label}
              {isActive && (
                <div className="absolute bottom-0 left-1 right-1 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
