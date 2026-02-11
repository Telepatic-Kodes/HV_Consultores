/**
 * Analytics Dashboard Page
 * Phase 7: Advanced Analytics & Business Intelligence
 * Created: 2026-01-11
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
// TODO: Phase 2 - Replace demo user with Convex auth session
import { DocumentAnalyticsDashboard } from '@/components/analytics/DocumentAnalyticsDashboard'
import { AutomationAnalyticsDashboard } from '@/components/analytics/AutomationAnalyticsDashboard'
import { TeamAnalyticsDashboard } from '@/components/analytics/TeamAnalyticsDashboard'
import { QueuePerformanceDashboard } from '@/components/analytics/QueuePerformanceDashboard'
import { ComplianceAnalyticsDashboard } from '@/components/analytics/ComplianceAnalyticsDashboard'
import { AlertRulesManager } from '@/components/analytics/AlertRulesManager'
import { ReportScheduler } from '@/components/analytics/ReportScheduler'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Demo user constant - replaces Supabase auth session
const DEMO_USER = {
  id: 'demo-user-hv-consultores',
  email: 'demo@hvconsultores.cl',
  name: 'Usuario Demo',
}

interface AnalyticsDashboardPageProps {
  searchParams?: {
    tab?: string
  }
}

export default function AnalyticsDashboardPage({
  searchParams,
}: AnalyticsDashboardPageProps) {
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Use demo user instead of Supabase auth
  useEffect(() => {
    // TODO: Phase 2 - Replace with Convex auth session check
    setOrganizationId(DEMO_USER.id)
    setLoading(false)
  }, [router])

  if (loading) {
    return <LoadingState />
  }

  if (!organizationId) {
    return (
      <div className='space-y-4'>
        <h1 className='text-3xl font-bold'>Analytics</h1>
        <Card className='border-destructive'>
          <CardContent className='pt-6'>
            <p className='text-sm text-destructive'>
              Unable to load analytics. Please log in again.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeTab = searchParams?.tab || 'documents'

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Analytics</h1>
        <p className='text-muted-foreground'>
          Real-time insights into your document management system performance
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} defaultValue='documents' className='space-y-6'>
        <TabsList className='grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-7'>
          <TabsTrigger value='documents'>Documents</TabsTrigger>
          <TabsTrigger value='automation'>Automation</TabsTrigger>
          <TabsTrigger value='team'>Team</TabsTrigger>
          <TabsTrigger value='queue'>Queue</TabsTrigger>
          <TabsTrigger value='compliance'>Compliance</TabsTrigger>
          <TabsTrigger value='alerts'>Alerts</TabsTrigger>
          <TabsTrigger value='reports'>Reports</TabsTrigger>
        </TabsList>

        {/* Documents Tab */}
        <TabsContent value='documents'>
          <DocumentAnalyticsDashboard organizationId={organizationId} />
        </TabsContent>

        {/* Automation Tab */}
        <TabsContent value='automation'>
          <AutomationAnalyticsDashboard organizationId={organizationId} />
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value='team'>
          <TeamAnalyticsDashboard organizationId={organizationId} />
        </TabsContent>

        {/* Queue Tab */}
        <TabsContent value='queue'>
          <QueuePerformanceDashboard organizationId={organizationId} />
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value='compliance'>
          <ComplianceAnalyticsDashboard organizationId={organizationId} />
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value='alerts'>
          <AlertRulesManager organizationId={organizationId} />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value='reports'>
          <ReportScheduler organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Phase 7 Implementation Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div>
              <p className='text-sm font-medium'>Week 1: Foundation & Document Analytics</p>
              <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-primary transition-all'
                  style={{ width: '100%' }}
                />
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>Complete</p>
            </div>

            <div>
              <p className='text-sm font-medium'>
                Week 2: Automation & Team Analytics
              </p>
              <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-primary transition-all'
                  style={{ width: '100%' }}
                />
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>Complete</p>
            </div>

            <div>
              <p className='text-sm font-medium'>Week 3: Compliance & Alerts</p>
              <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-primary transition-all'
                  style={{ width: '20%' }}
                />
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>In Progress (Compliance done)</p>
            </div>

            <div>
              <p className='text-sm font-medium'>
                Week 4: Optimization & Deployment
              </p>
              <div className='mt-2 h-2 w-full overflow-hidden rounded-full bg-muted'>
                <div
                  className='h-full bg-primary transition-all'
                  style={{ width: '0%' }}
                />
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>Upcoming</p>
            </div>
          </div>

          <div className='mt-6 space-y-2 border-t pt-4'>
            <p className='text-sm font-medium'>Component Status (Week 1-2)</p>
            <ul className='space-y-2 text-sm text-muted-foreground'>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-green-500'></span>
                Database schema created and optimized
              </li>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-green-500'></span>
                Document analytics dashboard built
              </li>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-green-500'></span>
                Automation analytics dashboard built
              </li>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-green-500'></span>
                Team analytics dashboard built
              </li>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-green-500'></span>
                Queue performance dashboard built
              </li>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-green-500'></span>
                Analytics API endpoints implemented (4/4)
              </li>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-blue-500'></span>
                Real-time subscriptions (next)
              </li>
              <li className='flex items-center gap-2'>
                <span className='h-2 w-2 rounded-full bg-blue-500'></span>
                Integration testing (in progress)
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingState() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-10 w-64' />
      <Skeleton className='h-6 w-96' />
      <div className='space-y-4'>
        <Skeleton className='h-12 w-full' />
        <div className='grid gap-4 md:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className='h-24 w-full' />
          ))}
        </div>
      </div>
    </div>
  )
}
