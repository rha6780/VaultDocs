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
} from '@tabler/icons-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppShell';

const STATUS_COLOR = {
  draft: 'gray',
  published: 'green',
  archived: 'orange',
} as const;

const STATUS_LABEL = {
  draft: '초안',
  published: '게시됨',
  archived: '보관됨',
} as const;

type Doc = {
  id: string;
  title: string;
  status: keyof typeof STATUS_COLOR;
  updatedAt: string;
};

const mockDocuments: Doc[] = [
  { id: '1', title: '프로젝트 기획서', status: 'published', updatedAt: '2026-05-16' },
  { id: '2', title: 'API 설계 문서', status: 'draft', updatedAt: '2026-05-15' },
  { id: '3', title: '회의록 05월', status: 'draft', updatedAt: '2026-05-14' },
];

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

function DocMenu({ docId }: { docId: string }) {
  const navigate = useNavigate();
  return (
    <Menu shadow="md" width={180} withinPortal position="bottom-end">
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" size="sm" onClick={(e) => e.stopPropagation()}>
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
        <Menu.Item color="red" leftSection={<IconTrash size={14} />}>삭제</Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [newTitle, setNewTitle] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const rows = mockDocuments
    .filter((d) => d.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const v = a[sortKey] < b[sortKey] ? -1 : a[sortKey] > b[sortKey] ? 1 : 0;
      return sortDir === 'asc' ? v : -v;
    });

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    close();
    setNewTitle('');
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
            {rows.map((doc) => (
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
                  <Text size="sm" c="dimmed">{doc.updatedAt}</Text>
                </Table.Td>
                <Table.Td>
                  <DocMenu docId={doc.id} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
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
            <Button onClick={handleCreate} disabled={!newTitle.trim()}>만들기</Button>
          </Group>
        </Stack>
      </Modal>
    </AppLayout>
  );
}
