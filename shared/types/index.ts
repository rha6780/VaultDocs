// ─── User ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  createdAt: string;
}

// ─── Document ────────────────────────────────────────────────────────────────

export type DocumentStatus = 'draft' | 'published' | 'archived';

export interface Document {
  id: string;
  title: string;
  content: string;
  status: DocumentStatus;
  ownerId: string;
  projectId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentSummary {
  id: string;
  title: string;
  status: DocumentStatus;
  ownerId: string;
  projectId: string | null;
  updatedAt: string;
}

// ─── Version ─────────────────────────────────────────────────────────────────

export interface VersionSnapshot {
  id: string;
  documentId: string;
  version: number;
  diff: string;
  snapshot: string;
  createdAt: string;
  createdById: string;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

export interface PresignedUrlResponse {
  url: string;
  key: string;
  expiresAt: string;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
