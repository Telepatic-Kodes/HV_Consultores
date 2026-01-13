'use client'

import { ReactNode } from 'react'

interface KPIGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function KPIGrid({
  children,
  columns = 4,
  gap = 'md',
  className = '',
}: KPIGridProps) {
  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }

  const columnClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  }

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

interface KPIGridItemProps {
  children: ReactNode
  span?: 1 | 2 | 3
  className?: string
}

export function KPIGridItem({
  children,
  span = 1,
  className = '',
}: KPIGridItemProps) {
  const spanClasses = {
    1: '',
    2: 'sm:col-span-2',
    3: 'sm:col-span-2 lg:col-span-3',
  }

  return (
    <div className={`${spanClasses[span]} ${className}`}>
      {children}
    </div>
  )
}

export default KPIGrid
