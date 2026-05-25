import { useNavigate, useParams } from 'react-router-dom';
import {
  Stack,
  Group,
  Title,
  Button,
  Badge,
  Text,
  Breadcrumbs,
  Anchor,
  ActionIcon,
  Tooltip,
  Loader,
  Alert,
  Center,
} from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconHistory, IconDownload, IconAlertCircle } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import AppLayout from '@/components/layout/AppShell';
import RichEditor from '@/components/editor/RichEditor';
import { getDocument, updateDocument } from '@/api/documents';
import type { DocumentStatus } from '@shared/types';

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

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: doc, isLoading, isError } = useQuery({
    queryKey: ['document', id],
    queryFn: () => getDocument(id!),
    enabled: !!id,
  });

  const [content, setContent] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (doc) {
      setContent(doc.content ?? '');
      setIsDirty(false);
    }
  }, [doc]);

  const saveMutation = useMutation({
    mutationFn: () => updateDocument(id!, { content }),
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['documents', 'list'] });
      notifications.show({ message: '저장됐습니다.', color: 'green' });
    },
    onError: () => {
      notifications.show({ message: '저장 중 오류가 발생했습니다.', color: 'red' });
    },
  });

  const handleChange = (markdown: string) => {
    setContent(markdown);
    setIsDirty(true);
  };

  if (isLoading) {
    return (
      <AppLayout>
        <Center h={300}><Loader size="sm" /></Center>
      </AppLayout>
    );
  }

  if (isError || !doc) {
    return (
      <AppLayout>
        <Alert icon={<IconAlertCircle size={16} />} color="red" title="문서를 찾을 수 없습니다">
          문서를 불러오는 중 오류가 발생했습니다.
          <Anchor onClick={() => navigate('/')} ml="xs" size="sm">목록으로 돌아가기</Anchor>
        </Alert>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Stack gap="md">
        <Breadcrumbs>
          <Anchor onClick={() => navigate('/')} size="sm">문서</Anchor>
          <Text size="sm">{doc.title}</Text>
        </Breadcrumbs>

        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={() => navigate('/')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
            <Title order={3}>{doc.title}</Title>
            <Badge color={STATUS_COLOR[doc.status]} variant="light">
              {STATUS_LABEL[doc.status]}
            </Badge>
            {isDirty && <Badge color="orange" variant="dot">저장 안 됨</Badge>}
          </Group>
          <Group>
            <Tooltip label="버전 기록">
              <ActionIcon variant="default" size="lg">
                <IconHistory size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="PDF 내보내기">
              <ActionIcon variant="default" size="lg">
                <IconDownload size={18} />
              </ActionIcon>
            </Tooltip>
            <Button
              leftSection={<IconDeviceFloppy size={16} />}
              onClick={() => saveMutation.mutate()}
              disabled={!isDirty}
              loading={saveMutation.isPending}
            >
              저장
            </Button>
          </Group>
        </Group>

        <RichEditor
          key={doc.id}
          content={content}
          onChange={handleChange}
        />
      </Stack>
    </AppLayout>
  );
}
