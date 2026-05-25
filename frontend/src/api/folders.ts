import type { Folder } from '@shared/types';
import client from './client';

export async function getFolders(parentId?: string): Promise<Folder[]> {
  const params = parentId ? { parentId } : {};
  const { data } = await client.get<Folder[]>('/api/folders', { params });
  return data;
}

export async function getFolderBreadcrumb(id: string): Promise<Folder[]> {
  const { data } = await client.get<Folder[]>(`/api/folders/${id}/breadcrumb`);
  return data;
}

export async function createFolder(name: string, parentId?: string): Promise<Folder> {
  const { data } = await client.post<Folder>('/api/folders', { name, parentId });
  return data;
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const { data } = await client.patch<Folder>(`/api/folders/${id}`, { name });
  return data;
}

export async function deleteFolder(id: string): Promise<void> {
  await client.delete(`/api/folders/${id}`);
}
