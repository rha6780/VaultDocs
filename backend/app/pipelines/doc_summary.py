from app.agents.orchestrator import Orchestrator
from app.agents.summarizer import DocSummarizerAgent, TagExtractorAgent


def build() -> Orchestrator:
    return Orchestrator(
        agents=[
            DocSummarizerAgent(),
            TagExtractorAgent(),
        ]
    )
