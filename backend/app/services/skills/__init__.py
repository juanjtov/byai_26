"""
Skills module for specialized AI capabilities.

Each skill provides a focused capability with its own system prompt
and execution logic.
"""

from app.services.skills.base import BaseSkill
from app.services.skills.spanish import SpanishJobOrderSkill
from app.services.skills.materials import MaterialTakeoffSkill

__all__ = [
    "BaseSkill",
    "SpanishJobOrderSkill",
    "MaterialTakeoffSkill",
]
