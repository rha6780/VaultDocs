import asyncio
import logging

from app.workers.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, name="ai.run_pipeline")
def run_pipeline_task(
    self,
    pipeline_name: str,
    user_id: str,
    input_data: dict,
    document_id: str | None = None,
) -> dict:
    """
    파이프라인을 백그라운드에서 실행한다.
    Celery는 동기 환경이므로 asyncio.run으로 비동기 코드를 실행한다.
    """
    return asyncio.run(
        _run_async(self.request.id, pipeline_name, user_id, input_data, document_id)
    )


async def _run_async(
    job_id: str,
    pipeline_name: str,
    user_id: str,
    input_data: dict,
    document_id: str | None,
) -> dict:
    import app.pipelines as pipeline_registry
    from app.agents.base import PipelineContext

    logger.info("ai_task: starting pipeline=%s job_id=%s", pipeline_name, job_id)

    orchestrator = pipeline_registry.get(pipeline_name)
    context = PipelineContext(
        job_id=job_id,
        user_id=user_id,
        pipeline_name=pipeline_name,
        input=input_data,
    )

    final_context = await orchestrator.run(context)
    result = orchestrator.final_output(final_context)

    # document_id가 있으면 결과를 Document content로 저장
    if document_id:
        await _save_to_document(document_id, pipeline_name, result)

    logger.info("ai_task: completed pipeline=%s job_id=%s", pipeline_name, job_id)
    return {"result": result, "document_id": document_id}


async def _save_to_document(document_id: str, pipeline_name: str, result: dict) -> None:
    from datetime import datetime

    from sqlmodel import select
    from sqlmodel.ext.asyncio.session import AsyncSession

    from app.database import get_session_factory
    from app.models.document import Document

    # meeting_notes 파이프라인이면 summary를 content로 저장
    content_key = "summary"
    content = result.get(content_key, "")
    if not content:
        return

    async with get_session_factory()() as session:
        result_db = await session.exec(select(Document).where(Document.id == document_id))
        doc = result_db.first()
        if doc:
            doc.content = content
            doc.updated_at = datetime.utcnow()
            session.add(doc)
            await session.commit()
