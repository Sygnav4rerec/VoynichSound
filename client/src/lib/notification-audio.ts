export interface FrequencyMapping {
  glyph: string;
  frequency: number;
  phase: number;
  amplitude: number;
}

export class NotificationAudioEngine {
  private isPlaying: boolean = false;

  async playSequence(mappings: FrequencyMapping[]): Promise<void> {
    if (!mappings.length) return;

    this.isPlaying = true;
    const limitedMappings = mappings.slice(0, 8);

    try {
      // Creative approach: Use browser notifications with frequency data
      if ('Notification' in window) {
        const permission = await this.requestNotificationPermission();
        if (permission === 'granted') {
          await this.playNotificationSequence(limitedMappings);
        } else {
          await this.playConsoleSequence(limitedMappings);
        }
      } else {
        await this.playConsoleSequence(limitedMappings);
      }
    } catch (error) {
      console.error('Notification audio failed:', error);
      await this.playConsoleSequence(limitedMappings);
    } finally {
      this.isPlaying = false;
    }
  }

  private async requestNotificationPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  }

  private async playNotificationSequence(mappings: FrequencyMapping[]): Promise<void> {
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      
      const notification = new Notification(`Glyph: ${mapping.glyph}`, {
        body: `Frequency: ${Math.round(mapping.frequency)}Hz\nAmplitude: ${Math.round(mapping.amplitude * 100)}%`,
        icon: 'data:image/svg+xml;base64,' + btoa(`
          <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
            <circle cx="32" cy="32" r="30" fill="hsl(${(mapping.frequency / 2000) * 360}, 70%, 50%)" stroke="#fff" stroke-width="2"/>
            <text x="32" y="38" text-anchor="middle" fill="#fff" font-size="24">${mapping.glyph}</text>
          </svg>
        `),
        silent: false,
        tag: `glyph-${i}`
      });

      // Auto-close notification after short time
      setTimeout(() => {
        notification.close();
      }, 800);

      // Wait between notifications
      await new Promise(resolve => setTimeout(resolve, 900));
    }
  }

  private async playConsoleSequence(mappings: FrequencyMapping[]): Promise<void> {
    console.group('🎵 Glyph Sequence Audio Representation');
    
    for (let i = 0; i < mappings.length; i++) {
      const mapping = mappings[i];
      const frequencyBar = '█'.repeat(Math.floor((mapping.frequency / 2000) * 20));
      const amplitudeBar = '▓'.repeat(Math.floor(mapping.amplitude * 10));
      
      console.log(`${i + 1}. ${mapping.glyph} → ${Math.round(mapping.frequency)}Hz`);
      console.log(`   Frequency: ${frequencyBar}`);
      console.log(`   Amplitude: ${amplitudeBar}`);
      console.log('---');
      
      // Try to trigger browser's default notification sound
      try {
        // Some browsers play a sound when console.error is called
        if (i % 2 === 0) {
          console.info(`♪ Playing tone ${i + 1}`);
        }
      } catch (e) {
        // Ignore
      }
      
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    console.groupEnd();
  }

  // Alternative: Use vibration API for haptic feedback
  async playVibrationSequence(mappings: FrequencyMapping[]): Promise<void> {
    if (!('vibrate' in navigator)) {
      console.log('Vibration API not supported');
      return;
    }

    this.isPlaying = true;
    const limitedMappings = mappings.slice(0, 10);

    try {
      for (const mapping of limitedMappings) {
        // Map frequency to vibration pattern
        const duration = Math.floor((mapping.frequency / 2000) * 300) + 100;
        const pause = Math.floor((1 - mapping.amplitude) * 200) + 50;
        
        navigator.vibrate([duration, pause]);
        await new Promise(resolve => setTimeout(resolve, duration + pause + 100));
      }
    } catch (error) {
      console.error('Vibration failed:', error);
    } finally {
      this.isPlaying = false;
    }
  }

  // Most creative: Use CSS animations to create visual "sound waves"
  async playVisualWaveSequence(mappings: FrequencyMapping[]): Promise<void> {
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: white;
      font-family: monospace;
      pointer-events: none;
    `;

    document.body.appendChild(container);
    this.isPlaying = true;

    try {
      for (let i = 0; i < Math.min(mappings.length, 6); i++) {
        const mapping = mappings[i];
        
        // Create visual sound wave
        const wave = document.createElement('div');
        const hue = (mapping.frequency / 2000) * 360;
        wave.style.cssText = `
          width: 200px;
          height: 200px;
          border: 3px solid hsl(${hue}, 70%, 50%);
          border-radius: 50%;
          animation: soundWave 0.8s ease-out;
          margin: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: hsl(${hue}, 70%, 70%);
        `;

        // Add animation keyframes if not exists
        if (!document.getElementById('soundWaveStyle')) {
          const style = document.createElement('style');
          style.id = 'soundWaveStyle';
          style.textContent = `
            @keyframes soundWave {
              0% { transform: scale(0.5); opacity: 1; }
              100% { transform: scale(2); opacity: 0; }
            }
          `;
          document.head.appendChild(style);
        }

        wave.textContent = `${mapping.glyph} (${Math.round(mapping.frequency)}Hz)`;
        container.appendChild(wave);

        // Remove wave after animation
        setTimeout(() => {
          if (wave.parentNode) {
            wave.parentNode.removeChild(wave);
          }
        }, 800);

        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Keep container for a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));

    } finally {
      document.body.removeChild(container);
      this.isPlaying = false;
    }
  }

  stop(): void {
    this.isPlaying = false;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const notificationAudioEngine = new NotificationAudioEngine();