import 'dart:io';

import 'package:delivery/models/product_model.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class ProductsManagementScreen extends StatefulWidget {
  const ProductsManagementScreen({super.key});

  @override
  State<ProductsManagementScreen> createState() =>
      _ProductsManagementScreenState();
}

class _ProductsManagementScreenState extends State<ProductsManagementScreen> {
  // Categorías predefinidas
  static const List<String> CATEGORIAS_PREDEFINIDAS = [
    'Pizzas',
    'Hamburguesas',
    'Ensaladas',
    'Bebidas',
    'Postres',
    'Sándwiches',
    'Sopas',
    'Frutas',
  ];

  List<Product> _products = [];
  bool _isLoading = true;
  String _searchQuery = '';
  String _selectedCategory = 'Todas';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadProducts();
    });
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    try {
      final response = await Supabase.instance.client
          .from('products')
          .select('*')
          .eq('estado', true)
          .order('nombre', ascending: true);

      final products =
          (response as List).map((json) => Product.fromJson(json)).toList();

      setState(() {
        _products = products;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al cargar productos: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _addProduct(
    Map<String, dynamic> productData, {
    Uint8List? imageBytes,
    File? imageFile,
  }) async {
    try {
      debugPrint('Agregando producto: $productData');

      // Subir imagen si existe
      String? imageUrl;
      if (imageBytes != null || imageFile != null) {
        try {
          final fileName =
              '${DateTime.now().millisecondsSinceEpoch}.jpg';

          if (kIsWeb && imageBytes != null) {
            await Supabase.instance.client.storage
                .from('products')
                .uploadBinary(fileName, imageBytes);
          } else if (imageFile != null) {
            await Supabase.instance.client.storage
                .from('products')
                .uploadBinary(fileName, await imageFile.readAsBytes());
          }

          imageUrl = Supabase.instance.client.storage
              .from('products')
              .getPublicUrl(fileName);
          productData['imagen_url'] = imageUrl;
        } catch (e) {
          debugPrint('Error al subir imagen: $e');
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('⚠️ Producto guardado pero sin imagen: $e'),
                backgroundColor: Colors.orange,
              ),
            );
          }
        }
      }

      final response =
          await Supabase.instance.client
              .from('products')
              .insert(productData)
              .select();
      debugPrint('Respuesta: $response');
      await _loadProducts();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Producto agregado correctamente'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } on PostgrestException catch (e) {
      debugPrint('Error de Supabase: ${e.message}');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Error: ${e.message}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error general: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Error inesperado: $e'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    }
  }

  Future<void> _updateProduct(
    String id,
    Map<String, dynamic> productData, {
    Uint8List? imageBytes,
    File? imageFile,
  }) async {
    try {
      String? imageUrl;
      if (imageBytes != null || imageFile != null) {
        try {
          final fileName =
              '${DateTime.now().millisecondsSinceEpoch}.jpg';

          if (kIsWeb && imageBytes != null) {
            await Supabase.instance.client.storage
                .from('products')
                .uploadBinary(fileName, imageBytes);
          } else if (imageFile != null) {
            await Supabase.instance.client.storage
                .from('products')
                .uploadBinary(fileName, await imageFile.readAsBytes());
          }

          imageUrl = Supabase.instance.client.storage
              .from('products')
              .getPublicUrl(fileName);
          productData['imagen_url'] = imageUrl;
        } catch (e) {
          debugPrint('Error al subir imagen: $e');
        }
      }

      await Supabase.instance.client
          .from('products')
          .update(productData)
          .eq('id', id);
      await _loadProducts();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Producto actualizado correctamente'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al actualizar producto: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _deleteProduct(String id) async {
    try {
      await Supabase.instance.client
          .from('products')
          .update({'estado': false})
          .eq('id', id);
      await _loadProducts();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✅ Producto desactivado correctamente'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error al eliminar producto: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  List<Product> get _filteredProducts {
    return _products.where((product) {
      final matchesSearch =
          _searchQuery.isEmpty ||
          product.nombre.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          product.descripcion.toLowerCase().contains(
            _searchQuery.toLowerCase(),
          );
      final matchesCategory =
          _selectedCategory == 'Todas' ||
          product.categoria == _selectedCategory;
      return matchesSearch && matchesCategory;
    }).toList();
  }

  Widget _buildGroupedProductsList(ThemeData theme, bool isMobile) {
    final grouped = <String, List<Product>>{};
    for (var product in _filteredProducts) {
      grouped.putIfAbsent(product.categoria, () => []).add(product);
    }

    final categories = grouped.keys.toList()..sort();
    final items = <Widget>[];

    for (final category in categories) {
      final products = grouped[category] ?? [];

      // Encabezado de categoría
      items.add(
        Padding(
          padding: EdgeInsets.fromLTRB(
            isMobile ? 12 : 16,
            16,
            isMobile ? 12 : 16,
            8,
          ),
          child: Text(
            category,
            style: TextStyle(
              fontSize: isMobile ? 16 : 18,
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.primary,
            ),
          ),
        ),
      );

      // Productos de la categoría
      for (final product in products) {
        items.add(
          _ProductCard(
            product: product,
            isCompact: isMobile,
            onEdit: () => _showEditProductDialog(context, product),
            onDelete: () => _showDeleteConfirmation(context, product),
          ),
        );
      }

      items.add(const SizedBox(height: 16));
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) => items[index],
        childCount: items.length,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'Gestión de Productos',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.primaryContainer,
                    ],
                  ),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.all(isMobile ? 12 : 16),
              child: Column(
                children: [
                  // Barra de búsqueda
                  TextField(
                    decoration: InputDecoration(
                      hintText: 'Buscar productos...',
                      prefixIcon: const Icon(Icons.search),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      filled: true,
                      fillColor: Colors.grey.shade100,
                    ),
                    onChanged: (value) {
                      setState(() => _searchQuery = value);
                    },
                  ),
                  const SizedBox(height: 16),
                  // Categorías
                  SizedBox(
                    height: 45,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: CATEGORIAS_PREDEFINIDAS.length + 1,
                      itemBuilder: (context, index) {
                        final category =
                            index == 0
                                ? 'Todas'
                                : CATEGORIAS_PREDEFINIDAS[index - 1];
                        final isSelected = _selectedCategory == category;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(category),
                            selected: isSelected,
                            onSelected: (selected) {
                              if (selected) {
                                setState(() => _selectedCategory = category);
                              }
                            },
                            selectedColor: theme.colorScheme.primary,
                            labelStyle: TextStyle(
                              color:
                                  isSelected
                                      ? Colors.white
                                      : theme.colorScheme.primary,
                              fontWeight: FontWeight.w600,
                            ),
                            backgroundColor: theme.colorScheme.primary
                                .withValues(alpha: 0.1),
                          ),
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Resumen
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${_filteredProducts.length} productos',
                        style: TextStyle(
                          fontSize: isMobile ? 14 : 16,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: _loadProducts,
                        icon: const Icon(Icons.refresh, size: 18),
                        label: const Text('Actualizar'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          _isLoading
              ? const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator()),
              )
              : _filteredProducts.isEmpty
              ? SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.shopping_bag_outlined,
                        size: 80,
                        color: Colors.grey.shade400,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No hay productos',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => _showAddProductDialog(context),
                        icon: const Icon(Icons.add),
                        label: const Text('Agregar Producto'),
                      ),
                    ],
                  ),
                ),
              )
              : _buildGroupedProductsList(theme, isMobile),
          const SliverToBoxAdapter(child: SizedBox(height: 80)),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddProductDialog(context),
        icon: const Icon(Icons.add),
        label: const Text('Nuevo'),
        backgroundColor: theme.colorScheme.primary,
      ),
    );
  }

  void _showAddProductDialog(BuildContext context) {
    final formKey = GlobalKey<FormState>();
    final nombreController = TextEditingController();
    final descripcionController = TextEditingController();
    final precioController = TextEditingController();

    String selectedCategoria = CATEGORIAS_PREDEFINIDAS.first;
    File? selectedImage;
    Uint8List? imageBytes;

    showDialog(
      context: context,
      builder:
          (context) => StatefulBuilder(
            builder:
                (context, setState) => Dialog(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: SingleChildScrollView(
                    child: Padding(
                      padding: const EdgeInsets.all(20),
                      child: Form(
                        key: formKey,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Encabezado
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Agregar Nuevo Producto',
                                  style: TextStyle(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                IconButton(
                                  onPressed: () => Navigator.pop(context),
                                  icon: const Icon(Icons.close),
                                  splashRadius: 24,
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // Selección de imagen
                            Container(
                              width: double.infinity,
                              height: 150,
                              decoration: BoxDecoration(
                                border: Border.all(
                                  color: Colors.grey.shade300,
                                  width: 2,
                                ),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child:
                                  (selectedImage == null && imageBytes == null)
                                      ? InkWell(
                                        onTap: () async {
                                          final picker = ImagePicker();
                                          final image = await picker.pickImage(
                                            source: ImageSource.gallery,
                                            imageQuality: 80,
                                          );
                                          if (image != null) {
                                            if (kIsWeb) {
                                              final bytes =
                                                  await image.readAsBytes();
                                              setState(() {
                                                imageBytes = bytes;
                                              });
                                            } else {
                                              setState(() {
                                                selectedImage = File(
                                                  image.path,
                                                );
                                              });
                                            }
                                          }
                                        },
                                        child: Column(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Icon(
                                              Icons.image_outlined,
                                              size: 48,
                                              color: Colors.grey.shade400,
                                            ),
                                            const SizedBox(height: 8),
                                            Text(
                                              'Seleccionar imagen',
                                              style: TextStyle(
                                                color: Colors.grey.shade600,
                                              ),
                                            ),
                                          ],
                                        ),
                                      )
                                      : Stack(
                                        children: [
                                          kIsWeb && imageBytes != null
                                              ? Image.memory(
                                                imageBytes!,
                                                width: double.infinity,
                                                height: 150,
                                                fit: BoxFit.cover,
                                              )
                                              : Image.file(
                                                selectedImage!,
                                                width: double.infinity,
                                                height: 150,
                                                fit: BoxFit.cover,
                                              ),
                                          Positioned(
                                            top: 8,
                                            right: 8,
                                            child: FloatingActionButton(
                                              mini: true,
                                              onPressed: () {
                                                setState(() {
                                                  selectedImage = null;
                                                  imageBytes = null;
                                                });
                                              },
                                              backgroundColor: Colors.red,
                                              child: const Icon(
                                                Icons.close,
                                                color: Colors.white,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                            ),
                            const SizedBox(height: 20),

                            // Nombre
                            TextFormField(
                              controller: nombreController,
                              decoration: InputDecoration(
                                labelText: 'Nombre del Producto',
                                hintText: 'Ej: Pizza Hawaiana',
                                prefixIcon: const Icon(Icons.label_outline),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'El nombre es requerido';
                                }
                                if (value.length < 3) {
                                  return 'El nombre debe tener al menos 3 caracteres';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Descripción
                            TextFormField(
                              controller: descripcionController,
                              decoration: InputDecoration(
                                labelText: 'Descripción',
                                hintText:
                                    'Describe los ingredientes y características',
                                prefixIcon: const Icon(
                                  Icons.description_outlined,
                                ),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              maxLines: 3,
                              minLines: 2,
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'La descripción es requerida';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 16),

                            // Categoría
                            DropdownButtonFormField<String>(
                              value: selectedCategoria,
                              decoration: InputDecoration(
                                labelText: 'Categoría',
                                prefixIcon: const Icon(Icons.category_outlined),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              items:
                                  CATEGORIAS_PREDEFINIDAS
                                      .map(
                                        (category) => DropdownMenuItem(
                                          value: category,
                                          child: Text(category),
                                        ),
                                      )
                                      .toList(),
                              onChanged: (value) {
                                setState(() => selectedCategoria = value ?? '');
                              },
                            ),
                            const SizedBox(height: 16),

                            // Precio
                            TextFormField(
                              controller: precioController,
                              decoration: InputDecoration(
                                labelText: 'Precio (Bs)',
                                hintText: '0.00',
                                prefixIcon: const Icon(Icons.attach_money),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8),
                                ),
                              ),
                              keyboardType:
                                  const TextInputType.numberWithOptions(
                                    decimal: true,
                                  ),
                              validator: (value) {
                                if (value == null || value.isEmpty) {
                                  return 'El precio es requerido';
                                }
                                if (double.tryParse(value) == null) {
                                  return 'Ingrese un precio válido';
                                }
                                if (double.parse(value) <= 0) {
                                  return 'El precio debe ser mayor a 0';
                                }
                                return null;
                              },
                            ),
                            const SizedBox(height: 24),

                            // Botones de acción
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text('Cancelar'),
                                ),
                                const SizedBox(width: 12),
                                ElevatedButton.icon(
                                  onPressed: () {
                                    if (formKey.currentState!.validate()) {
                                      Navigator.pop(context);
                                      _addProduct(
                                        {
                                          'nombre':
                                              nombreController.text.trim(),
                                          'descripcion':
                                              descripcionController.text.trim(),
                                 'precio': double.parse(
                                   precioController.text,
                                 ),
                                 'categoria': selectedCategoria,
                                 'estado': true,
                               },
                                        imageBytes: imageBytes,
                                        imageFile: selectedImage,
                                      );
                                    }
                                  },
                                  icon: const Icon(Icons.save),
                                  label: const Text('Guardar'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
          ),
    );
  }

  void _showEditProductDialog(BuildContext context, Product product) {
    final formKey = GlobalKey<FormState>();
    final nombreController = TextEditingController(text: product.nombre);
    final descripcionController = TextEditingController(
      text: product.descripcion,
    );
    final precioController = TextEditingController(
      text: product.precio.toString(),
    );
    String selectedCategoria = product.categoria;
    File? selectedImage;
    Uint8List? imageBytes;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => Dialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Editar Producto',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.close),
                          splashRadius: 24,
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      height: 150,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: Colors.grey.shade300,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: selectedImage != null
                          ? Stack(
                               children: [
                                 kIsWeb && imageBytes != null
                                     ? Image.memory(
                                         imageBytes!,
                                         width: double.infinity,
                                         height: 150,
                                         fit: BoxFit.cover,
                                       )
                                     : Image.file(
                                         selectedImage!,
                                         width: double.infinity,
                                         height: 150,
                                         fit: BoxFit.cover,
                                       ),
                                 Positioned(
                                   top: 8,
                                   right: 8,
                                   child: FloatingActionButton(
                                     mini: true,
                                     onPressed: () {
                                       setState(() {
                                         selectedImage = null;
                                         imageBytes = null;
                                       });
                                     },
                                     backgroundColor: Colors.red,
                                     child: const Icon(
                                       Icons.close,
                                       color: Colors.white,
                                     ),
                                   ),
                                 ),
                               ],
                               )
                          : product.imagenUrl != null &&
                                product.imagenUrl!.isNotEmpty
                              ? Stack(
                                   children: [
                                     Image.network(
                                       product.imagenUrl!,
                                       width: double.infinity,
                                       height: 150,
                                       fit: BoxFit.cover,
                                       errorBuilder: (context, error, stackTrace) => Center(
                                         child: Icon(
                                           Icons.image_not_supported,
                                           size: 48,
                                           color: Colors.grey.shade400,
                                         ),
                                       ),
                                     ),
                                     Positioned(
                                       top: 8,
                                       right: 8,
                                       child: FloatingActionButton(
                                         mini: true,
                                         onPressed: () async {
                                           final picker = ImagePicker();
                                           final image = await picker.pickImage(
                                             source: ImageSource.gallery,
                                             imageQuality: 80,
                                           );
                                           if (image != null) {
                                             if (kIsWeb) {
                                               final bytes = await image.readAsBytes();
                                               setState(() {
                                                 imageBytes = bytes;
                                               });
                                             } else {
                                               setState(() {
                                                 selectedImage = File(image.path);
                                               });
                                             }
                                           }
                                         },
                                         backgroundColor: Colors.blue,
                                         child: const Icon(
                                           Icons.edit,
                                           color: Colors.white,
                                         ),
                                       ),
                                     ),
                                   ],
                                   )
                              : InkWell(
                                   onTap: () async {
                                     final picker = ImagePicker();
                                     final image = await picker.pickImage(
                                       source: ImageSource.gallery,
                                       imageQuality: 80,
                                     );
                                     if (image != null) {
                                       if (kIsWeb) {
                                         final bytes = await image.readAsBytes();
                                         setState(() {
                                           imageBytes = bytes;
                                         });
                                       } else {
                                         setState(() {
                                           selectedImage = File(image.path);
                                         });
                                       }
                                     }
                                   },
                                   child: Column(
                                     mainAxisAlignment: MainAxisAlignment.center,
                                     children: [
                                       Icon(
                                         Icons.image_outlined,
                                         size: 48,
                                         color: Colors.grey.shade400,
                                       ),
                                       const SizedBox(height: 8),
                                       Text(
                                         'Seleccionar imagen',
                                         style: TextStyle(
                                           color: Colors.grey.shade600,
                                         ),
                                       ),
                                     ],
                                   ),
                                 ),
                               ),
                    const SizedBox(height: 20),
                    TextFormField(
                      controller: nombreController,
                      decoration: InputDecoration(
                        labelText: 'Nombre del Producto',
                        prefixIcon: const Icon(Icons.label_outline),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'El nombre es requerido';
                        }
                        if (value.length < 3) {
                          return 'El nombre debe tener al menos 3 caracteres';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: descripcionController,
                      decoration: InputDecoration(
                        labelText: 'Descripción',
                        prefixIcon: const Icon(Icons.description_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      maxLines: 3,
                      minLines: 2,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'La descripción es requerida';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<String>(
                      value: selectedCategoria,
                      decoration: InputDecoration(
                        labelText: 'Categoría',
                        prefixIcon: const Icon(Icons.category_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      items: CATEGORIAS_PREDEFINIDAS
                          .map((category) => DropdownMenuItem(
                                value: category,
                                child: Text(category),
                              ))
                          .toList(),
                      onChanged: (value) {
                        setState(() => selectedCategoria = value ?? '');
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: precioController,
                      decoration: InputDecoration(
                        labelText: 'Precio (Bs)',
                        prefixIcon: const Icon(Icons.attach_money),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      keyboardType: const TextInputType.numberWithOptions(
                        decimal: true,
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'El precio es requerido';
                        }
                        if (double.tryParse(value) == null) {
                          return 'Ingrese un precio válido';
                        }
                        if (double.parse(value) <= 0) {
                          return 'El precio debe ser mayor a 0';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.pop(context),
                          child: const Text('Cancelar'),
                        ),
                        const SizedBox(width: 12),
                        ElevatedButton.icon(
                          onPressed: () {
                            if (formKey.currentState!.validate()) {
                              Navigator.pop(context);
                              _updateProduct(
                                product.id,
                                {
                                  'nombre': nombreController.text.trim(),
                                  'descripcion':
                                      descripcionController.text.trim(),
                                  'precio': double.parse(
                                    precioController.text,
                                  ),
                                  'categoria': selectedCategoria,
                                },
                                imageBytes: imageBytes,
                                imageFile: selectedImage,
                              );
                            }
                          },
                          icon: const Icon(Icons.save),
                          label: const Text('Actualizar'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context, Product product) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Eliminar Producto'),
        content: Text(
          '¿Estás seguro de que deseas eliminar "${product.nombre}"?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteProduct(product.id);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Eliminar'),
          ),
        ],
      ),
    );
  }
}

class _ProductCard extends StatelessWidget {
  final Product product;
  final bool isCompact;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ProductCard({
    required this.product,
    required this.isCompact,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(locale: 'es', symbol: 'Bs');
    final theme = Theme.of(context);

    return Card(
      margin: EdgeInsets.all(isCompact ? 12 : 16),
      child: Padding(
        padding: EdgeInsets.all(isCompact ? 12 : 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: isCompact ? 60 : 80,
                  height: isCompact ? 60 : 80,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: product.imagenUrl != null && product.imagenUrl!.isNotEmpty
                      ? Image.network(
                          product.imagenUrl!,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Icon(
                            Icons.image_not_supported,
                            size: isCompact ? 30 : 40,
                            color: Colors.grey.shade400,
                          ),
                        )
                      : Icon(
                          Icons.image_outlined,
                          size: isCompact ? 30 : 40,
                          color: Colors.grey.shade400,
                        ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product.nombre,
                        style: TextStyle(
                          fontSize: isCompact ? 14 : 16,
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        product.descripcion,
                        style: TextStyle(
                          fontSize: isCompact ? 12 : 13,
                          color: Colors.grey.shade600,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                currencyFormat.format(product.precio),
                                style: TextStyle(
                                  fontSize: isCompact ? 13 : 14,
                                  fontWeight: FontWeight.bold,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              IconButton(
                                onPressed: onEdit,
                                icon: const Icon(Icons.edit),
                                iconSize: isCompact ? 18 : 20,
                                splashRadius: 20,
                              ),
                              IconButton(
                                onPressed: onDelete,
                                icon: const Icon(Icons.delete),
                                color: Colors.red,
                                iconSize: isCompact ? 18 : 20,
                                splashRadius: 20,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                product.categoria,
                style: TextStyle(
                  fontSize: isCompact ? 11 : 12,
                  color: theme.colorScheme.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
