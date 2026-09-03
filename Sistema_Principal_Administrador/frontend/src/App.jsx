import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './pages/Login'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Inventario from './pages/Inventario'
import Productos from './pages/Productos'
import Usuarios from './pages/Usuarios'
import ClientesDelivery from './pages/ClientesDelivery'
import Caja from './pages/Caja'
import Pedidos from './pages/Pedidos'
import Delivery from './pages/Delivery'
import Reportes from './pages/Reportes'
import Categorias from './pages/Categorias'
import Puestos from './pages/Puestos'

function AppRoutes() {
  const location = useLocation();
  
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard key={location.key} />} />
        <Route path="inventario" element={<Inventario key={location.key} />} />
        <Route path="productos" element={<Productos key={location.key} />} />
        <Route path="usuarios" element={<Usuarios key={location.key} />} />
        <Route path="clientes-delivery" element={<ClientesDelivery key={location.key} />} />
        <Route path="caja" element={<Caja key={location.key} />} />
        <Route path="pedidos" element={<Pedidos key={location.key} />} />
        <Route path="delivery" element={<Delivery key={location.key} />} />
        <Route path="reportes" element={<Reportes key={location.key} />} />
        <Route path="categorias" element={<Categorias key={location.key} />} />
        <Route path="puestos" element={<Puestos key={location.key} />} />
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
