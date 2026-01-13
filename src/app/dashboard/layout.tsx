import { Sidebar, RealtimeToasts } from '@/components/dashboard'
import { RealtimeProvider } from '@/providers/realtime-provider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RealtimeProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <Sidebar />
        <div className="pl-64 transition-all duration-300 ease-out">
          {children}
        </div>
        <RealtimeToasts />
      </div>
    </RealtimeProvider>
  )
}
