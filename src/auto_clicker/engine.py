"""Core clicker implementation."""

from __future__ import annotations

import logging
import random
import threading
import time
from typing import Callable

import keyboard
from .config import ClickMode, ClickSettings

LOGGER = logging.getLogger(__name__)


class AutoClicker:
    """Runs the different clicker strategies."""

    def __init__(self, settings: ClickSettings) -> None:
        self.settings = settings
        self.settings.validate()
        self._clicking = False
        import pyautogui  # type: ignore

        self._pyautogui = pyautogui
        self._pyautogui.FAILSAFE = True  # moving to a screen corner aborts clicks

    def run(self, mode: ClickMode, stop_event: threading.Event | None = None) -> None:
        """Run the clicker in the selected mode until stopped."""

        runner: dict[ClickMode, Callable[[threading.Event | None], None]] = {
            ClickMode.TOGGLE: self._run_toggle,
            ClickMode.HOLD: self._run_hold,
            ClickMode.DOUBLE: self._run_double,
            ClickMode.RANDOM: self._run_random,
            ClickMode.BURST: self._run_burst,
        }

        LOGGER.info("Starting %s mode. Press '%s' to stop.", mode.value, self.settings.stop_key)
        try:
            runner[mode](stop_event)
        except self._pyautogui.FailSafeException:
            LOGGER.warning("PyAutoGUI fail-safe triggered. Aborting clicks.")
        except KeyboardInterrupt:
            LOGGER.info("Interrupted by user.")

    def _run_toggle(self, stop_event: threading.Event | None) -> None:
        LOGGER.info(
            "Toggle mode active. Tap '%s' to start/stop clicks.", self.settings.click_key
        )
        while True:
            if self._should_stop(stop_event):
                LOGGER.info("Stopping toggle mode.")
                break

            if keyboard.is_pressed(self.settings.click_key):
                self._clicking = not self._clicking
                LOGGER.info("Clicking %s", "ON" if self._clicking else "OFF")
                self._wait_until_key_released(self.settings.click_key)
            if self._clicking:
                self._click_once()
                self._sleep_between_clicks()
            time.sleep(0.01)

    def _run_hold(self, stop_event: threading.Event | None) -> None:
        LOGGER.info(
            "Hold mode active. Hold '%s' to click.", self.settings.click_key
        )
        self._simple_press_to_click(stop_event, click_strategy=self._click_once)

    def _run_double(self, stop_event: threading.Event | None) -> None:
        LOGGER.info(
            "Double mode active. Hold '%s' for double clicks.", self.settings.click_key
        )
        self._simple_press_to_click(stop_event, click_strategy=self._double_click)

    def _run_random(self, stop_event: threading.Event | None) -> None:
        LOGGER.info(
            "Random mode active. Hold '%s' for jittered clicks.", self.settings.click_key
        )
        self._simple_press_to_click(stop_event, click_strategy=self._click_once)

    def _run_burst(self, stop_event: threading.Event | None) -> None:
        LOGGER.info(
            "Burst mode active. Hold '%s' for bursts of %s clicks.",
            self.settings.click_key,
            self.settings.burst_count,
        )

        while True:
            if self._should_stop(stop_event):
                LOGGER.info("Stopping burst mode.")
                break

            if keyboard.is_pressed(self.settings.click_key):
                LOGGER.debug("Starting burst of %s clicks.", self.settings.burst_count)
                for _ in range(self.settings.burst_count):
                    if self._should_stop(stop_event, quiet=True):
                        break
                    self._click_once()
                    self._sleep_between_clicks()
                time.sleep(0.3)
            else:
                time.sleep(0.01)

    def _simple_press_to_click(
        self, stop_event: threading.Event | None, *, click_strategy: Callable[[], None]
    ) -> None:
        while True:
            if self._should_stop(stop_event):
                LOGGER.info("Stopping clicker.")
                break
            if keyboard.is_pressed(self.settings.click_key):
                click_strategy()
                self._sleep_between_clicks()
            else:
                time.sleep(0.01)

    def _click_once(self) -> None:
        LOGGER.debug("Clicking %s button.", self.settings.button.value)
        self._pyautogui.click(button=self.settings.button.value)

    def _double_click(self) -> None:
        self._click_once()
        time.sleep(0.01)
        self._click_once()

    def _sleep_between_clicks(self) -> None:
        delay = random.uniform(self.settings.min_delay, self.settings.max_delay)
        time.sleep(delay)

    def _should_stop(self, stop_event: threading.Event | None, *, quiet: bool = False) -> bool:
        if stop_event and stop_event.is_set():
            if not quiet:
                LOGGER.info("Stop requested from controller.")
            return True
        if keyboard.is_pressed(self.settings.stop_key):
            if not quiet:
                LOGGER.info("Stop key '%s' pressed.", self.settings.stop_key)
            return True
        return False

    @staticmethod
    def _wait_until_key_released(key_name: str) -> None:
        while keyboard.is_pressed(key_name):
            time.sleep(0.05)


__all__ = ["AutoClicker"]
