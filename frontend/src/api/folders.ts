import type { Folder } from '@shared/types';
import client from './client';

export async function getFolders(opts?: { parentId?: string; workspaceId?: string }): Promise<Folder[]> {
  const { data } = await client.get<Folder[]>('/api/folders', { params: opts ?? {} });
  return data;
}

export async function getFolderBreadcrumb(id: string): Promise<Folder[]> {
  const { data } = await client.get<Folder[]>(`/api/folders/${id}/breadcrumb`);
  return data;
}

export async function createFolder(name: string, opts?: { parentId?: string; workspaceId?: string }): Promise<Folder> {
  const { data } = await client.post<Folder>('/api/folders', { name, ...opts });
  return data;
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const { data } = await client.patch<Folder>(`/api/folders/${id}`, { name });
  return data;
}

export async function deleteFolder(id: string): Promise<void> {
  await client.delete(`/api/folders/${id}`);
}
