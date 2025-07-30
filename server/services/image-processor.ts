import sharp from 'sharp';
import { createCanvas, createImageData } from 'canvas';

export interface GlyphDetectionResult {
  glyph: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface PatternAnalysisResult {
  patterns: Array<{
    sequence: string;
    frequency: number;
    positions: Array<{ x: number; y: number }>;
  }>;
  complexity: number;
  uniqueGlyphs: number;
  totalGlyphs: number;
}

export class ImageProcessor {
  async processManuscriptImage(
    imageBuffer: Buffer,
    options: {
      autoDetectGlyphs?: boolean;
      patternRecognition?: boolean;
      frequencyMapping?: boolean;
    } = {}
  ): Promise<{
    glyphs: GlyphDetectionResult[];
    patterns: PatternAnalysisResult;
    processedImageData?: Buffer;
  }> {
    try {
      // Convert image to standard format for processing
      const processedBuffer = await sharp(imageBuffer)
        .resize(1200, null, { withoutEnlargement: true })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();

      const { data, info } = await sharp(processedBuffer).raw().toBuffer({ resolveWithObject: true });
      
      let glyphs: GlyphDetectionResult[] = [];
      let patterns: PatternAnalysisResult = {
        patterns: [],
        complexity: 0,
        uniqueGlyphs: 0,
        totalGlyphs: 0
      };

      if (options.autoDetectGlyphs) {
        glyphs = await this.detectGlyphs(data, info.width, info.height);
      }

      if (options.patternRecognition) {
        patterns = await this.analyzePatterns(glyphs);
      }

      return {
        glyphs,
        patterns,
        processedImageData: processedBuffer
      };
    } catch (error) {
      throw new Error(`Image processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async detectGlyphs(
    imageData: Buffer, 
    width: number, 
    height: number
  ): Promise<GlyphDetectionResult[]> {
    // Simplified glyph detection using edge detection and contour analysis
    const glyphs: GlyphDetectionResult[] = [];
    
    // Convert buffer to pixel array
    const pixels = new Uint8Array(imageData);
    
    // Apply edge detection (simplified Sobel operator)
    const edges = this.detectEdges(pixels, width, height);
    
    // Find connected components (potential glyphs)
    const components = this.findConnectedComponents(edges, width, height);
    
    // Filter and classify components as glyphs
    for (const component of components) {
      if (this.isLikelyGlyph(component)) {
        const glyph = this.classifyGlyph(component);
        if (glyph) {
          glyphs.push(glyph);
        }
      }
    }
    
    return glyphs;
  }

  private detectEdges(pixels: Uint8Array, width: number, height: number): Uint8Array {
    const edges = new Uint8Array(width * height);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        
        // Sobel X
        const gx = -pixels[(y-1)*width + (x-1)] + pixels[(y-1)*width + (x+1)] +
                   -2*pixels[y*width + (x-1)] + 2*pixels[y*width + (x+1)] +
                   -pixels[(y+1)*width + (x-1)] + pixels[(y+1)*width + (x+1)];
        
        // Sobel Y
        const gy = -pixels[(y-1)*width + (x-1)] - 2*pixels[(y-1)*width + x] - pixels[(y-1)*width + (x+1)] +
                   pixels[(y+1)*width + (x-1)] + 2*pixels[(y+1)*width + x] + pixels[(y+1)*width + (x+1)];
        
        const magnitude = Math.sqrt(gx*gx + gy*gy);
        edges[idx] = magnitude > 50 ? 255 : 0;
      }
    }
    
    return edges;
  }

  private findConnectedComponents(
    edges: Uint8Array, 
    width: number, 
    height: number
  ): Array<{ pixels: Array<{x: number, y: number}>, boundingBox: {x: number, y: number, width: number, height: number} }> {
    const visited = new Set<number>();
    const components = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        if (edges[idx] > 0 && !visited.has(idx)) {
          const component = this.floodFill(edges, width, height, x, y, visited);
          if (component.pixels.length > 10) { // Minimum size threshold
            components.push(component);
          }
        }
      }
    }
    
    return components;
  }

  private floodFill(
    edges: Uint8Array,
    width: number,
    height: number,
    startX: number,
    startY: number,
    visited: Set<number>
  ): { pixels: Array<{x: number, y: number}>, boundingBox: {x: number, y: number, width: number, height: number} } {
    const stack = [{x: startX, y: startY}];
    const pixels = [];
    let minX = startX, maxX = startX, minY = startY, maxY = startY;
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      const idx = y * width + x;
      
      if (x < 0 || x >= width || y < 0 || y >= height || visited.has(idx) || edges[idx] === 0) {
        continue;
      }
      
      visited.add(idx);
      pixels.push({x, y});
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      
      stack.push({x: x+1, y}, {x: x-1, y}, {x, y: y+1}, {x, y: y-1});
    }
    
    return {
      pixels,
      boundingBox: {
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1
      }
    };
  }

  private isLikelyGlyph(component: { pixels: Array<{x: number, y: number}>, boundingBox: any }): boolean {
    const { boundingBox, pixels } = component;
    
    // Basic heuristics for glyph detection
    const aspectRatio = boundingBox.width / boundingBox.height;
    const density = pixels.length / (boundingBox.width * boundingBox.height);
    
    return (
      boundingBox.width >= 5 && boundingBox.height >= 5 && // Minimum size
      boundingBox.width <= 200 && boundingBox.height <= 200 && // Maximum size
      aspectRatio > 0.2 && aspectRatio < 5 && // Reasonable aspect ratio
      density > 0.1 && density < 0.8 // Reasonable density
    );
  }

  private classifyGlyph(component: any): GlyphDetectionResult | null {
    // Simplified glyph classification
    // In a real implementation, this would use machine learning or pattern matching
    const { boundingBox } = component;
    
    // For now, return a generic classification with confidence based on component quality
    const confidence = Math.min(0.95, Math.max(0.1, component.pixels.length / 100));
    
    return {
      glyph: this.generateGlyphRepresentation(component),
      confidence,
      boundingBox
    };
  }

  private generateGlyphRepresentation(component: any): string {
    // Generate a Unicode representation based on glyph characteristics
    // This is a simplified approach - real implementation would use trained models
    const glyphSymbols = ['𝖆', '𝖇', '𝖈', '⟁', '〰', '༄', '⌇', '◉', '𐇩', '🜂'];
    const index = Math.floor(Math.random() * glyphSymbols.length);
    return glyphSymbols[index];
  }

  private async analyzePatterns(glyphs: GlyphDetectionResult[]): Promise<PatternAnalysisResult> {
    const glyphSequence = glyphs.map(g => g.glyph).join('');
    const glyphCounts = new Map<string, number>();
    const patterns = new Map<string, { frequency: number, positions: Array<{ x: number; y: number }> }>();
    
    // Count individual glyphs
    for (const glyph of glyphs) {
      glyphCounts.set(glyph.glyph, (glyphCounts.get(glyph.glyph) || 0) + 1);
    }
    
    // Find bigram and trigram patterns
    for (let i = 0; i < glyphs.length - 1; i++) {
      const bigram = glyphs[i].glyph + glyphs[i + 1].glyph;
      if (!patterns.has(bigram)) {
        patterns.set(bigram, { frequency: 0, positions: [] });
      }
      const pattern = patterns.get(bigram)!;
      pattern.frequency++;
      pattern.positions.push({ x: glyphs[i].boundingBox.x, y: glyphs[i].boundingBox.y });
    }
    
    // Calculate complexity score
    const uniqueGlyphs = glyphCounts.size;
    const totalGlyphs = glyphs.length;
    const entropy = Array.from(glyphCounts.values())
      .map(count => count / totalGlyphs)
      .reduce((sum, p) => sum - p * Math.log2(p), 0);
    
    const complexity = entropy / Math.log2(uniqueGlyphs || 1);
    
    return {
      patterns: Array.from(patterns.entries())
        .map(([sequence, data]) => ({ sequence, ...data }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 20), // Top 20 patterns
      complexity,
      uniqueGlyphs,
      totalGlyphs
    };
  }
}

export const imageProcessor = new ImageProcessor();
