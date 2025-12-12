export type ClickMode = 'toggle' | 'hold' | 'double' | 'random' | 'burst' | 'rs3-action';

export interface RS3ActionBarConfig {
  abilityKeys: string[];
  minAbilityDelay: number;
  maxAbilityDelay: number;
  shuffleRotation: boolean;
  pauseChance: number;
  pauseMin: number;
  pauseMax: number;
}

export interface ClickerSettings {
  mode?: ClickMode;
  minDelay: number;
  maxDelay: number;
  burstCount: number;
  clickKey: string;
  stopKey: string;
  button: 'left' | 'right' | 'middle';
  rs3Config?: RS3ActionBarConfig;
}

export interface ClickerStatus {
  running: boolean;
  mode: ClickMode;
  settings: ClickerSettings;
}

export interface RecordedAction {
  type: 'click' | 'move';
  x: number;
  y: number;
  button?: string;
  timestamp: number;
  delay?: number;
}

export interface RecordedSequence {
  name: string;
  actions: RecordedAction[];
  created: number;
}

export interface ScreenRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ColorMatch {
  r: number;
  g: number;
  b: number;
  tolerance: number;
}
