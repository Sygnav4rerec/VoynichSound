export type WaveformType = 'sine' | 'sawtooth' | 'square' | 'triangle';

export interface FrequencyMapping {
  glyph: string;
  frequency: number;
  phase: number;
  amplitude: number;
}

export class SimpleAudioEngine {
  private audioContext: AudioContext | null = null;
  private isPlaying: boolean = false;

  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Audio initialization failed:', error);
    }
  }

  // Creative solution 1: Use CSS/DOM approach for "audio" feedback
  async playVisualSequence(mappings: FrequencyMapping[]): Promise<void> {
    if (!mappings.length) return;

    // Create a visual/haptic feedback system instead of audio
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '50%';
    container.style.left = '50%';
    container.style.transform = 'translate(-50%, -50%)';
    container.style.zIndex = '9999';
    container.style.pointerEvents = 'none';
    container.style.fontSize = '24px';
    container.style.fontWeight = 'bold';
    container.style.color = '#fff';
    container.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    document.body.appendChild(container);

    this.isPlaying = true;

    for (let i = 0; i < Math.min(mappings.length, 10); i++) {
      const mapping = mappings[i];
      
      // Visual frequency representation
      const hue = (mapping.frequency / 2000) * 360;
      container.style.color = `hsl(${hue}, 80%, 60%)`;
      container.textContent = `${mapping.glyph} (${Math.round(mapping.frequency)}Hz)`;
      
      // Brief visual flash
      container.style.opacity = '1';
      await new Promise(resolve => setTimeout(resolve, 200));
      container.style.opacity = '0.3';
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    document.body.removeChild(container);
    this.isPlaying = false;
  }

  // Creative solution 2: Use HTML5 Audio with data URLs for simple tones
  async playDataUrlSequence(mappings: FrequencyMapping[]): Promise<void> {
    if (!mappings.length) return;

    this.isPlaying = true;

    for (let i = 0; i < Math.min(mappings.length, 5); i++) {
      const mapping = mappings[i];
      
      try {
        // Generate a simple tone using data URL (very basic)
        const audio = new Audio();
        const frequency = Math.max(200, Math.min(800, mapping.frequency));
        
        // Create a simple beep sound using data URL
        const dataUrl = this.generateBeepDataUrl(frequency, 0.3);
        audio.src = dataUrl;
        audio.volume = 0.3;
        
        await new Promise((resolve, reject) => {
          audio.onended = resolve;
          audio.onerror = reject;
          audio.play().catch(reject);
        });
        
        // Small gap between tones
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.log('Audio playback skipped for tone:', mapping.frequency);
      }
    }

    this.isPlaying = false;
  }

  // Creative solution 3: Use simple oscillator with minimal complexity
  async playMinimalSequence(mappings: FrequencyMapping[]): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }

    if (!this.audioContext) return;

    this.isPlaying = true;
    const limitedMappings = mappings.slice(0, 5); // Very conservative limit

    for (const mapping of limitedMappings) {
      try {
        // Extremely simple oscillator - no gain nodes, no envelopes
        const oscillator = this.audioContext.createOscillator();
        oscillator.frequency.value = Math.max(200, Math.min(800, mapping.frequency));
        oscillator.type = 'sine'; // Always sine for simplicity
        
        // Connect directly to destination with low volume
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0.1; // Very quiet
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        
        // Stop after short duration
        setTimeout(() => {
          try {
            oscillator.stop();
          } catch (e) {
            // Ignore
          }
        }, 200);
        
        // Wait before next tone
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.log('Skipping tone:', mapping.frequency);
      }
    }

    this.isPlaying = false;
  }

  private generateBeepDataUrl(frequency: number, duration: number): string {
    // Very simple beep generation using data URL
    // This is a fallback - not perfect but should work
    const sampleRate = 8000;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);
    
    // WAV header (simplified)
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);
    
    // Generate simple sine wave
    for (let i = 0; i < samples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3;
      view.setInt16(44 + i * 2, sample * 32767, true);
    }
    
    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  stop(): void {
    this.isPlaying = false;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const simpleAudioEngine = new SimpleAudioEngine();