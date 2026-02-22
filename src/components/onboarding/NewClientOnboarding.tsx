'use client'

import { useState, useCallback } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { AnimatePresence, motion } from 'framer-motion'
import { Building, Scale, BookOpen, Landmark, KeyRound, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { StepProgress } from './StepProgress'
import {
  DatosBasicosStep,
  RegimenStep,
  PlanCuentasStep,
  CuentaBancariaStep,
  CredencialesSIIStep,
  ResumenStep,
} from './steps'

const STEPS = [
  { label: 'Datos Básicos', icon: Building },
  { label: 'Régimen', icon: Scale },
  { label: 'Plan Cuentas', icon: BookOpen, optional: true },
  { label: 'Cuenta Bancaria', icon: Landmark, optional: true },
  { label: 'Credenciales SII', icon: KeyRound, optional: true },
  { label: 'Resumen', icon: CheckCircle },
]

interface OnboardingData {
  datosBasicos: {
    razon_social: string
    rut: string
    nombre_fantasia: string
    giro: string
    direccion: string
    comuna: string
    region: string
    tasa_ppm: string
  } | null
  regimen: string | null
  planCuentas: boolean | null
  cuentaBancaria: {
    banco: string
    tipo_cuenta: string
    numero_cuenta: string
  } | null
  credenciales: {
    rut_usuario: string
    clave: string
  } | null
}

export function NewClientOnboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [data, setData] = useState<OnboardingData>({
    datosBasicos: null,
    regimen: null,
    planCuentas: null,
    cuentaBancaria: null,
    credenciales: null,
  })

  const createCliente = useMutation(api.clients.createCliente)
  const updateCliente = useMutation(api.clients.updateCliente)
  const createBankAccount = useMutation(api.banks.createBankAccount)
  const createCredencial = useMutation(api.credenciales.createCredencial)

  const goForward = useCallback((step?: number) => {
    setDirection(1)
    setCurrentStep((prev) => step ?? prev + 1)
  }, [])

  const goBack = useCallback((step?: number) => {
    setDirection(-1)
    setCurrentStep((prev) => step ?? prev - 1)
  }, [])

  // Step 1: Datos Básicos — creates the client in Convex
  const handleDatosBasicos = useCallback(async (formData: NonNullable<OnboardingData['datosBasicos']>) => {
    setData((prev) => ({ ...prev, datosBasicos: formData }))

    try {
      if (!clienteId) {
        const id = await createCliente({
          razon_social: formData.razon_social,
          rut: formData.rut,
          nombre_fantasia: formData.nombre_fantasia || undefined,
          giro: formData.giro || undefined,
        })
        const idStr = id as unknown as string
        setClienteId(idStr)

        // Update with extra fields
        if (formData.direccion || formData.comuna || formData.region || formData.tasa_ppm) {
          await updateCliente({
            id: idStr as any,
            direccion: formData.direccion || undefined,
            comuna: formData.comuna || undefined,
            region: formData.region || undefined,
            tasa_ppm: formData.tasa_ppm ? parseFloat(formData.tasa_ppm) : undefined,
          })
        }
      } else {
        await updateCliente({
          id: clienteId as any,
          razon_social: formData.razon_social,
          rut: formData.rut,
          nombre_fantasia: formData.nombre_fantasia || undefined,
          giro: formData.giro || undefined,
          direccion: formData.direccion || undefined,
          comuna: formData.comuna || undefined,
          region: formData.region || undefined,
          tasa_ppm: formData.tasa_ppm ? parseFloat(formData.tasa_ppm) : undefined,
        })
      }
      toast.success('Cliente creado exitosamente')
    } catch (err) {
      console.error('Error creating/updating client:', err)
      toast.error('Error al crear el cliente')
    }

    goForward()
  }, [clienteId, createCliente, updateCliente, goForward])

  // Step 2: Régimen Tributario
  const handleRegimen = useCallback(async (regimen: string) => {
    setData((prev) => ({ ...prev, regimen }))

    if (clienteId) {
      try {
        await updateCliente({
          id: clienteId as any,
          regimen_tributario: regimen as any,
        })
        toast.success('Régimen tributario configurado')
      } catch (err) {
        console.error('Error updating régimen:', err)
        toast.error('Error al configurar régimen')
      }
    }

    goForward()
  }, [clienteId, updateCliente, goForward])

  // Step 3: Plan de Cuentas
  const handlePlanCuentas = useCallback((accepted: boolean) => {
    setData((prev) => ({ ...prev, planCuentas: accepted }))
    goForward()
  }, [goForward])

  // Step 4: Cuenta Bancaria
  const handleCuentaBancaria = useCallback(async (cuentaData: OnboardingData['cuentaBancaria']) => {
    setData((prev) => ({ ...prev, cuentaBancaria: cuentaData }))

    if (cuentaData && clienteId) {
      try {
        await createBankAccount({
          cliente_id: clienteId as any,
          banco: cuentaData.banco as any,
          tipo_cuenta: cuentaData.tipo_cuenta as any,
          numero_cuenta: cuentaData.numero_cuenta,
        })
        toast.success('Cuenta bancaria agregada')
      } catch (err) {
        console.error('Error creating bank account:', err)
        toast.error('Error al agregar cuenta bancaria')
      }
    }

    goForward()
  }, [clienteId, createBankAccount, goForward])

  // Step 5: Credenciales SII
  const handleCredenciales = useCallback(async (credData: OnboardingData['credenciales']) => {
    setData((prev) => ({ ...prev, credenciales: credData }))

    if (credData && clienteId) {
      try {
        await createCredencial({
          cliente_id: clienteId as any,
          portal: 'SII_MIPYME',
          usuario_encriptado: credData.rut_usuario,
          password_encriptado: credData.clave,
        })
        toast.success('Credenciales SII guardadas')
      } catch (err) {
        console.error('Error creating credentials:', err)
        toast.error('Error al guardar credenciales')
      }
    }

    goForward()
  }, [clienteId, createCredencial, goForward])

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <DatosBasicosStep
            data={data.datosBasicos}
            onNext={handleDatosBasicos}
          />
        )
      case 1:
        return (
          <RegimenStep
            data={data.regimen}
            onNext={handleRegimen}
            onBack={() => goBack()}
          />
        )
      case 2:
        return (
          <PlanCuentasStep
            regimen={data.regimen ?? '14D'}
            onNext={handlePlanCuentas}
            onBack={() => goBack()}
          />
        )
      case 3:
        return (
          <CuentaBancariaStep
            data={data.cuentaBancaria}
            onNext={handleCuentaBancaria}
            onBack={() => goBack()}
          />
        )
      case 4:
        return (
          <CredencialesSIIStep
            data={data.credenciales}
            onNext={handleCredenciales}
            onBack={() => goBack()}
          />
        )
      case 5:
        return (
          <ResumenStep
            data={data}
            clienteId={clienteId}
            onBack={() => goBack()}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <StepProgress steps={STEPS} currentStep={currentStep} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentStep}
          initial={{ x: direction > 0 ? 80 : -80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: direction > 0 ? -80 : 80, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
