// DOM Elements - will be initialized in init()
let startBtn: HTMLButtonElement;
let stopBtn: HTMLButtonElement;
let statusBar: HTMLElement;
let statusText: HTMLElement;
let modeSelect: HTMLSelectElement;
let modeSelector: HTMLElement;
let burstCountRow: HTMLElement;

// Quick stats elements
let currentModeText: HTMLElement;
let currentButtonText: HTMLElement;
let currentDelayText: HTMLElement;

// Settings inputs
let minDelayInput: HTMLInputElement;
let maxDelayInput: HTMLInputElement;
let burstCountInput: HTMLInputElement;
let clickKeyInput: HTMLInputElement;
let stopKeyInput: HTMLInputElement;
let buttonSelect: HTMLSelectElement;

interface ClickerSettings {
  mode: string;
  minDelay: number;
  maxDelay: number;
  burstCount: number;
  clickKey: string;
  stopKey: string;
  button: string;
}

// Initialize
function init(): void {
  // Get DOM elements
  startBtn = document.getElementById('startBtn') as HTMLButtonElement;
  stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
  statusBar = document.getElementById('statusBar') as HTMLElement;
  statusText = document.getElementById('statusText') as HTMLElement;
  modeSelect = document.getElementById('mode') as HTMLSelectElement;
  modeSelector = document.getElementById('modeSelector') as HTMLElement;
  burstCountRow = document.getElementById('burstCountRow') as HTMLElement;
  currentModeText = document.getElementById('currentMode') as HTMLElement;
  currentButtonText = document.getElementById('currentButton') as HTMLElement;
  currentDelayText = document.getElementById('currentDelay') as HTMLElement;
  minDelayInput = document.getElementById('minDelay') as HTMLInputElement;
  maxDelayInput = document.getElementById('maxDelay') as HTMLInputElement;
  burstCountInput = document.getElementById('burstCount') as HTMLInputElement;
  clickKeyInput = document.getElementById('clickKey') as HTMLInputElement;
  stopKeyInput = document.getElementById('stopKey') as HTMLInputElement;
  buttonSelect = document.getElementById('button') as HTMLSelectElement;

  // Check if all elements exist
  if (
    !startBtn ||
    !stopBtn ||
    !statusBar ||
    !statusText ||
    !modeSelect ||
    !modeSelector ||
    !burstCountRow
  ) {
    console.error('Required DOM elements not found');
    return;
  }

  // Check if electronAPI is available
  if (!window.electronAPI) {
    console.error('electronAPI is not available');
    statusText.textContent = 'Error';
    return;
  }

  // Set up event listeners
  startBtn.addEventListener('click', handleStart);
  stopBtn.addEventListener('click', handleStop);

  // Mode selector buttons
  const modeButtons = modeSelector.querySelectorAll('.mode-btn');
  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.getAttribute('data-mode');
      if (mode) {
        selectMode(mode);
      }
    });
  });

  // Add input validation listeners
  minDelayInput.addEventListener('input', () => {
    validateDelayInputs();
    updateQuickStats();
  });
  maxDelayInput.addEventListener('input', () => {
    validateDelayInputs();
    updateQuickStats();
  });

  // Button select listener
  buttonSelect.addEventListener('change', updateQuickStats);

  // Listen for status updates from main process
  window.electronAPI.onClickerStatus((data) => {
    updateStatus(data.running);
  });

  // Initialize UI based on mode
  handleModeChange();
  updateQuickStats();
}

function selectMode(mode: string): void {
  // Update visual selection
  const modeButtons = modeSelector.querySelectorAll('.mode-btn');
  modeButtons.forEach((button) => {
    if (button.getAttribute('data-mode') === mode) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });

  // Update hidden select
  modeSelect.value = mode;

  // Handle mode-specific UI
  handleModeChange();
  updateQuickStats();
}

function updateQuickStats(): void {
  // Update mode
  const modeNames: Record<string, string> = {
    toggle: 'TOGGLE',
    hold: 'HOLD',
    double: 'DOUBLE',
    random: 'RANDOM',
    burst: 'BURST',
  };
  currentModeText.textContent = modeNames[modeSelect.value] || 'HOLD';

  // Update button
  currentButtonText.textContent = buttonSelect.value.toUpperCase();

  // Update delay
  const min = minDelayInput.value;
  const max = maxDelayInput.value;
  currentDelayText.textContent = `${min}-${max}ms`;
}

function handleModeChange(): void {
  const mode = modeSelect.value;

  // Show/hide burst count based on mode
  if (mode === 'burst') {
    burstCountRow.classList.remove('hidden');
  } else {
    burstCountRow.classList.add('hidden');
  }
}

