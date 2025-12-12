import { globalShortcut } from 'electron';
import { mouse, Button, keyboard } from '@nut-tree-fork/nut-js';
import { ClickerSettings, ClickMode, ClickerStatus, RS3ActionBarConfig } from './types';

const DOUBLE_CLICK_DELAY_MS = 10;
const RANDOM_MODE_DELAY_MULTIPLIER = 2;

const DEFAULT_SETTINGS: ClickerSettings = {
  mode: 'hold',
  minDelay: 1,
  maxDelay: 5,
  burstCount: 10,
  clickKey: 'h',
  stopKey: 'esc',
  button: 'left',
};

const DEFAULT_RS3_CONFIG: RS3ActionBarConfig = {
  abilityKeys: ['1', '2', '3', '4', '5', '6'],
  minAbilityDelay: 800,
  maxAbilityDelay: 1400,
  shuffleRotation: true,
  pauseChance: 15,
  pauseMin: 1500,
  pauseMax: 3200,
};

type StatusListener = (status: ClickerStatus) => void;

export class ClickerController {
  private clickerInterval: NodeJS.Timeout | null = null;
  private clickingActive = false;
  private mode: ClickMode = 'hold';
  private settings: ClickerSettings = DEFAULT_SETTINGS;
  private rs3LoopController: { cancelled: boolean } | null = null;
  private statusListener?: StatusListener;

  constructor(statusListener?: StatusListener) {
    this.statusListener = statusListener;
  }

  setStatusListener(listener: StatusListener): void {
    this.statusListener = listener;
  }

  async start(newSettings: ClickerSettings): Promise<void> {
    if (this.clickingActive) {
      throw new Error('Clicker is already running');
    }

    this.settings = { ...DEFAULT_SETTINGS, ...newSettings };
    this.mode = (newSettings.mode || 'hold') as ClickMode;
    this.clickingActive = true;

    globalShortcut.unregisterAll();
    globalShortcut.register(this.settings.stopKey, () => this.stop());

    switch (this.mode) {
      case 'toggle':
        this.runToggleMode();
        break;
      case 'hold':
        this.runHoldMode();
        break;
      case 'double':
        this.runDoubleMode();
        break;
      case 'random':
        this.runRandomMode();
        break;
      case 'burst':
        this.runBurstMode();
        break;
      case 'rs3-action':
        this.runRs3ActionMode();
        break;
      default:
        this.runHoldMode();
    }

    this.notifyStatus();
  }

  stop(): void {
    if (this.clickerInterval) {
      clearTimeout(this.clickerInterval);
      this.clickerInterval = null;
    }
    this.cancelRs3Loop();
    this.clickingActive = false;
    globalShortcut.unregisterAll();
    this.notifyStatus();
  }

  getStatus(): ClickerStatus {
    return {
      running: this.clickingActive,
      mode: this.mode,
      settings: this.settings,
    };
  }

  private runToggleMode(): void {
    let clicking = false;
    globalShortcut.register(this.settings.clickKey, () => {
      clicking = !clicking;
      console.log('Toggle mode:', clicking ? 'ON' : 'OFF');
    });

    const clickLoop = (): void => {
      if (!this.clickingActive) {
        return;
      }

      if (clicking) {
        void this.performClick();
      }

      this.clickerInterval = setTimeout(clickLoop, this.getRandomDelay());
    };

    clickLoop();
  }

  private runHoldMode(): void {
    let isHolding = false;
    globalShortcut.register(this.settings.clickKey, () => {
      isHolding = !isHolding;
      console.log('Hold mode:', isHolding ? 'ON' : 'OFF');
    });

    const clickLoop = (): void => {
      if (!this.clickingActive) {
        return;
      }

      if (isHolding) {
        void this.performClick();
      }

      this.clickerInterval = setTimeout(clickLoop, this.getRandomDelay());
    };

    clickLoop();
  }

  private runDoubleMode(): void {
    let isDoubleClicking = false;
    globalShortcut.register(this.settings.clickKey, () => {
      isDoubleClicking = !isDoubleClicking;
      console.log('Double mode:', isDoubleClicking ? 'ON' : 'OFF');
    });

    const clickLoop = (): void => {
      if (!this.clickingActive) {
        return;
      }

      if (isDoubleClicking) {
        void this.performDoubleClick();
      }

      this.clickerInterval = setTimeout(clickLoop, this.getRandomDelay());
    };

    clickLoop();
  }

