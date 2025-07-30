export type WaveformType = 'sine' | 'sawtooth' | 'square' | 'triangle';

export interface AudioConfig {
  frequency: number;
  waveformType: WaveformType;
  volume: number;
  duration?: number;
  phase?: number;
}

export interface FrequencyMapping {
  glyph: string;
  frequency: number;
  phase: number;
  amplitude: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private activeOscillators: OscillatorNode[] = [];
  private analyserNode: AnalyserNode | null = null;
  private frequencyData: Uint8Array | null = null;

  async initialize(): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.analyserNode = this.audioContext.createAnalyser();
      
      // Configure analyser
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;
      this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
      
      // Connect nodes
      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(this.audioContext.destination);
      
      this.masterGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    } catch (error) {
      throw new Error(`Failed to initialize audio context: ${error}`);
    }
  }

  async ensureInitialized(): Promise<void> {
    if (!this.audioContext) {
      await this.initialize();
    }
    
    if (this.audioContext?.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  async playTone(config: AudioConfig): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.audioContext || !this.masterGain) {
      throw new Error('Audio context not initialized');
    }

    this.stopAllOscillators();

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = config.waveformType;
    oscillator.frequency.setValueAtTime(config.frequency, this.audioContext.currentTime);
    
    if (config.phase) {
      // Phase is handled by timing offset for simplicity
      const delay = config.phase / (2 * Math.PI * config.frequency);
      oscillator.start(this.audioContext.currentTime + delay);
    } else {
      oscillator.start();
    }

    gainNode.gain.setValueAtTime(config.volume * 0.7, this.audioContext.currentTime);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    this.activeOscillators.push(oscillator);
    this.isPlaying = true;

    if (config.duration) {
      setTimeout(() => {
        this.stop();
      }, config.duration * 1000);
    }
  }

  async playSequence(mappings: FrequencyMapping[], waveformType: WaveformType, duration: number = 0.5): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.audioContext || !this.masterGain) {
      throw new Error('Audio context not initialized');
    }

    this.stopAllOscillators();

    // Performance safeguard - limit sequence length to prevent browser hangs
    const maxSequenceLength = 50; // Reasonable limit for audio performance
    const limitedMappings = mappings.slice(0, maxSequenceLength);
    
    // Limit duration for very long sequences
    const adjustedDuration = limitedMappings.length > 20 ? 0.2 : duration;

    let currentTime = this.audioContext.currentTime;
    
    try {
      for (let i = 0; i < limitedMappings.length; i++) {
        const mapping = limitedMappings[i];
        
        // Skip if frequency is invalid
        if (!mapping.frequency || mapping.frequency < 20 || mapping.frequency > 20000) {
          currentTime += adjustedDuration;
          continue;
        }
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = waveformType;
        oscillator.frequency.setValueAtTime(mapping.frequency, currentTime);
        
        // Envelope for smooth transitions with shorter ramps for performance
        const rampTime = Math.min(0.02, adjustedDuration * 0.1);
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(mapping.amplitude * 0.5, currentTime + rampTime);
        gainNode.gain.setValueAtTime(mapping.amplitude * 0.5, currentTime + adjustedDuration - rampTime);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + adjustedDuration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(currentTime);
        oscillator.stop(currentTime + adjustedDuration);

        this.activeOscillators.push(oscillator);
        
        // Clean up oscillator after it finishes to prevent memory leaks
        oscillator.onended = () => {
          const index = this.activeOscillators.indexOf(oscillator);
          if (index > -1) {
            this.activeOscillators.splice(index, 1);
          }
        };

        currentTime += adjustedDuration;
        
        // Add small gap between tones for clarity
        currentTime += 0.02;
      }
    } catch (error) {
      console.error('Error in playSequence:', error);
      this.stopAllOscillators();
      throw error;
    }

    this.isPlaying = true;
    
    // Auto-stop after sequence completes
    const totalDuration = (limitedMappings.length * (adjustedDuration + 0.02)) * 1000;
    setTimeout(() => {
      this.isPlaying = false;
    }, totalDuration + 500);
  }

  async playChord(frequencies: number[], waveformType: WaveformType, volume: number = 0.5): Promise<void> {
    await this.ensureInitialized();
    
    if (!this.audioContext || !this.masterGain) {
      throw new Error('Audio context not initialized');
    }

    this.stopAllOscillators();

    const gainPerOscillator = (volume * 0.7) / frequencies.length;

    for (const frequency of frequencies) {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = waveformType;
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
      
      gainNode.gain.setValueAtTime(gainPerOscillator, this.audioContext.currentTime);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      oscillator.start();
      this.activeOscillators.push(oscillator);
    }

    this.isPlaying = true;
  }

  stop(): void {
    this.stopAllOscillators();
    this.isPlaying = false;
  }

  private stopAllOscillators(): void {
    for (const oscillator of this.activeOscillators) {
      try {
        oscillator.stop();
        oscillator.disconnect();
      } catch (error) {
        // Oscillator might already be stopped
      }
    }
    this.activeOscillators = [];
  }

  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(volume, this.audioContext?.currentTime || 0);
    }
  }

  getFrequencyData(): Uint8Array | null {
    if (this.analyserNode && this.frequencyData) {
      this.analyserNode.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    return null;
  }

  getFrequencyBinCount(): number {
    return this.analyserNode?.frequencyBinCount || 0;
  }

  getSampleRate(): number {
    return this.audioContext?.sampleRate || 44100;
  }

  isAudioPlaying(): boolean {
    return this.isPlaying;
  }

  async generateWAV(
    mappings: FrequencyMapping[],
    waveformType: WaveformType,
    duration: number,
    sampleRate: number = 44100
  ): Promise<Blob> {
    const length = sampleRate * duration;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    const samples = new Int16Array(length);

    // Generate audio samples
    for (let i = 0; i < length; i++) {
      let sample = 0;
      const time = i / sampleRate;
      
      for (const mapping of mappings) {
        const phase = 2 * Math.PI * mapping.frequency * time + mapping.phase;
        
        switch (waveformType) {
          case 'sine':
            sample += Math.sin(phase) * mapping.amplitude;
            break;
          case 'sawtooth':
            sample += (2 * (phase % (2 * Math.PI)) / (2 * Math.PI) - 1) * mapping.amplitude;
            break;
          case 'square':
            sample += (Math.sin(phase) >= 0 ? 1 : -1) * mapping.amplitude;
            break;
          case 'triangle':
            sample += (2 * Math.abs(2 * (phase % (2 * Math.PI)) / (2 * Math.PI) - 1) - 1) * mapping.amplitude;
            break;
        }
      }
      
      // Normalize and apply envelope
      sample = sample / mappings.length;
      const envelope = Math.sin(Math.PI * time / duration); // Simple sine envelope
      sample *= envelope;
      
      samples[i] = Math.max(-32767, Math.min(32767, sample * 32767));
    }

    // WAV header
    let pos = 0;
    const setUint32 = (data: number) => (view.setUint32(pos, data, true), pos += 4);
    const setUint16 = (data: number) => (view.setUint16(pos, data, true), pos += 2);
    const setString = (s: string) => {
      for (let i = 0; i < s.length; i++) {
        view.setUint8(pos++, s.charCodeAt(i));
      }
    };

    setString('RIFF');
    setUint32(36 + samples.length * 2);
    setString('WAVE');
    setString('fmt ');
    setUint32(16);
    setUint16(1);
    setUint16(1);
    setUint32(sampleRate);
    setUint32(sampleRate * 2);
    setUint16(2);
    setUint16(16);
    setString('data');
    setUint32(samples.length * 2);

    // Copy sample data
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(pos, samples[i], true);
      pos += 2;
    }

    return new Blob([buffer], { type: 'audio/wav' });
  }

  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
    this.analyserNode = null;
    this.frequencyData = null;
  }
}

export const audioEngine = new AudioEngine();
