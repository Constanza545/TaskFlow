import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '../services/api';
import { Button, FormField } from '../components/ui';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-800 via-purple-600 to-fuchsia-500 px-4">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1">Crear cuenta</h1>
        <p className="text-sm text-gray-500 mb-6">
          El primer usuario registrado se vuelve <strong>admin</strong> automáticamente.
        </p>

        <FormField
          id="name"
          label="Nombre"
          required
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <Button className="w-full" disabled={loading}>
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-brand-600 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </form>
    </div>
  );
}
