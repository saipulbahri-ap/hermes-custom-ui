import React, { useState } from 'react';
import { LogIn, Shield } from 'lucide-react';

interface LoginProps {
  onLogin: (key: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('API key is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Validate key against backend
      const r = await fetch('/api/system/stats', {
        headers: { 'X-API-Key': trimmed },
      });
      if (r.ok) {
        localStorage.setItem('hermes_api_key', trimmed);
        onLogin(trimmed);
      } else if (r.status === 403) {
        setError('Invalid API key');
      } else {
        setError(`Server error: ${r.status}`);
      }
    } catch {
      setError('Cannot reach server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-hermes-600/20 mb-4">
            <Shield className="w-8 h-8 text-hermes-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100">Hermes UI</h1>
          <p className="text-sm text-gray-500 mt-1">Enter API key to continue</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              API Key
            </label>
            <input
              type="password"
              className="input w-full font-mono text-sm"
              placeholder="Enter your API key..."
              value={key}
              onChange={(e) => { setKey(e.target.value); setError(''); }}
              autoFocus
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-900/30 border border-red-800/50 text-red-400 text-xs">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !key.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Validating...' : 'Login'}
          </button>
        </form>

        <p className="text-xs text-gray-600 text-center mt-4">
          Set UI_API_KEY environment variable on the server to enable authentication
        </p>
      </div>
    </div>
  );
}
