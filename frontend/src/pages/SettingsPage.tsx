import {
  Stack,
  Title,
  Tabs,
  Text,
  Group,
  Switch,
  Paper,
  Divider,
  Select,
  Avatar,
  TextInput,
  Button,
  rem,
} from '@mantine/core';
import {
  IconSettings,
  IconUser,
  IconBell,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import { useMantineColorScheme, useComputedColorScheme } from '@mantine/core';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppShell';
import { useAuthStore } from '@/store/auth';

function GeneralTab() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');
  const isDark = computedColorScheme === 'dark';

  return (
    <Stack gap="lg">
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Text fw={600} size="sm">화면</Text>
          <Divider />
          <Group justify="space-between">
            <Group gap="sm">
              {isDark ? <IconMoon size={18} /> : <IconSun size={18} />}
              <Stack gap={2}>
                <Text size="sm" fw={500}>다크 모드</Text>
                <Text size="xs" c="dimmed">어두운 색상으로 화면을 표시합니다</Text>
              </Stack>
            </Group>
            <Switch
              checked={isDark}
              onChange={(e) => setColorScheme(e.currentTarget.checked ? 'dark' : 'light')}
              size="md"
            />
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Text fw={600} size="sm">언어 및 지역</Text>
          <Divider />
          <Select
            label="언어"
            defaultValue="ko"
            data={[
              { value: 'ko', label: '한국어' },
              { value: 'en', label: 'English' },
            ]}
            w={220}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}

function ProfileTab() {
  const user = useAuthStore((s) => s.user);

  return (
    <Stack gap="lg">
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Text fw={600} size="sm">프로필 정보</Text>
          <Divider />
          <Group gap="md">
            <Avatar src={user?.avatarUrl} size={64} radius="xl" color="blue">
              {user?.name?.[0]}
            </Avatar>
            <Stack gap={4}>
              <Text size="sm" fw={500}>{user?.name ?? 'User'}</Text>
              <Text size="xs" c="dimmed">{user?.email ?? ''}</Text>
            </Stack>
          </Group>
          <TextInput
            label="이름"
            defaultValue={user?.name ?? ''}
            w={{ base: '100%', sm: 320 }}
          />
          <Group>
            <Button size="sm">저장</Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}

function NotificationsTab() {
  return (
    <Stack gap="lg">
      <Paper withBorder radius="md" p="lg">
        <Stack gap="md">
          <Text fw={600} size="sm">알림 설정</Text>
          <Divider />
          <Group justify="space-between">
            <Stack gap={2}>
              <Text size="sm" fw={500}>문서 업데이트 알림</Text>
              <Text size="xs" c="dimmed">문서가 수정되면 알림을 받습니다</Text>
            </Stack>
            <Switch defaultChecked size="md" />
          </Group>
          <Group justify="space-between">
            <Stack gap={2}>
              <Text size="sm" fw={500}>댓글 알림</Text>
              <Text size="xs" c="dimmed">새 댓글이 달리면 알림을 받습니다</Text>
            </Stack>
            <Switch defaultChecked size="md" />
          </Group>
          <Group justify="space-between">
            <Stack gap={2}>
              <Text size="sm" fw={500}>이메일 알림</Text>
              <Text size="xs" c="dimmed">이메일로 알림을 받습니다</Text>
            </Stack>
            <Switch size="md" />
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') ?? 'general';

  return (
    <AppLayout>
      <Stack gap="lg">
        <Group gap="sm">
          <IconSettings size={22} />
          <Title order={2}>설정</Title>
        </Group>

        <Tabs defaultValue={defaultTab} keepMounted={false}>
          <Tabs.List mb="lg">
            <Tabs.Tab
              value="general"
              leftSection={<IconSettings size={rem(14)} />}
            >
              일반
            </Tabs.Tab>
            <Tabs.Tab
              value="profile"
              leftSection={<IconUser size={rem(14)} />}
            >
              프로필
            </Tabs.Tab>
            <Tabs.Tab
              value="notifications"
              leftSection={<IconBell size={rem(14)} />}
            >
              알림
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="general">
            <GeneralTab />
          </Tabs.Panel>
          <Tabs.Panel value="profile">
            <ProfileTab />
          </Tabs.Panel>
          <Tabs.Panel value="notifications">
            <NotificationsTab />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </AppLayout>
  );
}
