'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface UsuarioStaff {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'funcionario';
}

interface UseStaffAuthReturn {
  usuario: UsuarioStaff | null;
  token: string | null;
  carregando: boolean;
  logout: () => void;
  authHeader: () => Record<string, string>;
}

export function useStaffAuth(): UseStaffAuthReturn {
  const [usuario, setUsuario] = useState<UsuarioStaff | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('staff_token');
    const storedUsuario = localStorage.getItem('staff_usuario');

    if (!storedToken || !storedUsuario) {
      router.replace('/staff/login');
      return;
    }

    // Valida o token contra o backend
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Token inválido');
        return res.json();
      })
      .then(() => {
        setToken(storedToken);
        setUsuario(JSON.parse(storedUsuario));

        // Sincroniza o token num cookie para o middleware Next.js
        document.cookie = `staff_token=${storedToken}; path=/; samesite=lax`;
      })
      .catch(() => {
        localStorage.removeItem('staff_token');
        localStorage.removeItem('staff_usuario');
        document.cookie = 'staff_token=; path=/; max-age=0';
        router.replace('/staff/login');
      })
      .finally(() => setCarregando(false));
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('staff_token');
    localStorage.removeItem('staff_usuario');
    document.cookie = 'staff_token=; path=/; max-age=0';
    router.replace('/staff/login');
  }, [router]);

  const authHeader = useCallback((): Record<string, string> => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  return { usuario, token, carregando, logout, authHeader };
}
