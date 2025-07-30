import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CloudUpload, FileImage, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface GlyphDetection {
  glyph: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface UploadResult {
  imageId: string;
  analysis: {
    patterns: Array<{
      sequence: string;
      frequency: number;
      positions: Array<{ x: number; y: number }>;
    }>;
    complexity: number;
    uniqueGlyphs: number;
    totalGlyphs: number;
  };
  glyphs: GlyphDetection[];
  processingComplete: boolean;
}

interface ManuscriptUploadProps {
  onGlyphsDetected: (glyphs: GlyphDetection[]) => void;
}

export default function ManuscriptUpload({ onGlyphsDetected }: ManuscriptUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisOptions, setAnalysisOptions] = useState({
    autoDetectGlyphs: true,
    patternRecognition: true,
    frequencyMapping: true
  });

  // Fetch previously uploaded images
  const { data: manuscriptImages, isLoading: imagesLoading } = useQuery({
    queryKey: ['/api/manuscript/images'],
    select: (data) => data || []
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('autoDetectGlyphs', analysisOptions.autoDetectGlyphs.toString());
      formData.append('patternRecognition', analysisOptions.patternRecognition.toString());
      formData.append('frequencyMapping', analysisOptions.frequencyMapping.toString());

      const response = await apiRequest('POST', '/api/manuscript/upload', formData);
      return response.json();
    },
    onSuccess: (result) => {
      setUploadProgress(100);
      toast({
        title: "Upload Complete",
        description: `Detected ${result.glyphs.length} glyphs with ${result.analysis.patterns.length} patterns`,
      });
      onGlyphsDetected(result.glyphs);
      queryClient.invalidateQueries({ queryKey: ['/api/manuscript/images'] });
      
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 2000);
    },
    onError: (error: any) => {
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to process manuscript image",
        variant: "destructive"
      });
    }
  });

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileUpload(imageFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive"
      });
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = useCallback((file: File) => {
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    setUploadProgress(10);
    uploadMutation.mutate(file);
  }, [uploadMutation, toast]);

  const handleOptionChange = (option: keyof typeof analysisOptions) => {
    setAnalysisOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <Card className="analysis-card bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <FileImage className="voynich-green w-5 h-5 mr-3" />
        Manuscript Page Analysis
      </h2>
      
      {/* Upload Area */}
      <div 
        className={`upload-area border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragOver 
            ? 'drag-over border-amber-400 bg-amber-50' 
            : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploadMutation.isPending}
        />
        
        {uploadMutation.isPending ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
            <p className="text-gray-600 mb-2">Processing manuscript image...</p>
            {uploadProgress > 0 && (
              <div className="w-full max-w-xs">
                <Progress value={uploadProgress} className="mb-2" />
                <p className="text-sm text-gray-500">{uploadProgress}%</p>
              </div>
            )}
          </div>
        ) : (
          <>
            <CloudUpload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Upload Voynich manuscript page</p>
            <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            <p className="text-xs text-gray-400 mt-2">Click or drag and drop</p>
          </>
        )}
      </div>

      {/* Analysis Options */}
      <div className="mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Auto-detect glyphs</label>
          <Checkbox
            checked={analysisOptions.autoDetectGlyphs}
            onCheckedChange={() => handleOptionChange('autoDetectGlyphs')}
            disabled={uploadMutation.isPending}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Pattern recognition</label>
          <Checkbox
            checked={analysisOptions.patternRecognition}
            onCheckedChange={() => handleOptionChange('patternRecognition')}
            disabled={uploadMutation.isPending}
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Frequency mapping</label>
          <Checkbox
            checked={analysisOptions.frequencyMapping}
            onCheckedChange={() => handleOptionChange('frequencyMapping')}
            disabled={uploadMutation.isPending}
          />
        </div>
      </div>

      {/* Recent Uploads */}
      {manuscriptImages && manuscriptImages.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Uploads</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {manuscriptImages.slice(0, 3).map((image: any) => (
              <div key={image.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-2" />
                  <span className="truncate">{image.originalName}</span>
                </div>
                <span className="text-gray-500 text-xs">
                  {image.detectedGlyphs?.length || 0} glyphs
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {uploadMutation.error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-sm text-red-700">
            {uploadMutation.error instanceof Error 
              ? uploadMutation.error.message 
              : 'Upload failed. Please try again.'}
          </p>
        </div>
      )}
    </Card>
  );
}
