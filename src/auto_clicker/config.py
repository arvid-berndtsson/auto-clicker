"""Configuration and domain models for the auto clicker."""

from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class ClickMode(str, Enum):
    """Supported clicker modes."""

    TOGGLE = "toggle"
    HOLD = "hold"
    DOUBLE = "double"
    RANDOM = "random"
    BURST = "burst"


class ClickButton(str, Enum):
    """Mouse buttons supported by PyAutoGUI."""

    LEFT = "left"
    RIGHT = "right"
    MIDDLE = "middle"


@dataclass(slots=True)
class ClickSettings:
    """User configurable clicker settings."""

    click_key: str = "h"
    stop_key: str = "esc"
    min_delay: float = 0.001
    max_delay: float = 0.005
    burst_count: int = 10
    button: ClickButton = ClickButton.LEFT

    def validate(self) -> None:
        """Run basic validation to prevent invalid runtime states."""

        if self.min_delay <= 0 or self.max_delay <= 0:
            raise ValueError("Delays must be positive numbers.")
        if self.min_delay > self.max_delay:
            raise ValueError("Minimum delay cannot be greater than maximum delay.")
        if self.burst_count <= 0:
            raise ValueError("Burst count must be at least 1.")
        if len(self.click_key) == 0 or len(self.stop_key) == 0:
            raise ValueError("Key names cannot be empty.")


__all__ = ["ClickButton", "ClickMode", "ClickSettings"]
