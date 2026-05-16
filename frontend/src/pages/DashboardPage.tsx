import {
  Stack,
  Group,
  Title,
  Button,
  TextInput,
  Card,
  Text,
  Badge,
  ActionIcon,
  SimpleGrid,
  Modal,
  Menu,
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

const mockDocuments = [
  { id: '1', title: '프로젝트 기획서', status: 'published' as const, updatedAt: '2026-05-16' },
  { id: '2', title: 'API 설계 문서', status: 'draft' as const, updatedAt: '2026-05-15' },
  { id: '3', title: '회의록 05월', status: 'draft' as const, updatedAt: '2026-05-14' },
];

function DocMenu({ docId }: { docId: string }) {
  const navigate = useNavigate();

  return (
    <Menu shadow="md" width={180} withinPortal position="bottom-end">
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          onClick={(e) => e.stopPropagation()}
        >
          <IconDots size={14} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
        <Menu.Item
          leftSection={<IconPencil size={14} />}
          onClick={() => navigate(`/documents/${docId}`)}
        >
          편집
        </Menu.Item>
        <Menu.Item leftSection={<IconCopy size={14} />}>
          복제
        </Menu.Item>
        <Menu.Item leftSection={<IconDownload size={14} />}>
          PDF 내보내기
        </Menu.Item>

        <Menu.Divider />

        <Menu.Item leftSection={<IconArchive size={14} />}>
          보관
        </Menu.Item>
        <Menu.Item color="red" leftSection={<IconTrash size={14} />}>
          삭제
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [newTitle, setNewTitle] = useState('');
  const [search, setSearch] = useState('');

  const filtered = mockDocuments.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()),
  );

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
          <Button leftSection={<IconPlus size={16} />} onClick={open}>
            새 문서
          </Button>
        </Group>

        <TextInput
          placeholder="문서 검색..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          w={{ base: '100%', sm: 300 }}
        />

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {filtered.map((doc) => (
            <Card
              key={doc.id}
              shadow="xs"
              padding="lg"
              radius="md"
              withBorder
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/documents/${doc.id}`)}
            >
              <Group justify="space-between" mb="xs">
                <Group gap="xs" style={{ flex: 1, minWidth: 0 }}>
                  <IconFile size={18} color="var(--mantine-color-blue-6)" style={{ flexShrink: 0 }} />
                  <Text fw={500} size="sm" lineClamp={1}>{doc.title}</Text>
                </Group>
                <DocMenu docId={doc.id} />
              </Group>
              <Group justify="space-between" mt="md">
                <Badge color={STATUS_COLOR[doc.status]} variant="light" size="sm">
                  {STATUS_LABEL[doc.status]}
                </Badge>
                <Text size="xs" c="dimmed">{doc.updatedAt}</Text>
              </Group>
            </Card>
          ))}
        </SimpleGrid>
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
