# Auto Clicker

Cross-platform auto clicker built with Electron for a modern, unified user experience across all platforms.

## Features

- Five clicking strategies: toggle, hold, double, random, and burst.
- Configurable click/stop hotkeys, delays, mouse button, and burst sizes.
- Modern Electron-based GUI with improved UI/UX design.
- Single codebase for Windows, macOS, and Linux - no need for separate builds.
- Built-in safety: `esc` (or custom stop key) stops the clicker instantly.
- Cross-platform automation using native system APIs.

## Repository Layout

- `electron/`: Electron main process and preload scripts.
- `renderer/`: UI code (HTML, CSS, JavaScript).
- `tools/`: Utility scripts (scancode helper).
- `package.json`: Node.js dependencies and build configuration.

## Documentation

- **[ROADMAP.md](ROADMAP.md)** - Comprehensive development plan for gaming enhancements targeting Roblox, RuneScape (OSRS & RS3), Minecraft, World of Warcraft, Final Fantasy XIV, and other popular games
- **[Gaming Guide](docs/GAMING_GUIDE.md)** - Game-specific configuration recommendations, safety tips, and best practices

## Getting Started

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd auto-clicker
```

2. Install dependencies:

```bash
pnpm install
```

3. Run the application:

```bash
pnpm start
# or
node cli.js gui
```

### Command Line Interface

The CLI provides quick access to the application:

```bash
# Launch GUI (default)
node cli.js
node cli.js gui

# Launch GUI with verbose logging (shows DevTools)
node cli.js gui --verbose

# Show version
node cli.js version

# Show help
node cli.js help
```

## Usage

The Auto Clicker features an intuitive GUI where you can:

1. **Select a clicking mode**:
   - **Toggle**: Tap the click key to start/stop automatic clicking
   - **Hold**: Clicks continuously while holding the click key
   - **Double**: Performs double-clicks while holding the click key
   - **Random**: Adds extra randomness to click timing for more human-like behavior
   - **Burst**: Fires multiple rapid clicks per key press

2. **Configure settings**:
   - Set minimum and maximum delay between clicks (in milliseconds)
   - Choose mouse button (left, right, or middle)
   - Set burst count for burst mode
   - Customize hotkeys for clicking and stopping

3. **Start clicking**: Press the "Start Clicker" button or use your configured hotkey

4. **Stop at any time**: Press the stop key (default: ESC) or click the "Stop Clicker" button

## Building Executables

Build standalone executables for distribution using electron-builder:

```bash
# Build for all platforms
pnpm build

# Or build for specific platforms
pnpm build:win     # Windows
pnpm build:mac     # macOS
pnpm build:linux   # Linux
```

Results are placed in the `dist/` folder:

- **Windows**: `.exe` installer
- **macOS**: `.dmg` disk image
- **Linux**: `.AppImage` and `.deb` package

**Note**: For best results, build on the target platform (Windows builds on Windows, macOS on macOS, etc.)

## Scancode Helper

Need to discover keyboard key names for configuring hotkeys?

```bash
# CLI mode (text-based)
pnpm scancode

# GUI mode (visual interface)
pnpm scancode:gui
# or
node tools/scancode.js --gui
```

Press any key to see its information; press ESC to exit.

## Continuous Delivery

- `.github/workflows/build-release.yml` runs on every push to `main`, on tags that start with `v`, and via `workflow_dispatch`.
- Each job installs Node.js on Windows, macOS, and Linux runners, builds the Electron app using electron-builder, and publishes artifacts as `auto-clicker-<OS>.zip`.
- When a tag such as `v1.2.3` is pushed, the workflow automatically creates a GitHub release and attaches the three platform-specific archives so you can share binaries without any local work.
- For ad-hoc builds, launch the workflow manually from the GitHub Actions tab and download the artifacts from the run summary once it completes.

## Known Limitations

- Global hotkeys may require accessibility permissions on macOS and Linux. Grant the necessary permissions when prompted.
- On Linux, you may need to install additional dependencies for the automation library.
- For security reasons, some operating systems may require running the app with elevated privileges for system-wide hotkeys.
- Cross-compiling executables is not supported; build on each OS for best results.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
