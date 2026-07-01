from types import ModuleType

from app.agents.orchestrator import Orchestrator
from app.pipelines import doc_summary, meeting_notes

_REGISTRY: dict[str, ModuleType] = {
    "meeting_notes": meeting_notes,
    "doc_summary": doc_summary,
}


def get(pipeline_name: str) -> Orchestrator:
    module = _REGISTRY.get(pipeline_name)
    if module is None:
        raise ValueError(f"Unknown pipeline: {pipeline_name!r}")
    return module.build()


def available() -> list[str]:
    return list(_REGISTRY.keys())
