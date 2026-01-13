import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { ChatContent } from './chat-content'
import { getSesiones, getOrCreateSesion } from './actions'

export default async function ChatPage({
  searchParams,
}: {
  searchParams: { sesion?: string }
}) {
  const [sesiones, sesionActual] = await Promise.all([
    getSesiones(),
    getOrCreateSesion(searchParams.sesion),
  ])

  return (
    <>
      <TopNav
        title="HV-Chat"
        subtitle="Asistente IA para consultas contables"
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <ChatContent
          sesiones={sesiones}
          sesionActual={sesionActual}
        />
      </Suspense>
    </>
  )
}
