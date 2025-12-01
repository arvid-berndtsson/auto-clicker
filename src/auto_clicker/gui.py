"""Simple Tkinter GUI facade for the auto clicker."""

from __future__ import annotations

import logging
import threading
import tkinter as tk
from tkinter import ttk

from .config import ClickButton, ClickMode, ClickSettings
from .engine import AutoClicker

LOGGER = logging.getLogger(__name__)


class _ClickController:
    """Controls the background thread running the clicker."""

    def __init__(self) -> None:
        self._stop_event = threading.Event()
        self._worker: threading.Thread | None = None

    def start(self, settings: ClickSettings, mode: ClickMode) -> None:
        if self.is_running:
            LOGGER.warning("Clicker already running.")
            return

        self._stop_event.clear()
        self._worker = threading.Thread(
            target=self._run_clicker, args=(settings, mode), daemon=True
        )
        self._worker.start()

    def stop(self) -> None:
        if not self.is_running:
            return
        self._stop_event.set()
        LOGGER.info("Stop requested from GUI.")

    def _run_clicker(self, settings: ClickSettings, mode: ClickMode) -> None:
        clicker = AutoClicker(settings)
        clicker.run(mode, stop_event=self._stop_event)

    @property
    def is_running(self) -> bool:
        return self._worker is not None and self._worker.is_alive()


def launch_gui() -> None:
    root = tk.Tk()
    root.title("Auto Clicker")
    root.resizable(False, False)

    controller = _ClickController()
    status_var = tk.StringVar(value="Idle")

    # Inputs
    min_delay_var = tk.DoubleVar(value=0.001)
    max_delay_var = tk.DoubleVar(value=0.005)
    burst_var = tk.IntVar(value=10)
    click_key_var = tk.StringVar(value="h")
    stop_key_var = tk.StringVar(value="esc")
    mode_var = tk.StringVar(value=ClickMode.HOLD.value)
    button_var = tk.StringVar(value=ClickButton.LEFT.value)

    def start_clicker() -> None:
        try:
            settings = ClickSettings(
                click_key=click_key_var.get(),
                stop_key=stop_key_var.get(),
                min_delay=min_delay_var.get(),
                max_delay=max_delay_var.get(),
                burst_count=burst_var.get(),
                button=ClickButton(button_var.get()),
            )
            settings.validate()
        except Exception as exc:  # noqa: BLE001
            status_var.set(f"Invalid settings: {exc}")
            LOGGER.error("Validation error: %s", exc)
            return

        controller.start(settings, ClickMode(mode_var.get()))
        status_var.set("Clicker running... Move mouse to corner or press Stop.")

    def stop_clicker() -> None:
        controller.stop()
        status_var.set("Stopping...")

    main_frame = ttk.Frame(root, padding=12)
    main_frame.grid(row=0, column=0, sticky="nsew")

    def add_labeled_entry(
        label_text: str, variable: tk.Variable, row: int, width: int = 12
    ) -> None:
        ttk.Label(main_frame, text=label_text).grid(row=row, column=0, sticky="w", pady=4)
        entry = ttk.Entry(main_frame, textvariable=variable, width=width)
        entry.grid(row=row, column=1, sticky="ew")

    add_labeled_entry("Min delay (s)", min_delay_var, row=0)
    add_labeled_entry("Max delay (s)", max_delay_var, row=1)
    add_labeled_entry("Burst count", burst_var, row=2)
    add_labeled_entry("Click key", click_key_var, row=3)
    add_labeled_entry("Stop key", stop_key_var, row=4)

    ttk.Label(main_frame, text="Mode").grid(row=5, column=0, sticky="w", pady=4)
    mode_menu = ttk.OptionMenu(
        main_frame, mode_var, mode_var.get(), *[m.value for m in ClickMode]
    )
    mode_menu.grid(row=5, column=1, sticky="ew")

    ttk.Label(main_frame, text="Mouse button").grid(row=6, column=0, sticky="w", pady=4)
    button_menu = ttk.OptionMenu(
        main_frame, button_var, button_var.get(), *[b.value for b in ClickButton]
    )
    button_menu.grid(row=6, column=1, sticky="ew")

    button_frame = ttk.Frame(main_frame)
    button_frame.grid(row=7, column=0, columnspan=2, pady=12)

    ttk.Button(button_frame, text="Start", command=start_clicker).grid(
        row=0, column=0, padx=6
    )
    ttk.Button(button_frame, text="Stop", command=stop_clicker).grid(
        row=0, column=1, padx=6
    )

    ttk.Label(main_frame, textvariable=status_var, foreground="blue").grid(
        row=8, column=0, columnspan=2, sticky="w"
    )

    root.protocol("WM_DELETE_WINDOW", lambda: (controller.stop(), root.destroy()))
    root.mainloop()


__all__ = ["launch_gui"]
