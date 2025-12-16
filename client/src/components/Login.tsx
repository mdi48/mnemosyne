import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LoginProps {
  onSwitchToRegister: () => void;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function Login({ onSwitchToRegister, onClose, onSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      onSuccess?.();
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 rounded-lg p-8 w-full max-w-md">
      <h2 className="text-3xl font-bold text-white mb-6">Log In</h2>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-white/80 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-neutral-800 text-white px-4 py-2 rounded border border-neutral-700 focus:border-blue-500 focus:outline-none"
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-white/80 mb-2">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-neutral-800 text-white px-4 py-2 rounded border border-neutral-700 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/60">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Register
          </button>
        </p>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white/80 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
