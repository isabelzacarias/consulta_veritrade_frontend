import { Navigate, Route, Routes } from 'react-router-dom'
import { ImportacionesPage } from '@/features/importaciones/ImportacionesPage'
import { ComprasPage } from '@/features/compras/ComprasPage'
import { ChatWidget } from '@/features/chatbot/ChatWidget'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<ImportacionesPage />} />
        <Route path="/compras" element={<ComprasPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ChatWidget />
    </>
  )
}

export default App
