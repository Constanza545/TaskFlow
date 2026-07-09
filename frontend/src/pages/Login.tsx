import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../services/api';
import { Button, FormField } from '../components/ui';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  // TEMPORAL: credencial demo prellenada para desarrollo (la siembra el backend).
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('321');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-purple-600 to-fuchsia-500 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-6 text-white">
          <span className="w-10 h-10 rounded-full bg-white/20 ring-1 ring-white/30 grid place-items-center font-bold shadow-md">
            T
          </span>
          <span className="text-2xl font-bold">TaskFlow</span>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Iniciar sesión</h1>
          <p className="text-sm text-gray-500 mb-6">Bienvenida de vuelta al tablero del equipo.</p>

          <FormField
            id="email"
            label="Email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FormField
            id="password"
            label="Contraseña"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
              {error}
            </p>
          )}

          <Button className="w-full" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>

          <p className="text-xs text-gray-500 mt-5 text-center">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">
              Registrate
            </Link>
          </p>
        </form>

        <p className="text-xs text-white/90 bg-white/15 border border-white/25 rounded-full px-4 py-2 mt-4 text-center backdrop-blur-sm">
          Acceso demo temporal: <strong>admin@demo.com</strong> / <strong>321</strong> (solo
          desarrollo)
        </p>
      </div>
    </div>
  );
}
