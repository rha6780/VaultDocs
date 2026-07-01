from app.agents.meeting import (
    ActionItemExtractorAgent,
    MeetingCleanerAgent,
    MeetingSummarizerAgent,
)
from app.agents.orchestrator import Orchestrator


def build() -> Orchestrator:
    return Orchestrator(
        agents=[
            MeetingCleanerAgent(),
            MeetingSummarizerAgent(),
            ActionItemExtractorAgent(),
        ]
    )
