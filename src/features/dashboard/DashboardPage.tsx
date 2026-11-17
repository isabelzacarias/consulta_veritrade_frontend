import { AppHeader } from '@/components/layout/AppHeader'

export function DashboardPage() {
  return (
    <div className="horbis-canvas min-h-screen text-slate-900">
      <AppHeader
        title="Veritrade Analytics"
        subtitle="Observatorio de comercio exterior · HORBIS"
      />

      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h1>
      </main>
    </div>
  )
}
