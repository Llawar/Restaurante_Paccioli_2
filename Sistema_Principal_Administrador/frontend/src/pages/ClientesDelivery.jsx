import { useState, useEffect } from 'react'
import { Search, RefreshCw, Truck, ShieldAlert, Ban, Loader2, Users, UserCheck, Clock } from 'lucide-react'
import { clientesDeliveryApi } from '../services/clientesDelivery.service'
import socket from '../services/socket'

function StatusBadge({ text, variant }) {
  const variants = {
    client: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    delivery: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    synced: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  }
  const s = variants[variant] || variants.client
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`}></span>
      {text}
    </span>
  )
}

export default function ClientesDelivery() {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('todos')
  const [syncing, setSyncing] = useState(false)

  const fetch = async () => {
    try {
      setLoading(true)
      const r = await clientesDeliveryApi.getAll()
      setClientes(r.data?.data || [])
    } catch (e) {
      console.error('Error clientes delivery:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch()
    socket.on('clientes:changed', fetch)
    return () => socket.off('clientes:changed', fetch)
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try {
      await clientesDeliveryApi.syncNow()
      await fetch()
    } finally {
      setSyncing(false)
    }
  }

  const handlePromote = async (id) => {
    if (!confirm('¿Promover este cliente a repartidor? Se creará un usuario delivery.')) return
    try {
      await clientesDeliveryApi.promote(id)
      fetch()
    } catch (e) {
      alert(e.response?.data?.message || 'Error al promover')
    }
  }

  const handleDemote = async (id) => {
    if (!confirm('¿Revertir delivery a cliente?')) return
    try {
      await clientesDeliveryApi.demote(id)
      fetch()
    } catch (e) {
      alert(e.response?.data?.message || 'Error')
    }
  }

  const handleBlock = async (id) => {
    try {
      await clientesDeliveryApi.toggleBlock(id)
      fetch()
    } catch (e) {
      alert('Error al bloquear')
    }
  }

  const filtered = clientes.filter(c => {
    const matchSearch = (c.nombre + c.email + c.telefono).toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'todos' || c.supabase_rol === filter
    return matchSearch && matchFilter
  })

  const total = clientes.length
  const deliveryCount = clientes.filter(c => c.supabase_rol === 'delivery').length
  const clientCount = clientes.filter(c => c.supabase_rol === 'client').length

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Clientes Delivery</h1>
          <p className="text-sm text-gray-400 mt-1">Sincronizados desde Supabase (app delivery) · {total} clientes</p>
        </div>
        <button onClick={handleSync} disabled={syncing} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} /> {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><Users size={22} /></div>
          <div><p className="text-2xl font-bold">{total}</p><p className="text-sm text-gray-500">Total clientes</p></div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><Truck size={22} /></div>
          <div><p className="text-2xl font-bold">{deliveryCount}</p><p className="text-sm text-gray-500">Repartidores</p></div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><UserCheck size={22} /></div>
          <div><p className="text-2xl font-bold">{clientCount}</p><p className="text-sm text-gray-500">Solo clientes</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-100 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, email o teléfono..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white">
          <option value="todos">Todos</option>
          <option value="client">Solo clientes</option>
          <option value="delivery">Repartidores</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Contacto</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Origen</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">No hay clientes sincronizados. Registra uno en la app delivery o pulsa Sincronizar.</td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{c.nombre}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} />{new Date(c.created_at).toLocaleDateString('es-ES')}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <p>{c.email || '—'}</p><p className="text-xs">{c.telefono || '—'}</p>
                  </td>
                  <td className="px-6 py-4"><StatusBadge text={c.supabase_rol === 'delivery' ? 'Delivery' : 'Cliente'} variant={c.supabase_rol} /></td>
                  <td className="px-6 py-4 text-xs text-gray-500">Supabase<br /><span className="text-[11px] text-gray-400">{c.supabase_id?.slice(0,8)}…</span></td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {c.supabase_rol !== 'delivery' ? (
                        <button onClick={() => handlePromote(c.id)} className="px-3 py-1.5 rounded-lg border text-xs hover:bg-green-50 hover:text-green-600 flex items-center gap-1"><Truck size={14} /> Asignar Delivery</button>
                      ) : (
                        <button onClick={() => handleDemote(c.id)} className="px-3 py-1.5 rounded-lg border text-xs hover:bg-orange-50 hover:text-orange-600">Revertir</button>
                      )}
                      <button onClick={() => handleBlock(c.id)} className="px-3 py-1.5 rounded-lg border text-xs hover:bg-red-50 hover:text-red-600 flex items-center gap-1"><Ban size={14} /> Bloquear</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">💡 Supabase es canal temporal — la fuente de verdad es MySQL. Promover crea un `usuarios` con rol delivery y actualiza Supabase automáticamente.</p>
    </div>
  )
}
