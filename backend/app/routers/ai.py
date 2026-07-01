import logging
from typing import Any

from celery.result import AsyncResult
from fastapi import APIRouter, Depends, HTTPException, status

import app.pipelines as pipeline_registry
from app.deps import get_current_user
from app.models.user import User
from app.schemas.ai import JobResponse, JobResult, JobStatus, PipelineRequest
from app.workers.ai_tasks import run_pipeline_task

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/pipelines")
async def list_pipelines() -> dict[str, Any]:
    return {"pipelines": pipeline_registry.available()}


@router.post("/pipeline/{pipeline_name}", response_model=JobResponse, status_code=status.HTTP_202_ACCEPTED)
async def run_pipeline(
    pipeline_name: str,
    body: PipelineRequest,
    current_user: User = Depends(get_current_user),
) -> JobResponse:
    if pipeline_name not in pipeline_registry.available():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pipeline '{pipeline_name}' not found. Available: {pipeline_registry.available()}",
        )

    task = run_pipeline_task.delay(
        pipeline_name=pipeline_name,
        user_id=current_user.id,
        input_data=body.input,
        document_id=body.document_id,
    )

    logger.info("Pipeline job dispatched: pipeline=%s job_id=%s user=%s", pipeline_name, task.id, current_user.id)

    return JobResponse(
        job_id=task.id,
        pipeline_name=pipeline_name,
        status=JobStatus.pending,
    )


@router.get("/jobs/{job_id}", response_model=JobResult)
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
) -> JobResult:
    task_result = AsyncResult(job_id)

    if task_result.state == "PENDING":
        return JobResult(job_id=job_id, pipeline_name="", status=JobStatus.pending)

    if task_result.state == "STARTED":
        return JobResult(job_id=job_id, pipeline_name="", status=JobStatus.running)

    if task_result.state == "SUCCESS":
        payload: dict = task_result.result or {}
        return JobResult(
            job_id=job_id,
            pipeline_name="",
            status=JobStatus.done,
            result=payload.get("result"),
            document_id=payload.get("document_id"),
        )

    # FAILURE
    return JobResult(
        job_id=job_id,
        pipeline_name="",
        status=JobStatus.failed,
        error=str(task_result.result),
    )
