import { useEffect } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { SUITE_URL } from '@/lib/suite'

export function SuiteRedirectPage() {
  useEffect(() => {
    window.location.replace(SUITE_URL)
  }, [])

  return (
    <div className="horbis-canvas grid min-h-screen place-items-center px-4 py-10 text-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-brand-100 bg-white/95 p-8 text-center shadow-xl shadow-brand-950/10">
        <Loader2 className="mx-auto size-9 animate-spin text-brand-600" />
        <h1 className="mt-4 text-lg font-semibold tracking-tight">
          Abriendo la suite
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Te estamos redirigiendo al proyecto de la suite.
        </p>
        <a
          href={SUITE_URL}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-700 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-brand-800"
        >
          <ExternalLink className="size-3.5" />
          Ir a la suite
        </a>
      </div>
    </div>
  )
}
