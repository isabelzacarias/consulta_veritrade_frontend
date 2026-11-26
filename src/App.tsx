import { Navigate, Route, Routes } from 'react-router-dom'
import { ImportacionesPage } from '@/features/importaciones/ImportacionesPage'
import { ComprasPage } from '@/features/compras/ComprasPage'
import { ChatWidget } from '@/features/chatbot/ChatWidget'
import { AuthGate } from '@/features/auth/AuthGate'
import { useAuth } from '@/features/auth/AuthContext'
import { SuiteRedirectPage } from '@/features/suite/SuiteRedirectPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/features/dashboard/DashboardPage'

function App() {
  const auth = useAuth()
  const canViewImportaciones = auth.hasPermission('compras.ver')

  return (
    <AuthGate>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route
            path="/importaciones"
            element={
              canViewImportaciones ? (
                <ImportacionesPage />
              ) : (
                <Navigate to="/compras" replace />
              )
            }
          />
          <Route path="/miscompras" element={<ComprasPage />} />
        </Route>
        <Route path="/suite" element={<SuiteRedirectPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ChatWidget />
    </AuthGate>
  )
}

export default App
