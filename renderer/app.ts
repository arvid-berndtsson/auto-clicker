// DOM Elements - will be initialized in init()
let startBtn: HTMLButtonElement;
let stopBtn: HTMLButtonElement;
let statusBar: HTMLElement;
let statusText: HTMLElement;
let modeSelect: HTMLSelectElement;
let modeSelector: HTMLElement;
let burstCountRow: HTMLElement;
let rs3ConfigPanel: HTMLElement;

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
let rs3AbilityKeysInput: HTMLTextAreaElement;
let rs3MinAbilityDelayInput: HTMLInputElement;
let rs3MaxAbilityDelayInput: HTMLInputElement;
let rs3ShuffleInput: HTMLInputElement;
let rs3PauseChanceInput: HTMLInputElement;
let rs3PauseMinInput: HTMLInputElement;
let rs3PauseMaxInput: HTMLInputElement;
let lolTemplatePathInput: HTMLInputElement;
let lolRegionXInput: HTMLInputElement;
let lolRegionYInput: HTMLInputElement;
let lolRegionWidthInput: HTMLInputElement;
let lolRegionHeightInput: HTMLInputElement;
let lolPollIntervalInput: HTMLInputElement;
let lolAutoClickInput: HTMLInputElement;
let lolOffsetXInput: HTMLInputElement;
let lolOffsetYInput: HTMLInputElement;
let lolDiffRatioInput: HTMLInputElement;
let lolPixelThresholdInput: HTMLInputElement;
let lolStartWatcherBtn: HTMLButtonElement;
let lolStopWatcherBtn: HTMLButtonElement;
let lolWatcherStatusText: HTMLElement;

// Recording elements
let startRecordBtn: HTMLButtonElement;
let stopRecordBtn: HTMLButtonElement;
let sequenceList: HTMLElement;
let loadSequencesBtn: HTMLButtonElement;
let noSequencesMsg: HTMLElement;

interface RS3ActionBarConfig {
  abilityKeys: string[];
  minAbilityDelay: number;
  maxAbilityDelay: number;
  shuffleRotation: boolean;
  pauseChance: number;
  pauseMin: number;
  pauseMax: number;
}

interface ScreenRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LolWatcherConfig {
  templatePath: string;
  region: ScreenRegion;
  pollIntervalMs: number;
  autoClick: boolean;
  clickOffset: { x: number; y: number };
  matchOptions?: {
    maxDiffRatio?: number;
    pixelThreshold?: number;
  };
}

interface LolWatcherStatus {
  running: boolean;
  lastCheck?: number;
  lastMatch?: {
    x: number;
    y: number;
    score?: number;
    at: number;
  };
  error?: string;
}

type ClickMode = 'toggle' | 'hold' | 'double' | 'random' | 'burst' | 'rs3-action';

type ClickButton = 'left' | 'right' | 'middle';

interface ClickerSettings {
  mode: ClickMode;
  minDelay: number;
  maxDelay: number;
  burstCount: number;
  clickKey: string;
  stopKey: string;
  button: ClickButton;
  rs3Config?: RS3ActionBarConfig;
}

const DEFAULT_RS3_CONFIG: RS3ActionBarConfig = {
  abilityKeys: ['1', '2', '3', '4', '5', '6'],
  minAbilityDelay: 800,
  maxAbilityDelay: 1400,
  shuffleRotation: true,
  pauseChance: 15,
  pauseMin: 1500,
  pauseMax: 3200,
};

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parseAbilityKeys(value: string): string[] {
  return value
    .split(/[\s,]+/)
    .map((key) => key.trim())
    .filter(Boolean);
}

