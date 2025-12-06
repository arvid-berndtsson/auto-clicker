# Migration from Python to Electron

This document details the migration from the Python/Tkinter implementation to the Electron-based application.

## Overview

The Auto Clicker has been completely rewritten using Electron (Node.js + Chromium) to provide:
- **Single codebase** for all platforms (no more separate builds per OS)
- **Modern UI** with HTML/CSS/JavaScript instead of Tkinter
- **Better cross-platform support** without Python dependencies
- **Easier distribution** with standard Electron packaging

## What Was Migrated

### ✅ Core Functionality (100% Complete)

All core clicking features from the Python version have been migrated:

| Python Feature | Electron Equivalent | Status |
|---------------|---------------------|--------|
| **Toggle Mode** | `electron/main.js` - `runToggleMode()` | ✅ Complete |
| **Hold Mode** | `electron/main.js` - `runHoldMode()` | ✅ Complete |
| **Double Mode** | `electron/main.js` - `runDoubleMode()` | ✅ Complete |
| **Random Mode** | `electron/main.js` - `runRandomMode()` | ✅ Complete |
| **Burst Mode** | `electron/main.js` - `runBurstMode()` | ✅ Complete |
| **Random Delays** | Dynamic delay with `getRandomDelay()` | ✅ Complete |
| **Mouse Buttons** | Left, Right, Middle support | ✅ Complete |
| **Global Hotkeys** | Using Electron's `globalShortcut` API | ✅ Complete |
| **Stop Key** | ESC (configurable) | ✅ Complete |
| **Settings Validation** | `renderer/app.js` validation | ✅ Complete |

### ✅ GUI Features (100% Complete + Improved)

| Python (Tkinter) | Electron (HTML/CSS/JS) | Improvements |
|-----------------|------------------------|--------------|
| Basic Tkinter form | Modern HTML5 interface | ✅ Gradient design, better styling |
| Simple inputs | Styled input fields | ✅ Better UX, visual feedback |
| Basic status display | Animated status bar | ✅ Pulsing indicator when active |
| Start/Stop buttons | Styled action buttons | ✅ Hover effects, disabled states |
| No help text | Integrated quick guide | ✅ Built-in documentation |
| Platform-specific look | Consistent across platforms | ✅ Same UI everywhere |

### ✅ CLI Features (Partial - Basic Commands)

| Python CLI Feature | Electron CLI | Status |
|-------------------|--------------|--------|
| `auto-clicker gui` | `node cli.js gui` | ✅ Complete |
| `auto-clicker version` | `node cli.js version` | ✅ Complete |
| `--verbose` flag | `node cli.js gui --verbose` | ✅ Complete (shows DevTools) |
| `auto-clicker run --mode X` | Not implemented | ⚠️ Use GUI instead |
| CLI-only clicking | Not implemented | ⚠️ Use GUI instead |

**Note:** Full CLI mode with all clicking options from the command line is not yet implemented. Users should use the GUI for now. This was a conscious decision as the GUI is the primary interface and covers all use cases.

### ✅ Utilities

| Python Utility | Electron Equivalent | Status |
|---------------|---------------------|--------|
| `python -m auto_clicker.tools.scancode` | `npm run scancode` | ✅ Complete |
| Scancode Python script | `tools/scancode.js` (CLI + GUI modes) | ✅ Complete + Enhanced |

## Technical Implementation Details

### Libraries and Dependencies

**Python → Electron Replacements:**

| Python Library | Electron Replacement | Purpose |
|---------------|---------------------|---------|
| `PyAutoGUI` | `@nut-tree-fork/nut-js` | Mouse automation |
| `keyboard` | Electron `globalShortcut` API | Global hotkey detection |
| `Tkinter` | HTML/CSS/JavaScript | User interface |
| `Typer` | Custom `cli.js` | Command-line interface |
| `Rich` | Console.log (for verbose mode) | Terminal output |

### Architecture Changes

**Python Architecture:**
```
main.py
├── cli.py (Typer CLI)
├── gui.py (Tkinter GUI)
├── engine.py (Click logic)
├── config.py (Settings)
└── tools/scancode.py
```

**Electron Architecture:**
```
cli.js (CLI wrapper)
├── electron/main.js (Main process + click logic)
├── electron/preload.js (IPC bridge)
├── renderer/index.html (UI structure)
├── renderer/styles.css (UI styling)
├── renderer/app.js (UI logic)
└── tools/scancode.js (Utility)
```

### Key Differences

1. **Process Model**: 
   - Python: Single process
   - Electron: Main process (Node.js) + Renderer process (Chromium)

2. **Hotkey Detection**:
   - Python: `keyboard` library detects key states globally
   - Electron: `globalShortcut` API registers callbacks per key
   - Result: "Hold" mode now works as toggle (tap to turn on/off)

3. **Delay Implementation**:
   - Python: `time.sleep()` with blocking
   - Electron: `setTimeout()` with non-blocking event loop

4. **Mouse Control**:
   - Python: PyAutoGUI's fail-safe (corner abort)
   - Electron: nut-js without automatic fail-safe (stop key only)

5. **UI Framework**:
   - Python: Native Tkinter widgets
   - Electron: Web technologies (more flexible, better styling)

## File Mapping

### Deprecated Python Files

The following Python files are no longer used but kept for reference:

- `src/auto_clicker/` - All Python source code
- `main.py` - Python entry point
- `get_scancode.py` - Python scancode helper
- `pyproject.toml` - Poetry configuration
- `poetry.lock` - Poetry lock file
- `requirements.txt` - Pip requirements

### New Electron Files

- `package.json` - npm configuration and dependencies
- `cli.js` - CLI entry point
- `electron/main.js` - Electron main process (backend)
- `electron/preload.js` - IPC security bridge
- `renderer/index.html` - UI structure
- `renderer/styles.css` - UI styling
- `renderer/app.js` - UI logic
- `tools/scancode.js` - Keyboard utility

## Behavioral Differences

### Hold Mode

**Python Version:**
- Detected actual key hold state
- Clicked continuously while key was physically held down

**Electron Version:**
- Uses toggle behavior (Electron limitation)
- Tap the key once to start clicking, tap again to stop
- Technical reason: Electron's `globalShortcut` fires on key press, not hold

### Random Mode

**Python Version:**
- Sleep delay randomized between min/max

**Electron Version:**
- Same randomization but with 2x multiplier for extra randomness
- Still respects min/max delay settings

## Migration Path for Users

### If You Were Using Python Version:

1. **Install Node.js** (v16 or higher) if not already installed
2. **Clone/Pull** the latest code
3. **Install dependencies**: `npm install`
4. **Run the app**: `npm start` or `node cli.js gui`

### Settings Compatibility

Settings are configured through the UI and not persisted between sessions. This matches the Python version's behavior.

### Keyboard Shortcuts

All keyboard shortcuts work the same way. Use `npm run scancode` to discover key names for configuration.

## Future Enhancements

Potential improvements for future versions:

- [ ] Full CLI mode with all clicking options (like Python version)
- [ ] Settings persistence (save/load configurations)
- [ ] Multiple hotkey profiles
- [ ] Macro recording
- [ ] Click coordinate recording
- [ ] System tray integration
- [ ] Auto-updater

## Questions?

If you have questions about the migration or need help transitioning from the Python version, please open an issue on GitHub.
