'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TopNav } from '@/components/dashboard'
import { NewClientOnboarding } from '@/components/onboarding/NewClientOnboarding'

export default function NuevoClientePage() {
  return (
    <>
      <TopNav title="Nuevo Cliente" subtitle="Onboarding paso a paso" />
      <main className="p-4 md:p-6 lg:p-8 max-w-3xl mx-auto">
        <Link
          href="/dashboard/clientes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Clientes
        </Link>

        <NewClientOnboarding />
      </main>
    </>
  )
}
