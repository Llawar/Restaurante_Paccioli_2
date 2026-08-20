import { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Loader2,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { productosApi } from '../services/productos.service';
import { categoriasApi } from '../services/categorias.service';
import socket from '../services/socket';

function Productos() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(['Todas']);
  const [categoriaOptions, setCategoriaOptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Estados para manejo de imágenes
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria_id: ''
  });
  const [editFormData, setEditFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    categoria_id: '',
    imagen: '',
    activo: true
  });

  useEffect(() => {
    fetchProducts();
    fetchCategorias();

    socket.on('products:changed', () => {
      console.log('Productos actualizados desde el servidor, recargando...');
      fetchProducts();
    });
    socket.on('categories:changed', () => {
      fetchCategorias();
      fetchProducts();
    });

    return () => {
      socket.off('products:changed');
      socket.off('categories:changed');
    };
  }, []);

  const fetchCategorias = async () => {
    try {
      const response = await categoriasApi.getAll();
      const data = response.data?.data || [];
      setCategoriaOptions(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productosApi.getAllAdmin();
      const productosData = response.data?.data || [];
      
      // Transformar datos de la API al formato del componente
      const formattedProducts = productosData.map(p => ({
        id: p.id,
        name: p.nombre,
        description: p.descripcion,
        category: p.categoria_nombre || p.categoria || 'Sin categoría',
        price: parseFloat(p.precio) || 0,
        sold: p.vendidos || 0,
        status: p.activo ? 'activo' : 'inactivo',
        image: p.imagen && p.imagen.startsWith('/uploads/') 
          ? `${(import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3006/api`).replace(/\/api$/, '')}${p.imagen}` 
          : getEmojiForCategory(p.categoria_nombre || p.categoria)
      }));
      
      setProducts(formattedProducts);
      
      // Extraer categorías únicas
      const uniqueCategories = ['Todas', ...new Set(formattedProducts.map(p => p.category))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error cargando productos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmojiForCategory = (category) => {
    const emojis = {
      'Hamburguesas': '🍔',
      'Pizzas': '🍕',
      'Mexicana': '�',
      'Ensaladas': '🥗',
      'Platos Fuertes': '🍗',
      'Pastas': '🍝',
      'Sushi': '🍣',
      'Sandwiches': '🥪',
      'Bebidas': '🥤',
      'Postres': '🍰'
    };
    return emojis[category] || '🍽️';
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      try {
        await productosApi.delete(id);
        await fetchProducts(); // Recargar lista
        alert('Producto eliminado correctamente');
      } catch (error) {
        console.error('Error eliminando producto:', error);
        alert('Error al eliminar el producto: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await productosApi.toggleStatus(id);
      fetchProducts(); // Recargar lista
    } catch (error) {
      console.error('Error cambiando estado:', error);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Crear FormData para enviar imagen
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', formData.nombre);
      formDataToSend.append('descripcion', formData.descripcion);
      formDataToSend.append('precio', formData.precio);
      formDataToSend.append('categoria_id', formData.categoria_id);
      if (selectedImage) {
        formDataToSend.append('imagen', selectedImage);
      }
      
      await productosApi.create(formDataToSend);
      setIsModalOpen(false);
      setFormData({
        nombre: '',
        descripcion: '',
        precio: '',
        categoria_id: ''
      });
      clearImage();
      await fetchProducts();
    } catch (error) {
      console.error('Error creando producto:', error);
      const serverMessage = error.response?.data?.message;
      alert(serverMessage || 'Error al crear el producto: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (product) => {
    const categoria = categoriaOptions.find(c => c.nombre === product.category);
    setEditingProduct(product);
    setEditFormData({
      nombre: product.name || '',
      descripcion: product.description || '',
      precio: product.price || '',
      categoria_id: categoria ? String(categoria.id) : '',
      imagen: product.image || '',
      activo: product.status === 'activo'
    });
    // Limpiar imagen seleccionada al abrir modal
    clearImage();
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Crear FormData para enviar imagen
      const formDataToSend = new FormData();
      formDataToSend.append('nombre', editFormData.nombre);
      formDataToSend.append('descripcion', editFormData.descripcion);
      formDataToSend.append('precio', editFormData.precio);
      formDataToSend.append('categoria_id', editFormData.categoria_id);
      formDataToSend.append('activo', editFormData.activo ? 1 : 0);
      if (selectedImage) {
        formDataToSend.append('imagen', selectedImage);
      }
      
      await productosApi.update(editingProduct.id, formDataToSend);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      clearImage();
      await fetchProducts();
    } catch (error) {
      console.error('Error actualizando producto:', error);
      const serverMessage = error.response?.data?.message;
      alert(serverMessage || 'Error al actualizar el producto: ' + (error.message || 'Error desconocido'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar datos
  const filteredData = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'todas' || product.category.toLowerCase() === categoryFilter;
    const matchesStatus = statusFilter === 'todos' || product.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status) => {
    if (status === 'activo') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
          Activo
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
        Inactivo
      </span>
    );
  };

  const totalPages = Math.ceil(filteredData.length / 10);

  // Funciones para manejo de imágenes
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndSetImage(file);
    }
  };

  const validateAndSetImage = (file) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const allowedExtensions = /\.(jpe?g|png|webp|gif)$/i;
    const validType = allowedTypes.includes(file.type) || file.type === '';
    if (!validType || !allowedExtensions.test(file.name)) {
      alert('Imagen no admitida. Formatos permitidos: JPEG, JPG, PNG, WEBP o GIF');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es muy grande. Máximo 5MB');
      return;
    }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) validateAndSetImage(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const ImageUploadComponent = () => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Imagen del producto
      </label>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
          isDragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
        }`}
      >
        {imagePreview ? (
          <div className="relative">
            <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
            <button
              type="button"
              onClick={clearImage}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-600">
              Arrastra una imagen o <span className="text-primary font-medium">clic para seleccionar</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Formatos: JPEG, JPG, PNG, WEBP, GIF (máx. 5MB)
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500 mt-1">
            {products.length} productos en tu catálogo
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg shadow-lg shadow-primary/30 transition-all"
        >
          <Plus size={18} />
          Agregar Producto
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div className="flex gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white min-w-[160px]"
            >
              <option value="todas">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat.toLowerCase()}>{cat}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white min-w-[140px]"
            >
              <option value="todos">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Producto</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Categoría</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Precio</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Vendidos</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Estado</th>
                <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((product) => (
                <tr 
                  key={product.id} 
                  className="hover:bg-gray-50 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center overflow-hidden">
                        {product.image?.startsWith('http') ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl">{product.image}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">{product.name}</p>
                        <p className="text-sm text-gray-500 line-clamp-1 max-w-xs">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900">Bs {product.price.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{product.sold}</span>
                      <span className="text-xs text-gray-500">vendidos</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(product.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => openEditModal(product)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" 
                        title="Editar producto"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed size={32} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron productos</h3>
            <p className="text-gray-500">Intenta ajustar los filtros o agrega un nuevo producto</p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{filteredData.length}</span> de <span className="font-medium">{products.length}</span> productos
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm text-gray-600">
              Página {currentPage} de {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal - Nuevo Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Nuevo Producto</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ej: Hamburguesa Clásica"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Descripción del producto..."
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.precio}
                    onChange={(e) => setFormData({...formData, precio: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({...formData, categoria_id: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                    required
                  >
                    <option value="" disabled>Seleccionar categoría...</option>
                    {categoriaOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <ImageUploadComponent />
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Editar Producto */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Editar Producto</h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del producto</label>
                <input
                  type="text"
                  required
                  value={editFormData.nombre}
                  onChange={(e) => setEditFormData({...editFormData, nombre: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Ej: Hamburguesa Clásica"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={editFormData.descripcion}
                  onChange={(e) => setEditFormData({...editFormData, descripcion: e.target.value})}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Descripción del producto..."
                  rows="3"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={editFormData.precio}
                    onChange={(e) => setEditFormData({...editFormData, precio: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                  <select
                    value={editFormData.categoria_id}
                    onChange={(e) => setEditFormData({...editFormData, categoria_id: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                    required
                  >
                    <option value="" disabled>Seleccionar categoría...</option>
                    {categoriaOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del producto</label>
                <ImageUploadComponent />
                {editFormData.imagen && !imagePreview && (
                  <p className="text-xs text-gray-500 mt-1">Imagen actual: {editFormData.imagen}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estado"
                      checked={editFormData.activo}
                      onChange={() => setEditFormData({...editFormData, activo: true})}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-gray-700">Activo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="estado"
                      checked={!editFormData.activo}
                      onChange={() => setEditFormData({...editFormData, activo: false})}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-sm text-gray-700">Inactivo</span>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Productos;
