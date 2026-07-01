# VaultDocs — Claude Code 지시문

## 프로젝트 개요
셀프 호스팅 문서 관리 웹 서비스. Google OAuth 기반 인증, 버전 관리, PDF 내보내기 지원.
멀티 에이전트 파이프라인을 통한 AI 기능(회의록 정리, 문서 요약, 액션 아이템 추출 등) 탑재.
추후 Electron 데스크탑 앱으로 확장 예정.

## 프로젝트 구조
```
VaultDocs/
├── backend/                    # FastAPI + SQLModel + Python
│   └── app/
│       ├── routers/            # HTTP 엔드포인트
│       ├── services/           # 비즈니스 로직 (DB 쿼리는 여기서만)
│       ├── agents/             # AI Agent 구현체
│       │   ├── base.py         # BaseAgent 추상 클래스
│       │   ├── summarizer.py   # 문서 요약 Agent
│       │   ├── meeting.py      # 회의록 정리 Agent
│       │   ├── action_item.py  # 액션 아이템 추출 Agent
│       │   └── orchestrator.py # 파이프라인 오케스트레이터
│       ├── pipelines/          # Agent 조합 파이프라인 정의
│       ├── models/             # SQLModel DB 모델
│       ├── schemas/            # Pydantic 입출력 스키마
│       ├── workers/            # Celery 비동기 태스크
│       └── main.py
├── frontend/                   # React 18 + Vite + TypeScript
├── shared/                     # 프론트·백 공통 타입 (TypeScript)
├── docker-compose.yml
└── docker-compose.dev.yml
```

## 기술 스택
| 레이어 | 기술 |
|---|---|
| Backend | FastAPI, SQLModel, PostgreSQL, asyncpg |
| AI / Agent | Anthropic Claude API (`anthropic` SDK), LangGraph |
| 비동기 잡 | Celery + Redis |
| Frontend | React 18, Vite, TypeScript |
| Auth | Google OAuth 2.0 (Authlib) |
| Storage | MinIO (presigned URL 방식) |
| Diff | diff-match-patch |
| 마이그레이션 | Alembic |
| 인프라 | Docker Compose (셀프 호스팅) |

## 코딩 규칙

### 공통
- Python: type hint 필수, `Any` 타입 사용 금지 — 대신 `Union` / `TypeVar` / Protocol 사용
- TypeScript: strict mode (`"strict": true`), `any` 금지
- API 응답 타입은 `shared/types/` (TS) 또는 `app/schemas/` (Pydantic) 에 정의
- `print()` 사용 금지 — `logging` 모듈 또는 `structlog` 사용

### Backend (FastAPI)
- DB 쿼리는 반드시 `services/` 레이어에서만 실행 (Router 직접 쿼리 금지)
- 에러는 `HTTPException` 으로 통일
- 모든 보호된 엔드포인트는 `Depends(get_current_user)` 적용
- 입출력 스키마는 Pydantic v2 모델로 정의 (`app/schemas/`)
- 스키마 변경 시 반드시 Alembic 마이그레이션 생성

### AI Agent 규칙
- 모든 Agent는 `BaseAgent` 추상 클래스를 상속
- Agent는 단일 책임 원칙 — 하나의 Agent가 하나의 태스크만 수행
- Agent 간 데이터 전달은 `PipelineContext` 타입 객체로 통일
- LLM 호출은 반드시 `agents/` 레이어에서만 실행 (Service에서 직접 LLM 호출 금지)
- 프롬프트는 `agents/prompts/` 디렉토리에 별도 파일로 관리
- 긴 LLM 호출(예상 > 5초)은 Celery 비동기 태스크로 처리

### Frontend (React)
- 상태 관리: React Query (서버 상태) + Zustand (클라이언트 상태)
- 컴포넌트는 `src/components/` 에, 페이지는 `src/pages/` 에 분리
- API 호출은 `src/api/` 훅으로 캡슐화
- AI 작업 상태(pending/running/done/failed)는 polling 또는 SSE로 수신

## 멀티 에이전트 파이프라인 구조

