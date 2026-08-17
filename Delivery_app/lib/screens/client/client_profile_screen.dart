import 'package:delivery/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class ClientProfileScreen extends StatefulWidget {
  const ClientProfileScreen({super.key});

  @override
  State<ClientProfileScreen> createState() => _ClientProfileScreenState();
}

class _ClientProfileScreenState extends State<ClientProfileScreen> {
  bool _isEditing = false;
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController();
    _emailController = TextEditingController();
    _phoneController = TextEditingController();
    _addressController = TextEditingController();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadUserData();
    });
  }

  void _loadUserData() {
    final authProvider = context.read<AuthProvider>();
    final user = authProvider.currentUser;

    if (user != null) {
      _nameController.text = user.nombre;
      _emailController.text = user.email;
      _phoneController.text = user.telefono ?? '';
      _addressController.text = user.direccion ?? '';
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Consumer<AuthProvider>(
      builder: (context, authProvider, _) {
        final user = authProvider.currentUser;

        return SingleChildScrollView(
          child: Column(
            children: [
              // Header con avatar
              Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Colors.orange, Colors.orange.shade700],
                  ),
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(30),
                    bottomRight: Radius.circular(30),
                  ),
                ),
                padding: EdgeInsets.all(isMobile ? 24 : 32),
                child: SafeArea(
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: isMobile ? 50 : 60,
                        backgroundColor: Colors.white,
                        child: CircleAvatar(
                          radius: isMobile ? 46 : 56,
                          backgroundColor: Colors.orange.shade100,
                          child: Icon(
                            Icons.person,
                            size: isMobile ? 50 : 60,
                            color: Colors.orange,
                          ),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        user?.nombre ?? 'Cliente',
                        style: TextStyle(
                          fontSize: isMobile ? 24 : 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user?.email ?? '',
                        style: TextStyle(
                          fontSize: isMobile ? 14 : 16,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Información del perfil
              Padding(
                padding: EdgeInsets.all(isMobile ? 16 : 24),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Información Personal',
                            style: TextStyle(
                              fontSize: isMobile ? 18 : 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          IconButton(
                            onPressed: () {
                              setState(() {
                                if (_isEditing) {
                                  _saveProfile();
                                }
                                _isEditing = !_isEditing;
                              });
                            },
                            icon: Icon(
                              _isEditing ? Icons.check : Icons.edit,
                              color: Colors.orange,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        label: 'Nombre Completo',
                        controller: _nameController,
                        icon: Icons.person_outline,
                        enabled: _isEditing,
                        isCompact: isMobile,
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        label: 'Correo Electrónico',
                        controller: _emailController,
                        icon: Icons.email_outlined,
                        enabled: _isEditing,
                        keyboardType: TextInputType.emailAddress,
                        isCompact: isMobile,
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        label: 'Teléfono',
                        controller: _phoneController,
                        icon: Icons.phone_outlined,
                        enabled: _isEditing,
                        keyboardType: TextInputType.phone,
                        isCompact: isMobile,
                      ),
                      const SizedBox(height: 16),
                      _buildTextField(
                        label: 'Dirección de Entrega',
                        controller: _addressController,
                        icon: Icons.location_on_outlined,
                        enabled: _isEditing,
                        maxLines: 2,
                        isCompact: isMobile,
                      ),
                    ],
                  ),
                ),
              ),

              // Opciones adicionales
              Padding(
                padding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Configuración',
                      style: TextStyle(
                        fontSize: isMobile ? 18 : 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildOptionTile(
                      icon: Icons.lock_outline,
                      title: 'Cambiar Contraseña',
                      subtitle: 'Actualiza tu contraseña de acceso',
                      onTap: () => _showChangePasswordDialog(context),
                      isCompact: isMobile,
                    ),
                    _buildOptionTile(
                      icon: Icons.notifications_outlined,
                      title: 'Notificaciones',
                      subtitle: 'Configura tus alertas',
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Configuración de notificaciones'),
                          ),
                        );
                      },
                      isCompact: isMobile,
                    ),
                    _buildOptionTile(
                      icon: Icons.help_outline,
                      title: 'Ayuda y Soporte',
                      subtitle: 'Preguntas frecuentes y contacto',
                      onTap: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Centro de ayuda')),
                        );
                      },
                      isCompact: isMobile,
                    ),
                    _buildOptionTile(
                      icon: Icons.info_outline,
                      title: 'Acerca de',
                      subtitle: 'Versión 1.0.0',
                      onTap: () => _showAboutDialog(context),
                      isCompact: isMobile,
                    ),
                    _buildOptionTile(
                      icon: Icons.delete_forever,
                      title: 'Eliminar Cuenta',
                      subtitle: 'Borra tus datos permanentemente',
                      onTap: () => _showDeleteAccountDialog(context),
                      isCompact: isMobile,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Botón de cerrar sesión
              Padding(
                padding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 24),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _showLogoutConfirmation(context),
                    icon: const Icon(Icons.logout),
                    label: const Text('Cerrar Sesión'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.red,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTextField({
    required String label,
    required TextEditingController controller,
    required IconData icon,
    required bool enabled,
    required bool isCompact,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
  }) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      keyboardType: keyboardType,
      maxLines: maxLines,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: enabled ? Colors.orange : Colors.grey),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade300),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Colors.orange, width: 2),
        ),
        disabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey.shade200),
        ),
        filled: !enabled,
        fillColor: enabled ? null : Colors.grey.shade100,
      ),
    );
  }

  Widget _buildOptionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required bool isCompact,
  }) {
    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ListTile(
        leading: Icon(icon, color: Colors.orange),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: isCompact ? 14 : 16,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: isCompact ? 12 : 13,
            color: Colors.grey.shade600,
          ),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }

  void _saveProfile() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Perfil actualizado correctamente')),
    );
  }

  void _showChangePasswordDialog(BuildContext context) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Cambiar Contraseña'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Contraseña Actual',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Nueva Contraseña',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Confirmar Contraseña',
                    prefixIcon: Icon(Icons.lock_outline),
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancelar'),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Contraseña cambiada correctamente'),
                    ),
                  );
                },
                child: const Text('Cambiar'),
              ),
            ],
          ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Acerca de'),
             content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Image.asset(
                  'assets/images/iconico.png',
                  width: 64,
                  height: 64,
                  fit: BoxFit.contain,
                ),
                SizedBox(height: 16),
                Text(
                  'Delivery App',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text('Versión 1.0.0'),
                SizedBox(height: 16),
                Text(
                  'Tu tienda de delivery favorita.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cerrar'),
              ),
            ],
          ),
    );
  }

  void _showLogoutConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Cerrar Sesión'),
            content: const Text('¿Estás seguro de que deseas cerrar sesión?'),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Cancelar'),
              ),
              ElevatedButton(
                onPressed: () async {
                  Navigator.pop(context);
                  final authProvider = context.read<AuthProvider>();
                  await authProvider.logout();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Cerrar Sesión'),
              ),
            ],
          ),
    );
  }

  void _showDeleteAccountDialog(BuildContext context) {
    final passwordController = TextEditingController();
    String? localErrorMessage;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setStateDialog) => AlertDialog(
          title: const Text('Eliminar Cuenta'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                '⚠️ Esta acción es irreversible. Todos tus datos serán borrados permanentemente.',
                style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              const Text('Para confirmar, ingresa tu contraseña:'),
              const SizedBox(height: 12),
              if (localErrorMessage != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(8),
                    margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.red[50],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.shade200),
                  ),
                  child: Text(
                    localErrorMessage!,
                    style: TextStyle(
                      color: Colors.red[700],
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              TextField(
                controller: passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Contraseña',
                  prefixIcon: const Icon(Icons.lock_outline),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar'),
            ),
            ElevatedButton(
              onPressed: () async {
                final password = passwordController.text.trim();
                if (password.isEmpty) {
                  setStateDialog(() {
                    localErrorMessage = 'Por favor, ingresa tu contraseña';
                  });
                  return;
                }

                final authProvider = context.read<AuthProvider>();
                final success = await authProvider.deleteAccount(password);

                if (success) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Cuenta eliminada exitosamente'),
                      backgroundColor: Colors.green,
                    ),
                  );
                } else {
                  setStateDialog(() {
                    localErrorMessage = 'Contraseña incorrecta';
                  });
                }

              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
              child: const Text('Eliminar Cuenta'),
            ),
          ],
        ),
      ),
    );
  }
}
