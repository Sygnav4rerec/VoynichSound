export type MappingAlgorithm = 'unicode' | 'phonetic' | 'geometric' | 'psycholinguistic';

export interface GlyphMapping {
  glyph: string;
  frequency: number;
  phase: number;
  amplitude: number;
}

export class GlyphMapper {
  private readonly FREQUENCY_RANGE = { min: 80, max: 2000 };
  private readonly AMPLITUDE_RANGE = { min: 0.3, max: 0.8 };

  mapGlyphsToFrequencies(
    glyphSequence: string,
    baseFrequency: number = 440,
    algorithm: MappingAlgorithm = 'unicode'
  ): GlyphMapping[] {
    // Performance safeguard from toneresonance - limit sequence length
    const maxLength = 50;
    const truncatedSequence = glyphSequence.length > maxLength 
      ? glyphSequence.substring(0, maxLength) 
      : glyphSequence;
      
    const glyphs = Array.from(truncatedSequence);
    return glyphs.map(glyph => this.mapSingleGlyph(glyph, baseFrequency, algorithm));
  }

  private mapSingleGlyph(
    glyph: string,
    baseFrequency: number,
    algorithm: MappingAlgorithm
  ): GlyphMapping {
    const frequency = this.calculateFrequency(glyph, baseFrequency, algorithm);
    const phase = this.calculatePhase(glyph);
    const amplitude = this.calculateAmplitude(glyph);

    return { glyph, frequency, phase, amplitude };
  }

  private calculateFrequency(
    glyph: string,
    baseFrequency: number,
    algorithm: MappingAlgorithm
  ): number {
    switch (algorithm) {
      case 'unicode':
        return this.unicodeMapping(glyph, baseFrequency);
      case 'phonetic':
        return this.phoneticMapping(glyph, baseFrequency);
      case 'geometric':
        return this.geometricMapping(glyph, baseFrequency);
      case 'psycholinguistic':
        return this.psycholinguisticMapping(glyph, baseFrequency);
      default:
        return baseFrequency;
    }
  }

  private unicodeMapping(glyph: string, baseFrequency: number): number {
    // Simple, reliable mapping like toneresonance
    const codePoint = glyph.codePointAt(0) || 65; // Default to 'A' if invalid
    
    // Map unicode to frequency using a simple linear scale
    const normalizedCode = codePoint % 256; // Keep within reasonable range
    const frequencyMultiplier = (normalizedCode / 256) * 2 + 0.5; // 0.5x to 2.5x base frequency
    const frequency = baseFrequency * frequencyMultiplier;
    
    return Math.max(this.FREQUENCY_RANGE.min, Math.min(this.FREQUENCY_RANGE.max, frequency));
  }

  private phoneticMapping(glyph: string, baseFrequency: number): number {
    const codePoint = glyph.codePointAt(0) || 0;
    
    // Simulate vowel/consonant properties
    const vowelLike = codePoint % 5;
    const consonantLike = Math.floor(codePoint / 5) % 7;
    
    // Harmonic relationships
    const harmonicMultipliers = [1, 1.125, 1.25, 1.5, 1.75]; // Musical intervals
    const formantShifts = [0.8, 0.9, 1.0, 1.1, 1.2, 1.3, 1.4];
    
    const frequency = baseFrequency * harmonicMultipliers[vowelLike] * formantShifts[consonantLike];
    return Math.max(this.FREQUENCY_RANGE.min, Math.min(this.FREQUENCY_RANGE.max, frequency));
  }

  private geometricMapping(glyph: string, baseFrequency: number): number {
    const codePoint = glyph.codePointAt(0) || 0;
    
    // Simulate geometric properties
    const complexity = this.estimateComplexity(glyph);
    const symmetry = this.estimateSymmetry(glyph);
    const curvature = this.estimateCurvature(glyph);
    
    // Map geometric properties to frequency
    const geometricFactor = (complexity * 0.4 + symmetry * 0.3 + curvature * 0.3);
    const frequency = baseFrequency * (0.5 + geometricFactor * 1.5);
    
    return Math.max(this.FREQUENCY_RANGE.min, Math.min(this.FREQUENCY_RANGE.max, frequency));
  }

