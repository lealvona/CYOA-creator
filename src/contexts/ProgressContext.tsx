import { createContext, useContext, useCallback, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'ppd-story-progress';
const EXPIRY_DAYS = 30;

export interface ProgressSlot {
  storyId: string;
  storyName: string;
  timestamp: number;
  nodeId: string;
  history: Array<{ nodeId: string; timestamp: number; choiceId?: string }>;
  flags: string[];
}

export interface ProgressContextType {
  /** Save current progress */
  saveProgress: (slot: ProgressSlot) => void;
  /** Load progress for a story */
  loadProgress: (storyId: string) => ProgressSlot | null;
  /** Export all progress as JSON */
  exportProgress: () => string;
  /** Import progress from JSON */
  importProgress: (json: string) => boolean;
  /** Delete progress for a story */
  deleteProgress: (storyId: string) => void;
  /** Get all saved slots */
  slots: ProgressSlot[];
  /** Clear expired progress */
  clearExpired: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<ProgressSlot[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as ProgressSlot[];
        // Filter out expired entries
        const now = Date.now();
        const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        return parsed.filter(slot => now - slot.timestamp < expiryTime);
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  const saveProgress = useCallback((slot: ProgressSlot) => {
    setSlots(current => {
      const filtered = current.filter(s => s.storyId !== slot.storyId);
      const updated = [...filtered, { ...slot, timestamp: Date.now() }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const loadProgress = useCallback((storyId: string): ProgressSlot | null => {
    const slot = slots.find(s => s.storyId === storyId);
    if (!slot) return null;
    
    // Check if expired
    const now = Date.now();
    const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (now - slot.timestamp > expiryTime) {
      deleteProgress(storyId);
      return null;
    }
    
    return slot;
  }, [slots]);

  const deleteProgress = useCallback((storyId: string) => {
    setSlots(current => {
      const updated = current.filter(s => s.storyId !== storyId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const exportProgress = useCallback((): string => {
    return JSON.stringify(slots, null, 2);
  }, [slots]);

  const importProgress = useCallback((json: string): boolean => {
    try {
      const imported = JSON.parse(json) as ProgressSlot[];
      if (!Array.isArray(imported)) return false;
      
      // Validate structure
      const valid = imported.every(slot => 
        slot.storyId && 
        slot.storyName && 
        slot.nodeId && 
        Array.isArray(slot.history) && 
        Array.isArray(slot.flags)
      );
      
      if (!valid) return false;
      
      setSlots(imported);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
      return true;
    } catch {
      return false;
    }
  }, []);

  const clearExpired = useCallback(() => {
    setSlots(current => {
      const now = Date.now();
      const expiryTime = EXPIRY_DAYS * 24 * 60 * 60 * 1000;
      const updated = current.filter(slot => now - slot.timestamp < expiryTime);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value: ProgressContextType = {
    saveProgress,
    loadProgress,
    exportProgress,
    importProgress,
    deleteProgress,
    slots,
    clearExpired,
  };

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextType {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}

export default ProgressContext;
