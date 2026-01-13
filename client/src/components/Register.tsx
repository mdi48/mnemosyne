import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function Register({ onSwitchToLogin, onClose, onSuccess }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [likesPrivate, setLikesPrivate] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(email, password, username, likesPrivate);
      onSuccess?.();
      onClose();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 rounded-lg p-8 w-full max-w-md">
      <h2 className="text-3xl font-bold text-white mb-6">Register</h2>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-white/80 mb-2">
            Username
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-neutral-800 text-white px-4 py-2 rounded border border-neutral-700 focus:border-blue-500 focus:outline-none"
            required
            autoFocus
            maxLength={30}
          />
        </div>

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
            minLength={8}
          />
          <p className="text-white/40 text-sm mt-1">Minimum 8 characters</p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="likesPrivate"
            checked={likesPrivate}
            onChange={(e) => setLikesPrivate(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-neutral-800 border-neutral-700 rounded focus:ring-blue-500"
          />
          <label htmlFor="likesPrivate" className="ml-2 text-white/80">
            Keep my liked quotes private
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded transition-colors"
        >
          {loading ? 'Creating account...' : 'Register'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-white/60">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Log In
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