function getRs3ConfigFromInputs(): RS3ActionBarConfig {
  if (
    !rs3AbilityKeysInput ||
    !rs3MinAbilityDelayInput ||
    !rs3MaxAbilityDelayInput ||
    !rs3ShuffleInput ||
    !rs3PauseChanceInput ||
    !rs3PauseMinInput ||
    !rs3PauseMaxInput
  ) {
    return DEFAULT_RS3_CONFIG;
  }

  const parsedAbilityKeys = parseAbilityKeys(rs3AbilityKeysInput.value);
  const minDelay = parseInt(rs3MinAbilityDelayInput.value);
  const maxDelay = parseInt(rs3MaxAbilityDelayInput.value);
  const pauseChance = clampNumber(parseInt(rs3PauseChanceInput.value) || DEFAULT_RS3_CONFIG.pauseChance, 0, 100);

  return {
    abilityKeys: parsedAbilityKeys.length ? parsedAbilityKeys : DEFAULT_RS3_CONFIG.abilityKeys,
    minAbilityDelay: isNaN(minDelay) ? DEFAULT_RS3_CONFIG.minAbilityDelay : minDelay,
    maxAbilityDelay: isNaN(maxDelay) ? DEFAULT_RS3_CONFIG.maxAbilityDelay : maxDelay,
    shuffleRotation: rs3ShuffleInput.checked,
    pauseChance,
    pauseMin: parseInt(rs3PauseMinInput.value) || DEFAULT_RS3_CONFIG.pauseMin,
    pauseMax: parseInt(rs3PauseMaxInput.value) || DEFAULT_RS3_CONFIG.pauseMax,
  };
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
let lolWatcherRunning = false;

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
  rs3ConfigPanel = document.getElementById('rs3ConfigPanel') as HTMLElement;
  rs3AbilityKeysInput = document.getElementById('rs3AbilityKeys') as HTMLTextAreaElement;
  rs3MinAbilityDelayInput = document.getElementById('rs3MinAbilityDelay') as HTMLInputElement;
  rs3MaxAbilityDelayInput = document.getElementById('rs3MaxAbilityDelay') as HTMLInputElement;
  rs3ShuffleInput = document.getElementById('rs3ShuffleRotation') as HTMLInputElement;
  rs3PauseChanceInput = document.getElementById('rs3PauseChance') as HTMLInputElement;
  rs3PauseMinInput = document.getElementById('rs3PauseMin') as HTMLInputElement;
  rs3PauseMaxInput = document.getElementById('rs3PauseMax') as HTMLInputElement;
  lolTemplatePathInput = document.getElementById('lolTemplatePath') as HTMLInputElement;
  lolRegionXInput = document.getElementById('lolRegionX') as HTMLInputElement;
  lolRegionYInput = document.getElementById('lolRegionY') as HTMLInputElement;
  lolRegionWidthInput = document.getElementById('lolRegionWidth') as HTMLInputElement;
  lolRegionHeightInput = document.getElementById('lolRegionHeight') as HTMLInputElement;
  lolPollIntervalInput = document.getElementById('lolPollInterval') as HTMLInputElement;
  lolAutoClickInput = document.getElementById('lolAutoClick') as HTMLInputElement;
  lolOffsetXInput = document.getElementById('lolClickOffsetX') as HTMLInputElement;
  lolOffsetYInput = document.getElementById('lolClickOffsetY') as HTMLInputElement;
  lolDiffRatioInput = document.getElementById('lolDiffRatio') as HTMLInputElement;
  lolPixelThresholdInput = document.getElementById('lolPixelThreshold') as HTMLInputElement;
  lolStartWatcherBtn = document.getElementById('lolStartWatcherBtn') as HTMLButtonElement;
  lolStopWatcherBtn = document.getElementById('lolStopWatcherBtn') as HTMLButtonElement;
  lolWatcherStatusText = document.getElementById('lolWatcherStatus') as HTMLElement;
  
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

  if (
    !rs3ConfigPanel ||
    !rs3AbilityKeysInput ||
    !rs3MinAbilityDelayInput ||
    !rs3MaxAbilityDelayInput ||
    !rs3ShuffleInput ||
    !rs3PauseChanceInput ||
    !rs3PauseMinInput ||
    !rs3PauseMaxInput ||
    !lolTemplatePathInput ||
    !lolRegionXInput ||
    !lolRegionYInput ||
    !lolRegionWidthInput ||
    !lolRegionHeightInput ||
    !lolPollIntervalInput ||
    !lolAutoClickInput ||
    !lolOffsetXInput ||
    !lolOffsetYInput ||
    !lolDiffRatioInput ||
    !lolPixelThresholdInput ||
    !lolStartWatcherBtn ||
    !lolStopWatcherBtn ||
    !lolWatcherStatusText
  ) {
    console.error('Required configuration elements not found');
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
  lolStartWatcherBtn.addEventListener('click', handleStartLolWatcher);
  lolStopWatcherBtn.addEventListener('click', handleStopLolWatcher);

  setupProfileCardListeners();

  // Listen for status updates from main process
  window.electronAPI.onClickerStatus((data) => {
    updateStatus(data.running);
  });

  // Listen for recording status updates
  window.electronAPI.onRecordingStatus((data) => {
    updateRecordingStatus(data.recording);
  });

  window.electronAPI.onLolWatcherStatus((status) => {
    updateLolWatcherStatus(status);
  });

  // Initialize UI based on mode
  handleModeChange();
  updateQuickStats();
  loadSequencesFromStorage();
  initializeLolWatcherStatus();
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
  if (modeSelect.value === 'rs3-action') {
    const rs3Config = getRs3ConfigFromInputs();
    currentDelayText.textContent = `${rs3Config.minAbilityDelay}-${rs3Config.maxAbilityDelay}ms`;
  } else {
    const min = minDelayInput.value;
    const max = maxDelayInput.value;
    currentDelayText.textContent = `${min}-${max}ms`;
  }
}

function handleModeChange(): void {
  const mode = modeSelect.value;

  // Show/hide burst count based on mode
  if (mode === 'burst') {
    burstCountRow.classList.remove('hidden');
  } else {
    burstCountRow.classList.add('hidden');
  }

  if (rs3ConfigPanel) {
    if (mode === 'rs3-action') {
      rs3ConfigPanel.classList.remove('hidden');
      rs3ConfigPanel.setAttribute('aria-hidden', 'false');
    } else {
      rs3ConfigPanel.classList.add('hidden');
      rs3ConfigPanel.setAttribute('aria-hidden', 'true');
    }
  }
}

function setupProfileCardListeners(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.profile-apply-btn');
  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const card = button.closest<HTMLElement>('[data-profile]');
      if (!card) {
        return;
      }
      applyProfileCard(card);
    });
  });
}

