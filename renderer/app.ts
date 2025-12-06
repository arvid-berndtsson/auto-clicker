// DOM Elements - will be initialized in init()
let startBtn: HTMLButtonElement;
let stopBtn: HTMLButtonElement;
let statusBar: HTMLElement;
let statusText: HTMLElement;
let modeSelect: HTMLSelectElement;
let burstCountGroup: HTMLElement;

// Settings inputs
let minDelayInput: HTMLInputElement;
let maxDelayInput: HTMLInputElement;
let burstCountInput: HTMLInputElement;
let clickKeyInput: HTMLInputElement;
let stopKeyInput: HTMLInputElement;
let buttonSelect: HTMLSelectElement;

// State - isRunning is managed via updateStatus function

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
  burstCountGroup = document.getElementById('burstCountGroup') as HTMLElement;
  minDelayInput = document.getElementById('minDelay') as HTMLInputElement;
  maxDelayInput = document.getElementById('maxDelay') as HTMLInputElement;
  burstCountInput = document.getElementById('burstCount') as HTMLInputElement;
  clickKeyInput = document.getElementById('clickKey') as HTMLInputElement;
  stopKeyInput = document.getElementById('stopKey') as HTMLInputElement;
  buttonSelect = document.getElementById('button') as HTMLSelectElement;

  // Check if all elements exist
  if (!startBtn || !stopBtn || !statusBar || !statusText || !modeSelect || !burstCountGroup) {
    console.error('Required DOM elements not found');
    return;
  }

  // Check if electronAPI is available
  if (!window.electronAPI) {
    console.error('electronAPI is not available');
    statusText.textContent = 'Error: electronAPI not available';
    statusText.style.color = '#dc3545';
    return;
  }

  // Set up event listeners
  startBtn.addEventListener('click', handleStart);
  stopBtn.addEventListener('click', handleStop);
  modeSelect.addEventListener('change', handleModeChange);

  // Listen for status updates from main process
  window.electronAPI.onClickerStatus((data) => {
    updateStatus(data.running);
  });

  // Initialize UI based on mode
  handleModeChange();
}

function handleModeChange(): void {
  const mode = modeSelect.value;

  // Show/hide burst count based on mode
  if (mode === 'burst') {
    burstCountGroup.classList.remove('hidden');
  } else {
    burstCountGroup.classList.add('hidden');
  }
}

function validateSettings(): boolean {
  const minDelay = parseInt(minDelayInput.value);
  const maxDelay = parseInt(maxDelayInput.value);
  const burstCount = parseInt(burstCountInput.value);

  if (minDelay <= 0 || maxDelay <= 0) {
    showStatusMessage('Error: Delays must be positive numbers', true);
    return false;
  }

  if (minDelay > maxDelay) {
    showStatusMessage('Error: Minimum delay cannot be greater than maximum delay', true);
    return false;
  }

  if (burstCount <= 0) {
    showStatusMessage('Error: Burst count must be at least 1', true);
    return false;
  }

  if (!clickKeyInput.value || !stopKeyInput.value) {
    showStatusMessage('Error: Key names cannot be empty', true);
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
      showStatusMessage('Clicker running... Press stop key to exit.');
    } else {
      showStatusMessage(result.message || 'Failed to start clicker', true);
    }
  } catch (error) {
    console.error('Error starting clicker:', error);
    showStatusMessage('Failed to start clicker', true);
  }
}

async function handleStop(): Promise<void> {
  try {
    const result = await window.electronAPI.stopClicker();

    if (result.success) {
      updateStatus(false);
      showStatusMessage('Clicker stopped.');
    }
  } catch (error) {
    console.error('Error stopping clicker:', error);
    showStatusMessage('Failed to stop clicker', true);
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
