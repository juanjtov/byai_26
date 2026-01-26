"""
Base skill class for specialized AI capabilities.
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional, Any

from app.services.openrouter import OpenRouterService


class BaseSkill(ABC):
    """
    Abstract base class for AI skills.

    Each skill provides a focused capability with its own
    system prompt and execution logic.
    """

    # Skill metadata - override in subclasses
    name: str = "base_skill"
    description: str = "Base skill class"

    def __init__(self):
        self.openrouter = OpenRouterService()

    @property
    @abstractmethod
    def system_prompt(self) -> str:
        """Return the system prompt for this skill."""
        pass

    @abstractmethod
    async def execute(
        self,
        user_input: str,
        context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Execute the skill with the given input and context.

        Args:
            user_input: The user's request
            context: Optional context (org data, previous messages, etc.)

        Returns:
            The skill's response
        """
        pass

    async def _call_llm(
        self,
        user_input: str,
        context: Optional[Dict[str, Any]] = None,
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """
        Helper to call the LLM with this skill's system prompt.

        Args:
            user_input: The user's request
            context: Optional context to include in the prompt
            temperature: LLM temperature
            max_tokens: Maximum response tokens

        Returns:
            LLM response
        """
        # Build context string if provided
        context_str = ""
        if context:
            context_str = "\n\n## Context\n"
            for key, value in context.items():
                context_str += f"- {key}: {value}\n"

        full_prompt = self.system_prompt
        if context_str:
            full_prompt += context_str

        response = await self.openrouter.chat_completion(
            messages=[{"role": "user", "content": user_input}],
            system_prompt=full_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        return response

    def get_info(self) -> Dict[str, str]:
        """Return skill metadata."""
        return {
            "name": self.name,
            "description": self.description,
        }
