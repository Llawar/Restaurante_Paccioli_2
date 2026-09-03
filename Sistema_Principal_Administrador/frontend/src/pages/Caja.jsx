import { useState, useEffect, useMemo } from 'react'
import { Search, ShoppingCart, Plus, Minus, X, Trash2, UtensilsCrossed, Package, CreditCard, User, Table2 } from 'lucide-react'
import { productosApi } from '../services/productos.service'
import { pedidosApi } from '../services/pedidos.service'
import api from '../services/api'

const getImageUrl = (raw) => {
  if (!raw) return null
  if (raw.startsWith('http')) return raw
  if (raw.startsWith('/uploads/')) {
    const base = (api.defaults.baseURL || `http://${window.location.hostname}:3006/api`).replace(/\/api\/?$/, '')
    return `${base}${raw}`
  }
  // fallback por si viene como 'productos/...'
  if (raw.startsWith('productos/')) {
    const base = (api.defaults.baseURL || `http://${window.location.hostname}:3006/api`).replace(/\/api\/?$/, '')
    return `${base}/uploads/${raw}`
  }
  return null
}

function Caja() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('todos')
  const [cart, setCart] = useState([])
  const [tipo, setTipo] = useState('mesa')
  const [mesaId, setMesaId] = useState('')
  const [clienteNombre, setClienteNombre] = useState('')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          productosApi.getAll(),
          api.get('/categorias').catch(() => ({ data: { data: [] } }))
        ])
        setProductos(prodRes.data?.data || [])
        setCategorias(catRes.data?.data || [])
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    return productos.filter(p => {
      const matchCat = catFilter === 'todos' || String(p.categoria_id) === String(catFilter)
      const matchSearch = p.nombre.toLowerCase().includes(search.toLowerCase())
      const isActivo = p.activo === undefined ? p.estado !== 'inactivo' : (p.activo === 1 || p.activo === true || p.activo === '1')
      const isDisp = p.disponible === undefined ? true : (p.disponible === 1 || p.disponible === true || p.disponible === '1')
      return matchCat && matchSearch && isActivo && isDisp
    })
  }, [productos, search, catFilter])

  const subtotal = cart.reduce((a, c) => a + c.precio * c.cantidad, 0)

  const addToCart = (prod) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === prod.id)
      if (ex) return prev.map(i => i.id === prod.id ? { ...i, cantidad: i.cantidad + 1 } : i)
      return [...prev, { id: prod.id, nombre: prod.nombre, precio: parseFloat(prod.precio), cantidad: 1 }]
    })
  }
  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, cantidad: Math.max(1, i.cantidad + delta) } : i))
  }
  const removeItem = (id) => setCart(prev => prev.filter(i => i.id !== id))

  const handleSubmit = async () => {
    if (cart.length === 0) return alert('Agrega productos al carrito')
    if (tipo === 'mesa' && !mesaId) return alert('Selecciona número de mesa')
    setSending(true)
    try {
      const items = cart.map(c => ({ producto_id: c.id, cantidad: c.cantidad, precio_unitario: c.precio }))
      const payload = {
        tipo,
        mesa_id: tipo === 'mesa' ? parseInt(mesaId) : null,
        cliente_id: null,
        items,
        total: subtotal,
        notas: `${clienteNombre ? `Cliente: ${clienteNombre} | ` : ''}${notas}`.trim() || null
      }
      const res = await pedidosApi.create(payload)
      setSuccess(res.data?.data?.id)
      setCart([]); setClienteNombre(''); setNotas(''); setMesaId('')
      setTimeout(() => setSuccess(null), 4000)
    } catch (e) {
      alert(e.response?.data?.message || 'Error al crear pedido')
    } finally { setSending(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">Cargando productos...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2"><UtensilsCrossed className="text-primary" /> Caja — Nuevo Pedido</h1>
        <p className="text-gray-400 text-sm mt-1">Rol empleado / admin — crea pedidos presenciales para clientes en local</p>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">✓ Pedido #{success} creado y enviado a cocina</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Productos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar producto..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-primary/20" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-4 py-2.5 bg-gray-50 rounded-lg outline-none border border-gray-100">
              <option value="todos">Todas categorías</option>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {filtered.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden text-left hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
                <div className="w-full h-28 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-100 to-amber-200 flex flex-col items-center justify-center gap-1">
                    <Package size={28} className="text-orange-500" />
                    <span className="text-lg font-bold text-orange-600">{String(p.nombre).charAt(0).toUpperCase()}</span>
                  </div>
                  {getImageUrl(p.imagen || p.imagen_url || p.image_url) && (
                    <img src={getImageUrl(p.imagen || p.imagen_url || p.image_url)} alt={p.nombre} className="absolute inset-0 w-full h-full object-cover" onError={e=>{e.currentTarget.style.display='none'}} />
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <p className="font-semibold text-gray-900 text-sm line-clamp-1">{p.nombre}</p>
                  <p className="text-xs text-gray-400 line-clamp-1">{p.categoria_nombre || ''}</p>
                  <p className="text-primary font-bold mt-2">Bs {parseFloat(p.precio).toFixed(2)}</p>
                  <button onClick={() => addToCart(p)} className="mt-2 inline-flex items-center gap-1 text-xs bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-full self-start transition-colors"><Plus size={12} /> Agregar</button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="col-span-full text-center text-gray-400 py-10">Sin productos</p>}
          </div>
        </div>

        {/* Carrito */}
        <div className="bg-white rounded-xl border border-gray-100 flex flex-col max-h-[78vh]">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2"><ShoppingCart size={18} className="text-primary" /> Carrito</h3>
            <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{cart.reduce((a,b)=>a+b.cantidad,0)} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? <p className="text-center text-gray-400 py-10"><Package className="mx-auto mb-2 opacity-50" /> Carrito vacío</p> :
              cart.map(item => {
                const prod = productos.find(pr=>pr.id===item.id)
                const img = getImageUrl(prod?.imagen || prod?.imagen_url)
                return (
                <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                  <div className="w-10 h-10 rounded-lg bg-white border flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {img ? <img src={img} alt={item.nombre} className="w-full h-full object-cover" onError={e=>e.target.style.display='none'} /> : <Package size={16} className="text-gray-300" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.nombre}</p>
                    <p className="text-xs text-gray-500">Bs {item.precio.toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.id,-1)} className="w-7 h-7 bg-white border rounded flex items-center justify-center"><Minus size={14} /></button>
                    <span className="w-6 text-center text-sm font-bold">{item.cantidad}</span>
                    <button onClick={() => updateQty(item.id,1)} className="w-7 h-7 bg-white border rounded flex items-center justify-center"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
                )
              })}
          </div>

          <div className="p-4 border-t border-gray-100 space-y-3 bg-gray-50/50">
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-gray-500">Tipo
                <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full mt-1 px-3 py-2 bg-white border rounded-lg text-sm">
                  <option value="mesa">Mesa</option>
                  <option value="para_llevar">Para llevar</option>
                </select>
              </label>
              <label className="text-xs text-gray-500 flex flex-col">Mesa
                <span className="relative mt-1">
                  <Table2 size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="number" min="1" value={mesaId} onChange={e => setMesaId(e.target.value)} placeholder="N°" disabled={tipo!=='mesa'} className="w-full pl-7 pr-2 py-2 bg-white border rounded-lg text-sm disabled:bg-gray-100" />
                </span>
              </label>
            </div>
            <label className="text-xs text-gray-500 flex flex-col">Cliente (opcional)
              <span className="relative mt-1">
                <User size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Nombre cliente" className="w-full pl-7 pr-2 py-2 bg-white border rounded-lg text-sm" />
              </span>
            </label>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas (ej: sin cebolla)" rows={2} className="w-full px-3 py-2 bg-white border rounded-lg text-sm" />
            <div className="flex items-center justify-between font-bold text-lg">
              <span>Total</span><span className="text-primary">Bs {subtotal.toFixed(2)}</span>
            </div>
            <button onClick={handleSubmit} disabled={sending || cart.length===0} className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50">
              <CreditCard size={18} /> {sending ? 'Enviando...' : 'Crear Pedido'}
            </button>
            {cart.length>0 && <button onClick={()=>setCart([])} className="w-full text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1"><X size={14}/> Vaciar carrito</button>}
          </div>
        </div>
      </div>
    </div>
  )
}
export default Caja
