// DOM Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusBar = document.getElementById('statusBar');
const statusText = document.getElementById('statusText');
const modeSelect = document.getElementById('mode');
const burstCountGroup = document.getElementById('burstCountGroup');

// Settings inputs
const minDelayInput = document.getElementById('minDelay');
const maxDelayInput = document.getElementById('maxDelay');
const burstCountInput = document.getElementById('burstCount');
const clickKeyInput = document.getElementById('clickKey');
const stopKeyInput = document.getElementById('stopKey');
const buttonSelect = document.getElementById('button');

// State
let isRunning = false;

// Initialize
function init() {
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

function handleModeChange() {
  const mode = modeSelect.value;
  
  // Show/hide burst count based on mode
  if (mode === 'burst') {
    burstCountGroup.classList.remove('hidden');
  } else {
    burstCountGroup.classList.add('hidden');
  }
}

function validateSettings() {
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

function getSettings() {
  return {
    mode: modeSelect.value,
    minDelay: parseInt(minDelayInput.value),
    maxDelay: parseInt(maxDelayInput.value),
    burstCount: parseInt(burstCountInput.value),
    clickKey: clickKeyInput.value.toLowerCase(),
    stopKey: stopKeyInput.value.toLowerCase(),
    button: buttonSelect.value
  };
}

async function handleStart() {
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
      showStatusMessage(result.message, true);
    }
  } catch (error) {
    console.error('Error starting clicker:', error);
    showStatusMessage('Failed to start clicker', true);
  }
}

async function handleStop() {
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

function updateStatus(running) {
  isRunning = running;
  
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

function showStatusMessage(message, isError = false) {
  statusText.textContent = message;
  
  if (isError) {
    statusText.style.color = '#dc3545';
  } else {
    statusText.style.color = '';
  }
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
