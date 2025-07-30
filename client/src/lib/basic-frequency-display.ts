export interface FrequencyMapping {
  glyph: string;
  frequency: number;
  phase: number;
  amplitude: number;
}

export class BasicFrequencyDisplay {
  private isPlaying: boolean = false;

  async displaySequence(mappings: FrequencyMapping[]): Promise<void> {
    if (!mappings.length) return;

    this.isPlaying = true;
    
    try {
      // Most basic approach possible - just console log
      console.log('Glyph to Frequency Conversion:');
      mappings.slice(0, 10).forEach((mapping, index) => {
        console.log(`${index + 1}. "${mapping.glyph}" → ${Math.round(mapping.frequency)}Hz (Amplitude: ${Math.round(mapping.amplitude * 100)}%)`);
      });
      
    } catch (error) {
      console.error('Display failed:', error);
    }
    
    this.isPlaying = false;
  }

  stop(): void {
    this.isPlaying = false;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const basicFrequencyDisplay = new BasicFrequencyDisplay();