import { useState, useEffect, useCallback } from 'react';
import Login from '../pages/Login';

export function useAuth() {
  const [apiKey, setApiKey] = useState<string | null>(() =>
    localStorage.getItem('hermes_api_key')
  );
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  // Validate stored key on mount
  useEffect(() => {
    const key = localStorage.getItem('hermes_api_key');
    if (!key) {
      setChecking(false);
      setAuthenticated(false);
      return;
    }
    // Quick validation — check if stats endpoint responds 200
    fetch('/api/system/stats', { headers: { 'X-API-Key': key } })
      .then((r) => {
        if (r.ok) {
          setAuthenticated(true);
          setApiKey(key);
        } else {
          localStorage.removeItem('hermes_api_key');
          setAuthenticated(false);
          setApiKey(null);
        }
      })
      .catch(() => {
        // Server might be down, allow offline
        setAuthenticated(true);
        setApiKey(key);
      })
      .finally(() => setChecking(false));
  }, []);

  const login = useCallback((key: string) => {
    localStorage.setItem('hermes_api_key', key);
    setApiKey(key);
    setAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('hermes_api_key');
    setApiKey(null);
    setAuthenticated(false);
  }, []);

  return { apiKey, authenticated, checking, login, logout };
}

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { authenticated, checking, login } = useAuth();

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Checking authentication...</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLogin={login} />;
  }

  return <>{children}</>;
}
