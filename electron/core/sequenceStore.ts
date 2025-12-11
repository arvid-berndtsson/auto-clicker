import * as fs from 'fs';
import * as path from 'path';
import { RecordedSequence } from './types';

export class SequenceStore {
  private readonly sequencesFile: string;

  constructor(userDataPath: string) {
    this.sequencesFile = path.join(userDataPath, 'sequences.json');
  }

  load(): RecordedSequence[] {
    if (!fs.existsSync(this.sequencesFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(this.sequencesFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Error loading sequences:', error);
      return [];
    }
  }

  save(sequence: RecordedSequence): void {
    const sequences = this.load();
    const existingIndex = sequences.findIndex((item) => item.name === sequence.name);

    if (existingIndex >= 0) {
      sequences[existingIndex] = sequence;
    } else {
      sequences.push(sequence);
    }

    this.persist(sequences);
  }

  delete(name: string): void {
    const sequences = this.load().filter((sequence) => sequence.name !== name);
    this.persist(sequences);
  }

  private persist(sequences: RecordedSequence[]): void {
    try {
      fs.writeFileSync(this.sequencesFile, JSON.stringify(sequences, null, 2));
    } catch (error) {
      console.error('Error saving sequences:', error);
      throw error;
    }
  }
}
