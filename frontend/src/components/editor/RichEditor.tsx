import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { Markdown } from 'tiptap-markdown';
import {
  ActionIcon,
  Divider,
  Group,
  Paper,
  Tooltip,
  Text,
} from '@mantine/core';
import {
  IconBold,
  IconItalic,
  IconUnderline,
  IconStrikethrough,
  IconCode,
  IconH1,
  IconH2,
  IconH3,
  IconList,
  IconListNumbers,
  IconListCheck,
  IconBlockquote,
  IconSeparator,
  IconHighlight,
  IconLink,
  IconArrowBack,
  IconArrowForward,
  IconMarkdown,
} from '@tabler/icons-react';
import { useEffect, useCallback } from 'react';
import './RichEditor.css';

interface RichEditorProps {
  content: string;
  onChange: (markdown: string) => void;
  editable?: boolean;
}

type Level = 1 | 2 | 3;

// ── 툴바 버튼 ──────────────────────────────────────────────────────────────────
function ToolBtn({
  label, active, disabled, onClick, children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label} withArrow position="top" openDelay={400}>
      <ActionIcon
        variant={active ? 'filled' : 'subtle'}
        color={active ? 'blue' : 'gray'}
        size="sm"
        disabled={disabled}
        onClick={onClick}
      >
        {children}
      </ActionIcon>
    </Tooltip>
  );
}

// ── 메인 에디터 ────────────────────────────────────────────────────────────────
export default function RichEditor({ content, onChange, editable = true }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: { languageClassPrefix: 'language-' } }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: '내용을 입력하세요... (마크다운 문법을 그대로 사용할 수 있습니다)' }),
      CharacterCount,
      Markdown.configure({ html: false, transformPastedText: true }),
    ],
    content,
    editable,
    onUpdate: ({ editor: e }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onChange((e.storage as any).markdown.getMarkdown());
    },
  });

  // content prop이 외부에서 바뀔 때 (초기 로드 등) 동기화
  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (editor.storage as any).markdown.getMarkdown();
    if (current !== content) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('URL을 입력하세요', prev ?? 'https://');
    if (url === null) return;
    if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount.characters();
  const wordCount = editor.storage.characterCount.words();

  return (
    <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
      {/* ── 툴바 ── */}
      {editable && (
        <Group
          gap={2}
          p="xs"
          wrap="wrap"
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          {/* 텍스트 스타일 */}
          <ToolBtn label="굵게 (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
            <IconBold size={14} />
          </ToolBtn>
          <ToolBtn label="기울임 (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <IconItalic size={14} />
          </ToolBtn>
          <ToolBtn label="밑줄 (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <IconUnderline size={14} />
          </ToolBtn>
          <ToolBtn label="취소선" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <IconStrikethrough size={14} />
          </ToolBtn>
          <ToolBtn label="하이라이트" active={editor.isActive('highlight')} onClick={() => editor.chain().focus().toggleHighlight().run()}>
            <IconHighlight size={14} />
          </ToolBtn>
          <ToolBtn label="인라인 코드" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
            <IconCode size={14} />
          </ToolBtn>

          <Divider orientation="vertical" mx={4} />

          {/* 제목 */}
          {([1, 2, 3] as Level[]).map((level) => {
            const Icon = level === 1 ? IconH1 : level === 2 ? IconH2 : IconH3;
            return (
              <ToolBtn
                key={level}
                label={`제목 ${level}`}
                active={editor.isActive('heading', { level })}
                onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
              >
                <Icon size={14} />
              </ToolBtn>
            );
          })}

          <Divider orientation="vertical" mx={4} />

          {/* 목록 */}
          <ToolBtn label="글머리 기호 목록" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <IconList size={14} />
          </ToolBtn>
          <ToolBtn label="번호 목록" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <IconListNumbers size={14} />
          </ToolBtn>
          <ToolBtn label="체크리스트" active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()}>
            <IconListCheck size={14} />
          </ToolBtn>

          <Divider orientation="vertical" mx={4} />

          {/* 블록 */}
          <ToolBtn label="인용" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <IconBlockquote size={14} />
          </ToolBtn>
          <ToolBtn label="코드 블록" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
            <IconMarkdown size={14} />
          </ToolBtn>
          <ToolBtn label="구분선" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <IconSeparator size={14} />
          </ToolBtn>
          <ToolBtn label="링크" active={editor.isActive('link')} onClick={setLink}>
            <IconLink size={14} />
          </ToolBtn>

          <Divider orientation="vertical" mx={4} />

          {/* 실행취소/다시실행 */}
          <ToolBtn label="실행 취소 (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <IconArrowBack size={14} />
          </ToolBtn>
          <ToolBtn label="다시 실행 (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <IconArrowForward size={14} />
          </ToolBtn>
        </Group>
      )}

      {/* ── 편집 영역 ── */}
      <div className="rich-editor">
        <EditorContent editor={editor} />
      </div>

      {/* ── 하단 정보 ── */}
      {editable && (
        <Group
          justify="flex-end"
          px="md"
          py={6}
          style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
        >
          <Text size="xs" c="dimmed">
            {charCount.toLocaleString()}자 · {wordCount.toLocaleString()}단어
          </Text>
        </Group>
      )}
    </Paper>
  );
}
