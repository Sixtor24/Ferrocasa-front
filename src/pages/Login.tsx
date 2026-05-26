import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import bgImage from '../assets/ferrocasa.jpg';
import { User, Lock, Eye, EyeOff, LogIn, Info } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Por favor complete todos los campos');
      return;
    }
    const success = login(username, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center blur-[2px]" style={{ backgroundImage: `url(${bgImage})` }}>
        <div className="absolute inset-0 bg-navy-950/75" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <img src={logo} alt="CVG Ferrocasa" className="w-24 h-24 object-contain" />
          </div>

          <h1 className="text-xl font-bold text-navy-900 text-center mb-1">
            Sistema de Control de Inventario de
          </h1>
          <h2 className="text-xl font-bold text-navy-900 text-center mb-8">
            Bienes Nacionales
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-navy-800 mb-2">
                <User size={16} />
                Usuario
              </label>
              <input
                type="text"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-navy-800 mb-2">
                <Lock size={16} />
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-navy-900 text-white py-3 rounded-lg font-medium hover:bg-navy-800 transition-colors flex items-center justify-center gap-2"
            >
              Ingresar
              <LogIn size={18} />
            </button>
          </form>

          <p className="text-center text-sm text-navy-500 mt-4 cursor-pointer hover:text-navy-700">
            ¿Olvidó su contraseña?
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 text-xs text-gray-400">
            <span>v1.0</span>
            <span className="flex items-center gap-1">
              <Info size={12} />
              Soporte Interno
            </span>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="absolute bottom-6 left-6 z-10 bg-white/90 backdrop-blur-sm rounded-lg p-4 max-w-xs">
        <p className="font-semibold text-navy-900 text-sm">Aviso de Seguridad</p>
        <p className="text-xs text-gray-600 mt-1">
          Este sistema es para uso exclusivo del personal autorizado de C.V.G.
          FERROCASA. Todas las transacciones son auditadas.
        </p>
      </div>

      {/* Location label */}
      <div className="absolute bottom-6 right-6 z-10 text-right text-white">
        <p className="font-bold text-lg">C.V.G. FERROCASA, Venezuela</p>
      </div>
    </div>
  );
}
