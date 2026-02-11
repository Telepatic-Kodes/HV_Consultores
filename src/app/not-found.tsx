import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <span className="text-7xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-mono">
            404
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight mb-3">
          Pagina no encontrada
        </h1>
        <p className="text-muted-foreground mb-8">
          La pagina que buscas no existe o fue movida.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Volver al inicio
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors"
          >
            Ir al dashboard
          </Link>
        </div>

        <p className="mt-12 text-xs text-muted-foreground">
          HV Consultores &mdash; Transformacion Digital Contable
        </p>
      </div>
    </div>
  )
}
