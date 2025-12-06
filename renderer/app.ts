// DOM Elements - will be initialized in init()
let startBtn: HTMLButtonElement;
let stopBtn: HTMLButtonElement;
let statusBar: HTMLElement;
let statusText: HTMLElement;
let modeSelect: HTMLSelectElement;
let burstCountGroup: HTMLElement;
let toastContainer: HTMLElement;

// Settings inputs
let minDelayInput: HTMLInputElement;
let maxDelayInput: HTMLInputElement;
let burstCountInput: HTMLInputElement;
let clickKeyInput: HTMLInputElement;
let stopKeyInput: HTMLInputElement;
let buttonSelect: HTMLSelectElement;

// State - isRunning is managed via updateStatus function
const activeToasts: Set<HTMLElement> = new Set();

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
  toastContainer = document.getElementById('toastContainer') as HTMLElement;
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
    !burstCountGroup ||
    !toastContainer
  ) {
    console.error('Required DOM elements not found');
    return;
  }

  // Check if electronAPI is available
  if (!window.electronAPI) {
    console.error('electronAPI is not available');
    statusText.textContent = 'Error: electronAPI not available';
    statusText.style.color = '#dc3545';
    showToast('Failed to initialize: electronAPI not available', 'error');
    return;
  }

  // Set up event listeners
  startBtn.addEventListener('click', handleStart);
  stopBtn.addEventListener('click', handleStop);
  modeSelect.addEventListener('change', handleModeChange);

  // Add input validation listeners
  minDelayInput.addEventListener('input', validateDelayInputs);
  maxDelayInput.addEventListener('input', validateDelayInputs);

  // Listen for status updates from main process
  window.electronAPI.onClickerStatus((data) => {
    updateStatus(data.running);
  });

  // Initialize UI based on mode
  handleModeChange();

  // Show welcome message
  showToast('Auto Clicker ready! Configure your settings and press Start.', 'info', 3000);
}

// Toast notification system
function showToast(
  message: string,
  type: 'success' | 'error' | 'info' = 'info',
  duration = 5000
): void {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = document.createElement('span');
  icon.className = 'toast-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';

  const content = document.createElement('span');
  content.className = 'toast-content';
  content.textContent = message;

  const closeBtn = document.createElement('span');
  closeBtn.className = 'toast-close';
  closeBtn.setAttribute('aria-label', 'Close notification');
  closeBtn.textContent = '×';
  closeBtn.onclick = () => removeToast(toast);

  toast.appendChild(icon);
  toast.appendChild(content);
  toast.appendChild(closeBtn);

  toastContainer.appendChild(toast);
  activeToasts.add(toast);

  // Auto-remove after duration
  setTimeout(() => {
    removeToast(toast);
  }, duration);
}

function removeToast(toast: HTMLElement): void {
  if (!activeToasts.has(toast)) return;

  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';

  setTimeout(() => {
    if (toast.parentNode === toastContainer) {
      toastContainer.removeChild(toast);
    }
    activeToasts.delete(toast);
  }, 300);
}

function handleModeChange(): void {
  const mode = modeSelect.value;

  // Show/hide burst count based on mode
  if (mode === 'burst') {
    burstCountGroup.classList.remove('hidden');
  } else {
    burstCountGroup.classList.add('hidden');
  }

  // Update help text based on mode
  const modeDescriptions: Record<string, string> = {
    toggle: 'Press the click key once to start, press again to stop',
    hold: 'Press the click key to toggle clicking on/off',
    double: 'Performs double-clicks while the mode is active',
    random: 'Adds extra randomness to simulate human-like clicking',
    burst: 'Fires multiple rapid clicks each time you press the key',
  };

  const description = modeDescriptions[mode] || '';
  if (description) {
    showStatusMessage(description);
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
    showToast('Please enter valid positive numbers for delays', 'error');
    return false;
  }

  if (minDelay > maxDelay) {
    showStatusMessage('Error: Minimum delay cannot be greater than maximum delay', true);
    showToast('Minimum delay must be less than or equal to maximum delay', 'error');
    return false;
  }

  if (isNaN(burstCount) || burstCount <= 0 || burstCount > 100) {
    showStatusMessage('Error: Burst count must be between 1 and 100', true);
    showToast('Burst count must be between 1 and 100', 'error');
    return false;
  }

  if (!clickKeyInput.value || !stopKeyInput.value) {
    showStatusMessage('Error: Key names cannot be empty', true);
    showToast('Please specify both click key and stop key', 'error');
    return false;
  }

  if (clickKeyInput.value.toLowerCase() === stopKeyInput.value.toLowerCase()) {
    showStatusMessage('Error: Click key and stop key must be different', true);
    showToast('Click key and stop key cannot be the same', 'error');
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
      const modeNames: Record<string, string> = {
        toggle: '🔄 Toggle',
        hold: '👆 Hold',
        double: '✌️ Double',
        random: '🎲 Random',
        burst: '💥 Burst',
      };
      const modeName = modeNames[settings.mode] || settings.mode;
      showStatusMessage(`${modeName} mode active - Press "${settings.stopKey}" to stop`);
      showToast(
        `Auto Clicker started in ${modeName} mode! Press "${settings.clickKey}" to click.`,
        'success'
      );
    } else {
      showStatusMessage(result.message || 'Failed to start clicker', true);
      showToast(result.message || 'Failed to start clicker', 'error');
    }
  } catch (error) {
    console.error('Error starting clicker:', error);
    showStatusMessage('Failed to start clicker', true);
    showToast('An unexpected error occurred while starting the clicker', 'error');
  }
}

async function handleStop(): Promise<void> {
  try {
    const result = await window.electronAPI.stopClicker();

    if (result.success) {
      updateStatus(false);
      showStatusMessage('Clicker stopped - Ready to start again');
      showToast('Auto Clicker stopped successfully', 'success', 3000);
    }
  } catch (error) {
    console.error('Error stopping clicker:', error);
    showStatusMessage('Failed to stop clicker', true);
    showToast('Failed to stop clicker', 'error');
  }
}

function updateStatus(running: boolean): void {
  // Update UI based on running state

  if (running) {
    statusBar.classList.add('active');
    startBtn.disabled = true;
    stopBtn.disabled = false;
    startBtn.setAttribute('aria-disabled', 'true');
    stopBtn.setAttribute('aria-disabled', 'false');

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
    startBtn.setAttribute('aria-disabled', 'false');
    stopBtn.setAttribute('aria-disabled', 'true');

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
