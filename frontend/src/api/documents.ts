import type { Document, DocumentSummary } from '@shared/types';
import client from './client';

/**
 * folderId: undefined → 필터 없음 / null → 폴더 미지정 문서만 / string → 해당 폴더
 * workspaceId: string → 해당 워크스페이스 문서만
 */
export async function getDocuments(opts?: {
  folderId?: string | null;
  workspaceId?: string;
}): Promise<DocumentSummary[]> {
  const params: Record<string, string> = {};
  if (opts?.folderId !== undefined) params.folderId = opts.folderId ?? 'null';
  if (opts?.workspaceId) params.workspaceId = opts.workspaceId;
  const { data } = await client.get<DocumentSummary[]>('/api/documents', { params });
  return data;
}

export async function getDocument(id: string): Promise<Document> {
  const { data } = await client.get<Document>(`/api/documents/${id}`);
  return data;
}

export async function createDocument(
  title: string,
  opts?: { folderId?: string; workspaceId?: string },
): Promise<Document> {
  const { data } = await client.post<Document>('/api/documents', {
    title,
    ...(opts?.folderId ? { folderId: opts.folderId } : {}),
    ...(opts?.workspaceId ? { workspaceId: opts.workspaceId } : {}),
  });
  return data;
}

export async function updateDocument(
  id: string,
  body: { title?: string; content?: string },
): Promise<Document> {
  const { data } = await client.patch<Document>(`/api/documents/${id}`, body);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await client.delete(`/api/documents/${id}`);
}
