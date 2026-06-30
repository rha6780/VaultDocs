import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field


class VersionSnapshot(SQLModel, table=True):
    __tablename__ = 'version_snapshots'

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    document_id: str = Field(foreign_key='documents.id', index=True)
    version: int
    diff: str  # JSON-stringified diff-match-patch result
    snapshot: str
    created_by_id: str = Field(foreign_key='users.id')
    created_at: datetime = Field(default_factory=datetime.utcnow)
