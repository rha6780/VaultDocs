import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppShell,
  NavLink,
  Group,
  Text,
  Avatar,
  Menu,
  Burger,
  ScrollArea,
  Stack,
  ActionIcon,
  Tooltip,
  Divider,
  rem,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconFiles,
  IconLogout,
  IconChevronDown,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconUser,
  IconPalette,
  IconBell,
  IconDots,
  IconSortAscendingLetters,
  IconClock,
  IconSettings,
} from '@tabler/icons-react';
import { useAuthStore } from '@/store/auth';

const NAV_WIDTH = 220;
const NAV_COLLAPSED_WIDTH = 60;

const navItems = [
  { label: '문서', icon: IconFiles, href: '/' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [collapsed, { toggle: toggleCollapse }] = useDisclosure(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{
        width: collapsed ? NAV_COLLAPSED_WIDTH : NAV_WIDTH,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened },
      }}
      padding="md"
      styles={{ main: { paddingInlineStart: rem(30) } }}
      transitionDuration={200}
      transitionTimingFunction="ease"
    >
      {/* ── 헤더 ── */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
            <Group gap={6}>
              <IconLayoutDashboard size={22} />
              <Text
                fw={700} size="lg" visibleFrom="sm"
                style={{
                  opacity: collapsed ? 0 : 1,
                  width: collapsed ? 0 : 'auto',
                  overflow: 'hidden',
                  transition: 'opacity 150ms ease, width 200ms ease',
                  whiteSpace: 'nowrap',
                }}
              >
                VaultDocs
              </Text>
              <Text fw={700} size="lg" hiddenFrom="sm">VaultDocs</Text>
            </Group>
          </Group>

          <Menu shadow="md" width={180}>
            <Menu.Target>
              <Group gap="xs" style={{ cursor: 'pointer' }}>
                <Avatar src={user?.avatarUrl} size="sm" radius="xl" color="blue">
                  {user?.name?.[0]}
                </Avatar>
                <Text size="sm" visibleFrom="sm">{user?.name ?? 'User'}</Text>
                <IconChevronDown size={14} />
              </Group>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>설정</Menu.Label>
              <Menu.Item leftSection={<IconUser size={14} />} onClick={() => navigate('/settings?tab=profile')}>프로필</Menu.Item>
              <Menu.Item leftSection={<IconPalette size={14} />} onClick={() => navigate('/settings?tab=general')}>테마</Menu.Item>
              <Menu.Item leftSection={<IconBell size={14} />} onClick={() => navigate('/settings?tab=notifications')}>알림</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>
                로그아웃
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      {/* ── 사이드바 ── */}
      <AppShell.Navbar p={collapsed ? 'xs' : 'sm'} style={{ overflow: 'visible' }}>

        {/* 경계선 위 접기 버튼 */}
        <Tooltip label={collapsed ? '펼치기' : '접기'} position="right" withArrow visibleFrom="sm">
          <ActionIcon
            variant="default" size="lg" radius="xl"
            onClick={toggleCollapse}
            visibleFrom="sm"
            style={{
              position: 'absolute',
              top: rem(10), right: rem(-18),
              zIndex: 200,
              boxShadow: '0 1px 6px rgba(0,0,0,0.15)',
              background: 'var(--mantine-color-body)',
              border: '1px solid var(--mantine-color-default-border)',
            }}
          >
            {collapsed
              ? <IconLayoutSidebarLeftExpand size={20} />
              : <IconLayoutSidebarLeftCollapse size={20} />
            }
          </ActionIcon>
        </Tooltip>

        {/* 상단 네비게이션 */}
        <Stack gap={4} style={{ flex: 1, overflow: 'hidden' }}>
          <ScrollArea flex={1}>
            <Stack gap={4}>
              {navItems.map((item) =>
                collapsed ? (
                  <Tooltip key={item.href} label={item.label} position="right" withArrow>
                    <ActionIcon
                      variant={location.pathname === item.href ? 'filled' : 'subtle'}
                      color={location.pathname === item.href ? 'blue' : 'gray'}
                      size="lg"
                      onClick={() => navigate(item.href)}
                      style={{ width: '100%', borderRadius: rem(6) }}
                    >
                      <item.icon size={18} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Group
                    key={item.href}
                    gap={0}
                    style={{
                      borderRadius: rem(6),
                      overflow: 'hidden',
                      backgroundColor: location.pathname === item.href
                        ? 'var(--mantine-color-blue-filled)'
                        : 'transparent',
                    }}
                  >
                    <NavLink
                      label={item.label}
                      leftSection={<item.icon size={16} />}
                      active={location.pathname === item.href}
                      onClick={() => navigate(item.href)}
                      variant="filled"
                      style={{ borderRadius: 0, flex: 1 }}
                    />
                    <Menu shadow="md" width={180} withinPortal position="right-start">
                      <Menu.Target>
                        <ActionIcon
                          variant="subtle"
                          color={location.pathname === item.href ? 'white' : 'gray'}
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                          style={{ borderRadius: 0, height: '100%', minHeight: rem(36) }}
                        >
                          <IconDots size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                        <Menu.Label>설정</Menu.Label>
                        <Menu.Item leftSection={<IconSortAscendingLetters size={14} />}>이름순 정렬</Menu.Item>
                        <Menu.Item leftSection={<IconClock size={14} />}>최신순 정렬</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Group>
                )
              )}
            </Stack>
          </ScrollArea>
        </Stack>

        {/* 하단 고정 설정 */}
        <Stack gap={0} mt="auto">
          <Divider mb="xs" />
          {collapsed ? (
            <Tooltip label="설정" position="right" withArrow>
              <ActionIcon
                variant={location.pathname === '/settings' ? 'filled' : 'subtle'}
                color={location.pathname === '/settings' ? 'blue' : 'gray'}
                size="lg"
                onClick={() => navigate('/settings')}
                style={{ width: '100%', borderRadius: rem(6) }}
              >
                <IconSettings size={18} />
              </ActionIcon>
            </Tooltip>
          ) : (
            <NavLink
              label="설정"
              leftSection={<IconSettings size={16} />}
              active={location.pathname === '/settings'}
              onClick={() => navigate('/settings')}
              variant="filled"
              style={{ borderRadius: rem(6) }}
            />
          )}
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
