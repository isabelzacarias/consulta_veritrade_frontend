import { Navigate, Route, Routes } from 'react-router-dom'
import { ImportacionesPage } from '@/features/importaciones/ImportacionesPage'
import { ComprasPage } from '@/features/compras/ComprasPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<ImportacionesPage />} />
      <Route path="/compras" element={<ComprasPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
