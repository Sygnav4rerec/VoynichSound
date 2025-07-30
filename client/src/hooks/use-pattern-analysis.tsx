import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { glyphMapper, type MappingAlgorithm } from '@/lib/glyph-mapper';
import { useToast } from '@/hooks/use-toast';

export interface PatternAnalysisResult {
  glyphCount: number;
  uniqueGlyphs: number;
  complexity: number;
  resonanceIndex: number;
  frequencyMappings: Array<{
    glyph: string;
    frequency: number;
    phase: number;
    amplitude: number;
  }>;
  patterns: Array<{
    sequence: string;
    frequency: number;
    percentage: number;
    mappedFrequency: number;
  }>;
}

export interface AnalysisConfig {
  glyphSequence: string;
  baseFrequency: number;
  mappingAlgorithm: MappingAlgorithm;
}

export function usePatternAnalysis() {
  const { toast } = useToast();
  const [localAnalysis, setLocalAnalysis] = useState<PatternAnalysisResult | null>(null);

  // Server-side analysis
  const analyzeGlyphsMutation = useMutation({
    mutationFn: async (config: AnalysisConfig): Promise<PatternAnalysisResult> => {
      const response = await apiRequest('POST', '/api/analyze-glyphs', config);
      return response.json();
    },
    onError: (error) => {
      console.error('Server analysis failed:', error);
      toast({
        title: "Analysis Error",
        description: "Server analysis failed. Using local analysis instead.",
        variant: "destructive"
      });
    }
  });

  // Client-side analysis as fallback
  const performLocalAnalysis = useCallback((config: AnalysisConfig): PatternAnalysisResult => {
    const { glyphSequence, baseFrequency, mappingAlgorithm } = config;
    
    if (!glyphSequence.trim()) {
      return {
        glyphCount: 0,
        uniqueGlyphs: 0,
        complexity: 0,
        resonanceIndex: 0,
        frequencyMappings: [],
        patterns: []
      };
    }

    const mappings = glyphMapper.mapGlyphsToFrequencies(glyphSequence, baseFrequency, mappingAlgorithm);
    const statistics = glyphMapper.getGlyphStatistics(glyphSequence);
    const patterns = glyphMapper.findPatterns(glyphSequence);
    const harmonics = glyphMapper.calculateHarmonicRelationships(mappings);
    
    // Calculate complexity based on entropy
    const complexity = statistics.entropy / Math.log2(Math.max(statistics.uniqueGlyphs, 1));
    
    // Calculate resonance index based on harmonic relationships
    const harmonicRelationships = harmonics.filter(h => h.harmonic).length;
    const totalRelationships = harmonics.length;
    const resonanceIndex = totalRelationships > 0 ? harmonicRelationships / totalRelationships : 0;
    
    // Convert patterns to expected format
    const formattedPatterns = patterns.slice(0, 10).map(pattern => {
      const mappedFreq = glyphMapper.mapGlyphsToFrequencies(
        pattern.pattern, 
        baseFrequency, 
        mappingAlgorithm
      );
      const avgFreq = mappedFreq.reduce((sum, m) => sum + m.frequency, 0) / mappedFreq.length;
      
      return {
        sequence: pattern.pattern,
        frequency: pattern.count,
        percentage: (pattern.count / statistics.length) * 100,
        mappedFrequency: avgFreq
      };
    });

    return {
      glyphCount: statistics.length,
      uniqueGlyphs: statistics.uniqueGlyphs,
      complexity,
      resonanceIndex,
      frequencyMappings: mappings,
      patterns: formattedPatterns
    };
  }, []);

  const analyzeGlyphs = useCallback(async (config: AnalysisConfig) => {
    try {
      // Always perform local analysis
      const localResult = performLocalAnalysis(config);
      setLocalAnalysis(localResult);

      // Attempt server analysis for more sophisticated results
      const serverResult = await analyzeGlyphsMutation.mutateAsync(config);
      return serverResult;
    } catch (error) {
      // Return local analysis if server fails
      return localAnalysis || performLocalAnalysis(config);
    }
  }, [analyzeGlyphsMutation, localAnalysis, performLocalAnalysis]);

  const getGlyphStatistics = useCallback((glyphSequence: string) => {
    return glyphMapper.getGlyphStatistics(glyphSequence);
  }, []);

  const findGlyphPatterns = useCallback((glyphSequence: string, minLength?: number, maxLength?: number) => {
    return glyphMapper.findPatterns(glyphSequence, minLength, maxLength);
  }, []);

  const calculateHarmonics = useCallback((glyphSequence: string, baseFrequency: number, algorithm: MappingAlgorithm) => {
    const mappings = glyphMapper.mapGlyphsToFrequencies(glyphSequence, baseFrequency, algorithm);
    return glyphMapper.calculateHarmonicRelationships(mappings);
  }, []);

  const generateFrequencyMappings = useCallback((
    glyphSequence: string, 
    baseFrequency: number, 
    algorithm: MappingAlgorithm
  ) => {
    return glyphMapper.mapGlyphsToFrequencies(glyphSequence, baseFrequency, algorithm);
  }, []);

  return {
    analyzeGlyphs,
    getGlyphStatistics,
    findGlyphPatterns,
    calculateHarmonics,
    generateFrequencyMappings,
    performLocalAnalysis,
    isAnalyzing: analyzeGlyphsMutation.isPending,
    error: analyzeGlyphsMutation.error,
    localAnalysis
  };
}
