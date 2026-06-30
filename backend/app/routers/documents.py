import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.deps import get_session, get_current_user
from app.models.user import User
from app.models.document import Document, DocumentStatus
from app.models.version import VersionSnapshot

router = APIRouter()


class DocumentSummaryOut(BaseModel):
    id: str
    title: str
    status: str
    ownerId: str
    folderId: Optional[str]
    workspaceId: Optional[str]
    projectId: Optional[str]
    updatedAt: str


class DocumentOut(DocumentSummaryOut):
    content: str
    createdAt: str


class DocumentCreate(BaseModel):
    title: str
    folderId: Optional[str] = None
    workspaceId: Optional[str] = None


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    folderId: Optional[str] = None
    workspaceId: Optional[str] = None


class VersionOut(BaseModel):
    id: str
    documentId: str
    version: int
    diff: str
    snapshot: str
    createdById: str
    createdAt: str


def _out(d: Document) -> DocumentOut:
    return DocumentOut(
        id=d.id, title=d.title, content=d.content, status=d.status.value,
        ownerId=d.owner_id, folderId=d.folder_id, workspaceId=d.workspace_id,
        projectId=d.project_id,
        createdAt=d.created_at.isoformat(), updatedAt=d.updated_at.isoformat(),
    )


def _summary_out(d: Document) -> DocumentSummaryOut:
    return DocumentSummaryOut(
        id=d.id, title=d.title, status=d.status.value,
        ownerId=d.owner_id, folderId=d.folder_id, workspaceId=d.workspace_id,
        projectId=d.project_id, updatedAt=d.updated_at.isoformat(),
    )


def _version_out(v: VersionSnapshot) -> VersionOut:
    return VersionOut(
        id=v.id, documentId=v.document_id, version=v.version,
        diff=v.diff, snapshot=v.snapshot, createdById=v.created_by_id,
        createdAt=v.created_at.isoformat(),
    )


async def _get_owned(doc_id: str, owner_id: str, session: AsyncSession) -> Document:
    result = await session.exec(select(Document).where(Document.id == doc_id, Document.owner_id == owner_id))
    d = result.first()
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Document not found')
    return d


# ─── Documents CRUD ───────────────────────────────────────────────────────────

@router.get('', response_model=list[DocumentSummaryOut])
async def list_documents(
    folderId: Optional[str] = None,
    workspaceId: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    q = select(Document).where(Document.owner_id == current_user.id)
    if folderId == 'null':
        q = q.where(Document.folder_id == None)  # noqa: E711
    elif folderId is not None:
        q = q.where(Document.folder_id == folderId)
    if workspaceId:
        q = q.where(Document.workspace_id == workspaceId)
    q = q.order_by(Document.updated_at.desc())
    result = await session.exec(q)
    return [_summary_out(d) for d in result.all()]


@router.get('/{doc_id}', response_model=DocumentOut)
async def get_document(doc_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return _out(await _get_owned(doc_id, current_user.id, session))


@router.post('', response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def create_document(body: DocumentCreate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    d = Document(title=body.title, owner_id=current_user.id, folder_id=body.folderId, workspace_id=body.workspaceId)
    session.add(d)
    await session.commit()
    await session.refresh(d)
    return _out(d)


@router.patch('/{doc_id}', response_model=DocumentOut)
async def update_document(doc_id: str, body: DocumentUpdate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    d = await _get_owned(doc_id, current_user.id, session)
    prev_content = d.content

    if body.title is not None:
        d.title = body.title
    if body.folderId is not None:
        d.folder_id = body.folderId
    if body.workspaceId is not None:
        d.workspace_id = body.workspaceId
    if body.content is not None:
        d.content = body.content
    d.updated_at = datetime.utcnow()
    session.add(d)

    # 내용이 변경됐을 때 자동으로 버전 스냅샷 생성
    if body.content is not None and body.content != prev_content:
        await _create_snapshot(session, d, prev_content, body.content, current_user.id)

    await session.commit()
    await session.refresh(d)
    return _out(d)


@router.delete('/{doc_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(doc_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    d = await _get_owned(doc_id, current_user.id, session)
    await session.delete(d)
    await session.commit()


# ─── Versions ─────────────────────────────────────────────────────────────────

async def _create_snapshot(session: AsyncSession, doc: Document, prev: str, new: str, user_id: str) -> VersionSnapshot:
    import diff_match_patch as dmp_module
    dmp = dmp_module.diff_match_patch()

    last_result = await session.exec(
        select(VersionSnapshot)
        .where(VersionSnapshot.document_id == doc.id)
        .order_by(VersionSnapshot.version.desc())
    )
    last = last_result.first()
    version = (last.version if last else 0) + 1
    diff = json.dumps(dmp.diff_main(prev, new))

    snapshot = VersionSnapshot(
        document_id=doc.id, version=version, diff=diff,
        snapshot=new, created_by_id=user_id,
    )
    session.add(snapshot)
    return snapshot


@router.get('/{doc_id}/versions', response_model=list[VersionOut])
async def list_versions(doc_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await _get_owned(doc_id, current_user.id, session)
    result = await session.exec(
        select(VersionSnapshot).where(VersionSnapshot.document_id == doc_id).order_by(VersionSnapshot.version.desc())
    )
    return [_version_out(v) for v in result.all()]


@router.get('/{doc_id}/versions/{version_id}', response_model=VersionOut)
async def get_version(doc_id: str, version_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await _get_owned(doc_id, current_user.id, session)
    result = await session.exec(
        select(VersionSnapshot).where(VersionSnapshot.id == version_id, VersionSnapshot.document_id == doc_id)
    )
    v = result.first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Version not found')
    return _version_out(v)


@router.post('/{doc_id}/versions/{version_id}/restore', response_model=DocumentOut)
async def restore_version(doc_id: str, version_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    d = await _get_owned(doc_id, current_user.id, session)
    result = await session.exec(
        select(VersionSnapshot).where(VersionSnapshot.id == version_id, VersionSnapshot.document_id == doc_id)
    )
    v = result.first()
    if not v:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Version not found')

    prev_content = d.content
    d.content = v.snapshot
    d.updated_at = datetime.utcnow()
    session.add(d)

    await _create_snapshot(session, d, prev_content, v.snapshot, current_user.id)
    await session.commit()
    await session.refresh(d)
    return _out(d)


# ─── PDF Export (stub) ────────────────────────────────────────────────────────

@router.get('/{doc_id}/export/pdf')
async def export_pdf(doc_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    await _get_owned(doc_id, current_user.id, session)
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail='PDF export not yet implemented')
