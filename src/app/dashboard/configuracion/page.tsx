import { Suspense } from 'react'
import { TopNav } from '@/components/dashboard'
import { ConfiguracionContent } from './configuracion-content'
import { getUserProfile, getNotificacionesConfig, getIntegracionesStatus, getSubscriptionData, getAuthUserId } from './actions'

export default async function ConfiguracionPage() {
  const [profile, notificaciones, integraciones, billingData, authUserId] = await Promise.all([
    getUserProfile(),
    getNotificacionesConfig(),
    getIntegracionesStatus(),
    getSubscriptionData(),
    getAuthUserId(),
  ])

  return (
    <>
      <TopNav
        title="Configuración"
        subtitle="Ajustes de la plataforma"
      />

      <Suspense fallback={<div className="p-6">Cargando...</div>}>
        <ConfiguracionContent
          profile={profile}
          notificaciones={notificaciones}
          integraciones={integraciones}
          subscription={billingData.subscription}
          usage={billingData.usage}
          userId={authUserId || ''}
          email={profile?.email || ''}
        />
      </Suspense>
    </>
  )
}
