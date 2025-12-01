"""Command line interface powered by Typer."""

from __future__ import annotations

import logging
import typer

from . import __version__
from .config import ClickButton, ClickMode, ClickSettings
from .engine import AutoClicker

app = typer.Typer(help="Cross-platform auto clicker.", no_args_is_help=True)


def _configure_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    )


@app.command()
def run(
    mode: ClickMode = typer.Option(
        ClickMode.HOLD,
        help="Clicker mode to use.",
        case_sensitive=False,
    ),
    min_delay: float = typer.Option(
        0.001,
        min=0.0001,
        help="Minimum delay between clicks in seconds.",
    ),
    max_delay: float = typer.Option(
        0.005,
        min=0.0001,
        help="Maximum delay between clicks in seconds.",
    ),
    burst_count: int = typer.Option(
        10,
        min=1,
        help="Number of clicks per burst when using burst mode.",
    ),
    click_key: str = typer.Option(
        "h", help="Global hotkey that triggers clicks."
    ),
    stop_key: str = typer.Option(
        "esc", help="Global hotkey that stops the clicker."
    ),
    button: ClickButton = typer.Option(
        ClickButton.LEFT,
        help="Mouse button to click.",
        case_sensitive=False,
    ),
    verbose: bool = typer.Option(
        False,
        "--verbose",
        "-v",
        help="Enable verbose logging output.",
    ),
) -> None:
    """Run the auto clicker from the terminal."""

    _configure_logging(verbose)
    settings = ClickSettings(
        click_key=click_key,
        stop_key=stop_key,
        min_delay=min_delay,
        max_delay=max_delay,
        burst_count=burst_count,
        button=button,
    )
    clicker = AutoClicker(settings)
    clicker.run(mode)


@app.command()
def version() -> None:
    """Print the current package version."""

    typer.echo(__version__)


@app.command()
def gui(verbose: bool = typer.Option(False, "--verbose", "-v")) -> None:
    """Launch the Tkinter GUI."""

    _configure_logging(verbose)
    from .gui import launch_gui

    launch_gui()


def entrypoint() -> None:
    """Expose a classic callable for PyInstaller."""

    app()


if __name__ == "__main__":
    entrypoint()