function applyProfileCard(card: HTMLElement): void {
  const profileName = card.getAttribute('data-profile') || 'Profile';
  const mode = card.getAttribute('data-mode');
  const minDelay = card.getAttribute('data-min-delay');
  const maxDelay = card.getAttribute('data-max-delay');
  const button = card.getAttribute('data-button');
  const clickKey = card.getAttribute('data-click-key');
  const stopKey = card.getAttribute('data-stop-key');
  const rs3AbilityKeys = card.getAttribute('data-rs3-ability-keys');
  const rs3MinAbilityDelay = card.getAttribute('data-rs3-min-ability-delay');
  const rs3MaxAbilityDelay = card.getAttribute('data-rs3-max-ability-delay');
  const rs3Shuffle = card.getAttribute('data-rs3-shuffle');
  const rs3PauseChance = card.getAttribute('data-rs3-pause-chance');
  const rs3PauseMin = card.getAttribute('data-rs3-pause-min');
  const rs3PauseMax = card.getAttribute('data-rs3-pause-max');

  if (mode) {
    selectMode(mode);
  }

  if (minDelay) {
    minDelayInput.value = minDelay;
  }

  if (maxDelay) {
    maxDelayInput.value = maxDelay;
  }

  if (button) {
    buttonSelect.value = button;
  }

  if (clickKey) {
    clickKeyInput.value = clickKey.toUpperCase();
  }

  if (stopKey) {
    stopKeyInput.value = stopKey.toUpperCase();
  }

  if (rs3AbilityKeys && rs3AbilityKeysInput) {
    rs3AbilityKeysInput.value = rs3AbilityKeys;
  }

  if (rs3MinAbilityDelay && rs3MinAbilityDelayInput) {
    rs3MinAbilityDelayInput.value = rs3MinAbilityDelay;
  }

  if (rs3MaxAbilityDelay && rs3MaxAbilityDelayInput) {
    rs3MaxAbilityDelayInput.value = rs3MaxAbilityDelay;
  }

  if (rs3Shuffle && rs3ShuffleInput) {
    rs3ShuffleInput.checked = rs3Shuffle === 'true';
  }

  if (rs3PauseChance && rs3PauseChanceInput) {
    rs3PauseChanceInput.value = rs3PauseChance;
  }

  if (rs3PauseMin && rs3PauseMinInput) {
    rs3PauseMinInput.value = rs3PauseMin;
  }

  if (rs3PauseMax && rs3PauseMaxInput) {
    rs3PauseMaxInput.value = rs3PauseMax;
  }

  validateDelayInputs();
  updateQuickStats();
  showStatusMessage(`${profileName} preset applied`, false);
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

  if (modeSelect.value === 'rs3-action') {
    const rs3Config = getRs3ConfigFromInputs();
    if (!rs3Config.abilityKeys.length) {
      showStatusMessage('Error: Ability rotation cannot be empty', true);
      return false;
    }

    if (
      isNaN(rs3Config.minAbilityDelay) ||
      isNaN(rs3Config.maxAbilityDelay) ||
      rs3Config.minAbilityDelay <= 0 ||
      rs3Config.maxAbilityDelay <= 0
    ) {
      showStatusMessage('Error: Ability delays must be positive numbers', true);
      return false;
    }

    if (rs3Config.minAbilityDelay > rs3Config.maxAbilityDelay) {
      showStatusMessage('Error: Ability min delay cannot exceed max delay', true);
      return false;
    }

    if (rs3Config.pauseMin > rs3Config.pauseMax) {
      showStatusMessage('Error: Pause min cannot exceed max', true);
      return false;
    }
  }

  return true;
}

