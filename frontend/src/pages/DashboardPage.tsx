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
} from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import AppLayout from '@/components/layout/AppShell';
import { getDocuments, createDocument, deleteDocument } from '@/api/documents';
import type { DocumentSummary, DocumentStatus } from '@shared/types';

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
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
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
        <Menu.Item leftSection={<IconPencil size={14} />} onClick={() => navigate(`/documents/${docId}`)}>
          편집
        </Menu.Item>
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
  const [opened, { open, close }] = useDisclosure(false);
  const [newTitle, setNewTitle] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const { data: documents = [], isLoading, isError } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
  });

  const createMutation = useMutation({
    mutationFn: (title: string) => createDocument(title),
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      close();
      setNewTitle('');
      navigate(`/documents/${doc.id}`);
    },
    onError: () => {
      notifications.show({ message: '문서 생성 중 오류가 발생했습니다.', color: 'red' });
    },
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const rows = documents
    .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const v = a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
      return sortDir === 'asc' ? v : -v;
    });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    createMutation.mutate(newTitle.trim());
  };

  return (
    <AppLayout>
      <Stack gap="lg">
        <Group justify="space-between">
          <Title order={2}>문서</Title>
          <Button leftSection={<IconPlus size={16} />} onClick={open}>새 문서</Button>
        </Group>

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

        {isLoading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" />
          </Group>
        ) : (
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
                      {search ? '검색 결과가 없습니다.' : '문서가 없습니다. 새 문서를 만들어보세요.'}
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
                      onDeleted={() => queryClient.invalidateQueries({ queryKey: ['documents'] })}
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Stack>

      <Modal opened={opened} onClose={close} title="새 문서 만들기" centered>
        <Stack gap="md">
          <TextInput
            label="제목"
            placeholder="문서 제목을 입력하세요"
            value={newTitle}
            onChange={(e) => setNewTitle(e.currentTarget.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>취소</Button>
            <Button
              onClick={handleCreate}
              disabled={!newTitle.trim()}
              loading={createMutation.isPending}
            >
              만들기
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppLayout>
  );
}
