import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BarChart, TrendingUp, Hash, Activity } from 'lucide-react';

interface AnalysisResultsProps {
  analysisResult: any;
  glyphSequence: string;
}

export default function AnalysisResults({ analysisResult, glyphSequence }: AnalysisResultsProps) {
  // Calculate real-time statistics from glyph sequence
  const calculateStats = () => {
    if (!glyphSequence) {
      return {
        glyphsDetected: 0,
        uniquePatterns: 0,
        complexity: 0,
        resonanceIndex: 0
      };
    }

    const glyphs = Array.from(glyphSequence);
    const uniqueGlyphs = new Set(glyphs).size;
    
    // Calculate entropy-based complexity
    const frequency = new Map<string, number>();
    for (const glyph of glyphs) {
      frequency.set(glyph, (frequency.get(glyph) || 0) + 1);
    }
    
    const entropy = Array.from(frequency.values())
      .map(count => count / glyphs.length)
      .reduce((sum, p) => sum - p * Math.log2(p), 0);
    
    const maxEntropy = Math.log2(uniqueGlyphs || 1);
    const complexity = maxEntropy > 0 ? entropy / maxEntropy : 0;
    
    return {
      glyphsDetected: analysisResult?.glyphCount || glyphs.length,
      uniquePatterns: analysisResult?.uniqueGlyphs || uniqueGlyphs,
      complexity: analysisResult?.complexity || complexity,
      resonanceIndex: analysisResult?.resonanceIndex || 0
    };
  };

  const stats = calculateStats();
  const patterns = analysisResult?.patterns || [];

  const formatComplexity = (value: number) => {
    return (value * 100).toFixed(1);
  };

  const formatResonance = (value: number) => {
    return (value * 100).toFixed(1);
  };

  const getComplexityColor = (complexity: number) => {
    if (complexity < 0.3) return 'text-green-600';
    if (complexity < 0.7) return 'text-amber-600';
    return 'text-red-600';
  };

  const getResonanceColor = (resonance: number) => {
    if (resonance > 0.7) return 'text-green-600';
    if (resonance > 0.4) return 'text-amber-600';
    return 'text-gray-600';
  };

  return (
    <Card className="analysis-card bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <BarChart className="voynich-purple w-5 h-5 mr-3" />
        Pattern Analysis Results
      </h2>
      
      {/* Statistics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold voynich-blue">{stats.glyphsDetected}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
            <Hash className="w-3 h-3 mr-1" />
            Glyphs Detected
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold voynich-green">{stats.uniquePatterns}</div>
          <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            Unique Patterns
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className={`text-2xl font-bold ${getComplexityColor(stats.complexity)}`}>
            {formatComplexity(stats.complexity)}%
          </div>
          <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
            <Activity className="w-3 h-3 mr-1" />
            Complexity Score
          </div>
          <Progress 
            value={stats.complexity * 100} 
            className="mt-2 h-1"
          />
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className={`text-2xl font-bold ${getResonanceColor(stats.resonanceIndex)}`}>
            {formatResonance(stats.resonanceIndex)}%
          </div>
          <div className="text-sm text-gray-600 flex items-center justify-center mt-1">
            <Activity className="w-3 h-3 mr-1" />
            Resonance Index
          </div>
          <Progress 
            value={stats.resonanceIndex * 100} 
            className="mt-2 h-1"
          />
        </div>
      </div>

      {/* Pattern Frequency List */}
      <div>
        <h3 className="font-medium text-gray-700 mb-3 flex items-center">
          <BarChart className="w-4 h-4 mr-2" />
          Top Frequent Patterns
        </h3>
        
        {patterns.length > 0 ? (
          <ScrollArea className="max-h-40">
            <div className="space-y-2">
              {patterns.map((pattern: any, index: number) => (
                <div 
                  key={`${pattern.sequence}-${index}`}
                  className="pattern-item flex items-center justify-between p-3 bg-gray-50 rounded-lg transition-all duration-200 hover:bg-amber-50 hover:transform hover:translate-x-1"
                >
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="glyph-input font-mono text-sm">
                      {pattern.sequence}
                    </Badge>
                    <span className="text-gray-600 text-sm">
                      {pattern.frequency}x ({pattern.percentage?.toFixed(1) || '0.0'}%)
                    </span>
                  </div>
                  <span className="voynich-amber text-sm font-medium">
                    {Math.round(pattern.mappedFrequency || 0)} Hz
                  </span>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <BarChart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {glyphSequence ? 'Analyzing patterns...' : 'Enter glyphs to see pattern analysis'}
            </p>
          </div>
        )}
      </div>

      {/* Analysis Insights */}
      {analysisResult && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="font-medium text-gray-700 mb-3">Analysis Insights</h3>
          <div className="space-y-2 text-sm">
            {stats.complexity > 0.8 && (
              <div className="flex items-center p-2 bg-amber-50 rounded-lg">
                <Activity className="w-4 h-4 text-amber-600 mr-2" />
                <span className="text-amber-800">High complexity indicates rich linguistic structure</span>
              </div>
            )}
            {stats.resonanceIndex > 0.6 && (
              <div className="flex items-center p-2 bg-green-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                <span className="text-green-800">Strong harmonic relationships detected</span>
              </div>
            )}
            {patterns.length > 5 && (
              <div className="flex items-center p-2 bg-blue-50 rounded-lg">
                <Hash className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-blue-800">Multiple recurring patterns suggest systematic structure</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
