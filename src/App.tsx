import { Navigate, Route, Routes } from 'react-router-dom'
import { ImportacionesPage } from '@/features/importaciones/ImportacionesPage'
import { ComprasPage } from '@/features/compras/ComprasPage'
import { ChatWidget } from '@/features/chatbot/ChatWidget'
import { AuthGate } from '@/features/auth/AuthGate'
import { SuiteRedirectPage } from '@/features/suite/SuiteRedirectPage'

function App() {
  return (
    <AuthGate>
      <Routes>
        <Route path="/" element={<Navigate to="/importaciones" replace />} />
        <Route path="/importaciones" element={<ImportacionesPage />} />
        <Route path="/compras" element={<ComprasPage />} />
        <Route path="/suite" element={<SuiteRedirectPage />} />
        <Route path="*" element={<Navigate to="/importaciones" replace />} />
      </Routes>

      <ChatWidget />
    </AuthGate>
  )
}

export default App
