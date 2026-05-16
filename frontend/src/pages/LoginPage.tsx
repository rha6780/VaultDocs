import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Center,
  Stack,
  Title,
  Text,
  Button,
  Paper,
  Divider,
  Badge,
  Alert,
} from '@mantine/core';
import { IconBrandGoogle, IconCode, IconAlertCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuthStore } from '@/store/auth';
import { devLogin } from '@/api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? ''}/api/auth/google`;
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { user, tokens } = await devLogin();
      setAuth(user, tokens);
      notifications.show({ message: `${user.name}으로 로그인됨`, color: 'green' });
      navigate('/');
    } catch {
      setError('Dev 로그인 실패. 백엔드가 실행 중인지 확인하세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center h="100vh" bg="gray.0">
      <Stack align="center" gap="xs" w={360}>
        <Title order={1}>VaultDocs</Title>
        <Text c="dimmed" mb="md">셀프 호스팅 문서 관리 서비스</Text>

        <Paper shadow="xs" p="xl" radius="md" w="100%" withBorder>
          <Stack gap="sm">
            <Button
              leftSection={<IconBrandGoogle size={18} />}
              variant="default"
              size="md"
              fullWidth
              onClick={handleGoogleLogin}
            >
              Google 로 계속하기
            </Button>

            {import.meta.env.DEV && (
              <>
                <Divider
                  label={<Badge color="yellow" variant="light" size="sm">개발 환경</Badge>}
                  labelPosition="center"
                />
                <Button
                  leftSection={<IconCode size={18} />}
                  variant="light"
                  color="yellow"
                  size="md"
                  fullWidth
                  loading={loading}
                  onClick={handleDevLogin}
                >
                  Dev 계정으로 로그인
                </Button>
                <Text size="xs" c="dimmed" ta="center">
                  dev@vaultdocs.local · OAuth 없이 바로 접속
                </Text>
              </>
            )}

            {error && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" variant="light">
                {error}
              </Alert>
            )}
          </Stack>
        </Paper>
      </Stack>
    </Center>
  );
}
