import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { ConvexClientProvider } from '@/providers/convex-provider'
import { Toaster } from 'sonner'
import './globals.css'

// Executive body font - clean, modern, professional
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Authoritative heading font - sophisticated serif
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// Data/numbers font - precise monospace
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'HV Consultores - Transformacion Digital Contable',
    template: '%s | HV Consultores',
  },
  description: 'Plataforma de automatización inteligente para servicios contables y tributarios. Optimice sus procesos con tecnología de vanguardia.',
  keywords: ['contabilidad', 'automatización', 'F29', 'SII', 'Chile', 'IA', 'machine learning', 'RPA', 'clasificación', 'consultoría'],
  authors: [{ name: 'HV Consultores' }],
  creator: 'HV Consultores',
  publisher: 'HV Consultores',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'HV Consultores - Transformacion Digital Contable',
    description: 'Plataforma de automatizacion inteligente para servicios contables y tributarios.',
    type: 'website',
    locale: 'es_CL',
    siteName: 'HV Consultores',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HV Consultores',
    description: 'Automatizacion inteligente para servicios contables.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans`}>
        <ConvexClientProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ConvexClientProvider>
      </body>
    </html>
  )
}