  private runRandomMode(): void {
    let isRandomClicking = false;
    globalShortcut.register(this.settings.clickKey, () => {
      isRandomClicking = !isRandomClicking;
      console.log('Random mode:', isRandomClicking ? 'ON' : 'OFF');
    });

    const clickLoop = (): void => {
      if (!this.clickingActive) {
        return;
      }

      if (isRandomClicking) {
        void this.performClick();
      }

      this.clickerInterval = setTimeout(
        clickLoop,
        this.getRandomDelay() * RANDOM_MODE_DELAY_MULTIPLIER
      );
    };

    clickLoop();
  }

  private runBurstMode(): void {
    globalShortcut.register(this.settings.clickKey, async () => {
      for (let i = 0; i < this.settings.burstCount; i++) {
        await this.performClick();
        if (i < this.settings.burstCount - 1) {
          await this.sleep(this.getRandomDelay());
        }
      }
    });
  }

  private runRs3ActionMode(): void {
    const rs3Config = this.resolveRs3Config();
    let rotationActive = false;

    this.cancelRs3Loop();
    const controller = { cancelled: false };
    this.rs3LoopController = controller;

    globalShortcut.register(this.settings.clickKey, () => {
      rotationActive = !rotationActive;
      console.log('RS3 action mode:', rotationActive ? 'ON' : 'OFF');
    });

    const abilityLoop = async (): Promise<void> => {
      try {
        while (this.clickingActive && !controller.cancelled) {
          if (!rotationActive) {
            await this.sleep(100);
            continue;
          }

          const latestConfig = this.resolveRs3Config();
          const abilities = latestConfig.shuffleRotation
            ? this.shuffleArray(latestConfig.abilityKeys)
            : latestConfig.abilityKeys;

          for (const ability of abilities) {
            if (!rotationActive || controller.cancelled || !this.clickingActive) {
              break;
            }

            await keyboard.type(ability);
            await this.sleep(this.getRandomInRange(latestConfig.minAbilityDelay, latestConfig.maxAbilityDelay));
          }

          if (
            latestConfig.pauseChance > 0 &&
            Math.random() * 100 < latestConfig.pauseChance &&
            !controller.cancelled
          ) {
            const pauseDuration = this.getRandomInRange(latestConfig.pauseMin, latestConfig.pauseMax);
            console.log(`RS3 micro break for ${pauseDuration.toFixed(0)}ms`);
            await this.sleep(pauseDuration);
          }
        }
      } catch (error) {
        console.error('RS3 action loop error:', error);
      }
    };

    void abilityLoop();
  }

  private resolveRs3Config(): RS3ActionBarConfig {
    const provided = this.settings.rs3Config;
    const abilityKeys =
      provided?.abilityKeys && provided.abilityKeys.length > 0
        ? provided.abilityKeys
        : DEFAULT_RS3_CONFIG.abilityKeys;

    return {
      ...DEFAULT_RS3_CONFIG,
      ...provided,
      abilityKeys,
    };
  }

  private cancelRs3Loop(): void {
    if (this.rs3LoopController) {
      this.rs3LoopController.cancelled = true;
      this.rs3LoopController = null;
    }
  }

  private notifyStatus(): void {
    this.statusListener?.({
      running: this.clickingActive,
      mode: this.mode,
      settings: this.settings,
    });
  }

  private async performClick(): Promise<void> {
    const buttonMap: Record<string, Button> = {
      left: Button.LEFT,
      right: Button.RIGHT,
      middle: Button.MIDDLE,
    };

    try {
      await mouse.click(buttonMap[this.settings.button] || Button.LEFT);
    } catch (error) {
      console.error('Error performing click:', error);
    }
  }

  private async performDoubleClick(): Promise<void> {
    const buttonMap: Record<string, Button> = {
      left: Button.LEFT,
      right: Button.RIGHT,
      middle: Button.MIDDLE,
    };
    const button = buttonMap[this.settings.button] || Button.LEFT;

    try {
      await mouse.click(button);
      await this.sleep(DOUBLE_CLICK_DELAY_MS);
      await mouse.click(button);
    } catch (error) {
      console.error('Error performing double click:', error);
    }
  }

  private getRandomDelay(): number {
    const min = this.settings.minDelay;
    const max = this.settings.maxDelay;
    return Math.random() * (max - min) + min;
  }

  private shuffleArray<T>(items: T[]): T[] {
    const clone = [...items];
    for (let i = clone.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [clone[i], clone[j]] = [clone[j], clone[i]];
    }
    return clone;
  }

  private getRandomInRange(min: number, max: number): number {
    if (max <= min) {
      return min;
    }
    return Math.random() * (max - min) + min;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
