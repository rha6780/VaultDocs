import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Folder(SQLModel, table=True):
    __tablename__ = 'folders'

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    owner_id: str = Field(foreign_key='users.id', index=True)
    parent_id: Optional[str] = Field(default=None, foreign_key='folders.id', index=True)
    workspace_id: Optional[str] = Field(default=None, foreign_key='workspaces.id', index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
