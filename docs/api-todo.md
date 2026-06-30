# VaultDocs — API 전체 명세

> `frontend/src/api/` 및 백엔드 컨트롤러 기준으로 도출한 전체 엔드포인트 목록.
> ✅ 구현 완료 / ❌ 미구현으로 구분.

---

## 우선순위 (미구현 항목)

| 기호 | 의미 |
|---|---|
| 🔴 | 필수 — 없으면 기본 기능 불가 |
| 🟠 | 중요 — 핵심 기능 완성에 필요 |
| 🟡 | 선택 — UI 확장 시 필요 |
| 🟢 | 나중 — 설정/고급 기능 |

---

## Auth

### ✅ `GET /api/auth/google`

Google OAuth 로그인 시작. Passport가 Google 로그인 페이지로 리다이렉트.

**Auth**: 불필요 (`@Public()`)

---

### ✅ `GET /api/auth/google/callback`

Google OAuth 콜백. 로그인 성공 후 프론트엔드로 토큰과 함께 리다이렉트.

**Auth**: 불필요 (`@Public()`)

**Redirect**
```
{FRONTEND_URL}/auth/callback?accessToken=...&refreshToken=...
```

---

### ✅ `POST /api/auth/dev-login`

개발 환경 전용 로그인. `NODE_ENV=production` 시 403 반환.

**Auth**: 불필요 (`@Public()`)

**Response**
```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatarUrl": "string | null",
    "createdAt": "string (ISO 8601)"
  },
  "tokens": {
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

---

### ✅ `POST /api/auth/logout`

Refresh Token DB에서 무효화.

**Auth**: JWT 필요

**Response**
```json
{ "message": "ok" }
```

---

### ❌ 🔴 `POST /api/auth/refresh`

Access Token(15분) 만료 시 재발급.
`frontend/src/api/client.ts` axios 인터셉터에서 자동 호출되도록 연결 필요.

**Auth**: 불필요 (`@Public()`)

**Request Body**
```json
{ "refreshToken": "string" }
```

**Response**
```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

**구현 위치**: `auth.controller.ts`, `auth.service.ts`

---

### ❌ 🔴 `GET /api/auth/me`

앱 초기 로드 / 새로고침 시 토큰으로 유저 정보 복원.

**Auth**: JWT 필요

**Response**
```json
{
  "id": "string",
  "email": "string",
  "name": "string",
  "avatarUrl": "string | null",
  "createdAt": "string (ISO 8601)"
}
```

**구현 위치**: `auth.controller.ts`, `users/users.service.ts`

---

## Workspaces

### ✅ `GET /api/workspaces`

로그인 유저의 워크스페이스 목록 조회. `updatedAt` 내림차순.

**Auth**: JWT 필요

**Response** `Workspace[]`
```json
[
  {
    "id": "string",
    "name": "string",
    "description": "string | null",
    "ownerId": "string",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  }
]
```

---

### ✅ `GET /api/workspaces/:id`

워크스페이스 단건 조회. 본인 소유가 아니면 404.

**Auth**: JWT 필요

**Response** `Workspace`

---

### ✅ `POST /api/workspaces`

워크스페이스 생성.

**Auth**: JWT 필요

**Request Body**
```json
{
  "name": "string",
  "description": "string (optional)"
}
```

**Response** `Workspace`

---

### ✅ `PATCH /api/workspaces/:id`

워크스페이스 수정.

**Auth**: JWT 필요

**Request Body**
```json
{
  "name": "string (optional)",
  "description": "string (optional)"
}
```

**Response** `Workspace`

---

### ✅ `DELETE /api/workspaces/:id`

워크스페이스 삭제.

**Auth**: JWT 필요

**Response**: 204 No Content

---

## Folders

### ✅ `GET /api/folders`

폴더 목록 조회. `parentId` 없으면 루트 폴더, 있으면 하위 폴더 반환.

**Auth**: JWT 필요

**Query Params**
| 파라미터 | 타입 | 설명 |
|---|---|---|
| `parentId` | string (optional) | 하위 폴더 조회 시 부모 폴더 ID |
| `workspaceId` | string (optional) | 워크스페이스 필터 |

**Response** `Folder[]`
```json
[
  {
    "id": "string",
    "name": "string",
    "ownerId": "string",
    "parentId": "string | null",
    "createdAt": "string (ISO 8601)",
    "updatedAt": "string (ISO 8601)"
  }
]
```

---

### ✅ `GET /api/folders/:id`

폴더 단건 조회.

**Auth**: JWT 필요

**Response** `Folder`

---

### ✅ `GET /api/folders/:id/breadcrumb`

폴더 경로(루트까지) 반환. 인덱스 0이 루트.

**Auth**: JWT 필요

**Response** `Folder[]`
```json
[
  { "id": "root-folder-id", "name": "루트", ... },
  { "id": "mid-folder-id",  "name": "중간", ... },
  { "id": "current-id",     "name": "현재", ... }
]
```

---

### ✅ `POST /api/folders`

폴더 생성.

**Auth**: JWT 필요

**Request Body**
```json
{
  "name": "string",
  "parentId": "string (optional)",
  "workspaceId": "string (optional)"
}
```

**Response** `Folder`

---

### ✅ `PATCH /api/folders/:id`

폴더 이름 변경.

**Auth**: JWT 필요

**Request Body**
```json
{ "name": "string" }
```

**Response** `Folder`

---

### ✅ `DELETE /api/folders/:id`

폴더 삭제. 하위 폴더나 문서가 있으면 403 반환.

**Auth**: JWT 필요

**Response**: 204 No Content

**Error**
```json
{ "statusCode": 403, "message": "폴더가 비어있지 않습니다. 내용을 먼저 이동하거나 삭제하세요." }
```

