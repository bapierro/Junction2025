from __future__ import annotations

import textwrap
from typing import Optional

import httpx

from ..config import get_settings

OPENAI_RESPONSES_ENDPOINT = "https://api.openai.com/v1/responses"


class OpenAIStoryService:
    """Wrapper around the OpenAI Responses API for transcript summarization."""

    def __init__(self, api_key: str, model: str, reasoning_effort: str) -> None:
        self.api_key = api_key
        self.model = model
        self.reasoning_effort = reasoning_effort

    @property
    def enabled(self) -> bool:
        return bool(self.api_key)

    async def generate_story(self, transcript: str) -> str:
        cleaned = (transcript or "").strip()
        if not cleaned:
            raise ValueError("Transcript is empty.")

        prompt = self._build_prompt(cleaned)
        if not self.enabled:
            return cleaned

        payload = {
            "model": self.model,
            "input": prompt,
            "reasoning": {"effort": self.reasoning_effort},
        }
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=90) as client:
            response = await client.post(OPENAI_RESPONSES_ENDPOINT, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

        story_text = self._extract_output_text(data)
        if not story_text:
            # fall back to cleaned transcript if the model yields nothing
            return cleaned
        return story_text.strip()

    @staticmethod
    def _build_prompt(transcript: str) -> str:
        instructions = (
            "You are an empathetic oral historian creating a concise, readable story from a "
            "conversation transcript. Write a first-person narrative that preserves key "
            "details, uses clear language, and contains a beginning, middle, and end. Remove "
            "filler words and questions from the guide while keeping the storyteller's "
            "voice heartfelt and respectful."
        )
        return textwrap.dedent(
            f"""{instructions}

            Transcript:
            {transcript}

            Narrative:"""
        ).strip()

    @staticmethod
    def _extract_output_text(data: dict) -> Optional[str]:
        text = data.get("output_text")
        if isinstance(text, list):
            text = "".join(part for part in text if isinstance(part, str))
        if isinstance(text, str) and text.strip():
            return text.strip()

        output = data.get("output")
        if isinstance(output, list):
            parts: list[str] = []
            for item in output:
                if not isinstance(item, dict):
                    continue
                if item.get("type") == "output_text" and isinstance(item.get("text"), str):
                    parts.append(item["text"])
                elif item.get("type") == "message":
                    for content in item.get("content", []):
                        if not isinstance(content, dict):
                            continue
                        if content.get("type") == "output_text" and isinstance(content.get("text"), str):
                            parts.append(content["text"])
            if parts:
                return "\n".join(part.strip() for part in parts if part).strip()
        return None


def get_openai_story_service() -> OpenAIStoryService:
    settings = get_settings()
    return OpenAIStoryService(
        settings.openai_api_key,
        settings.openai_model,
        settings.openai_reasoning_effort,
    )