  private psycholinguisticMapping(glyph: string, baseFrequency: number): number {
    const codePoint = glyph.codePointAt(0) || 0;
    
    // Simulate cognitive processing factors
    const cognitiveLoad = this.estimateCognitiveLoad(glyph);
    const memorability = this.estimateMemorability(glyph);
    const recognitionSpeed = this.estimateRecognitionSpeed(glyph);
    
    // Weight factors based on psycholinguistic principles
    const psychoFactor = (cognitiveLoad * 0.5 + memorability * 0.3 + recognitionSpeed * 0.2);
    const frequency = baseFrequency * (0.7 + psychoFactor * 0.8);
    
    return Math.max(this.FREQUENCY_RANGE.min, Math.min(this.FREQUENCY_RANGE.max, frequency));
  }

  private calculatePhase(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    return (codePoint % 360) * (Math.PI / 180);
  }

  private calculateAmplitude(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    const normalized = (codePoint % 100) / 100;
    return this.AMPLITUDE_RANGE.min + normalized * (this.AMPLITUDE_RANGE.max - this.AMPLITUDE_RANGE.min);
  }

  // Geometric property estimators
  private estimateComplexity(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    return Math.abs(Math.sin(codePoint * 0.01)) * 0.5 + 0.25;
  }

  private estimateSymmetry(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    return Math.abs(Math.cos(codePoint * 0.015)) * 0.5 + 0.25;
  }

  private estimateCurvature(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    return Math.abs(Math.sin(codePoint * 0.008)) * 0.5 + 0.25;
  }

  // Psycholinguistic estimators
  private estimateCognitiveLoad(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    return Math.abs(Math.sin(codePoint * 0.005)) * 0.5 + 0.25;
  }

  private estimateMemorability(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    return Math.abs(Math.cos(codePoint * 0.007)) * 0.5 + 0.25;
  }

  private estimateRecognitionSpeed(glyph: string): number {
    const codePoint = glyph.codePointAt(0) || 0;
    return Math.abs(Math.sin(codePoint * 0.012)) * 0.5 + 0.25;
  }

  // Utility methods
  getGlyphStatistics(glyphSequence: string): {
    length: number;
    uniqueGlyphs: number;
    frequency: Map<string, number>;
    mostCommon: string | null;
    entropy: number;
  } {
    const glyphs = Array.from(glyphSequence);
    const frequency = new Map<string, number>();
    
    for (const glyph of glyphs) {
      frequency.set(glyph, (frequency.get(glyph) || 0) + 1);
    }
    
    const mostCommon = Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    // Calculate Shannon entropy
    const total = glyphs.length;
    const entropy = Array.from(frequency.values())
      .map(count => count / total)
      .reduce((sum, p) => sum - p * Math.log2(p), 0);
    
    return {
      length: glyphs.length,
      uniqueGlyphs: frequency.size,
      frequency,
      mostCommon,
      entropy
    };
  }

  findPatterns(glyphSequence: string, minLength: number = 2, maxLength: number = 4): Array<{
    pattern: string;
    count: number;
    positions: number[];
  }> {
    const patterns = new Map<string, number[]>();
    const glyphs = Array.from(glyphSequence);
    
    for (let length = minLength; length <= maxLength; length++) {
      for (let i = 0; i <= glyphs.length - length; i++) {
        const pattern = glyphs.slice(i, i + length).join('');
        if (!patterns.has(pattern)) {
          patterns.set(pattern, []);
        }
        patterns.get(pattern)!.push(i);
      }
    }
    
    return Array.from(patterns.entries())
      .filter(([pattern, positions]) => positions.length > 1)
      .map(([pattern, positions]) => ({
        pattern,
        count: positions.length,
        positions
      }))
      .sort((a, b) => b.count - a.count);
  }

  calculateHarmonicRelationships(mappings: GlyphMapping[]): Array<{
    glyph1: string;
    glyph2: string;
    ratio: number;
    harmonic: boolean;
  }> {
    const relationships = [];
    
    for (let i = 0; i < mappings.length; i++) {
      for (let j = i + 1; j < mappings.length; j++) {
        const freq1 = mappings[i].frequency;
        const freq2 = mappings[j].frequency;
        const ratio = Math.max(freq1, freq2) / Math.min(freq1, freq2);
        const nearestHarmonic = Math.round(ratio);
        const harmonicDistance = Math.abs(ratio - nearestHarmonic);
        const isHarmonic = harmonicDistance < 0.1; // 10% tolerance
        
        relationships.push({
          glyph1: mappings[i].glyph,
          glyph2: mappings[j].glyph,
          ratio,
          harmonic: isHarmonic
        });
      }
    }
    
    return relationships.sort((a, b) => a.ratio - b.ratio);
  }
}

export const glyphMapper = new GlyphMapper();
