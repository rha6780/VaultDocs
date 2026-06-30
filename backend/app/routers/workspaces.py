from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from app.deps import get_session, get_current_user
from app.models.user import User
from app.models.workspace import Workspace

router = APIRouter()


class WorkspaceOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    ownerId: str
    createdAt: str
    updatedAt: str


class WorkspaceCreate(BaseModel):
    name: str
    description: Optional[str] = None


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


def _out(w: Workspace) -> WorkspaceOut:
    return WorkspaceOut(
        id=w.id, name=w.name, description=w.description,
        ownerId=w.owner_id,
        createdAt=w.created_at.isoformat(),
        updatedAt=w.updated_at.isoformat(),
    )


@router.get('', response_model=list[WorkspaceOut])
async def list_workspaces(current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.exec(
        select(Workspace).where(Workspace.owner_id == current_user.id).order_by(Workspace.updated_at.desc())
    )
    return [_out(w) for w in result.all()]


@router.get('/{workspace_id}', response_model=WorkspaceOut)
async def get_workspace(workspace_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.exec(select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == current_user.id))
    w = result.first()
    if not w:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Workspace not found')
    return _out(w)


@router.post('', response_model=WorkspaceOut, status_code=status.HTTP_201_CREATED)
async def create_workspace(body: WorkspaceCreate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    w = Workspace(name=body.name, description=body.description, owner_id=current_user.id)
    session.add(w)
    await session.commit()
    await session.refresh(w)
    return _out(w)


@router.patch('/{workspace_id}', response_model=WorkspaceOut)
async def update_workspace(workspace_id: str, body: WorkspaceUpdate, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.exec(select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == current_user.id))
    w = result.first()
    if not w:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Workspace not found')
    if body.name is not None:
        w.name = body.name
    if body.description is not None:
        w.description = body.description
    w.updated_at = datetime.utcnow()
    session.add(w)
    await session.commit()
    await session.refresh(w)
    return _out(w)


@router.delete('/{workspace_id}', status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(workspace_id: str, current_user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.exec(select(Workspace).where(Workspace.id == workspace_id, Workspace.owner_id == current_user.id))
    w = result.first()
    if not w:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail='Workspace not found')
    await session.delete(w)
    await session.commit()
