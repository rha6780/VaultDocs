import json
import logging

import anthropic

from app.agents.base import BaseAgent, PipelineContext
from app.agents.prompts.meeting import (
    ACTION_ITEM_SYSTEM,
    CLEANER_SYSTEM,
    SUMMARIZER_SYSTEM,
)
from app.config import settings

logger = logging.getLogger(__name__)


def _llm_client() -> anthropic.AsyncAnthropic:
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


class MeetingCleanerAgent(BaseAgent):
    name = "meeting_cleaner"

    async def run(self, context: PipelineContext) -> PipelineContext:
        transcript: str = context.input.get("transcript", "")
        if not transcript.strip():
            raise ValueError("transcript is required")

        logger.info("MeetingCleanerAgent: cleaning transcript (job_id=%s)", context.job_id)

        client = _llm_client()
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=CLEANER_SYSTEM,
            messages=[{"role": "user", "content": transcript}],
        )
        cleaned = message.content[0].text

        return context.with_output(self.name, {"cleaned_transcript": cleaned})


class MeetingSummarizerAgent(BaseAgent):
    name = "meeting_summarizer"

    async def run(self, context: PipelineContext) -> PipelineContext:
        cleaner_output = context.outputs.get("meeting_cleaner", {})
        cleaned = cleaner_output.get("cleaned_transcript") or context.input.get("transcript", "")

        logger.info("MeetingSummarizerAgent: summarizing (job_id=%s)", context.job_id)

        client = _llm_client()
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=SUMMARIZER_SYSTEM,
            messages=[{"role": "user", "content": cleaned}],
        )
        summary = message.content[0].text

        return context.with_output(self.name, {"summary": summary})


class ActionItemExtractorAgent(BaseAgent):
    name = "action_item_extractor"

    async def run(self, context: PipelineContext) -> PipelineContext:
        summarizer_output = context.outputs.get("meeting_summarizer", {})
        summary = summarizer_output.get("summary", "")
        if not summary:
            raise ValueError("meeting_summarizer output is required before ActionItemExtractorAgent")

        logger.info("ActionItemExtractorAgent: extracting action items (job_id=%s)", context.job_id)

        client = _llm_client()
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=ACTION_ITEM_SYSTEM,
            messages=[{"role": "user", "content": summary}],
        )

        try:
            action_items = json.loads(message.content[0].text)
        except json.JSONDecodeError:
            logger.warning("ActionItemExtractorAgent: failed to parse JSON, returning raw text")
            action_items = {"action_items": [], "raw": message.content[0].text}

        return context.with_output(self.name, action_items)
