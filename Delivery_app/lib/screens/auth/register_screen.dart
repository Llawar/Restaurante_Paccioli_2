import 'package:delivery/config/constants.dart';
import 'package:delivery/providers/auth_provider.dart';
import 'package:delivery/utils/validators.dart';
import 'package:delivery/widgets/custom_widgets.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (_formKey.currentState!.validate()) {
      final authProvider = context.read<AuthProvider>();
      final success = await authProvider.register(
        email: _emailController.text.trim(),
        password: _passwordController.text,
        nombre: _nameController.text.trim(),
        telefono: _phoneController.text.trim(),
        rol: UserRole.client,
      );

       if (mounted) {
         if (success) {
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(
               content: Text('¡Registro exitoso! Bienvenido'),
               backgroundColor: Colors.green,
             ),
           );
           Navigator.of(context).pop();
         } else {

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(authProvider.errorMessage ?? 'Error desconocido'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.transparent,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Título
                const Text(
                  'Crea tu Cuenta',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Únete a nosotros hoy',
                  style: TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const SizedBox(height: 32),

                // Nombre
                CustomTextField(
                  label: 'Nombre Completo',
                  hintText: 'Tu nombre',
                  controller: _nameController,
                  validator: Validators.validateName,
                  prefixIcon: const Icon(Icons.person_outlined),
                ),
                const SizedBox(height: 20),

                // Email
                CustomTextField(
                  label: 'Email',
                  hintText: 'tu@email.com',
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  validator: Validators.validateEmail,
                  prefixIcon: const Icon(Icons.email_outlined),
                ),
                const SizedBox(height: 20),

                // Teléfono
                CustomTextField(
                  label: 'Teléfono',
                  hintText: '1234567890',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  validator: Validators.validatePhone,
                  prefixIcon: const Icon(Icons.phone_outlined),
                ),
                const SizedBox(height: 20),

                // Contraseña
                CustomTextField(
                  label: 'Contraseña',
                  hintText: 'Crea una contraseña fuerte',
                  controller: _passwordController,
                  isPassword: true,
                  validator: Validators.validatePassword,
                  prefixIcon: const Icon(Icons.lock_outlined),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    '✓ Mínimo 8 caracteres\n✓ Una mayúscula\n✓ Un número',
                    style: TextStyle(fontSize: 12, color: Colors.blue),
                  ),
                ),
                const SizedBox(height: 20),

                // Confirmar Contraseña
                CustomTextField(
                  label: 'Confirmar Contraseña',
                  hintText: 'Repite tu contraseña',
                  controller: _confirmPasswordController,
                  isPassword: true,
                  validator:
                      (value) => Validators.validatePasswordConfirm(
                        value,
                        _passwordController.text,
                      ),
                  prefixIcon: const Icon(Icons.lock_outlined),
                ),
                const SizedBox(height: 32),

                // Botón Registrarse
                Consumer<AuthProvider>(
                  builder: (context, authProvider, _) {
                    return CustomButton(
                      label: 'Registrarse',
                      onPressed: _register,
                      isLoading: authProvider.isLoading,
                    );
                  },
                ),
                const SizedBox(height: 16),

                // Términos
                Center(
                  child: Text(
                    'Al registrarte, aceptas nuestros términos y condiciones',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                ),
                const SizedBox(height: 16),

                // Login
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Wrap(
                    alignment: WrapAlignment.center,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      const Text(
                        '¿Ya tienes cuenta? ',
                        style: TextStyle(fontSize: 14),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: const Text(
                          'Inicia sesión',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.orange,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
