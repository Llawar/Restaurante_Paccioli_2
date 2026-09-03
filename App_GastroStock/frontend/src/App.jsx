import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Manual from './pages/Manual'
import Productos from './pages/Productos'
import Categorias from './pages/Categorias'
import Subcategorias from './pages/Subcategorias'
import Unidades from './pages/Unidades'
import Ubicaciones from './pages/Ubicaciones'
import Proveedores from './pages/Proveedores'
import Compras from './pages/Compras'
import Lotes from './pages/Lotes'
import Kardex from './pages/Kardex'
import InventarioFisico from './pages/InventarioFisico'
import Alertas from './pages/Alertas'

function AppRoutes() {
  const location = useLocation();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard key={location.key} />} />
        <Route path="manual" element={<Manual key={location.key} />} />
        <Route path="productos" element={<Productos key={location.key} />} />
        <Route path="categorias" element={<Categorias key={location.key} />} />
        <Route path="subcategorias" element={<Subcategorias key={location.key} />} />
        <Route path="unidades" element={<Unidades key={location.key} />} />
        <Route path="ubicaciones" element={<Ubicaciones key={location.key} />} />
        <Route path="proveedores" element={<Proveedores key={location.key} />} />
        <Route path="compras" element={<Compras key={location.key} />} />
        <Route path="lotes" element={<Lotes key={location.key} />} />
        <Route path="kardex" element={<Kardex key={location.key} />} />
        <Route path="inventario-fisico" element={<InventarioFisico key={location.key} />} />
        <Route path="alertas" element={<Alertas key={location.key} />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
