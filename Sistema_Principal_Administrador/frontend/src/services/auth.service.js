import api from './api';

export const authApi = {
  // Login
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Registro
  register: (data) => api.post('/auth/register', data),
  
  // Obtener perfil del usuario logueado
  getProfile: () => api.get('/auth/profile'),
  
  // Verificar si hay token
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export default authApi;
