import {
  Stack,
  Group,
  Title,
  Button,
  TextInput,
  Text,
  Badge,
  ActionIcon,
  Modal,
  Menu,
  Table,
  UnstyledButton,
  Loader,
  Alert,
  SimpleGrid,
  Card,
  Breadcrumbs,
  Anchor,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconFile,
  IconPencil,
  IconCopy,
  IconDownload,
  IconArchive,
  IconTrash,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconAlertCircle,
  IconFolder,
  IconFolderPlus,
  IconHome,
} from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import AppLayout from '@/components/layout/AppShell';
import { getDocuments, createDocument, deleteDocument } from '@/api/documents';
import { getFolders, createFolder, deleteFolder, renameFolder } from '@/api/folders';
import type { DocumentSummary, DocumentStatus, Folder } from '@shared/types';

const STATUS_COLOR: Record<DocumentStatus, string> = {
  draft: 'gray',
  published: 'green',
  archived: 'orange',
};

const STATUS_LABEL: Record<DocumentStatus, string> = {
  draft: '초안',
  published: '게시됨',
  archived: '보관됨',
};

type SortKey = 'title' | 'status' | 'updatedAt';
type SortDir = 'asc' | 'desc';

function ThSort({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir; onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  const Icon = active ? (dir === 'asc' ? IconChevronUp : IconChevronDown) : IconSelector;
  return (
    <Table.Th>
      <UnstyledButton
        onClick={() => onSort(sortKey)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--mantine-color-gray-7)' }}
      >
        {label}
        <Icon size={14} color={active ? 'var(--mantine-color-blue-6)' : 'var(--mantine-color-gray-5)'} />
      </UnstyledButton>
    </Table.Th>
  );
}

function FolderCard({ folder, onClick, onRename, onDelete }: {
  folder: Folder;
  onClick: () => void;
  onRename: (folder: Folder) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card
      withBorder
      radius="md"
      padding="sm"
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={onClick}
    >
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" wrap="nowrap" style={{ overflow: 'hidden' }}>
          <IconFolder size={20} color="var(--mantine-color-yellow-6)" style={{ flexShrink: 0 }} />
          <Text size="sm" fw={500} lineClamp={1}>{folder.name}</Text>
        </Group>
        <Menu shadow="md" width={160} withinPortal position="bottom-end">
          <Menu.Target>
            <ActionIcon
              variant="subtle" color="gray" size="sm"
              onClick={(e) => e.stopPropagation()}
            >
              <IconDots size={14} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
            <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => onRename(folder)}>
              이름 변경
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={() => onDelete(folder.id)}>
              삭제
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Card>
  );
}

