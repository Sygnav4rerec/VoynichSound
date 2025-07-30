import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface DebugPanelProps {
  onToggleRendering?: (enabled: boolean) => void;
  onToggleAudio?: (enabled: boolean) => void;
  onToggleVisualization?: (enabled: boolean) => void;
}

export default function DebugPanel({ 
  onToggleRendering, 
  onToggleAudio, 
  onToggleVisualization 
}: DebugPanelProps) {
  const [renderingEnabled, setRenderingEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [visualizationEnabled, setVisualizationEnabled] = useState(false);

  const handleRenderingToggle = (enabled: boolean) => {
    setRenderingEnabled(enabled);
    onToggleRendering?.(enabled);
  };

  const handleAudioToggle = (enabled: boolean) => {
    setAudioEnabled(enabled);
    onToggleAudio?.(enabled);
  };

  const handleVisualizationToggle = (enabled: boolean) => {
    setVisualizationEnabled(enabled);
    onToggleVisualization?.(enabled);
  };

  const clearConsole = () => {
    console.clear();
    console.log('Console cleared - ready for fresh glyph analysis');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-sm">Debug Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="rendering"
            checked={renderingEnabled}
            onCheckedChange={handleRenderingToggle}
            disabled={true}
          />
          <Label htmlFor="rendering" className="text-sm">
            Canvas Rendering (Disabled for stability)
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="audio"
            checked={audioEnabled}
            onCheckedChange={handleAudioToggle}
            disabled={true}
          />
          <Label htmlFor="audio" className="text-sm">
            Audio Processing (Disabled for stability)
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="visualization"
            checked={visualizationEnabled}
            onCheckedChange={handleVisualizationToggle}
            disabled={true}
          />
          <Label htmlFor="visualization" className="text-sm">
            Live Visualization (Disabled for stability)
          </Label>
        </div>

        <div className="pt-2 border-t">
          <Button 
            onClick={clearConsole}
            variant="outline" 
            size="sm"
            className="w-full"
          >
            Clear Console Log
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Current Mode: Text-only frequency analysis</p>
          <p>Output: Browser console (F12)</p>
        </div>
      </CardContent>
    </Card>
  );
}