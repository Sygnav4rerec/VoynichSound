import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { StickyNote, Save, Clock, AlertCircle } from 'lucide-react';

interface ResearchNotesProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export default function ResearchNotes({ notes, onNotesChange }: ResearchNotesProps) {
  const { toast } = useToast();
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !hasUnsavedChanges) return;

    const autoSaveTimer = setTimeout(() => {
      handleSave(true);
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [notes, hasUnsavedChanges, autoSaveEnabled]);

  // Mark as having unsaved changes when notes change
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [notes]);

  // Load saved notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('voynich-research-notes');
    const savedTimestamp = localStorage.getItem('voynich-research-notes-timestamp');
    
    if (savedNotes && !notes) {
      onNotesChange(savedNotes);
      if (savedTimestamp) {
        setLastSaved(new Date(savedTimestamp));
      }
    }
  }, []);

  const handleSave = useCallback(async (isAutoSave = false) => {
    if (!notes.trim() && !isAutoSave) {
      toast({
        title: "Nothing to Save",
        description: "Please enter some notes before saving",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);

    try {
      // Save to localStorage (in a real app, this would be an API call)
      localStorage.setItem('voynich-research-notes', notes);
      const timestamp = new Date();
      localStorage.setItem('voynich-research-notes-timestamp', timestamp.toISOString());
      
      setLastSaved(timestamp);
      setHasUnsavedChanges(false);

      if (!isAutoSave) {
        toast({
          title: "Notes Saved",
          description: "Your research notes have been saved successfully",
        });
      }
    } catch (error) {
      console.error('Failed to save notes:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save notes. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [notes, toast]);

  const handleNotesChange = (value: string) => {
    onNotesChange(value);
  };

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 minute ago';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWordCount = () => {
    return notes.trim() ? notes.trim().split(/\s+/).length : 0;
  };

  const getCharacterCount = () => {
    return notes.length;
  };

  return (
    <Card className="analysis-card bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <StickyNote className="voynich-amber w-5 h-5 mr-3" />
        Research Notes
      </h2>
      
      {/* Notes Textarea */}
      <Textarea 
        className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
        placeholder="Document your observations and theories about the Voynich manuscript patterns, frequency relationships, and linguistic insights..."
        value={notes}
        onChange={(e) => handleNotesChange(e.target.value)}
      />
      
      {/* Notes Statistics */}
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{getWordCount()} words</span>
          <span>{getCharacterCount()} characters</span>
        </div>
        {hasUnsavedChanges && (
          <div className="flex items-center text-amber-600">
            <AlertCircle className="w-3 h-3 mr-1" />
            <span>Unsaved changes</span>
          </div>
        )}
      </div>

      {/* Save Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          <span>
            Auto-saved <span className="font-medium">{formatLastSaved(lastSaved)}</span>
          </span>
        </div>
        <Button 
          size="sm"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          onClick={() => handleSave(false)}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <>
              <div className="w-3 h-3 mr-1 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-3 h-3 mr-1" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Research Templates */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-2">Quick Templates</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs justify-start"
            onClick={() => {
              const template = `Pattern Analysis:\n- Frequency: \n- Distribution: \n- Context: \n\nObservations:\n- \n\nHypothesis:\n- `;
              handleNotesChange(notes + (notes ? '\n\n' : '') + template);
            }}
          >
            Pattern Template
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs justify-start"
            onClick={() => {
              const template = `Frequency Analysis:\n- Base: Hz\n- Harmonics: \n- Resonance: \n\nMapping Results:\n- Algorithm: \n- Effectiveness: \n\nNext Steps:\n- `;
              handleNotesChange(notes + (notes ? '\n\n' : '') + template);
            }}
          >
            Frequency Template
          </Button>
        </div>
      </div>

      {/* Auto-save Toggle */}
      <div className="mt-3 flex items-center justify-between">
        <label className="flex items-center text-xs text-gray-600">
          <input
            type="checkbox"
            checked={autoSaveEnabled}
            onChange={(e) => setAutoSaveEnabled(e.target.checked)}
            className="mr-2 h-3 w-3"
          />
          Auto-save enabled
        </label>
        {notes.trim() && (
          <Button
            size="sm"
            variant="ghost"
            className="text-xs text-gray-500 hover:text-gray-700"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all notes?')) {
                handleNotesChange('');
                localStorage.removeItem('voynich-research-notes');
                localStorage.removeItem('voynich-research-notes-timestamp');
                setLastSaved(null);
                setHasUnsavedChanges(false);
              }
            }}
          >
            Clear All
          </Button>
        )}
      </div>
    </Card>
  );
}
