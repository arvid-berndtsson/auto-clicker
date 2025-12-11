import { Button, mouse, Point } from '@nut-tree-fork/nut-js';
import { findImageInRegion, ImageMatchOptions } from './vision';
import { ScreenRegion } from './types';

export interface LolWatcherConfig {
  templatePath: string;
  region: ScreenRegion;
  pollIntervalMs: number;
  autoClick?: boolean;
  clickOffset?: { x: number; y: number };
  matchOptions?: ImageMatchOptions;
}

export interface LolWatcherStatus {
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

type StatusListener = (status: LolWatcherStatus) => void;

export class LeagueHelper {
  private watcher: NodeJS.Timeout | null = null;
  private config: LolWatcherConfig | null = null;
  private status: LolWatcherStatus = { running: false };
  constructor(private readonly notifyStatus?: StatusListener) {}

  start(config: LolWatcherConfig): void {
    if (this.watcher) {
      throw new Error('League watcher already running');
    }

    this.config = config;
    this.status = { running: true };
    this.tick();
    this.watcher = setInterval(() => this.tick(), Math.max(config.pollIntervalMs, 250));
    this.emitStatus();
  }

  stop(): void {
    if (this.watcher) {
      clearInterval(this.watcher);
      this.watcher = null;
    }
    this.config = null;
    this.status = { running: false };
    this.emitStatus();
  }

  getStatus(): LolWatcherStatus {
    return this.status;
  }

  private async tick(): Promise<void> {
    if (!this.config) {
      return;
    }

    const now = Date.now();
    try {
      const result = await findImageInRegion(
        this.config.region,
        this.config.templatePath,
        this.config.matchOptions
      );

      this.status.lastCheck = now;
      if (result.found && typeof result.x === 'number' && typeof result.y === 'number') {
        this.status.lastMatch = { x: result.x, y: result.y, score: result.score, at: now };
        if (this.config.autoClick) {
          await this.clickAt(result.x, result.y);
        }
      }
      this.status.error = undefined;
    } catch (error) {
      const err = error as Error;
      this.status.error = err.message;
    } finally {
      this.emitStatus();
    }
  }

  private async clickAt(x: number, y: number): Promise<void> {
    const offsetX = this.config?.clickOffset?.x ?? 0;
    const offsetY = this.config?.clickOffset?.y ?? 0;
    const targetX = Math.round(x + offsetX);
    const targetY = Math.round(y + offsetY);

    await mouse.setPosition(new Point(targetX, targetY));
    await mouse.click(Button.LEFT);
  }

  private emitStatus(): void {
    this.notifyStatus?.(this.status);
  }
}
