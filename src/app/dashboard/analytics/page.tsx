'use client'

import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const DocumentAnalyticsDashboard = dynamic(
  () => import('@/components/analytics/DocumentAnalyticsDashboard').then(m => m.DocumentAnalyticsDashboard),
  { ssr: false, loading: () => <TabSkeleton /> }
)
const AutomationAnalyticsDashboard = dynamic(
  () => import('@/components/analytics/AutomationAnalyticsDashboard').then(m => m.AutomationAnalyticsDashboard),
  { ssr: false, loading: () => <TabSkeleton /> }
)
const TeamAnalyticsDashboard = dynamic(
  () => import('@/components/analytics/TeamAnalyticsDashboard').then(m => m.TeamAnalyticsDashboard),
  { ssr: false, loading: () => <TabSkeleton /> }
)
const QueuePerformanceDashboard = dynamic(
  () => import('@/components/analytics/QueuePerformanceDashboard').then(m => m.QueuePerformanceDashboard),
  { ssr: false, loading: () => <TabSkeleton /> }
)
const ComplianceAnalyticsDashboard = dynamic(
  () => import('@/components/analytics/ComplianceAnalyticsDashboard').then(m => m.ComplianceAnalyticsDashboard),
  { ssr: false, loading: () => <TabSkeleton /> }
)
const AlertRulesManager = dynamic(
  () => import('@/components/analytics/AlertRulesManager').then(m => m.AlertRulesManager),
  { ssr: false, loading: () => <TabSkeleton /> }
)
const ReportScheduler = dynamic(
  () => import('@/components/analytics/ReportScheduler').then(m => m.ReportScheduler),
  { ssr: false, loading: () => <TabSkeleton /> }
)


function TabSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 md:grid-cols-4'>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className='h-24 w-full' />
        ))}
      </div>
      <Skeleton className='h-64 w-full' />
    </div>
  )
}

interface AnalyticsDashboardPageProps {
  searchParams?: {
    tab?: string
  }
}

export default function AnalyticsDashboardPage({
  searchParams,
}: AnalyticsDashboardPageProps) {
  const organizationId = 'default'
  const activeTab = searchParams?.tab || 'documents'

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Analytics</h1>
        <p className='text-muted-foreground'>
          Real-time insights into your document management system performance
        </p>
      </div>

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

        <TabsContent value='documents'>
          <DocumentAnalyticsDashboard organizationId={organizationId} />
        </TabsContent>

        <TabsContent value='automation'>
          <AutomationAnalyticsDashboard organizationId={organizationId} />
        </TabsContent>

        <TabsContent value='team'>
          <TeamAnalyticsDashboard organizationId={organizationId} />
        </TabsContent>

        <TabsContent value='queue'>
          <QueuePerformanceDashboard organizationId={organizationId} />
        </TabsContent>

        <TabsContent value='compliance'>
          <ComplianceAnalyticsDashboard organizationId={organizationId} />
        </TabsContent>

        <TabsContent value='alerts'>
          <AlertRulesManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value='reports'>
          <ReportScheduler organizationId={organizationId} />
        </TabsContent>
      </Tabs>
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
