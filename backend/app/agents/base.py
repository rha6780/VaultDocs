from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field


class PipelineContext(BaseModel):
    job_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    pipeline_name: str
    input: dict[str, Any]
    outputs: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)

    def with_output(self, agent_name: str, result: dict[str, Any]) -> "PipelineContext":
        return self.model_copy(
            update={"outputs": {**self.outputs, agent_name: result}}
        )


class BaseAgent(ABC):
    name: str

    @abstractmethod
    async def run(self, context: PipelineContext) -> PipelineContext:
        ...