function getSettings(): ClickerSettings {
  const selectedMode = modeSelect.value as ClickMode;
  const selectedButton = (buttonSelect.value as ClickButton) || 'left';

  const baseSettings: ClickerSettings = {
    mode: selectedMode,
    minDelay: parseInt(minDelayInput.value),
    maxDelay: parseInt(maxDelayInput.value),
    burstCount: parseInt(burstCountInput.value),
    clickKey: clickKeyInput.value.toLowerCase(),
    stopKey: stopKeyInput.value.toLowerCase(),
    button: selectedButton,
  };

  if (modeSelect.value === 'rs3-action') {
    baseSettings.rs3Config = getRs3ConfigFromInputs();
  }

  return baseSettings;
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

async function initializeLolWatcherStatus(): Promise<void> {
  try {
    const status = await window.electronAPI.lolGetWatcherStatus();
    updateLolWatcherStatus(status);
  } catch (error) {
    console.error('Failed to fetch League watcher status:', error);
    setLolWatcherStatusMessage('Unable to fetch watcher status', true);
  }
}

function getLolWatcherConfigFromInputs(): LolWatcherConfig | null {
  const templatePath = lolTemplatePathInput.value.trim();
  if (!templatePath) {
    setLolWatcherStatusMessage('Template path is required', true);
    return null;
  }

  const region: ScreenRegion = {
    x: parseInt(lolRegionXInput.value, 10),
    y: parseInt(lolRegionYInput.value, 10),
    width: parseInt(lolRegionWidthInput.value, 10),
    height: parseInt(lolRegionHeightInput.value, 10),
  };

  if (Object.values(region).some((value) => Number.isNaN(value))) {
    setLolWatcherStatusMessage('Region values must be numbers', true);
    return null;
  }

  if (region.width <= 0 || region.height <= 0) {
    setLolWatcherStatusMessage('Region width/height must be positive', true);
    return null;
  }

  const pollInterval = Math.max(250, parseInt(lolPollIntervalInput.value, 10) || 1000);
  const autoClick = lolAutoClickInput.checked;
  const clickOffset = {
    x: parseInt(lolOffsetXInput.value, 10) || 0,
    y: parseInt(lolOffsetYInput.value, 10) || 0,
  };

  const maxDiffRatio = clampNumber(parseFloat(lolDiffRatioInput.value) || 0.1, 0.01, 0.5);
  const pixelThreshold = clampNumber(
    parseFloat(lolPixelThresholdInput.value) || 0.1,
    0.01,
    1
  );

  return {
    templatePath,
    region,
    pollIntervalMs: pollInterval,
    autoClick,
    clickOffset,
    matchOptions: {
      maxDiffRatio,
      pixelThreshold,
    },
  };
}

async function handleStartLolWatcher(): Promise<void> {
  const config = getLolWatcherConfigFromInputs();
  if (!config) {
    return;
  }

  try {
    const result = await window.electronAPI.lolStartWatcher(config);
    if (!result.success) {
      setLolWatcherStatusMessage(result.message || 'Failed to start watcher', true);
      return;
    }
    setLolWatcherStatusMessage('Watcher running...');
    updateLolWatcherControls(true);
  } catch (error) {
    console.error('Error starting League watcher:', error);
    setLolWatcherStatusMessage('Failed to start watcher', true);
  }
}

async function handleStopLolWatcher(): Promise<void> {
  try {
    const result = await window.electronAPI.lolStopWatcher();
    if (!result.success) {
      setLolWatcherStatusMessage(result.message || 'Failed to stop watcher', true);
      return;
    }
    setLolWatcherStatusMessage('Watcher stopped');
    updateLolWatcherControls(false);
  } catch (error) {
    console.error('Error stopping League watcher:', error);
    setLolWatcherStatusMessage('Failed to stop watcher', true);
  }
}

function updateLolWatcherStatus(status: LolWatcherStatus): void {
  lolWatcherRunning = status.running;
  updateLolWatcherControls(status.running);

  const parts: string[] = [];
  if (status.running) {
    parts.push('Watching for template...');
  } else {
    parts.push('Watcher idle');
  }

  if (status.lastMatch) {
    const date = new Date(status.lastMatch.at);
    parts.push(
      `Last match at (${status.lastMatch.x}, ${status.lastMatch.y}) • ${date.toLocaleTimeString()}`
    );
  }

  if (status.error) {
    parts.push(`Error: ${status.error}`);
  }

  setLolWatcherStatusMessage(parts.join(' • '), Boolean(status.error));
}

function updateLolWatcherControls(running: boolean): void {
  lolStartWatcherBtn.disabled = running;
  lolStopWatcherBtn.disabled = !running;
  lolStartWatcherBtn.style.opacity = running ? '0.5' : '1';
  lolStopWatcherBtn.style.opacity = running ? '1' : '0.5';
}

function setLolWatcherStatusMessage(message: string, isError = false): void {
  lolWatcherStatusText.textContent = message;
  lolWatcherStatusText.style.color = isError ? '#f87171' : '#64748b';
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