---

### ❌ 🟡 `PATCH /api/folders/:id/move`

폴더를 다른 위치로 이동. 드래그&드롭 UI 구현 시 필요.

**Auth**: JWT 필요

**Request Body**
```json
{
  "parentId": "string | null",
  "workspaceId": "string (optional)"
}
```

**Response** `Folder`

**구현 위치**: `folders.controller.ts`, `folders.service.ts`

---

## Documents

### ✅ `GET /api/documents`

문서 목록 조회. `updatedAt` 내림차순.

**Auth**: JWT 필요

**Query Params**
| 파라미터 | 타입 | 설명 |
|---|---|---|
| `folderId` | string \| `"null"` (optional) | 생략 시 전체, `"null"` 문자열이면 폴더 미지정 문서만 |
| `workspaceId` | string (optional) | 워크스페이스 필터 |

**Response** `DocumentSummary[]`
```json
[
  {
    "id": "string",
    "title": "string",
    "status": "draft | published | archived",
    "ownerId": "string",
    "folderId": "string | null",
    "projectId": "string | null",
    "updatedAt": "string (ISO 8601)"
  }
]
```

---

### ✅ `GET /api/documents/:id`

문서 단건 조회. content 포함.

**Auth**: JWT 필요

**Response** `Document`
```json
{
  "id": "string",
  "title": "string",
  "content": "string",
  "status": "draft | published | archived",
  "ownerId": "string",
  "folderId": "string | null",
  "projectId": "string | null",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)"
}
```

---

### ✅ `POST /api/documents`

문서 생성.

**Auth**: JWT 필요

**Request Body**
```json
{
  "title": "string",
  "folderId": "string (optional)",
  "workspaceId": "string (optional)"
}
```

**Response** `Document`

---

### ✅ `PATCH /api/documents/:id`

문서 수정. 모든 필드 optional (부분 수정 가능).

**Auth**: JWT 필요

**Request Body**
```json
{
  "title": "string (optional)",
  "content": "string (optional)",
  "folderId": "string | null (optional)",
  "workspaceId": "string | null (optional)"
}
```

**Response** `Document`

---

### ✅ `DELETE /api/documents/:id`

문서 삭제.

**Auth**: JWT 필요

**Response**: 204 No Content

---

### ❌ 🟡 `GET /api/documents/:id/export/pdf`

문서를 PDF로 내보내기. (CLAUDE.md 명시 기능)

**Auth**: JWT 필요

두 가지 방식 중 선택:
- **Option A** (직접 반환): `Content-Type: application/pdf` binary 응답
- **Option B** (presigned URL): MinIO presigned download URL 반환 (권장)

**Response (Option B)**
```json
{ "url": "string (presigned URL, 유효시간 15분)" }
```

**구현 위치**: `documents.controller.ts`, `storage/storage.service.ts`

---

## Versions

### ✅ `GET /api/documents/:documentId/versions`

문서의 버전 목록 조회. `version` 내림차순.

**Auth**: JWT 필요

**Response** `VersionSnapshot[]`
```json
[
  {
    "id": "string",
    "documentId": "string",
    "version": "number",
    "diff": "string (JSON-stringified diff-match-patch)",
    "snapshot": "string",
    "createdById": "string",
    "createdAt": "string (ISO 8601)"
  }
]
```

---

### ❌ 🟠 `GET /api/documents/:documentId/versions/:versionId`

특정 버전 단건 조회. 버전 히스토리 UI에서 과거 내용 열람 시 필요.

**Auth**: JWT 필요

**Response** `VersionSnapshot`

**구현 위치**: `versions.controller.ts`, `versions.service.ts`

---

### ❌ 🟠 `POST /api/documents/:documentId/versions/:versionId/restore`

특정 버전으로 문서 내용 복구. 복구 후 새 VersionSnapshot 자동 생성.

**Auth**: JWT 필요

**Response** `Document` (복구된 문서)

**구현 위치**: `versions.controller.ts`, `versions.service.ts`, `documents.service.ts`

---

## Storage

### ✅ `POST /api/storage/presign/upload`

MinIO presigned 업로드 URL 발급.

**Auth**: JWT 필요

**Request Body**
```json
{ "key": "string" }
```

**Response**
```json
{
  "url": "string (presigned upload URL)",
  "key": "string"
}
```

---

### ✅ `POST /api/storage/presign/download`

MinIO presigned 다운로드 URL 발급.

**Auth**: JWT 필요

**Request Body**
```json
{ "key": "string" }
```

**Response**
```json
{
  "url": "string (presigned download URL)",
  "key": "string"
}
```

---

## Users

### ❌ 🟢 `PATCH /api/users/me`

계정 설정 페이지에서 프로필 수정.

**Auth**: JWT 필요

**Request Body**
```json
{
  "name": "string (optional)",
  "avatarUrl": "string (optional)"
}
```

**Response** `User`

**구현 위치**: `users/users.service.ts` (users controller 신규 생성 필요)

---

## 요약

| 상태 | 개수 |
|---|---|
| ✅ 구현 완료 | 16 |
| ❌ 미구현 | 7 |
| **전체** | **23** |

### 미구현 항목 한눈에 보기

| 우선순위 | 메서드 | 경로 |
|---|---|---|
| 🔴 | POST | `/api/auth/refresh` |
| 🔴 | GET | `/api/auth/me` |
| 🟠 | GET | `/api/documents/:documentId/versions/:versionId` |
| 🟠 | POST | `/api/documents/:documentId/versions/:versionId/restore` |
| 🟡 | GET | `/api/documents/:id/export/pdf` |
| 🟡 | PATCH | `/api/folders/:id/move` |
| 🟢 | PATCH | `/api/users/me` |
