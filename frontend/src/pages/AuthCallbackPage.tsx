import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { User } from '@shared/types';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (!accessToken || !refreshToken) {
      navigate('/login');
      return;
    }

    // JWT payload에서 유저 기본 정보 파싱 (추후 /api/users/me 호출로 교체 가능)
    try {
      const payload = JSON.parse(atob(accessToken.split('.')[1])) as { sub: string };
      const mockUser: User = {
        id: payload.sub,
        email: '',
        name: '',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      };
      setAuth(mockUser, { accessToken, refreshToken });
      navigate('/');
    } catch {
      navigate('/login');
    }
  }, [navigate, setAuth]);

  return <p style={{ textAlign: 'center', marginTop: '40vh' }}>로그인 처리 중...</p>;
}
