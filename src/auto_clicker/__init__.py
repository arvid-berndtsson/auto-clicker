"""Auto Clicker package."""

from importlib import metadata
from pathlib import Path

from .config import ClickMode, ClickSettings
from .engine import AutoClicker

try:
    __version__ = metadata.version("auto-clicker")
except metadata.PackageNotFoundError:
    try:
        import tomllib

        pyproject = Path(__file__).resolve().parents[2] / "pyproject.toml"
        with pyproject.open("rb") as handle:
            __version__ = tomllib.load(handle)["tool"]["poetry"]["version"]
    except Exception:  # noqa: BLE001
        __version__ = "0.0.0"

__all__ = ["AutoClicker", "ClickMode", "ClickSettings", "__version__"]
