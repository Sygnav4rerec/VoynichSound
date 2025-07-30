import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bookmark, Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import type { WaveformType, MappingAlgorithm } from '@/lib/glyph-mapper';

interface PresetConfig {
  glyphSequence: string;
  baseFrequency: number;
  waveformType: WaveformType;
  mappingAlgorithm: MappingAlgorithm;
}

interface GlyphPreset {
  id: string;
  name: string;
  glyphSequence: string;
  baseFrequency: number;
  waveformType: string;
  mappingAlgorithm: string;
  createdAt: string;
}

interface PresetManagerProps {
  currentConfig: PresetConfig;
  onLoadPreset: (preset: PresetConfig) => void;
}

export default function PresetManager({ currentConfig, onLoadPreset }: PresetManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [presetName, setPresetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Fetch presets
  const { data: presets = [], isLoading: presetsLoading } = useQuery<GlyphPreset[]>({
    queryKey: ['/api/presets'],
    select: (data) => data || []
  });

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async (preset: { name: string } & PresetConfig) => {
      const response = await apiRequest('POST', '/api/presets', preset);
      return response.json();
    },
    onSuccess: (newPreset) => {
      toast({
        title: "Preset Saved",
        description: `"${newPreset.name}" has been saved successfully`,
      });
      setPresetName('');
      setShowSaveForm(false);
      queryClient.invalidateQueries({ queryKey: ['/api/presets'] });
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save preset",
        variant: "destructive"
      });
    }
  });

  // Delete preset mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (presetId: string) => {
      const response = await apiRequest('DELETE', `/api/presets/${presetId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Preset Deleted",
        description: "Preset has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/presets'] });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete preset",
        variant: "destructive"
      });
    }
  });

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for the preset",
        variant: "destructive"
      });
      return;
    }

    if (!currentConfig.glyphSequence.trim()) {
      toast({
        title: "No Glyphs",
        description: "Please enter some glyphs before saving a preset",
        variant: "destructive"
      });
      return;
    }

    savePresetMutation.mutate({
      name: presetName,
      ...currentConfig
    });
  };

  const handleLoadPreset = (preset: GlyphPreset) => {
    onLoadPreset({
      glyphSequence: preset.glyphSequence,
      baseFrequency: preset.baseFrequency,
      waveformType: preset.waveformType as WaveformType,
      mappingAlgorithm: preset.mappingAlgorithm as MappingAlgorithm
    });

    toast({
      title: "Preset Loaded",
      description: `"${preset.name}" configuration has been applied`,
    });
  };

  const handleDeletePreset = (preset: GlyphPreset) => {
    if (window.confirm(`Are you sure you want to delete "${preset.name}"?`)) {
      deletePresetMutation.mutate(preset.id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getAlgorithmDisplay = (algorithm: string) => {
    const algorithms: Record<string, string> = {
      unicode: 'Unicode Linear',
      phonetic: 'Phonetic',
      geometric: 'Geometric',
      psycholinguistic: 'Psycholinguistic'
    };
    return algorithms[algorithm] || algorithm;
  };

  return (
    <Card className="analysis-card bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <Bookmark className="voynich-indigo w-5 h-5 mr-3" />
        Preset Library
      </h2>
      
      {/* Presets List */}
      <ScrollArea className="max-h-64 mb-4">
        {presetsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : presets.length > 0 ? (
          <div className="space-y-3">
            {presets.map((preset) => (
              <div 
                key={preset.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-amber-300 transition-colors cursor-pointer group"
                onClick={() => handleLoadPreset(preset)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-800 group-hover:text-amber-700">
                        {preset.name}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePreset(preset);
                        }}
                        disabled={deletePresetMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 glyph-input truncate mb-1">
                      {preset.glyphSequence || 'No glyphs'}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{preset.baseFrequency}Hz • {getAlgorithmDisplay(preset.mappingAlgorithm)}</span>
                      <span>{formatDate(preset.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No presets saved yet</p>
          </div>
        )}
      </ScrollArea>

      {/* Save Preset Form */}
      {showSaveForm ? (
        <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
          <Input
            placeholder="Enter preset name..."
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            disabled={savePresetMutation.isPending}
          />
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="flex-1 voynich-indigo-bg hover:bg-indigo-600 text-white"
              onClick={handleSavePreset}
              disabled={savePresetMutation.isPending}
            >
              {savePresetMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setShowSaveForm(false);
                setPresetName('');
              }}
              disabled={savePresetMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50"
          variant="outline"
          onClick={() => setShowSaveForm(true)}
          disabled={!currentConfig.glyphSequence.trim()}
        >
          <Plus className="w-4 h-4 mr-2" />
          Save Current as Preset
        </Button>
      )}

      {/* Quick Load Actions */}
      {presets.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs"
              onClick={() => {
                const lastPreset = presets[0];
                if (lastPreset) handleLoadPreset(lastPreset);
              }}
            >
              <Upload className="w-3 h-3 mr-1" />
              Load Recent
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
