import { Navigate, Route, Routes } from 'react-router-dom'
import { ImportacionesPage } from '@/features/importaciones/ImportacionesPage'
import { ComprasPage } from '@/features/compras/ComprasPage'
import { ChatWidget } from '@/features/chatbot/ChatWidget'
import { AuthGate } from '@/features/auth/AuthGate'
import { useAuth } from '@/features/auth/AuthContext'
import { SuiteRedirectPage } from '@/features/suite/SuiteRedirectPage'

function App() {
  const auth = useAuth()
  const canViewImportaciones = auth.hasPermission('compras.ver')
  const home = canViewImportaciones ? '/importaciones' : '/compras'

  return (
    <AuthGate>
      <Routes>
        <Route path="/" element={<Navigate to={home} replace />} />
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
        <Route path="/compras" element={<ComprasPage />} />
        <Route path="/suite" element={<SuiteRedirectPage />} />
        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>

      <ChatWidget />
    </AuthGate>
  )
}

export default App
