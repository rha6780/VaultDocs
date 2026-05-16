# VaultDocs — Claude Code 지시문

## 프로젝트 개요
셀프 호스팅 문서 관리 웹 서비스. Google OAuth 기반 인증, 버전 관리, PDF 내보내기 지원.
추후 Electron 데스크탑 앱으로 확장 예정.

## 프로젝트 구조
```
VaultDocs/
├── backend/          # NestJS + Prisma + TypeScript
├── frontend/         # React 18 + Vite + TypeScript
├── shared/           # 프론트·백 공통 타입
├── docker-compose.yml
└── docker-compose.dev.yml
```

## 기술 스택
| 레이어 | 기술 |
|---|---|
| Backend | NestJS, Prisma, PostgreSQL |
| Frontend | React 18, Vite, TypeScript |
| Auth | Google OAuth 2.0 (Passport.js) |
| Storage | MinIO (presigned URL 방식) |
| Diff | diff-match-patch |
| 인프라 | Docker Compose (셀프 호스팅) |

## 코딩 규칙

### 공통
- 모든 파일 TypeScript strict mode (`"strict": true`)
- `any` 타입 사용 금지 — 대신 `unknown` 후 타입 가드 사용
- API 응답 타입은 반드시 `shared/types/` 에 정의된 타입 사용
- `console.log` 사용 금지 — NestJS `Logger` 또는 프론트 전용 로거 사용

### Backend (NestJS)
- Prisma 쿼리는 반드시 Service 레이어에서만 실행 (Controller 직접 쿼리 금지)
- 에러는 `NestJS HttpException` 으로 통일
- 모든 엔드포인트에 `@UseGuards(JwtAuthGuard)` 적용 (공개 엔드포인트는 `@Public()` 데코레이터 명시)
- DTO는 `class-validator` 로 검증

### Frontend (React)
- 상태 관리: React Query (서버 상태) + Zustand (클라이언트 상태)
- 컴포넌트는 `src/components/` 에, 페이지는 `src/pages/` 에 분리
- API 호출은 `src/api/` 훅으로 캡슐화

## 버전 관리 규칙
- 문서 저장 시 `VersionSnapshot` 자동 생성
- diff 계산은 `diff-match-patch` 라이브러리 사용
- 파일 저장은 MinIO presigned URL 방식으로 처리

## 스토리지 전략
- **로컬(기본)**: MinIO (Docker Compose 내 포함) — 셀프 호스팅 시 기본값
- **클라우드(선택)**: Google Cloud Storage — 환경 변수로 전환 (`STORAGE_PROVIDER=gcs`)
- 스토리지 인터페이스는 추상화 레이어(`StorageService`)로 분리하여 전환 가능하게 유지

## 인증
- Google OAuth 2.0 (`passport-google-oauth20`)
- JWT Access Token (15분) + Refresh Token (7일) 방식
- Refresh Token은 DB에 해시 저장

## Docker Compose 구성
- `docker-compose.yml` — 프로덕션용 (전체 스택)
- `docker-compose.dev.yml` — 개발용 (DB + MinIO만, 앱은 로컬 실행)

## Electron 확장 고려사항
- 프론트엔드는 Electron 환경에서도 동작하도록 `window.electron` IPC 분기 준비
- 로컬 전용 모드 시 MinIO를 내장 프로세스로 실행하거나 파일시스템 fallback 고려
- `VITE_APP_MODE=electron | web` 환경 변수로 분기

## 개발 방식

### 브랜치 전략 (GitHub Flow)

`main` 브랜치는 항상 배포 가능한 상태를 유지한다.
모든 작업은 브랜치를 따서 진행하고, PR을 통해 `main`에 머지한다.

**브랜치 네이밍:**
```
feat/<기능명>       # 새 기능
fix/<버그명>        # 버그 수정
docs/<문서명>       # 문서
chore/<작업명>      # 빌드, 패키지, 설정 등
```

**예시:**
```
feat/google-oauth
fix/version-snapshot-race
docs/minio-setup
chore/upgrade-prisma-v5
```

### 커밋 메시지 (Conventional Commits)

```
<type>(<scope>): <subject>
```

**type:**

| type | 용도 |
|---|---|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `docs` | 문서만 변경 |
| `style` | 포맷 등 로직 변경 없음 |
| `refactor` | 기능 변경 없는 코드 정리 |
| `test` | 테스트 추가/수정 |
| `chore` | 빌드, 패키지 등 잡일 |
| `ci` | CI/CD 설정 변경 |

**scope:** 변경 범위 (`auth`, `documents`, `versions`, `storage`, `frontend` 등)

**예시:**
```
feat(auth): add Google OAuth login
fix(documents): prevent duplicate version snapshot on rapid save
refactor(storage): abstract storage provider interface
chore: upgrade Prisma to v5.10
docs: add MinIO setup guide to README
```

### PR 규칙
- PR 제목은 커밋 메시지 형식과 동일하게 작성
- 1 PR = 1 기능/수정 (범위를 작게 유지)
- 머지 전 `main` 브랜치 최신화 (`rebase` 또는 `merge` 후 PR)
- 직접 `main` 푸시 금지

### 릴리즈
- `main` 머지 후 태그로 릴리즈 관리: `v0.1.0`, `v0.2.0`, ...
- [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`
  - PATCH: 버그 수정
  - MINOR: 하위 호환 기능 추가
  - MAJOR: 하위 비호환 변경

## 환경 변수
`.env.example` 참조. 절대 `.env` 파일을 커밋하지 말 것.

## 금지 사항
- `any` 타입 사용 금지
- Controller에서 직접 DB 쿼리 금지
- `console.log` 사용 금지 (NestJS Logger 사용)
- `.env` 파일 커밋 금지
- Prisma 마이그레이션 없이 스키마 변경 금지
