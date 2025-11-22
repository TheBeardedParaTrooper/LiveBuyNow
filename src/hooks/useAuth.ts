import { useEffect, useState } from 'react';

interface UserShape {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<UserShape | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = typeof window !== 'undefined' ? localStorage.getItem('lbn_token') : null;
    if (!t) {
      setLoading(false);
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${t}` } });
        if (!res.ok) {
          localStorage.removeItem('lbn_token');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setToken(t);
      } catch (err) {
        console.error('useAuth fetchMe error', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  return { user, token, loading };
};
