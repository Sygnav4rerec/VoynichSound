import { type MappingAlgorithm, type WaveformType } from "@shared/schema";

export interface FrequencyMapping {
  glyph: string;
  frequency: number;
  phase: number;
  amplitude: number;
}

export interface AnalysisResult {
  glyphCount: number;
  uniqueGlyphs: number;
  complexity: number;
  resonanceIndex: number;
  frequencyMappings: FrequencyMapping[];
  patterns: Array<{
    sequence: string;
    frequency: number;
    percentage: number;
    mappedFrequency: number;
  }>;
}

export class PatternAnalyzer {
  analyzeGlyphSequence(
    glyphSequence: string,
    baseFrequency: number = 440,
    mappingAlgorithm: MappingAlgorithm = 'unicode'
  ): AnalysisResult {
    const glyphs = Array.from(glyphSequence);
    const glyphCounts = this.countGlyphs(glyphs);
    const patterns = this.findPatterns(glyphSequence);
    
    const complexity = this.calculateComplexity(glyphs, glyphCounts);
    const resonanceIndex = this.calculateResonanceIndex(glyphs, baseFrequency);
    
    const frequencyMappings = this.generateFrequencyMappings(
      Array.from(glyphCounts.keys()),
      baseFrequency,
      mappingAlgorithm
    );
    
    const patternMappings = patterns.map(pattern => ({
      ...pattern,
      mappedFrequency: this.mapSequenceToFrequency(pattern.sequence, baseFrequency, mappingAlgorithm)
    }));
    
    return {
      glyphCount: glyphs.length,
      uniqueGlyphs: glyphCounts.size,
      complexity,
      resonanceIndex,
      frequencyMappings,
      patterns: patternMappings
    };
  }

