import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Download, Settings } from 'lucide-react';
import GlyphInputPanel from '@/components/glyph-input-panel';
import FrequencyVisualizer from '@/components/frequency-visualizer';
import ManuscriptUpload from '@/components/manuscript-upload';
import AnalysisResults from '@/components/analysis-results';
import PresetManager from '@/components/preset-manager';
import ResearchNotes from '@/components/research-notes';
import DebugPanel from '@/components/debug-panel';
import { usePatternAnalysis, type AnalysisConfig } from '@/hooks/use-pattern-analysis';
import { useAudioSynthesis } from '@/hooks/use-audio-synthesis';
import type { MappingAlgorithm } from '@/lib/glyph-mapper';
import type { WaveformType } from '@/lib/audio-engine';

export default function VoynichAnalysis() {
  const [glyphSequence, setGlyphSequence] = useState('');
  const [baseFrequency, setBaseFrequency] = useState(440);
  const [waveformType, setWaveformType] = useState<WaveformType>('sine');
  const [mappingAlgorithm, setMappingAlgorithm] = useState<MappingAlgorithm>('unicode');
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [notes, setNotes] = useState('');
  
  const { analyzeGlyphs, generateFrequencyMappings, isAnalyzing } = usePatternAnalysis();
  const { state: audioState, actions: audioActions } = useAudioSynthesis();

  // Initialize audio system
  useEffect(() => {
    audioActions.initialize();
  }, [audioActions]);

  const handleAnalyze = async () => {
    if (!glyphSequence.trim()) return;

    const config: AnalysisConfig = {
      glyphSequence,
      baseFrequency,
      mappingAlgorithm
    };

    try {
      const result = await analyzeGlyphs(config);
      setAnalysisResult(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handlePlaySequence = async () => {
    if (!analysisResult?.frequencyMappings) return;
    
    await audioActions.playSequence(
      analysisResult.frequencyMappings,
      waveformType,
      0.5
    );
  };

  const handleStopAudio = () => {
    audioActions.stop();
  };

  const handleVolumeChange = (volume: number) => {
    audioActions.setVolume(volume / 100);
  };

  const handleExportAudio = async () => {
    if (!analysisResult?.frequencyMappings) return;
    
    await audioActions.exportAudio(
      analysisResult.frequencyMappings,
      waveformType,
      5,
      'voynich-analysis'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="voynich-header text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="text-2xl font-bold voynich-amber">𓁿</div>
              <div>
                <h1 className="text-xl font-semibold">Voynich Analysis Platform</h1>
                <p className="text-sm text-gray-300">Psycholinguistic Frequency Resonance Tool</p>
              </div>
            </div>
            <nav className="flex items-center space-x-6">
              <Button variant="ghost" className="text-white hover:text-amber-400">
                <Save className="w-4 h-4 mr-2" />
                Save Session
              </Button>
              <Button variant="ghost" className="text-white hover:text-amber-400" onClick={handleExportAudio}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="ghost" className="text-white hover:text-amber-400">
                <Settings className="w-4 h-4" />
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Glyph Input Panel */}
          <div className="lg:col-span-1">
            <GlyphInputPanel
              glyphSequence={glyphSequence}
              onGlyphSequenceChange={setGlyphSequence}
              baseFrequency={baseFrequency}
              onBaseFrequencyChange={setBaseFrequency}
              waveformType={waveformType}
              onWaveformTypeChange={setWaveformType}
              mappingAlgorithm={mappingAlgorithm}
              onMappingAlgorithmChange={setMappingAlgorithm}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>
          
          {/* Visualization Panel */}
          <div className="lg:col-span-2">
            <FrequencyVisualizer
              analysisResult={analysisResult}
              isPlaying={audioState.isPlaying}
              volume={audioState.volume * 100}
              onPlay={handlePlaySequence}
              onStop={handleStopAudio}
              onVolumeChange={handleVolumeChange}
              onExportAudio={handleExportAudio}
              onVisualizationStart={audioActions.startVisualization}
              onVisualizationStop={audioActions.stopVisualization}
            />
          </div>
        </div>

        {/* Manuscript Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Image Upload Panel */}
          <ManuscriptUpload 
            onGlyphsDetected={(glyphs) => {
              const glyphString = glyphs.map(g => g.glyph).join('');
              setGlyphSequence(glyphString);
            }}
          />

          {/* Analysis Results */}
          <AnalysisResults 
            analysisResult={analysisResult}
            glyphSequence={glyphSequence}
          />
        </div>

        {/* Advanced Tools Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Preset Management */}
          <PresetManager
            currentConfig={{
              glyphSequence,
              baseFrequency,
              waveformType,
              mappingAlgorithm
            }}
            onLoadPreset={(preset) => {
              setGlyphSequence(preset.glyphSequence);
              setBaseFrequency(preset.baseFrequency);
              setWaveformType(preset.waveformType as WaveformType);
              setMappingAlgorithm(preset.mappingAlgorithm as MappingAlgorithm);
            }}
          />

          {/* Export Tools */}
          <Card className="analysis-card bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Download className="voynich-pink w-5 h-5 mr-3" />
              Export & Share
            </h2>
            
            <div className="space-y-3">
              <Button 
                className="w-full voynich-blue-bg hover:bg-blue-600 text-white"
                onClick={handleExportAudio}
                disabled={!analysisResult}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Audio Sequence
              </Button>
              <Button className="w-full voynich-green-bg hover:bg-green-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Export Analysis Data
              </Button>
              <Button className="w-full voynich-purple-bg hover:bg-purple-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Export Visualization
              </Button>
              <Button className="w-full bg-gray-500 hover:bg-gray-600 text-white">
                <Download className="w-4 h-4 mr-2" />
                Download Session
              </Button>
            </div>
          </Card>

          {/* Research Notes */}
          <ResearchNotes
            notes={notes}
            onNotesChange={setNotes}
          />
        </div>
      </div>
    </div>
  );
}
