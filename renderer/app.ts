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

// Recording elements
let startRecordBtn: HTMLButtonElement;
let stopRecordBtn: HTMLButtonElement;
let sequenceList: HTMLElement;
let loadSequencesBtn: HTMLButtonElement;
let noSequencesMsg: HTMLElement;

interface ClickerSettings {
  mode: string;
  minDelay: number;
  maxDelay: number;
  burstCount: number;
  clickKey: string;
  stopKey: string;
  button: string;
}

interface RecordedAction {
  type: 'click' | 'move';
  x: number;
  y: number;
  button?: string;
  timestamp: number;
  delay?: number;
}

interface RecordedSequence {
  name: string;
  actions: RecordedAction[];
  created: number;
}

// Recording state
let currentRecordedSequence: RecordedSequence | null = null;
let loadedSequences: RecordedSequence[] = [];

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
  
  // Recording elements
  startRecordBtn = document.getElementById('startRecordBtn') as HTMLButtonElement;
  stopRecordBtn = document.getElementById('stopRecordBtn') as HTMLButtonElement;
  sequenceList = document.getElementById('sequenceList') as HTMLElement;
  loadSequencesBtn = document.getElementById('loadSequencesBtn') as HTMLButtonElement;
  noSequencesMsg = document.getElementById('noSequencesMsg') as HTMLElement;

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

  // Recording event listeners
  startRecordBtn.addEventListener('click', handleStartRecording);
  stopRecordBtn.addEventListener('click', handleStopRecording);
  loadSequencesBtn.addEventListener('click', handleLoadSequences);

  // Listen for status updates from main process
  window.electronAPI.onClickerStatus((data) => {
    updateStatus(data.running);
  });

  // Listen for recording status updates
  window.electronAPI.onRecordingStatus((data) => {
    updateRecordingStatus(data.recording);
  });

  // Initialize UI based on mode
  handleModeChange();
  updateQuickStats();
  loadSequencesFromStorage();
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

// Recording functions
async function handleStartRecording(): Promise<void> {
  try {
    const result = await window.electronAPI.startRecording();
    if (result.success) {
      showStatusMessage('Recording...', false);
    } else {
      showStatusMessage(result.message || 'Failed to start recording', true);
    }
  } catch (error) {
    console.error('Error starting recording:', error);
    showStatusMessage('ERROR', true);
  }
}

async function handleStopRecording(): Promise<void> {
  try {
    const result = await window.electronAPI.stopRecording();
    if (result.success && result.sequence) {
      currentRecordedSequence = result.sequence;
      
      // Prompt for name
      const name = prompt('Enter a name for this sequence:', currentRecordedSequence.name);
      if (name) {
        currentRecordedSequence.name = name;
        await saveCurrentSequence();
      }
      
      showStatusMessage('Recording saved', false);
    } else {
      showStatusMessage(result.message || 'Failed to stop recording', true);
    }
  } catch (error) {
    console.error('Error stopping recording:', error);
    showStatusMessage('ERROR', true);
  }
}

async function saveCurrentSequence(): Promise<void> {
  if (!currentRecordedSequence) return;
  
  try {
    const result = await window.electronAPI.saveSequence(currentRecordedSequence);
    if (result.success) {
      await loadSequencesFromStorage();
    }
  } catch (error) {
    console.error('Error saving sequence:', error);
  }
}

async function loadSequencesFromStorage(): Promise<void> {
  try {
    const result = await window.electronAPI.loadSequences();
    if (result.success && result.sequences) {
      loadedSequences = result.sequences;
      renderSequenceList();
    }
  } catch (error) {
    console.error('Error loading sequences:', error);
  }
}

async function handleLoadSequences(): Promise<void> {
  await loadSequencesFromStorage();
}

const NO_SEQUENCES_MESSAGE = 'No sequences saved yet';

function renderSequenceList(): void {
  if (loadedSequences.length === 0) {
    noSequencesMsg.style.display = 'block';
    sequenceList.innerHTML = '';
    const messageEl = document.createElement('p');
    messageEl.className = 'info-text';
    messageEl.id = 'noSequencesMsg';
    messageEl.textContent = NO_SEQUENCES_MESSAGE;
    sequenceList.appendChild(messageEl);
    return;
  }
  
  noSequencesMsg.style.display = 'none';
  sequenceList.innerHTML = '';
  
  loadedSequences.forEach((sequence) => {
    const seqDiv = document.createElement('div');
    seqDiv.className = 'sequence-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'sequence-name';
    nameSpan.textContent = sequence.name;
    
    const actionsSpan = document.createElement('span');
    actionsSpan.className = 'sequence-actions';
    actionsSpan.textContent = `${sequence.actions.length} actions`;
    
    const playBtn = document.createElement('button');
    playBtn.className = 'sequence-btn play-btn';
    playBtn.textContent = 'PLAY';
    playBtn.onclick = () => handlePlaySequence(sequence);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'sequence-btn delete-btn';
    deleteBtn.textContent = 'DELETE';
    deleteBtn.onclick = () => handleDeleteSequence(sequence.name);
    
    seqDiv.appendChild(nameSpan);
    seqDiv.appendChild(actionsSpan);
    seqDiv.appendChild(playBtn);
    seqDiv.appendChild(deleteBtn);
    
    sequenceList.appendChild(seqDiv);
  });
}

async function handlePlaySequence(sequence: RecordedSequence): Promise<void> {
  try {
    showStatusMessage('Playing sequence...', false);
    const result = await window.electronAPI.playSequence(sequence);
    if (result.success) {
      showStatusMessage('Sequence completed', false);
    } else {
      showStatusMessage(result.message || 'Failed to play sequence', true);
    }
  } catch (error) {
    console.error('Error playing sequence:', error);
    showStatusMessage('ERROR', true);
  }
}

async function handleDeleteSequence(name: string): Promise<void> {
  if (!confirm(`Delete sequence "${name}"?`)) {
    return;
  }
  
  try {
    const result = await window.electronAPI.deleteSequence(name);
    if (result.success) {
      await loadSequencesFromStorage();
      showStatusMessage('Sequence deleted', false);
    } else {
      showStatusMessage(result.message || 'Failed to delete sequence', true);
    }
  } catch (error) {
    console.error('Error deleting sequence:', error);
    showStatusMessage('ERROR', true);
  }
}

function updateRecordingStatus(recording: boolean): void {
  if (recording) {
    startRecordBtn.disabled = true;
    stopRecordBtn.disabled = false;
    startRecordBtn.style.opacity = '0.5';
    stopRecordBtn.style.opacity = '1';
  } else {
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
    startRecordBtn.style.opacity = '1';
    stopRecordBtn.style.opacity = '0.5';
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
