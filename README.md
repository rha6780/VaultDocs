# VaultDocs

셀프 호스팅 문서 관리 웹 서비스. 문서 버전 관리, diff 추적, PDF 내보내기를 지원합니다.
추후 Electron 데스크탑 앱으로 확장 예정.

## 기술 스택

| 레이어 | 기술 |
|---|---|
| Backend | NestJS · Prisma · PostgreSQL |
| Frontend | React 18 · Vite · TypeScript |
| Auth | Google OAuth 2.0 |
| Storage | MinIO (presigned URL) |
| 인프라 | Docker Compose |

## 프로젝트 구조

```
VaultDocs/
├── backend/               # NestJS API 서버 (포트 4000)
│   ├── src/
│   │   ├── auth/          # Google OAuth + JWT
│   │   ├── documents/     # 문서 CRUD
│   │   ├── versions/      # 버전 스냅샷
│   │   ├── storage/       # MinIO 연동
│   │   └── users/
│   └── prisma/
│       └── schema.prisma
├── frontend/              # React SPA (포트 3000)
│   └── src/
│       ├── api/           # API 훅
│       ├── components/
│       ├── pages/
│       └── store/         # Zustand 상태
├── shared/
│   └── types/             # 프론트·백 공통 타입
├── docker-compose.yml     # 프로덕션 전체 스택
└── docker-compose.dev.yml # 개발용 (DB + MinIO)
```

## 시작하기

### 사전 요구사항

- Docker & Docker Compose
- Node.js 20+
- Google Cloud Console 프로젝트 및 OAuth 2.0 클라이언트 ID

### Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com) 에서 프로젝트 생성
2. **APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Authorized redirect URIs에 추가:
   - 개발: `http://localhost:4000/api/auth/google/callback`
   - 프로덕션: `https://your-domain.com/api/auth/google/callback`

### 개발 환경 실행

```bash
# 1. 환경 변수 설정
cp .env.example .env
# .env 파일에서 Google OAuth 정보 등 필수 값 입력

# 2. 개발용 인프라 실행 (PostgreSQL + MinIO)
docker compose -f docker-compose.dev.yml up -d

# 3. 백엔드 실행
cd backend
npm install
npm run db:migrate   # 최초 1회
npm run start:dev

# 4. 프론트엔드 실행 (별도 터미널)
cd frontend
npm install
npm run dev
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:4000
- API 문서 (Swagger): http://localhost:4000/api/docs
- MinIO 콘솔: http://localhost:9001

### 프로덕션 실행 (Docker Compose)

```bash
cp .env.example .env
# .env에 모든 값 설정 (PASSWORD, SECRET 등 반드시 강력한 값으로)

docker compose up -d
```

## 주요 기능

| 기능 | 설명 |
|---|---|
| Google 로그인 | OAuth 2.0 기반 인증 |
| 문서 관리 | 생성 / 편집 / 보관 / 삭제 |
| 버전 관리 | 저장 시 자동 스냅샷 & diff 추적 |
| 파일 첨부 | MinIO presigned URL 업로드 |
| PDF 내보내기 | 문서를 PDF로 다운로드 |

## 스토리지 구성

기본값은 MinIO (로컬). 추후 Google Cloud Storage로 전환 가능합니다.

```env
# .env
STORAGE_PROVIDER=minio   # 또는 gcs
```

## Electron 확장 계획

데스크탑 앱 전환 시 고려사항:
- `VITE_APP_MODE=electron` 환경 변수로 웹/데스크탑 분기
- MinIO를 내장 프로세스로 실행하거나 로컬 파일시스템 fallback
- `window.electron` IPC 통신 레이어 추가

## 환경 변수

`.env.example` 파일 참조. **`.env` 파일은 절대 커밋하지 마세요.**

## 라이선스

MIT
