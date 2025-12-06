#!/usr/bin/env node

/**
 * Keyboard scancode utility for Auto Clicker
 * Press any key to see its information, press ESC to exit
 */

import { app, BrowserWindow } from 'electron';
import * as readline from 'readline';

interface KeyInfo {
  name?: string;
  sequence?: string;
  shift?: boolean;
  ctrl?: boolean;
  meta?: boolean;
}

// For CLI-based scancode detection (simpler approach)
function cliScancode(): void {
  console.log('\n=== Keyboard Scancode Utility ===');
  console.log('Press any key to see its information');
  console.log('Press Ctrl+C to exit\n');

  // Enable raw mode to capture individual keypresses
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
  }

  process.stdin.on('keypress', (str: string, key: KeyInfo) => {
    if (key.ctrl && key.name === 'c') {
      console.log('\nExiting...');
      process.exit(0);
    }

    console.log('─────────────────────────────────');
    console.log(`Key Name: ${key.name || 'unknown'}`);
    console.log(`Key Sequence: ${key.sequence || 'N/A'}`);
    console.log(`Shift: ${key.shift || false}`);
    console.log(`Ctrl: ${key.ctrl || false}`);
    console.log(`Alt/Meta: ${key.meta || false}`);

    if (key.name === 'escape') {
      console.log('\nESC pressed. Exiting...');
      process.exit(0);
    }
  });

  process.on('SIGINT', () => {
    console.log('\nExiting...');
    process.exit(0);
  });
}

// For Electron-based GUI scancode detection (more user-friendly)
function guiScancode(): void {
  app.whenReady().then(() => {
    const win = new BrowserWindow({
      width: 500,
      height: 400,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
      title: 'Scancode Utility',
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 30px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      margin: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      background: rgba(255, 255, 255, 0.1);
      padding: 30px;
      border-radius: 15px;
      backdrop-filter: blur(10px);
      text-align: center;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    }
    h1 { margin-top: 0; font-size: 24px; }
    .info {
      background: rgba(255, 255, 255, 0.2);
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
      min-height: 150px;
    }
    .key-info {
      font-size: 18px;
      margin: 10px 0;
    }
    .key-name {
      font-size: 32px;
      font-weight: bold;
      color: #ffd700;
      margin: 15px 0;
    }
    .instruction {
      font-size: 14px;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎹 Keyboard Scancode Utility</h1>
    <p class="instruction">Press any key to see its information</p>
    <div class="info">
      <div id="output">
        <p style="opacity: 0.6;">Waiting for key press...</p>
      </div>
    </div>
    <p class="instruction">Press ESC to exit</p>
  </div>
  <script>
    document.addEventListener('keydown', (event) => {
      event.preventDefault();
      
      if (event.key === 'Escape') {
        window.close();
        return;
      }
      
      const output = document.getElementById('output');
      output.innerHTML = \`
        <div class="key-name">\${event.key}</div>
        <div class="key-info">Code: \${event.code}</div>
        <div class="key-info">Key: \${event.key}</div>
        <div class="key-info">Which: \${event.which || event.keyCode}</div>
        <div class="key-info">
          Modifiers: \${[
            event.shiftKey && 'Shift',
            event.ctrlKey && 'Ctrl',
            event.altKey && 'Alt',
            event.metaKey && 'Meta'
          ].filter(Boolean).join(', ') || 'None'}
        </div>
      \`;
    });
  </script>
</body>
</html>
    `;

    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
}

// Determine which mode to use
const args = process.argv.slice(2);
const useGui = args.includes('--gui') || args.includes('-g');

if (useGui) {
  guiScancode();
} else {
  cliScancode();
}
