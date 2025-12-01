# Auto Clicker

Cross-platform auto clicker with both CLI and GUI front-ends plus ready-to-use packaging via PyInstaller.

## Features

- Five clicking strategies: toggle, hold, double, random, and burst.
- Configurable click/stop hotkeys, delays, mouse button, and burst sizes.
- Tkinter GUI for quick experimentation without touching the terminal.
- Typer CLI with rich help text, logging controls, and completion support.
- Built-in safety: `esc` stops the clicker and PyAutoGUI's fail-safe turns off clicks when the mouse hits a screen corner.
- PyInstaller spec file for generating standalone executables on Windows, macOS, and Linux (build on each OS for best results).

## Repository Layout

- `src/auto_clicker/`: Production code (CLI, GUI, engine, and utilities).
- `main.py`: Backwards-compatible launcher that proxies to the Typer CLI.
- `get_scancode.py`: Helper that reuses `auto_clicker.tools.scancode`.
- `pyinstaller.spec`: Opinionated configuration for packaging.
- `pyproject.toml` / `poetry.lock`: Project metadata and dependencies.

## Getting Started

### Using Poetry (recommended)

```bash
git clone <repository-url>
cd auto-clicker-main
poetry install
```

Run commands inside the managed environment:

```bash
poetry run auto-clicker run --mode hold
poetry run auto-clicker gui
```

### Using pip

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m auto_clicker --help
```

## CLI Usage

```bash
poetry run auto-clicker run \
  --mode burst \
  --burst-count 25 \
  --min-delay 0.002 \
  --max-delay 0.008 \
  --click-key h \
  --stop-key esc \
  --button left
```

Show the installed version at any time:

```bash
poetry run auto-clicker version
```

Useful flags:

- `--mode`: `toggle|hold|double|random|burst`.
- `--min-delay` / `--max-delay`: Human-like jitter between clicks.
- `--button`: `left`, `right`, or `middle`.
- `-v/--verbose`: Enable debug logging for troubleshooting.
- `auto-clicker gui`: launches the Tkinter application instead of the CLI mode.

## GUI Usage

```bash
poetry run auto-clicker gui
```

Configure keys, delays, and mode directly in the window. The GUI runs the clicker in a background thread and can be stopped from the UI, via the `esc` key, or by moving the mouse to the top-left corner (PyAutoGUI fail-safe).

## Packaging to Executables

The project ships with a ready-to-run `pyinstaller.spec`. Build commands must be executed on the target operating system to guarantee native binaries.

```bash
# inside the poetry shell (or use `poetry run ...`)
pyinstaller pyinstaller.spec
```

Results are placed in `dist/auto-clicker/` (folder) and `dist/auto-clicker.exe` on Windows.

Platform tips:

- **Windows:** run the above command from a Developer PowerShell or Command Prompt inside `poetry shell`. The generated `.exe` is immediately shareable.
- **macOS:** the same command produces a `.app` bundle inside `dist/auto-clicker`. Notarization/signing is optional but recommended before distribution.
- **Linux:** produces an ELF binary in `dist/auto-clicker`. Make sure it is marked executable (`chmod +x` if copied elsewhere).

For reproducible builds or custom icons, tweak `pyinstaller.spec` (e.g., `icon='assets/icon.ico'`) and rerun the command. Distribute the contents of `dist/auto-clicker` or create compressed archives per platform.

## Continuous Delivery

- `.github/workflows/build-release.yml` runs on every push to `main`, on tags that start with `v`, and via `workflow_dispatch`.
- Each job installs Poetry on Windows, macOS, and Linux runners, builds the PyInstaller bundle, zips `dist/auto-clicker`, and publishes the zip as a workflow artifact named `auto-clicker-<OS>.zip`.
- When a tag such as `v1.2.3` is pushed, the workflow automatically creates a GitHub release and attaches the three platform-specific archives so you can share binaries without any local work.
- For ad-hoc builds, launch the workflow manually from the GitHub Actions tab and download the artifacts from the run summary once it completes.

## Scancode Helper

Need to discover the physical scancode for a keyboard key?

```bash
poetry run python -m auto_clicker.tools.scancode
```

Press any key to see its info; press `esc` to exit.

## Known Limitations

- The `keyboard` package requires administrative privileges on macOS and Linux (root/sudo). Run the app with the necessary permissions when global hotkeys do not fire.
- PyAutoGUI relies on the system accessibility APIs. Grant accessibility/input monitoring permissions when macOS prompts for them.
- Cross-compiling executables is not supported; build on each OS instead.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