### 파이프라인 흐름
```
Client
  │ POST /api/ai/pipeline/{pipeline_name}
  ▼
Orchestrator (orchestrator.py)
  ├── Agent 1: 입력 전처리 / 분류
  ├── Agent 2: 핵심 처리 (요약, 정리 등)
  └── Agent 3: 후처리 (액션 아이템, 태그 추출 등)
  │
  ▼ (결과를 Document로 저장)
DocumentService → DB
```

### BaseAgent 인터페이스
```python
class BaseAgent(ABC):
    @abstractmethod
    async def run(self, context: PipelineContext) -> PipelineContext:
        ...
```

### PipelineContext
Agent 간 공유되는 불변 컨텍스트 객체. 각 Agent는 context를 받아 새 context를 반환 (순수 함수 스타일).

```python
class PipelineContext(BaseModel):
    job_id: str
    user_id: str
    input: dict[str, Any]
    outputs: dict[str, Any] = {}   # 각 Agent 결과 누적
    metadata: dict[str, Any] = {}
```

### 내장 파이프라인 목록
| 파이프라인 | 구성 Agent | 엔드포인트 |
|---|---|---|
| `meeting_notes` | Cleaner → Summarizer → ActionItemExtractor | `POST /api/ai/pipeline/meeting_notes` |
| `doc_summary` | Summarizer → TagExtractor | `POST /api/ai/pipeline/doc_summary` |

## 비동기 잡 처리
- Celery worker가 LLM 호출을 백그라운드에서 실행
- 클라이언트는 `job_id` 를 받아 `GET /api/ai/jobs/{job_id}` 로 상태 폴링
- 완료 시 결과를 DB에 저장하고 Document에 연결

## 버전 관리 규칙
- 문서 저장 시 `VersionSnapshot` 자동 생성
- diff 계산은 `diff-match-patch` 라이브러리 사용
- 파일 저장은 MinIO presigned URL 방식으로 처리

## 스토리지 전략
- **로컬(기본)**: MinIO (Docker Compose 내 포함) — 셀프 호스팅 시 기본값
- **클라우드(선택)**: Google Cloud Storage — 환경 변수로 전환 (`STORAGE_PROVIDER=gcs`)
- 스토리지 인터페이스는 추상화 레이어(`StorageService`)로 분리

## 인증
- Google OAuth 2.0 (Authlib)
- JWT Access Token (15분) + Refresh Token (7일) 방식
- Refresh Token은 DB에 해시 저장

## Docker Compose 구성
- `docker-compose.yml` — 프로덕션용 (전체 스택 + Redis + Celery worker)
- `docker-compose.dev.yml` — 개발용 (DB + MinIO + Redis만, 앱은 로컬 실행)

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
feat/meeting-notes-pipeline
fix/celery-job-status
docs/agent-architecture
chore/add-anthropic-sdk
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

**scope:** 변경 범위 (`auth`, `documents`, `agents`, `pipeline`, `storage`, `frontend` 등)

**예시:**
```
feat(agents): add MeetingNotesAgent
feat(pipeline): implement meeting_notes pipeline
fix(agents): handle empty transcript in Summarizer
chore: add anthropic and langgraph dependencies
```

### PR 규칙
- PR 제목은 커밋 메시지 형식과 동일하게 작성
- 1 PR = 1 기능/수정 (범위를 작게 유지)
- 머지 전 `main` 브랜치 최신화 (`rebase` 또는 `merge` 후 PR)
- 직접 `main` 푸시 금지

### 릴리즈
- `main` 머지 후 태그로 릴리즈 관리: `v0.1.0`, `v0.2.0`, ...
- [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`

## 환경 변수
`.env.example` 참조. 절대 `.env` 파일을 커밋하지 말 것.

주요 AI 관련 환경 변수:
```
ANTHROPIC_API_KEY=
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## 금지 사항
- Python `Any` 타입 / TypeScript `any` 타입 사용 금지
- Router/Controller에서 직접 DB 쿼리 금지
- Service 레이어에서 직접 LLM 호출 금지 (반드시 Agent 레이어 경유)
- `print()` / `console.log` 사용 금지
- `.env` 파일 커밋 금지
- Alembic 마이그레이션 없이 모델 변경 금지
