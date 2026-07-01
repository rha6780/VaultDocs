import logging
from typing import Any

from app.agents.base import BaseAgent, PipelineContext

logger = logging.getLogger(__name__)


class Orchestrator:
    """순차적으로 Agent를 실행하고 PipelineContext를 전달한다."""

    def __init__(self, agents: list[BaseAgent]) -> None:
        self._agents = agents

    async def run(self, context: PipelineContext) -> PipelineContext:
        current = context
        for agent in self._agents:
            logger.info(
                "Orchestrator: running agent=%s job_id=%s",
                agent.name,
                current.job_id,
            )
            current = await agent.run(current)
        return current

    def final_output(self, context: PipelineContext) -> dict[str, Any]:
        """파이프라인 최종 결과물을 병합해서 반환."""
        merged: dict[str, Any] = {}
        for agent_output in context.outputs.values():
            merged.update(agent_output)
        return merged
