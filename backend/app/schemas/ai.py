from enum import Enum
from typing import Any, Optional

from pydantic import BaseModel


class JobStatus(str, Enum):
    pending = "pending"
    running = "running"
    done = "done"
    failed = "failed"


class PipelineRequest(BaseModel):
    input: dict[str, Any]
    document_id: Optional[str] = None  # 결과를 기존 Document에 연결할 경우


class JobResponse(BaseModel):
    job_id: str
    pipeline_name: str
    status: JobStatus


class JobResult(BaseModel):
    job_id: str
    pipeline_name: str
    status: JobStatus
    result: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    document_id: Optional[str] = None
