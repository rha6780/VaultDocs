import type { Document, DocumentSummary } from '@shared/types';
import client from './client';

/** folderId: undefined → 전체 / null → 루트 / string → 해당 폴더 */
export async function getDocuments(folderId?: string | null): Promise<DocumentSummary[]> {
  const params: Record<string, string> = {};
  if (folderId !== undefined) params.folderId = folderId ?? 'null';
  const { data } = await client.get<DocumentSummary[]>('/api/documents', { params });
  return data;
}

export async function getDocument(id: string): Promise<Document> {
  const { data } = await client.get<Document>(`/api/documents/${id}`);
  return data;
}

export async function createDocument(title: string): Promise<Document> {
  const { data } = await client.post<Document>('/api/documents', { title });
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
