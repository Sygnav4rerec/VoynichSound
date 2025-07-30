import { useState, useCallback, useRef, useEffect } from 'react';
import { audioEngine, type WaveformType, type AudioConfig, type FrequencyMapping } from '@/lib/audio-engine';
import { useToast } from '@/hooks/use-toast';

export interface AudioSynthesisState {
  isPlaying: boolean;
  isInitialized: boolean;
  volume: number;
  frequency: number;
  waveformType: WaveformType;
}

export function useAudioSynthesis() {
  const { toast } = useToast();
  const [state, setState] = useState<AudioSynthesisState>({
    isPlaying: false,
    isInitialized: false,
    volume: 0.5,
    frequency: 440,
    waveformType: 'sine'
  });
  
  const analyzerRef = useRef<{
    canvas: HTMLCanvasElement | null;
    animationId: number | null;
  }>({ canvas: null, animationId: null });

  useEffect(() => {
    return () => {
      if (analyzerRef.current.animationId) {
        cancelAnimationFrame(analyzerRef.current.animationId);
      }
      audioEngine.destroy();
    };
  }, []);

  const initialize = useCallback(async () => {
    try {
      await audioEngine.initialize();
      setState(prev => ({ ...prev, isInitialized: true }));
    } catch (error) {
      console.error('Audio initialization failed:', error);
      toast({
        title: "Audio Error",
        description: "Failed to initialize audio system. Please check your browser permissions.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const playTone = useCallback(async (config?: Partial<AudioConfig>) => {
    if (!state.isInitialized) {
      await initialize();
    }

    try {
      const audioConfig: AudioConfig = {
        frequency: config?.frequency || state.frequency,
        waveformType: config?.waveformType || state.waveformType,
        volume: config?.volume || state.volume,
        duration: config?.duration,
        phase: config?.phase
      };

      await audioEngine.playTone(audioConfig);
      setState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Audio playback failed:', error);
      toast({
        title: "Playback Error",
        description: "Failed to play audio tone.",
        variant: "destructive"
      });
    }
  }, [state, initialize, toast]);

  const playSequence = useCallback(async (
    mappings: FrequencyMapping[],
    waveformType?: WaveformType,
    duration: number = 0.5
  ) => {
    if (!state.isInitialized) {
      await initialize();
    }

    try {
      await audioEngine.playSequence(
        mappings,
        waveformType || state.waveformType,
        duration
      );
      setState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Sequence playback failed:', error);
      toast({
        title: "Playback Error",
        description: "Failed to play glyph sequence.",
        variant: "destructive"
      });
    }
  }, [state, initialize, toast]);

  const playChord = useCallback(async (
    frequencies: number[],
    waveformType?: WaveformType,
    volume?: number
  ) => {
    if (!state.isInitialized) {
      await initialize();
    }

    try {
      await audioEngine.playChord(
        frequencies,
        waveformType || state.waveformType,
        volume || state.volume
      );
      setState(prev => ({ ...prev, isPlaying: true }));
    } catch (error) {
      console.error('Chord playback failed:', error);
      toast({
        title: "Playback Error",
        description: "Failed to play frequency chord.",
        variant: "destructive"
      });
    }
  }, [state, initialize, toast]);

  const stop = useCallback(() => {
    audioEngine.stop();
    setState(prev => ({ ...prev, isPlaying: false }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    audioEngine.setVolume(volume);
    setState(prev => ({ ...prev, volume }));
  }, []);

  const setFrequency = useCallback((frequency: number) => {
    setState(prev => ({ ...prev, frequency }));
  }, []);

  const setWaveformType = useCallback((waveformType: WaveformType) => {
    setState(prev => ({ ...prev, waveformType }));
  }, []);

  const startVisualization = useCallback((canvas: HTMLCanvasElement) => {
    if (!state.isInitialized) return;

    analyzerRef.current.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const frequencyData = audioEngine.getFrequencyData();
      if (!frequencyData) {
        analyzerRef.current.animationId = requestAnimationFrame(draw);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
      ctx.fillRect(0, 0, width, height);

      const barWidth = width / frequencyData.length;
      let x = 0;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#f59e0b');
      gradient.addColorStop(0.5, '#3b82f6');
      gradient.addColorStop(1, '#8b5cf6');

      ctx.fillStyle = gradient;

      for (let i = 0; i < frequencyData.length; i++) {
        const barHeight = (frequencyData[i] / 255) * height;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }

      analyzerRef.current.animationId = requestAnimationFrame(draw);
    };

    draw();
  }, [state.isInitialized]);

  const stopVisualization = useCallback(() => {
    if (analyzerRef.current.animationId) {
      cancelAnimationFrame(analyzerRef.current.animationId);
      analyzerRef.current.animationId = null;
    }
  }, []);

  const exportAudio = useCallback(async (
    mappings: FrequencyMapping[],
    waveformType: WaveformType,
    duration: number,
    filename: string = 'voynich-analysis'
  ) => {
    try {
      const blob = await audioEngine.generateWAV(mappings, waveformType, duration);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.wav`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `Audio exported as ${filename}.wav`,
      });
    } catch (error) {
      console.error('Audio export failed:', error);
      toast({
        title: "Export Error",
        description: "Failed to export audio file.",
        variant: "destructive"
      });
    }
  }, [toast]);

  return {
    state,
    actions: {
      initialize,
      playTone,
      playSequence,
      playChord,
      stop,
      setVolume,
      setFrequency,
      setWaveformType,
      startVisualization,
      stopVisualization,
      exportAudio
    }
  };
}
