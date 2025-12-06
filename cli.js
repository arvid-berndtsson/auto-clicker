#!/usr/bin/env node

/**
 * Command-line interface for Auto Clicker
 * Provides CLI functionality similar to the Python version
 */

const { spawn } = require('child_process');
const path = require('path');
const packageJson = require('./package.json');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

function printHelp() {
  console.log(`
Auto Clicker CLI v${packageJson.version}

Usage:
  auto-clicker [command] [options]

Commands:
  gui              Launch the Electron GUI application
  version          Print the current version
  help             Show this help message

Options for 'gui':
  --verbose, -v    Enable verbose logging (shows DevTools)

Examples:
  auto-clicker gui           # Launch the GUI
  auto-clicker gui --verbose # Launch GUI with DevTools
  auto-clicker version       # Print version

Note: The full CLI mode with all clicking options from the command line
is not yet implemented in the Electron version. Use the GUI for now.
`);
}

function printVersion() {
  console.log(packageJson.version);
}

function launchGui(verbose = false) {
  console.log('Launching Auto Clicker GUI...');
  
  const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');
  const mainPath = path.join(__dirname, 'electron', 'main.js');
  
  const args = [__dirname, '--no-sandbox'];
  
  if (verbose) {
    console.log('Verbose mode enabled - DevTools will be shown');
    process.env.AUTO_CLICKER_VERBOSE = '1';
  }
  
  const child = spawn(electronPath, args, {
    stdio: 'inherit',
    env: process.env
  });
  
  child.on('error', (error) => {
    console.error('Failed to start Electron:', error);
    process.exit(1);
  });
  
  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

// Command routing
switch (command) {
  case 'gui':
    const verbose = args.includes('--verbose') || args.includes('-v');
    launchGui(verbose);
    break;
  
  case 'version':
    printVersion();
    break;
  
  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;
  
  case undefined:
    // No command provided, launch GUI by default
    launchGui();
    break;
  
  default:
    console.error(`Unknown command: ${command}`);
    console.error('Run "auto-clicker help" for usage information.');
    process.exit(1);
}
