import { globalShortcut } from 'electron';
import { mouse, Button } from '@nut-tree-fork/nut-js';
import { smoothMoveMouse } from './mouseMovement';
import { SequenceStore } from './sequenceStore';
import { RecordedAction, RecordedSequence } from './types';

export class RecordingController {
  private isRecording = false;
  private recordedActions: RecordedAction[] = [];
  private recordingStartTime = 0;
  private isPlayingSequence = false;

  constructor(
    private readonly sequenceStore: SequenceStore,
    private readonly notifyRecordingStatus?: (recording: boolean) => void
  ) {}

  async startRecording(): Promise<void> {
    if (this.isRecording) {
      return;
    }

    this.isRecording = true;
    this.recordedActions = [];
    this.recordingStartTime = Date.now();

    const hotkey = 'CommandOrControl+Shift+R';
    globalShortcut.register(hotkey, async () => {
      if (!this.isRecording) {
        return;
      }

      try {
        const position = await mouse.getPosition();
        const now = Date.now();
        const delay =
          this.recordedActions.length > 0
            ? now - this.recordedActions[this.recordedActions.length - 1].timestamp
            : 0;

        this.recordedActions.push({
          type: 'click',
          x: position.x,
          y: position.y,
          button: 'left',
          timestamp: now,
          delay,
        });
      } catch (error) {
        console.error('Error recording click position:', error);
      }
    });

    this.notifyRecordingStatus?.(true);
    console.log('Recording started - Press Ctrl+Shift+R to record click positions');
  }

  stopRecording(): RecordedSequence {
    this.isRecording = false;
    globalShortcut.unregister('CommandOrControl+Shift+R');

    const sequence: RecordedSequence = {
      name: `Recording ${new Date().toISOString()}`,
      actions: this.recordedActions,
      created: this.recordingStartTime,
    };

    this.notifyRecordingStatus?.(false);
    console.log(`Recording stopped. Captured ${this.recordedActions.length} actions`);
    return sequence;
  }

  async playSequence(sequence: RecordedSequence): Promise<void> {
    if (this.isPlayingSequence) {
      throw new Error('Already playing a sequence');
    }

    this.isPlayingSequence = true;
    try {
      console.log(`Playing sequence "${sequence.name}" with ${sequence.actions.length} actions`);
      for (const action of sequence.actions) {
        if (!this.isPlayingSequence) {
          break;
        }

        if (action.delay && action.delay > 0) {
          await this.sleep(action.delay);
        }

        if (action.type === 'move') {
          await smoothMoveMouse(action.x, action.y);
        } else {
          await smoothMoveMouse(action.x, action.y);
          await mouse.click(this.getButton(action.button));
        }
      }
    } finally {
      this.isPlayingSequence = false;
    }
  }

  async saveSequence(sequence: RecordedSequence): Promise<void> {
    this.sequenceStore.save(sequence);
  }

  loadSequences(): RecordedSequence[] {
    return this.sequenceStore.load();
  }

  deleteSequence(name: string): void {
    this.sequenceStore.delete(name);
  }

  cancelPlayback(): void {
    this.isPlayingSequence = false;
  }

  private getButton(button?: string): Button {
    const mapping: Record<string, Button> = {
      left: Button.LEFT,
      right: Button.RIGHT,
      middle: Button.MIDDLE,
    };
    return mapping[button || 'left'] || Button.LEFT;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
