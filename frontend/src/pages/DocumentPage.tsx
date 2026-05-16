import { useNavigate } from 'react-router-dom';
import {
  Stack,
  Group,
  Title,
  Button,
  Badge,
  Text,
  Breadcrumbs,
  Anchor,
  Textarea,
  Paper,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconArrowLeft, IconDeviceFloppy, IconHistory, IconDownload } from '@tabler/icons-react';
import { useState } from 'react';
import AppLayout from '@/components/layout/AppShell';

export default function DocumentPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState('# 새 문서\n\n내용을 입력하세요.');
  const [saved, setSaved] = useState(true);

  const handleSave = () => {
    setSaved(true);
  };

  return (
    <AppLayout>
      <Stack gap="md">
        <Breadcrumbs>
          <Anchor onClick={() => navigate('/')} size="sm">문서</Anchor>
          <Text size="sm">프로젝트 기획서</Text>
        </Breadcrumbs>

        <Group justify="space-between">
          <Group>
            <ActionIcon variant="subtle" onClick={() => navigate('/')}>
              <IconArrowLeft size={18} />
            </ActionIcon>
            <Title order={3}>프로젝트 기획서</Title>
            <Badge color="gray" variant="light">초안</Badge>
            {!saved && <Badge color="orange" variant="dot">저장 안 됨</Badge>}
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
              onClick={handleSave}
              disabled={saved}
            >
              저장
            </Button>
          </Group>
        </Group>

        <Paper withBorder radius="md" p="md" style={{ minHeight: 'calc(100vh - 220px)' }}>
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.currentTarget.value);
              setSaved(false);
            }}
            autosize
            minRows={20}
            variant="unstyled"
            styles={{ input: { fontFamily: 'monospace', fontSize: '14px' } }}
          />
        </Paper>
      </Stack>
    </AppLayout>
  );
}