  private countGlyphs(glyphs: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const glyph of glyphs) {
      counts.set(glyph, (counts.get(glyph) || 0) + 1);
    }
    return counts;
  }

  private findPatterns(sequence: string): Array<{
    sequence: string;
    frequency: number;
    percentage: number;
  }> {
    const patterns = new Map<string, number>();
    const glyphs = Array.from(sequence);
    
    // Find bigrams
    for (let i = 0; i < glyphs.length - 1; i++) {
      const bigram = glyphs[i] + glyphs[i + 1];
      patterns.set(bigram, (patterns.get(bigram) || 0) + 1);
    }
    
    // Find trigrams
    for (let i = 0; i < glyphs.length - 2; i++) {
      const trigram = glyphs[i] + glyphs[i + 1] + glyphs[i + 2];
      patterns.set(trigram, (patterns.get(trigram) || 0) + 1);
    }
    
    const totalPatterns = Array.from(patterns.values()).reduce((sum, count) => sum + count, 0);
    
    return Array.from(patterns.entries())
      .map(([seq, freq]) => ({
        sequence: seq,
        frequency: freq,
        percentage: (freq / totalPatterns) * 100
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10); // Top 10 patterns
  }

  private calculateComplexity(glyphs: string[], glyphCounts: Map<string, number>): number {
    if (glyphs.length === 0) return 0;
    
    // Calculate Shannon entropy
    const entropy = Array.from(glyphCounts.values())
      .map(count => count / glyphs.length)
      .reduce((sum, p) => sum - p * Math.log2(p), 0);
    
    // Normalize by maximum possible entropy
    const maxEntropy = Math.log2(glyphCounts.size || 1);
    return maxEntropy > 0 ? entropy / maxEntropy : 0;
  }

  private calculateResonanceIndex(glyphs: string[], baseFrequency: number): number {
    if (glyphs.length === 0) return 0;
    
    // Calculate harmonic relationships between consecutive glyphs
    let harmonicSum = 0;
    let validPairs = 0;
    
    for (let i = 0; i < glyphs.length - 1; i++) {
      const freq1 = this.glyphToFrequency(glyphs[i], baseFrequency, 'unicode');
      const freq2 = this.glyphToFrequency(glyphs[i + 1], baseFrequency, 'unicode');
      
      // Calculate harmonic ratio
      const ratio = Math.max(freq1, freq2) / Math.min(freq1, freq2);
      const nearestHarmonic = Math.round(ratio);
      const harmonicDistance = Math.abs(ratio - nearestHarmonic);
      
      // Closer to perfect harmonic = higher resonance
      harmonicSum += 1 - Math.min(harmonicDistance, 1);
      validPairs++;
    }
    
    return validPairs > 0 ? harmonicSum / validPairs : 0;
  }

  private generateFrequencyMappings(
    uniqueGlyphs: string[],
    baseFrequency: number,
    algorithm: MappingAlgorithm
  ): FrequencyMapping[] {
    return uniqueGlyphs.map(glyph => ({
      glyph,
      frequency: this.glyphToFrequency(glyph, baseFrequency, algorithm),
      phase: this.glyphToPhase(glyph),
      amplitude: this.glyphToAmplitude(glyph)
    }));
  }

  private glyphToFrequency(
    glyph: string,
    baseFrequency: number,
    algorithm: MappingAlgorithm
  ): number {
    switch (algorithm) {
      case 'unicode':
        return this.unicodeLinearMapping(glyph, baseFrequency);
      case 'phonetic':
        return this.phoneticResonanceMapping(glyph, baseFrequency);
      case 'geometric':
        return this.geometricPatternMapping(glyph, baseFrequency);
      case 'psycholinguistic':
        return this.psycholinguisticMapping(glyph, baseFrequency);
      default:
        return baseFrequency;
    }
  }

  private unicodeLinearMapping(glyph: string, baseFrequency: number): number {
    const codePoint = glyph.codePointAt(0) || 0;
    // Map Unicode range to musical frequencies (20Hz - 2000Hz)
    const normalizedCode = (codePoint % 1000) / 1000;
    return baseFrequency * (0.5 + normalizedCode * 3.5);
  }

  private phoneticResonanceMapping(glyph: string, baseFrequency: number): number {
    // Map based on theoretical phonetic properties
    const codePoint = glyph.codePointAt(0) || 0;
    const vowelLike = codePoint % 5;
    const consonantLike = Math.floor(codePoint / 5) % 7;
    
    // Use harmonic series for vowel-like sounds
    const harmonicMultiplier = [1, 1.25, 1.5, 1.75, 2][vowelLike];
    const formantShift = [0.9, 1.0, 1.1, 1.2, 1.3, 1.4, 1.5][consonantLike];
    
    return baseFrequency * harmonicMultiplier * formantShift;
  }

  private geometricPatternMapping(glyph: string, baseFrequency: number): number {
    // Map based on visual/geometric properties
    const codePoint = glyph.codePointAt(0) || 0;
    
    // Simulate geometric complexity to frequency mapping
    const complexity = this.estimateVisualComplexity(glyph);
    const symmetry = this.estimateSymmetry(glyph);
    
    return baseFrequency * (1 + complexity * 0.5) * (1 + symmetry * 0.3);
  }

  private psycholinguisticMapping(glyph: string, baseFrequency: number): number {
    // Map based on psycholinguistic principles
    const codePoint = glyph.codePointAt(0) || 0;
    
    // Simulate cognitive load and processing frequency
    const cognitiveLoad = (codePoint % 100) / 100;
    const processingFreq = Math.sin(codePoint * 0.01) * 0.5 + 0.5;
    
    return baseFrequency * (1 + cognitiveLoad) * (0.5 + processingFreq);
  }

  private estimateVisualComplexity(glyph: string): number {
    // Simple heuristic based on Unicode block and code point
    const codePoint = glyph.codePointAt(0) || 0;
    return Math.sin(codePoint * 0.001) * 0.5 + 0.5;
  }

  private estimateSymmetry(glyph: string): number {
    // Simple heuristic for symmetry
    const codePoint = glyph.codePointAt(0) || 0;
    return Math.cos(codePoint * 0.002) * 0.5 + 0.5;
  }

  private glyphToPhase(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    return (codePoint % 360) * (Math.PI / 180); // Convert to radians
  }

  private glyphToAmplitude(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    return 0.3 + (codePoint % 100) / 100 * 0.4; // Range: 0.3 - 0.7
  }

  private mapSequenceToFrequency(
    sequence: string,
    baseFrequency: number,
    algorithm: MappingAlgorithm
  ): number {
    const glyphs = Array.from(sequence);
    const frequencies = glyphs.map(glyph => 
      this.glyphToFrequency(glyph, baseFrequency, algorithm)
    );
    
    // Return geometric mean of frequencies in the sequence
    const product = frequencies.reduce((prod, freq) => prod * freq, 1);
    return Math.pow(product, 1 / frequencies.length);
  }
}

export const patternAnalyzer = new PatternAnalyzer();
