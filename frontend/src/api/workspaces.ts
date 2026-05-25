import type { Workspace } from '@shared/types';
import client from './client';

export async function getWorkspaces(): Promise<Workspace[]> {
  const { data } = await client.get<Workspace[]>('/api/workspaces');
  return data;
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const { data } = await client.get<Workspace>(`/api/workspaces/${id}`);
  return data;
}

export async function createWorkspace(name: string, description?: string): Promise<Workspace> {
  const { data } = await client.post<Workspace>('/api/workspaces', { name, description });
  return data;
}

export async function updateWorkspace(id: string, body: { name?: string; description?: string }): Promise<Workspace> {
  const { data } = await client.patch<Workspace>(`/api/workspaces/${id}`, body);
  return data;
}

export async function deleteWorkspace(id: string): Promise<void> {
  await client.delete(`/api/workspaces/${id}`);
}
