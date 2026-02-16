import { Sidebar, SidebarProvider, RealtimeToasts, ClientProvider } from '@/components/dashboard'
import { RealtimeProvider } from '@/providers/realtime-provider'

// All dashboard pages use server-side data fetching — disable static prerendering
export const dynamic = 'force-dynamic'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <RealtimeProvider>
      <SidebarProvider>
        <ClientProvider>
          <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            <Sidebar />
            <div className="md:pl-64 transition-all duration-300 ease-out">
              {children}
            </div>
            <RealtimeToasts />
          </div>
        </ClientProvider>
      </SidebarProvider>
    </RealtimeProvider>
  )
}
