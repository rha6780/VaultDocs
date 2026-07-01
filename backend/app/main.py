from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.routers import ai, auth, documents, folders, storage, workspaces


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title='VaultDocs API',
    version='0.1.0',
    docs_url='/api/docs' if settings.debug else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(auth.router, prefix='/api/auth', tags=['auth'])
app.include_router(workspaces.router, prefix='/api/workspaces', tags=['workspaces'])
app.include_router(folders.router, prefix='/api/folders', tags=['folders'])
app.include_router(documents.router, prefix='/api/documents', tags=['documents'])
app.include_router(storage.router, prefix='/api/storage', tags=['storage'])
app.include_router(ai.router, prefix='/api/ai', tags=['ai'])


@app.get('/health')
async def health():
    return {'status': 'ok'}
