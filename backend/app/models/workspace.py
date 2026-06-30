import uuid
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field


class Workspace(SQLModel, table=True):
    __tablename__ = 'workspaces'

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    description: Optional[str] = None
    owner_id: str = Field(foreign_key='users.id', index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
