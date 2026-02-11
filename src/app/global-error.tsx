'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="es">
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#f8fafc',
          padding: '1rem',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
            <div style={{ marginBottom: '2rem' }}>
              <span style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                color: '#0f3460',
                fontFamily: 'monospace',
              }}>
                500
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#0f172a' }}>
              Error del servidor
            </h1>
            <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: 1.6 }}>
              Ocurrio un error inesperado. Por favor intenta nuevamente.
            </p>

            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#0f3460',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>

            <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: '#94a3b8' }}>
              HV Consultores — Transformacion Digital Contable
            </p>
          </div>
        </div>
      </body>
    </html>
  )
}