function DocMenu({ docId, onDeleted }: { docId: string; onDeleted: () => void }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('문서를 삭제할까요?')) return;
    setLoading(true);
    try {
      await deleteDocument(docId);
      onDeleted();
      notifications.show({ message: '문서가 삭제됐습니다.', color: 'green' });
    } catch {
      notifications.show({ message: '삭제 중 오류가 발생했습니다.', color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Menu shadow="md" width={180} withinPortal position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={(e) => e.stopPropagation()} loading={loading}>
          <IconDots size={14} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
        <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => navigate(`/documents/${docId}`)}>편집</Menu.Item>
        <Menu.Item leftSection={<IconCopy size={14} />}>복제</Menu.Item>
        <Menu.Item leftSection={<IconDownload size={14} />}>PDF 내보내기</Menu.Item>
        <Menu.Divider />
        <Menu.Item leftSection={<IconArchive size={14} />}>보관</Menu.Item>
        <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={handleDelete}>삭제</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 현재 탐색 중인 폴더 스택 (breadcrumb용)
  const [folderStack, setFolderStack] = useState<Folder[]>([]);
  const currentFolderId = folderStack.length > 0 ? folderStack[folderStack.length - 1].id : null;

  const [docModalOpened, { open: openDocModal, close: closeDocModal }] = useDisclosure(false);
  const [folderModalOpened, { open: openFolderModal, close: closeFolderModal }] = useDisclosure(false);
  const [renameModalOpened, { open: openRenameModal, close: closeRenameModal }] = useDisclosure(false);

  const [newTitle, setNewTitle] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['folders', currentFolderId],
    queryFn: () => getFolders(currentFolderId ?? undefined),
  });

  const { data: documents = [], isLoading: docsLoading, isError } = useQuery({
    queryKey: ['documents', currentFolderId],
    queryFn: () => getDocuments(currentFolderId),
  });

  const createDocMutation = useMutation({
    mutationFn: (title: string) => createDocument(title),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['documents', currentFolderId] });
      closeDocModal();
      setNewTitle('');
      navigate(`/documents/${doc.id}`);
    },
    onError: () => notifications.show({ message: '문서 생성 중 오류가 발생했습니다.', color: 'red' }),
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createFolder(name, currentFolderId ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', currentFolderId] });
      closeFolderModal();
      setNewFolderName('');
      notifications.show({ message: '폴더가 생성됐습니다.', color: 'green' });
    },
    onError: () => notifications.show({ message: '폴더 생성 중 오류가 발생했습니다.', color: 'red' }),
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => renameFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', currentFolderId] });
      closeRenameModal();
      setRenamingFolder(null);
    },
    onError: () => notifications.show({ message: '이름 변경 중 오류가 발생했습니다.', color: 'red' }),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folders', currentFolderId] });
      notifications.show({ message: '폴더가 삭제됐습니다.', color: 'green' });
    },
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notifications.show({ message: msg ?? '폴더 삭제 중 오류가 발생했습니다.', color: 'red' });
    },
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const enterFolder = (folder: Folder) => {
    setFolderStack((prev) => [...prev, folder]);
    setSearch('');
  };

  const navigateToBreadcrumb = (index: number) => {
    setFolderStack((prev) => prev.slice(0, index + 1));
    setSearch('');
  };

  const handleDeleteFolder = (id: string) => {
    if (!confirm('폴더를 삭제할까요? 비어있는 폴더만 삭제할 수 있습니다.')) return;
    deleteFolderMutation.mutate(id);
  };

  const handleRenameClick = (folder: Folder) => {
    setRenamingFolder(folder);
    setRenameValue(folder.name);
    openRenameModal();
  };

  const rows = documents
    .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const v = a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
      return sortDir === 'asc' ? v : -v;
    });

  const isLoading = foldersLoading || docsLoading;

  return (
    <AppLayout>
      <Stack gap="lg">
        {/* 헤더 */}
        <Group justify="space-between">
          <Title order={2}>문서</Title>
          <Group gap="xs">
            <Tooltip label="새 폴더">
              <ActionIcon variant="default" size="lg" onClick={openFolderModal}>
                <IconFolderPlus size={18} />
              </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconPlus size={16} />} onClick={openDocModal}>새 문서</Button>
          </Group>
        </Group>

        {/* 폴더 Breadcrumb */}
        <Breadcrumbs separator="›">
          <Anchor
            size="sm"
            onClick={() => setFolderStack([])}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <IconHome size={14} />
            전체
          </Anchor>
          {folderStack.map((f, i) => (
            i === folderStack.length - 1
              ? <Text key={f.id} size="sm" fw={500}>{f.name}</Text>
              : <Anchor key={f.id} size="sm" onClick={() => navigateToBreadcrumb(i)}>{f.name}</Anchor>
          ))}
        </Breadcrumbs>

        {isLoading ? (
          <Group justify="center" py="xl"><Loader size="sm" /></Group>
        ) : (
          <>
            {/* 폴더 그리드 */}
            {folders.length > 0 && (
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
                {folders.map((folder) => (
                  <FolderCard
                    key={folder.id}
                    folder={folder}
                    onClick={() => enterFolder(folder)}
                    onRename={handleRenameClick}
                    onDelete={handleDeleteFolder}
                  />
                ))}
              </SimpleGrid>
            )}

            {/* 검색 */}
            <TextInput
              placeholder="문서 검색..."
              leftSection={<IconSearch size={16} />}
              value={search}
              onChange={(e) => setSearch(e.currentTarget.value)}
              w={{ base: '100%', sm: 300 }}
            />

            {isError && (
              <Alert icon={<IconAlertCircle size={16} />} color="red" title="불러오기 실패">
                문서 목록을 가져오는 중 오류가 발생했습니다.
              </Alert>
            )}

            {/* 문서 테이블 */}
            <Table highlightOnHover verticalSpacing="sm" style={{ tableLayout: 'fixed' }}>
              <Table.Thead>
                <Table.Tr>
                  <ThSort label="제목" sortKey="title" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <ThSort label="상태" sortKey="status" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <ThSort label="수정일" sortKey="updatedAt" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <Table.Th w={40} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text size="sm" c="dimmed" ta="center" py="xl">
                        {search ? '검색 결과가 없습니다.' : '이 위치에 문서가 없습니다.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : rows.map((doc: DocumentSummary) => (
                  <Table.Tr
                    key={doc.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/documents/${doc.id}`)}
                  >
                    <Table.Td>
                      <Group gap="xs">
                        <IconFile size={16} color="var(--mantine-color-blue-6)" style={{ flexShrink: 0 }} />
                        <Text size="sm" fw={500} lineClamp={1}>{doc.title}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={STATUS_COLOR[doc.status]} variant="light" size="sm">
                        {STATUS_LABEL[doc.status]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {new Date(doc.updatedAt).toLocaleDateString('ko-KR')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <DocMenu
                        docId={doc.id}
                        onDeleted={() => queryClient.invalidateQueries({ queryKey: ['documents', currentFolderId] })}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </>
        )}
      </Stack>

      {/* 새 문서 모달 */}
      <Modal opened={docModalOpened} onClose={closeDocModal} title="새 문서 만들기" centered>
        <Stack gap="md">
          <TextInput
            label="제목"
            placeholder="문서 제목을 입력하세요"
            value={newTitle}
            onChange={(e) => setNewTitle(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && createDocMutation.mutate(newTitle.trim())}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeDocModal}>취소</Button>
            <Button
              onClick={() => createDocMutation.mutate(newTitle.trim())}
              disabled={!newTitle.trim()}
              loading={createDocMutation.isPending}
            >
              만들기
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 새 폴더 모달 */}
      <Modal opened={folderModalOpened} onClose={closeFolderModal} title="새 폴더 만들기" centered>
        <Stack gap="md">
          <TextInput
            label="폴더 이름"
            placeholder="폴더 이름을 입력하세요"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && createFolderMutation.mutate(newFolderName.trim())}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeFolderModal}>취소</Button>
            <Button
              onClick={() => createFolderMutation.mutate(newFolderName.trim())}
              disabled={!newFolderName.trim()}
              loading={createFolderMutation.isPending}
            >
              만들기
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* 폴더 이름 변경 모달 */}
      <Modal opened={renameModalOpened} onClose={closeRenameModal} title="폴더 이름 변경" centered>
        <Stack gap="md">
          <TextInput
            label="새 이름"
            value={renameValue}
            onChange={(e) => setRenameValue(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && renamingFolder && renameMutation.mutate({ id: renamingFolder.id, name: renameValue.trim() })}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeRenameModal}>취소</Button>
            <Button
              onClick={() => renamingFolder && renameMutation.mutate({ id: renamingFolder.id, name: renameValue.trim() })}
              disabled={!renameValue.trim()}
              loading={renameMutation.isPending}
            >
              변경
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppLayout>
  );
}
