import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PenTool, Play, Loader2 } from 'lucide-react';
import type { MappingAlgorithm } from '@/lib/glyph-mapper';
import type { WaveformType } from '@/lib/audio-engine';

interface GlyphInputPanelProps {
  glyphSequence: string;
  onGlyphSequenceChange: (value: string) => void;
  baseFrequency: number;
  onBaseFrequencyChange: (value: number) => void;
  waveformType: WaveformType;
  onWaveformTypeChange: (value: WaveformType) => void;
  mappingAlgorithm: MappingAlgorithm;
  onMappingAlgorithmChange: (value: MappingAlgorithm) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

export default function GlyphInputPanel({
  glyphSequence,
  onGlyphSequenceChange,
  baseFrequency,
  onBaseFrequencyChange,
  waveformType,
  onWaveformTypeChange,
  mappingAlgorithm,
  onMappingAlgorithmChange,
  onAnalyze,
  isAnalyzing
}: GlyphInputPanelProps) {
  // Local state for immediate UI updates without triggering heavy calculations
  const [localGlyphSequence, setLocalGlyphSequence] = useState(glyphSequence);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Sync local state when external state changes
  useEffect(() => {
    setLocalGlyphSequence(glyphSequence);
  }, [glyphSequence]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Memoize calculations based on the actual prop to prevent unnecessary recalculation
  const glyphStats = useMemo(() => {
    const glyphs = Array.from(glyphSequence || '');
    return {
      count: glyphs.length,
      unique: new Set(glyphs).size
    };
  }, [glyphSequence]);

  // Optimized input handler with immediate local update and debounced external update
  const handleGlyphSequenceChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Immediate local update for smooth UI
    setLocalGlyphSequence(value);
    
    // Clear previous debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Debounced external update to prevent performance issues
    debounceTimer.current = setTimeout(() => {
      onGlyphSequenceChange(value);
    }, 500); // 500ms debounce for heavy pattern analysis
    
  }, [onGlyphSequenceChange]);

  const handleFrequencySliderChange = useCallback((value: number[]) => {
    onBaseFrequencyChange(value[0]);
  }, [onBaseFrequencyChange]);

  const handleFrequencyInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 20 && value <= 2000) {
      onBaseFrequencyChange(value);
    }
  }, [onBaseFrequencyChange]);

  return (
    <Card className="analysis-card bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <PenTool className="voynich-amber w-5 h-5 mr-3" />
        Glyph Input Analysis
      </h2>
      
      {/* Glyph Input Field */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-2">Symbol Sequence</Label>
        <Textarea 
          className="glyph-input w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-lg"
          placeholder="𝖆𝖇𝖈 ⟁〰༄ Enter Voynich glyphs or Unicode symbols..."
          value={localGlyphSequence}
          onChange={handleGlyphSequenceChange}
        />
        <p className="text-xs text-gray-500 mt-2">
          <span>{glyphStats.count}</span> glyphs | 
          <span className="ml-1">{glyphStats.unique}</span> unique patterns
        </p>
      </div>

      {/* Frequency Mapping Controls */}
      <div className="space-y-4">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Base Frequency (Hz)</Label>
          <div className="flex items-center space-x-3">
            <Slider
              value={[baseFrequency]}
              onValueChange={handleFrequencySliderChange}
              min={20}
              max={2000}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={baseFrequency}
              onChange={handleFrequencyInputChange}
              min={20}
              max={2000}
              className="w-20"
            />
          </div>
        </div>
        
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Waveform Type</Label>
          <Select value={waveformType} onValueChange={(value: WaveformType) => onWaveformTypeChange(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sine">Sine Wave</SelectItem>
              <SelectItem value="sawtooth">Sawtooth</SelectItem>
              <SelectItem value="square">Square Wave</SelectItem>
              <SelectItem value="triangle">Triangle</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Mapping Algorithm</Label>
          <Select value={mappingAlgorithm} onValueChange={(value: MappingAlgorithm) => onMappingAlgorithmChange(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unicode">Unicode Value Linear</SelectItem>
              <SelectItem value="phonetic">Phonetic Resonance</SelectItem>
              <SelectItem value="geometric">Geometric Pattern</SelectItem>
              <SelectItem value="psycholinguistic">Psycholinguistic Model</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generate Button */}
      <Button 
        className="w-full mt-6 voynich-amber-bg hover:bg-amber-600 text-white font-medium py-3"
        onClick={onAnalyze}
        disabled={!glyphSequence.trim() || isAnalyzing}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Play className="w-4 h-4 mr-2" />
            Generate Tone Sequence
          </>
        )}
      </Button>
    </Card>
  );
}
