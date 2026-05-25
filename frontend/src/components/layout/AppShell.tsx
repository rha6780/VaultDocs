import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  AppShell,
  NavLink,
  Group,
  Text,
  Avatar,
  Menu,
  Burger,
  Stack,
  ActionIcon,
  Tooltip,
  Divider,
  ScrollArea,
  Modal,
  TextInput,
  Button,
  rem,
  Loader,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  IconLogout,
  IconChevronDown,
  IconLayoutDashboard,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconUser,
  IconPalette,
  IconBell,
  IconSettings,
  IconFolder,
  IconFolderOpen,
  IconFolderPlus,
  IconChevronRight,
} from '@tabler/icons-react';
import { useAuthStore } from '@/store/auth';
import { getWorkspaces, createWorkspace } from '@/api/workspaces';
import { getFolders } from '@/api/folders';
import type { Workspace, Folder } from '@shared/types';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import './AppShell.css';

const NAV_WIDTH = 240;
const NAV_COLLAPSED_WIDTH = 60;

// ── 폴더 트리 노드 ─────────────────────────────────────────────────────────────
function FolderNode({
  folder,
  depth,
  collapsed,
  selectedFolderId,
}: {
  folder: Folder;
  depth: number;
  collapsed: boolean;
  selectedFolderId: string | null;
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [opened, setOpened] = useState(false);

  const { data: children = [], isFetching } = useQuery({
    queryKey: ['folders', 'children', folder.id],
    queryFn: () => getFolders({ parentId: folder.id }),
    enabled: opened,
  });

  const workspaceId = searchParams.get('workspaceId');
  const isActive = selectedFolderId === folder.id;

  const handleNavigate = () => {
    navigate(`/?workspaceId=${workspaceId}&folderId=${folder.id}`);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpened((o) => !o);
  };

  if (collapsed) {
    return (
      <Tooltip label={folder.name} position="right" withArrow>
        <ActionIcon
          variant={isActive ? 'filled' : 'subtle'}
          color={isActive ? 'blue' : 'gray'}
          size="lg"
          onClick={handleNavigate}
          style={{ width: '100%', borderRadius: rem(6) }}
        >
          <IconFolder size={16} />
        </ActionIcon>
      </Tooltip>
    );
  }

  return (
    <div>
      <div className={`nav-row${isActive ? ' active' : ''}`}>
        {/* 이름 영역 — 클릭 시 이동 */}
        <div
          className="nav-row-label"
          style={{ paddingLeft: rem(12 + depth * 12) }}
          onClick={handleNavigate}
        >
          {isActive ? <IconFolderOpen size={15} /> : <IconFolder size={15} />}
          <Text size="sm" truncate>{folder.name}</Text>
        </div>
        {/* 화살표 — 클릭 시 펼치기/접기 */}
        <div className="nav-row-toggle" onClick={handleToggle}>
          {isFetching ? (
            <Loader size={10} />
          ) : (
            <IconChevronRight
              size={14}
              style={{ transform: opened ? 'rotate(90deg)' : 'none', transition: 'transform 150ms ease' }}
            />
          )}
        </div>
      </div>
      {opened && children.map((child) => (
        <FolderNode
          key={child.id}
          folder={child}
          depth={depth + 1}
          collapsed={collapsed}
          selectedFolderId={selectedFolderId}
        />
      ))}
    </div>
  );
}

// ── 워크스페이스 노드 ──────────────────────────────────────────────────────────
function WorkspaceNode({
  workspace,
  collapsed,
  selectedWorkspaceId,
  selectedFolderId,
}: {
  workspace: Workspace;
  collapsed: boolean;
  selectedWorkspaceId: string | null;
  selectedFolderId: string | null;
}) {
  const navigate = useNavigate();
  const isSelected = selectedWorkspaceId === workspace.id;
  const [opened, setOpened] = useState(isSelected);

  const { data: folders = [], isFetching } = useQuery({
    queryKey: ['folders', 'root', workspace.id],
    queryFn: () => getFolders({ workspaceId: workspace.id }),
    enabled: opened,
  });

  const handleNavigate = () => {
    navigate(`/?workspaceId=${workspace.id}`);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpened((o) => !o);
  };

  if (collapsed) {
    return (
      <Tooltip label={workspace.name} position="right" withArrow>
        <ActionIcon
          variant={isSelected ? 'filled' : 'subtle'}
          color={isSelected ? 'blue' : 'gray'}
          size="lg"
          onClick={() => navigate(`/?workspaceId=${workspace.id}`)}
          style={{ width: '100%', borderRadius: rem(6) }}
        >
          <IconFolder size={18} />
        </ActionIcon>
      </Tooltip>
    );
  }

  const isActive = isSelected && !selectedFolderId;

  return (
    <div>
      <div className={`nav-row${isActive ? ' active' : ''}`}>
        {/* 이름 영역 — 클릭 시 이동 */}
        <div className="nav-row-label" onClick={handleNavigate}>
          {isSelected
            ? <IconFolderOpen size={16} color={isActive ? '#fff' : 'var(--mantine-color-blue-6)'} />
            : <IconFolder size={16} />
          }
          <Text size="sm" fw={600} truncate>{workspace.name}</Text>
        </div>
        {/* 화살표 — 클릭 시 펼치기/접기 */}
        <div className="nav-row-toggle" onClick={handleToggle}>
          {isFetching ? (
            <Loader size={10} />
          ) : (
            <IconChevronRight
              size={14}
              style={{ transform: opened ? 'rotate(90deg)' : 'none', transition: 'transform 150ms ease' }}
            />
          )}
        </div>
      </div>
      {opened && folders.map((folder) => (
        <FolderNode
          key={folder.id}
          folder={folder}
          depth={0}
          collapsed={collapsed}
          selectedFolderId={selectedFolderId}
        />
      ))}
    </div>
  );
}

// ── 메인 레이아웃 ──────────────────────────────────────────────────────────────
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [collapsed, { toggle: toggleCollapse }] = useDisclosure(false);
  const [wsModalOpened, { open: openWsModal, close: closeWsModal }] = useDisclosure(false);
  const [newWsName, setNewWsName] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const selectedWorkspaceId = searchParams.get('workspaceId');
  const selectedFolderId = searchParams.get('folderId');

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  const { data: workspaces = [], isLoading: wsLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });

  const createWsMutation = useMutation({
    mutationFn: (name: string) => createWorkspace(name),
    onSuccess: (ws) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      closeWsModal();
      setNewWsName('');
      navigate(`/?workspaceId=${ws.id}`);
    },
    onError: () => notifications.show({ message: '워크스페이스 생성 중 오류가 발생했습니다.', color: 'red' }),
  });

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
      padding="lg"
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
              <Menu.Item color="red" leftSection={<IconLogout size={14} />} onClick={handleLogout}>로그아웃</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </AppShell.Header>

      {/* ── 사이드바 ── */}
      <AppShell.Navbar p={collapsed ? 'xs' : 'sm'} style={{ overflow: 'visible' }}>

        {/* 접기 버튼 */}
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

        {/* 워크스페이스 트리 */}
        <Stack gap={0} style={{ flex: 1, overflow: 'hidden' }}>

          {/* 워크스페이스 헤더 */}
          {!collapsed && (
            <Group justify="space-between" px={4} mb={4}>
              <Text size="xs" fw={600} c="dimmed" tt="uppercase">워크스페이스</Text>
              <Tooltip label="새 워크스페이스" position="right" withArrow>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={openWsModal}>
                  <IconFolderPlus size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}

          <ScrollArea flex={1} offsetScrollbars>
            <Stack gap={2}>
              {collapsed && (
                <Tooltip label="새 워크스페이스" position="right" withArrow>
                  <ActionIcon variant="subtle" color="gray" size="lg" onClick={openWsModal} style={{ width: '100%', borderRadius: rem(6) }}>
                    <IconFolderPlus size={18} />
                  </ActionIcon>
                </Tooltip>
              )}

              {wsLoading ? (
                <Group justify="center" py="xs"><Loader size="xs" /></Group>
              ) : workspaces.length === 0 ? (
                !collapsed && (
                  <Text size="xs" c="dimmed" ta="center" py="sm">
                    워크스페이스를 만들어보세요
                  </Text>
                )
              ) : (
                workspaces.map((ws) => (
                  <WorkspaceNode
                    key={ws.id}
                    workspace={ws}
                    collapsed={collapsed}
                    selectedWorkspaceId={selectedWorkspaceId}
                    selectedFolderId={selectedFolderId}
                  />
                ))
              )}
            </Stack>
          </ScrollArea>
        </Stack>

        {/* 하단 설정 */}
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

      {/* 새 워크스페이스 모달 */}
      <Modal opened={wsModalOpened} onClose={closeWsModal} title="새 워크스페이스 만들기" centered>
        <Stack gap="md">
          <TextInput
            label="이름"
            placeholder="워크스페이스 이름을 입력하세요"
            value={newWsName}
            onChange={(e) => setNewWsName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && createWsMutation.mutate(newWsName.trim())}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeWsModal}>취소</Button>
            <Button
              onClick={() => createWsMutation.mutate(newWsName.trim())}
              disabled={!newWsName.trim()}
              loading={createWsMutation.isPending}
            >
              만들기
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppShell>
  );
}