// Validate delay inputs in real-time
function validateDelayInputs(): void {
  const minDelay = parseInt(minDelayInput.value);
  const maxDelay = parseInt(maxDelayInput.value);

  if (minDelay > 0 && maxDelay > 0 && minDelay > maxDelay) {
    minDelayInput.style.borderColor = '#ef4444';
    maxDelayInput.style.borderColor = '#ef4444';
  } else {
    minDelayInput.style.borderColor = '';
    maxDelayInput.style.borderColor = '';
  }
}

function validateSettings(): boolean {
  const minDelay = parseInt(minDelayInput.value);
  const maxDelay = parseInt(maxDelayInput.value);
  const burstCount = parseInt(burstCountInput.value);

  if (isNaN(minDelay) || minDelay <= 0 || isNaN(maxDelay) || maxDelay <= 0) {
    showStatusMessage('Error: Delays must be positive numbers', true);
    return false;
  }

  if (minDelay > maxDelay) {
    showStatusMessage('Error: Min delay cannot exceed max delay', true);
    return false;
  }

  if (isNaN(burstCount) || burstCount <= 0 || burstCount > 100) {
    showStatusMessage('Error: Burst count must be between 1 and 100', true);
    return false;
  }

  if (!clickKeyInput.value || !stopKeyInput.value) {
    showStatusMessage('Error: Key names cannot be empty', true);
    return false;
  }

  if (clickKeyInput.value.toLowerCase() === stopKeyInput.value.toLowerCase()) {
    showStatusMessage('Error: Keys must be different', true);
    return false;
  }

  return true;
}

function getSettings(): ClickerSettings {
  return {
    mode: modeSelect.value,
    minDelay: parseInt(minDelayInput.value),
    maxDelay: parseInt(maxDelayInput.value),
    burstCount: parseInt(burstCountInput.value),
    clickKey: clickKeyInput.value.toLowerCase(),
    stopKey: stopKeyInput.value.toLowerCase(),
    button: buttonSelect.value,
  };
}

async function handleStart(): Promise<void> {
  if (!validateSettings()) {
    return;
  }

  const settings = getSettings();

  try {
    const result = await window.electronAPI.startClicker(settings);

    if (result.success) {
      updateStatus(true);
      showStatusMessage('ACTIVE');
    } else {
      showStatusMessage(result.message || 'ERROR', true);
    }
  } catch (error) {
    console.error('Error starting clicker:', error);
    showStatusMessage('ERROR', true);
  }
}

async function handleStop(): Promise<void> {
  try {
    const result = await window.electronAPI.stopClicker();

    if (result.success) {
      updateStatus(false);
      showStatusMessage('READY');
    }
  } catch (error) {
    console.error('Error stopping clicker:', error);
    showStatusMessage('ERROR', true);
  }
}

function updateStatus(running: boolean): void {
  // Update UI based on running state

  if (running) {
    statusBar.classList.add('active');
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Disable settings while running
    minDelayInput.disabled = true;
    maxDelayInput.disabled = true;
    burstCountInput.disabled = true;
    clickKeyInput.disabled = true;
    stopKeyInput.disabled = true;
    modeSelect.disabled = true;
    buttonSelect.disabled = true;

    // Disable mode selector buttons
    const modeButtons = modeSelector.querySelectorAll('.mode-btn');
    modeButtons.forEach((button) => {
      const btn = button as HTMLButtonElement;
      btn.disabled = true;
      btn.style.opacity = '0.3';
      btn.style.cursor = 'not-allowed';
    });
  } else {
    statusBar.classList.remove('active');
    startBtn.disabled = false;
    stopBtn.disabled = true;

    // Enable settings when stopped
    minDelayInput.disabled = false;
    maxDelayInput.disabled = false;
    burstCountInput.disabled = false;
    clickKeyInput.disabled = false;
    stopKeyInput.disabled = false;
    modeSelect.disabled = false;
    buttonSelect.disabled = false;

    // Enable mode selector buttons
    const modeButtons = modeSelector.querySelectorAll('.mode-btn');
    modeButtons.forEach((button) => {
      const btn = button as HTMLButtonElement;
      btn.disabled = false;
      btn.style.opacity = '';
      btn.style.cursor = '';
    });
  }
}

function showStatusMessage(message: string, isError = false): void {
  statusText.textContent = message;

  if (isError) {
    statusText.style.color = '#dc3545';
  } else {
    statusText.style.color = '';
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    try {
      init();
    } catch (error) {
      console.error('Failed to initialize app:', error);
      const errorText = document.getElementById('statusText');
      if (errorText) {
        errorText.textContent = 'Error: Failed to initialize. Check console.';
        (errorText as HTMLElement).style.color = '#dc3545';
      }
    }
  });
} else {
  try {
    init();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    const errorText = document.getElementById('statusText');
    if (errorText) {
      errorText.textContent = 'Error: Failed to initialize. Check console.';
      (errorText as HTMLElement).style.color = '#dc3545';
    }
  }
}
