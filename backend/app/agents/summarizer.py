import json
import logging

import anthropic

from app.agents.base import BaseAgent, PipelineContext
from app.agents.prompts.summarizer import DOC_SUMMARIZER_SYSTEM, TAG_EXTRACTOR_SYSTEM
from app.config import settings

logger = logging.getLogger(__name__)


def _llm_client() -> anthropic.AsyncAnthropic:
    return anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)


class DocSummarizerAgent(BaseAgent):
    name = "doc_summarizer"

    async def run(self, context: PipelineContext) -> PipelineContext:
        content: str = context.input.get("content", "")
        if not content.strip():
            raise ValueError("content is required")

        logger.info("DocSummarizerAgent: summarizing document (job_id=%s)", context.job_id)

        client = _llm_client()
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=DOC_SUMMARIZER_SYSTEM,
            messages=[{"role": "user", "content": content}],
        )
        summary = message.content[0].text

        return context.with_output(self.name, {"summary": summary})


class TagExtractorAgent(BaseAgent):
    name = "tag_extractor"

    async def run(self, context: PipelineContext) -> PipelineContext:
        summarizer_output = context.outputs.get("doc_summarizer", {})
        summary = summarizer_output.get("summary", "")
        if not summary:
            raise ValueError("doc_summarizer output is required before TagExtractorAgent")

        logger.info("TagExtractorAgent: extracting tags (job_id=%s)", context.job_id)

        client = _llm_client()
        message = await client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=256,
            system=TAG_EXTRACTOR_SYSTEM,
            messages=[{"role": "user", "content": summary}],
        )

        try:
            tags = json.loads(message.content[0].text)
        except json.JSONDecodeError:
            logger.warning("TagExtractorAgent: failed to parse JSON, returning empty tags")
            tags = {"tags": []}

        return context.with_output(self.name, tags)
