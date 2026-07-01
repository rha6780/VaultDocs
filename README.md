# VaultDocs

셀프 호스팅 문서 관리 웹 서비스. 문서 버전 관리, diff 추적, PDF 내보내기를 지원합니다.
멀티 에이전트 파이프라인을 통한 AI 기능(회의록 정리, 문서 요약, 액션 아이템 추출)을 탑재합니다.
추후 Electron 데스크탑 앱으로 확장 예정.

## 기술 스택

| 레이어 | 기술 |
|---|---|
| Backend | FastAPI · SQLModel · PostgreSQL · asyncpg |
| AI / Agent | Anthropic Claude API · 자체 멀티 에이전트 파이프라인 |
| 비동기 잡 | Celery · Redis |
| Frontend | React 18 · Vite · TypeScript |
| Auth | Google OAuth 2.0 (Authlib) |
| Storage | MinIO (presigned URL) |
| 마이그레이션 | Alembic |
| 인프라 | Docker Compose |

## 프로젝트 구조

```
VaultDocs/
├── backend/                    # FastAPI 서버 (포트 4000)
│   └── app/
│       ├── routers/            # HTTP 엔드포인트
│       ├── services/           # 비즈니스 로직 (DB 쿼리)
│       ├── agents/             # AI Agent 구현체
│       │   ├── base.py         # BaseAgent + PipelineContext
│       │   ├── meeting.py      # 회의록 3종 Agent
│       │   ├── summarizer.py   # 문서 요약 2종 Agent
│       │   ├── orchestrator.py # 파이프라인 실행 엔진
│       │   └── prompts/        # 시스템 프롬프트 파일
│       ├── pipelines/          # Agent 조합 파이프라인 정의
│       ├── workers/            # Celery 비동기 태스크
│       ├── models/             # SQLModel DB 모델
│       └── schemas/            # Pydantic 입출력 스키마
├── frontend/                   # React SPA (포트 3000)
│   └── src/
│       ├── api/                # API 훅
│       ├── components/
│       ├── pages/
│       └── store/              # Zustand 상태
├── shared/
│   └── types/                  # 프론트·백 공통 타입
├── docker-compose.yml          # 프로덕션 전체 스택
└── docker-compose.dev.yml      # 개발용 (DB + MinIO + Redis)
```

## 시작하기

### 사전 요구사항

- Docker & Docker Compose
- Python 3.12+
- Node.js 20+
- Google Cloud Console 프로젝트 및 OAuth 2.0 클라이언트 ID
- Anthropic API Key

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
# .env 파일에서 Google OAuth, Anthropic API Key 등 필수 값 입력

# 2. 개발용 인프라 실행 (PostgreSQL + MinIO + Redis)
docker compose -f docker-compose.dev.yml up -d

# 3. 백엔드 의존성 설치
cd backend
pip install -r requirements.txt

# 4. DB 마이그레이션 (최초 1회)
alembic upgrade head

# 5. FastAPI 서버 실행
uvicorn app.main:app --reload --port 4000

# 6. Celery 워커 실행 (별도 터미널)
celery -A app.workers.celery_app worker --loglevel=info

# 7. 프론트엔드 실행 (별도 터미널)
cd frontend
npm install
npm run dev
```

- 프론트엔드: http://localhost:3000
- 백엔드 API: http://localhost:4000
- API 문서 (Swagger): http://localhost:4000/api/docs (DEBUG=true 시)
- MinIO 콘솔: http://localhost:9001

### 프로덕션 실행 (Docker Compose)

```bash
cp .env.example .env
# .env에 모든 값 설정 (PASSWORD, SECRET, API KEY 등 반드시 강력한 값으로)

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
| AI 파이프라인 | 회의록 정리 · 문서 요약 · 액션 아이템 추출 |

## AI 멀티 에이전트 파이프라인

### 파이프라인 흐름

```
POST /api/ai/pipeline/{pipeline_name}
          │
          ▼ job_id 즉시 반환
   Celery 백그라운드 실행
          │
          ▼
   Orchestrator
     ├── Agent 1
     ├── Agent 2
     └── Agent 3
          │
          ▼
   결과 → Document 저장

GET /api/ai/jobs/{job_id}  ← 상태 폴링
```

### 내장 파이프라인

| 파이프라인 | Agent 순서 | 입력 |
|---|---|---|
| `meeting_notes` | MeetingCleaner → MeetingSummarizer → ActionItemExtractor | `transcript` |
| `doc_summary` | DocSummarizer → TagExtractor | `content` |

### 사용 예시

```bash
# 회의록 정리 요청
curl -X POST http://localhost:4000/api/ai/pipeline/meeting_notes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"input": {"transcript": "회의 내용..."}, "document_id": "optional-doc-id"}'

# 응답
# {"job_id": "abc-123", "pipeline_name": "meeting_notes", "status": "pending"}

# 결과 폴링
curl http://localhost:4000/api/ai/jobs/abc-123 \
  -H "Authorization: Bearer <token>"

# 완료 응답
# {"status": "done", "result": {"summary": "...", "action_items": [...]}}
```

### 새 파이프라인 추가

```python
# 1. agents/your_agent.py
class YourAgent(BaseAgent):
    name = "your_agent"
    async def run(self, context: PipelineContext) -> PipelineContext:
        ...
        return context.with_output(self.name, {"result": "..."})

# 2. pipelines/your_pipeline.py
def build() -> Orchestrator:
    return Orchestrator(agents=[YourAgent()])

# 3. pipelines/__init__.py 의 _REGISTRY에 한 줄 추가
_REGISTRY = {
    ...,
    "your_pipeline": your_pipeline,
}
```

## 스토리지 구성

기본값은 MinIO (로컬). 추후 Google Cloud Storage로 전환 가능합니다.

```env
STORAGE_PROVIDER=minio   # 또는 gcs
```

## Electron 확장 계획

데스크탑 앱 전환 시 고려사항:
- `VITE_APP_MODE=electron` 환경 변수로 웹/데스크탑 분기
- MinIO를 내장 프로세스로 실행하거나 로컬 파일시스템 fallback
- `window.electron` IPC 통신 레이어 추가

## 환경 변수

`.env.example` 파일 참조. **`.env` 파일은 절대 커밋하지 마세요.**

주요 환경 변수:

```env
# DB
POSTGRES_DB=vaultdocs
POSTGRES_USER=vaultdocs
POSTGRES_PASSWORD=

# Auth
JWT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# AI
ANTHROPIC_API_KEY=

# Celery / Redis
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Storage
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
```

## 라이선스

MIT
