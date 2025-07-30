import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { BarChart3, Play, Square, RotateCcw, Download } from 'lucide-react';

interface FrequencyVisualizerProps {
  analysisResult: any;
  isPlaying: boolean;
  volume: number;
  onPlay: () => void;
  onStop: () => void;
  onVolumeChange: (volume: number) => void;
  onExportAudio: () => void;
  onVisualizationStart: (canvas: HTMLCanvasElement) => void;
  onVisualizationStop: () => void;
}

export default function FrequencyVisualizer({
  analysisResult,
  isPlaying,
  volume,
  onPlay,
  onStop,
  onVolumeChange,
  onExportAudio,
  onVisualizationStart,
  onVisualizationStop
}: FrequencyVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visualizationMode, setVisualizationMode] = useState<'live' | 'static'>('live');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    if (visualizationMode === 'live' && isPlaying) {
      onVisualizationStart(canvas);
    } else {
      onVisualizationStop();
      drawStaticVisualization(canvas);
    }

    return () => {
      onVisualizationStop();
    };
  }, [analysisResult, isPlaying, visualizationMode, onVisualizationStart, onVisualizationStop]);

  const drawStaticVisualization = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || !analysisResult?.frequencyMappings) {
      drawEmptyState(canvas);
      return;
    }

    const { width, height } = canvas;
    let mappings = analysisResult.frequencyMappings;

    // Performance safeguard - limit visualization to prevent browser hangs
    const maxBars = 100;
    if (mappings.length > maxBars) {
      mappings = mappings.slice(0, maxBars);
    }

    // Clear canvas
    ctx.fillStyle = 'rgba(30, 41, 59, 0.95)';
    ctx.fillRect(0, 0, width, height);

    // Skip visualization if too many items
    if (mappings.length === 0) {
      drawEmptyState(canvas);
      return;
    }

    // Draw frequency bars
    const barWidth = Math.max(2, width / mappings.length);
    const maxFreq = Math.max(...mappings.map((m: any) => m.frequency));

    try {
      mappings.forEach((mapping: any, index: number) => {
      const barHeight = (mapping.frequency / maxFreq) * height * 0.8;
      const x = index * barWidth;
      const y = height - barHeight;

      // Create gradient based on frequency
      const gradient = ctx.createLinearGradient(0, y, 0, height);
      const hue = (mapping.frequency / maxFreq) * 240; // Blue to red spectrum
      gradient.addColorStop(0, `hsl(${hue}, 70%, 60%)`);
      gradient.addColorStop(1, `hsl(${hue}, 70%, 40%)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x + 2, y, barWidth - 4, barHeight);

        // Only draw labels if bars are wide enough
        if (barWidth > 15) {
          // Draw glyph label
          ctx.fillStyle = 'white';
          ctx.font = '12px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(mapping.glyph, x + barWidth / 2, height - 5);

          // Draw frequency label
          ctx.fillStyle = '#f59e0b';
          ctx.font = '10px sans-serif';
          ctx.fillText(`${Math.round(mapping.frequency)}Hz`, x + barWidth / 2, y - 5);
        }
      });
    } catch (error) {
      console.error('Visualization error:', error);
      drawEmptyState(canvas);
    }
  };

  const drawEmptyState = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(30, 41, 59, 0.95)');
    gradient.addColorStop(1, 'rgba(51, 65, 85, 0.95)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Draw placeholder content
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Real-time spectrum visualization', width / 2, height / 2 - 20);
    
    ctx.font = '12px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillText('Input glyphs to begin frequency analysis', width / 2, height / 2 + 10);

    // Draw decorative waveform
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < width; x += 4) {
      const y = height / 2 + Math.sin(x * 0.02) * 20;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  const handleVolumeChange = (value: number[]) => {
    onVolumeChange(value[0]);
  };

  return (
    <Card className="analysis-card bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center justify-between">
        <span className="flex items-center">
          <BarChart3 className="voynich-blue w-5 h-5 mr-3" />
          Frequency Spectrum Analysis
        </span>
        <div className="flex items-center space-x-2 text-sm">
          <Button 
            variant={visualizationMode === 'live' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVisualizationMode('live')}
          >
            Live
          </Button>
          <Button 
            variant={visualizationMode === 'static' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setVisualizationMode('static')}
          >
            Static
          </Button>
        </div>
      </h2>
      
      {/* Spectrum Visualizer */}
      <div className="spectrum-viz h-64 rounded-lg mb-4 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full spectrum-canvas"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Audio Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <Button 
            className={`w-12 h-12 rounded-full transition-colors ${
              isPlaying 
                ? 'bg-gray-300 hover:bg-gray-400 text-gray-600' 
                : 'voynich-amber-bg hover:bg-amber-600 text-white'
            }`}
            onClick={isPlaying ? onStop : onPlay}
            disabled={!analysisResult?.frequencyMappings}
          >
            {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <Button 
            className="w-12 h-12 bg-gray-300 hover:bg-gray-400 text-gray-600 rounded-full"
            onClick={onStop}
            disabled={!isPlaying}
          >
            <Square className="w-5 h-5" />
          </Button>
          <Button 
            className="w-12 h-12 bg-gray-300 hover:bg-gray-400 text-gray-600 rounded-full"
            onClick={() => {
              onStop();
              setTimeout(onPlay, 100);
            }}
            disabled={!analysisResult?.frequencyMappings}
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-3 flex-1 mx-6">
          <span className="text-sm text-gray-600 min-w-[50px]">Volume</span>
          <Slider
            value={[volume]}
            onValueChange={handleVolumeChange}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-8">{Math.round(volume)}%</span>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            className="voynich-blue-bg hover:bg-blue-600 text-white"
            onClick={onExportAudio}
            disabled={!analysisResult?.frequencyMappings}
          >
            <Download className="w-4 h-4 mr-2" />
            Export WAV
          </Button>
        </div>
      </div>
    </Card>
  );
}
