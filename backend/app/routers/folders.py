from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.deps import get_session, get_current_user
from app.models.user import User
from app.models.folder import Folder

router = APIRouter()


class FolderOut(BaseModel):
    id: str
    name: str
    ownerId: str
    parentId: Optional[str]
    workspaceId: Optional[str]
    createdAt: str
    updatedAt: str


class FolderCreate(BaseModel):
    name: str
    parentId: Optional[str] = None
    workspaceId: Optional[str] = None


class FolderRename(BaseModel):
    name: str


class FolderMove(BaseModel):
    parentId: Optional[str] = None
    workspaceId: Optional[str] = None


def _out(f: Folder) -> FolderOut:
    return FolderOut(
        id=f.id, name=f.name, ownerId=f.owner_id,
        parentId=f.parent_id, workspaceId=f.workspace_id,
        createdAt=f.created_at.isoformat(), updatedAt=f.updated_at.isoformat(),
    )


async def _get_owned(folder_id: str, owner_id: str, session: AsyncSession) -> Folder:
    result = await session.exec(select(Folder).where(Folder.id == folder_id, Folder.owner_id == owner_id))
    f = result.first()
    if not f:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Folder not found')
    return f


@router.get('', response_model=list[FolderOut])
async def list_folders(
    parentId: Optional[str] = None,
    workspaceId: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
):
    q = select(Folder).where(Folder.owner_id == current_user.id)
    if parentId:
        q = q.where(Folder.parent_id == parentId)
    else:
        q = q.where(Folder.parent_id == None)  # noqa: E711
        if workspaceId:
            q = q.where(Folder.workspace_id == workspaceId)
    q = q.order_by(Folder.name)
    result = await session.exec(q)
    return [_out(f) for f in result.all()]


@router.get('/{folder_id}', response_model=FolderOut)
async def get_folder(folder_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    return _out(await _get_owned(folder_id, current_user.id, session))


@router.get('/{folder_id}/breadcrumb', response_model=list[FolderOut])
async def get_breadcrumb(folder_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    crumbs: list[Folder] = []
    current = await _get_owned(folder_id, current_user.id, session)
    while current:
        crumbs.insert(0, current)
        if not current.parent_id:
            break
        result = await session.exec(select(Folder).where(Folder.id == current.parent_id, Folder.owner_id == current_user.id))
        current = result.first()
    return [_out(f) for f in crumbs]


@router.post('', response_model=FolderOut, status_code=status.HTTP_201_CREATED)
async def create_folder(body: FolderCreate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    if body.parentId:
        await _get_owned(body.parentId, current_user.id, session)
    f = Folder(name=body.name, owner_id=current_user.id, parent_id=body.parentId, workspace_id=body.workspaceId)
    session.add(f)
    await session.commit()
    await session.refresh(f)
    return _out(f)


@router.patch('/{folder_id}', response_model=FolderOut)
async def rename_folder(folder_id: str, body: FolderRename, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    f = await _get_owned(folder_id, current_user.id, session)
    f.name = body.name
    f.updated_at = datetime.utcnow()
    session.add(f)
    await session.commit()
    await session.refresh(f)
    return _out(f)


@router.patch('/{folder_id}/move', response_model=FolderOut)
async def move_folder(folder_id: str, body: FolderMove, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    f = await _get_owned(folder_id, current_user.id, session)
    f.parent_id = body.parentId
    f.workspace_id = body.workspaceId
    f.updated_at = datetime.utcnow()
    session.add(f)
    await session.commit()
    await session.refresh(f)
    return _out(f)


@router.delete('/{folder_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_folder(folder_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    from app.models.document import Document
    f = await _get_owned(folder_id, current_user.id, session)

    child_result = await session.exec(select(Folder).where(Folder.parent_id == f.id))
    doc_result = await session.exec(select(Document).where(Document.folder_id == f.id))
    if child_result.first() or doc_result.first():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='폴더가 비어있지 않습니다. 내용을 먼저 이동하거나 삭제하세요.')

    await session.delete(f)
    await session.commit()
