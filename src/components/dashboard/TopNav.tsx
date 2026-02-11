'use client'

import { Search, User, Calendar, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NotificationsDropdown } from './NotificationsDropdown'
import { useSidebar } from './SidebarContext'
import Link from 'next/link'

interface TopNavProps {
  title: string
  subtitle?: string
}

export function TopNav({ title, subtitle }: TopNavProps) {
  const { toggleMobile } = useSidebar()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur-xl px-4 md:px-8">
      <div className="flex items-center gap-3 md:gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={toggleMobile}
          className="md:hidden p-2 -ml-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Vertical accent line — desktop only */}
        <div className="hidden sm:block h-10 w-0.5 bg-gradient-to-b from-primary to-secondary rounded-full" />

        <div>
          <h1 className="text-base md:text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          {subtitle && (
            <div className="hidden sm:flex items-center gap-2 mt-0.5">
              <Calendar className="h-3 w-3 text-muted-foreground/60" />
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Search — desktop only */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
          <Input
            type="search"
            placeholder="Buscar clientes, documentos..."
            className="w-72 pl-10 h-9 bg-muted/30 border-transparent focus:border-primary/30 focus:bg-background"
          />
        </div>

        {/* Divider — desktop only */}
        <div className="hidden md:block h-6 w-px bg-border/60" />

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User */}
        <Link href="/dashboard/configuracion">
          <Button variant="ghost" size="icon" className="relative group">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-primary/10 group-hover:ring-primary/30 transition-all">
              <User className="h-4 w-4 text-primary" />
            </div>
            <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-background" />
          </Button>
        </Link>
      </div>
    </header>
  )
}
