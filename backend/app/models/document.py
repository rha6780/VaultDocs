import uuid
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field


class DocumentStatus(str, Enum):
    draft = 'draft'
    published = 'published'
    archived = 'archived'


class Document(SQLModel, table=True):
    __tablename__ = 'documents'

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str
    content: str = Field(default='')
    status: DocumentStatus = Field(default=DocumentStatus.draft)
    owner_id: str = Field(foreign_key='users.id', index=True)
    folder_id: Optional[str] = Field(default=None, foreign_key='folders.id', index=True)
    workspace_id: Optional[str] = Field(default=None, foreign_key='workspaces.id', index=True)
    project_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
