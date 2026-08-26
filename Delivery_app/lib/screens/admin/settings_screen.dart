import 'package:delivery/providers/auth_provider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _darkMode = false;
  bool _notificationsEnabled = true;
  bool _emailNotifications = true;
  bool _pushNotifications = true;
  bool _soundEnabled = true;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 120,
            floating: false,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              title: const Text(
                'Ajustes',
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
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Sección: Perfil
                  _buildSectionTitle('Perfil'),
                  _buildCard(
                    child: Column(
                      children: [
                        _buildListTile(
                          icon: Icons.person_outline,
                          title: 'Editar Perfil',
                          subtitle: 'Nombre, email, teléfono',
                          onTap: () => _showEditProfileDialog(context),
                        ),
                        const Divider(height: 1),
                        _buildListTile(
                          icon: Icons.lock_outline,
                          title: 'Cambiar Contraseña',
                          subtitle: 'Actualizar contraseña de acceso',
                          onTap: () => _showChangePasswordDialog(context),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Sección: Notificaciones
                  _buildSectionTitle('Notificaciones'),
                  _buildCard(
                    child: Column(
                      children: [
                        _buildSwitchTile(
                          icon: Icons.notifications_outlined,
                          title: 'Habilitar Notificaciones',
                          subtitle: 'Activar/desactivar todas',
                          value: _notificationsEnabled,
                          onChanged: (value) {
                            setState(() => _notificationsEnabled = value);
                          },
                        ),
                        const Divider(height: 1),
                        _buildSwitchTile(
                          icon: Icons.email_outlined,
                          title: 'Notificaciones por Email',
                          subtitle: 'Recibir alertas en tu correo',
                          value: _emailNotifications,
                          onChanged:
                              _notificationsEnabled
                                  ? (value) {
                                    setState(() => _emailNotifications = value);
                                  }
                                  : null,
                        ),
                        const Divider(height: 1),
                        _buildSwitchTile(
                          icon: Icons.phone_android_outlined,
                          title: 'Notificaciones Push',
                          subtitle: 'Alertas en tiempo real',
                          value: _pushNotifications,
                          onChanged:
                              _notificationsEnabled
                                  ? (value) {
                                    setState(() => _pushNotifications = value);
                                  }
                                  : null,
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Sección: Preferencias
                  _buildSectionTitle('Preferencias'),
                  _buildCard(
                    child: Column(
                      children: [
                        _buildSwitchTile(
                          icon: Icons.dark_mode_outlined,
                          title: 'Modo Oscuro',
                          subtitle: 'Tema oscuro de la aplicación',
                          value: _darkMode,
                          onChanged: (value) {
                            setState(() => _darkMode = value);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Tema cambiado (requiere reinicio)',
                                ),
                                duration: Duration(seconds: 2),
                              ),
                            );
                          },
                        ),
                        const Divider(height: 1),
                        _buildSwitchTile(
                          icon: Icons.volume_up_outlined,
                          title: 'Sonidos',
                          subtitle: 'Efectos de sonido',
                          value: _soundEnabled,
                          onChanged: (value) {
                            setState(() => _soundEnabled = value);
                          },
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Sección: Sistema
                  _buildSectionTitle('Sistema'),
                  _buildCard(
                    child: Column(
                      children: [
                        _buildListTile(
                          icon: Icons.info_outline,
                          title: 'Acerca de',
                          subtitle: 'Versión 1.0.0 - Admin Delivery Pro',
                          onTap: () => _showAboutDialog(context),
                        ),
                        const Divider(height: 1),
                        _buildListTile(
                          icon: Icons.privacy_tip_outlined,
                          title: 'Política de Privacidad',
                          subtitle: 'Términos y condiciones de uso',
                          onTap: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Abriendo política de privacidad...',
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Botón de cerrar sesión
                  SizedBox(
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

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }

  Widget _buildCard({required Widget child}) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: child,
    );
  }

  Widget _buildListTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Theme.of(context).colorScheme.primary),
      title: Text(title),
      subtitle: Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }

  Widget _buildSwitchTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool>? onChanged,
  }) {
    return ListTile(
      leading: Icon(
        icon,
        color:
            onChanged != null
                ? Theme.of(context).colorScheme.primary
                : Colors.grey,
      ),
      title: Text(
        title,
        style: TextStyle(color: onChanged != null ? null : Colors.grey),
      ),
      subtitle: Text(
        subtitle,
        style: TextStyle(
          fontSize: 12,
          color: onChanged != null ? Colors.grey[600] : Colors.grey,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Switch(value: value, onChanged: onChanged),
    );
  }

  void _showEditProfileDialog(BuildContext context) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: const Text('Editar Perfil'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  decoration: const InputDecoration(
                    labelText: 'Nombre',
                    prefixIcon: Icon(Icons.person),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  decoration: const InputDecoration(
                    labelText: 'Email',
                    prefixIcon: Icon(Icons.email),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  decoration: const InputDecoration(
                    labelText: 'Teléfono',
                    prefixIcon: Icon(Icons.phone),
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
                      content: Text('Perfil actualizado correctamente'),
                      backgroundColor: Colors.green,
                    ),
                  );
                },
                child: const Text('Guardar'),
              ),
            ],
          ),
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
                    prefixIcon: Icon(Icons.lock),
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
                      backgroundColor: Colors.green,
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
                  'Admin Delivery Pro',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                SizedBox(height: 8),
                Text('Versión 1.0.0'),
                SizedBox(height: 16),
                Text(
                  'Sistema de gestión de pedidos y repartidores.',
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
      builder: (context) => AlertDialog(
        title: const Text('Cerrar Sesión'),
        content: const Text('¿Estás seguro de que deseas cerrar sesión?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
              ElevatedButton(
                onPressed: () async {
                  Navigator.pop(context); // Cerrar el diálogo
                  
                  // Limpiar toda la pila de navegación hasta la raíz
                  Navigator.of(context).popUntil((route) => route.isFirst);
                  
                  // Ejecutar el cierre de sesión
                  await context.read<AuthProvider>().logout();
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
}
