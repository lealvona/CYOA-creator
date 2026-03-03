import { useEffect, useCallback, type FC } from 'react';

export interface KeyboardShortcutsProps {
  /** Callback when shortcut is triggered */
  onShortcut?: (key: string) => void;
  /** Whether shortcuts are enabled */
  enabled?: boolean;
}

export const KeyboardShortcuts: FC<KeyboardShortcutsProps> = ({ 
  onShortcut,
  enabled = true 
}) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    
    // Don't trigger when typing in input fields
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = event.key;
    
    // Handle specific shortcuts
    switch (key) {
      case ' ':
        event.preventDefault();
        onShortcut?.('space');
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onShortcut?.('arrowleft');
        break;
      case 'ArrowRight':
        event.preventDefault();
        onShortcut?.('arrowright');
        break;
      case 'm':
      case 'M':
        onShortcut?.('m');
        break;
      case 'f':
      case 'F':
        event.preventDefault();
        onShortcut?.('f');
        break;
      case 'Escape':
        onShortcut?.('escape');
        break;
      case '?':
        event.preventDefault();
        onShortcut?.('?');
        break;
      case 'r':
      case 'R':
        onShortcut?.('r');
        break;
      default:
        // Handle number keys 1-9
        if (key >= '1' && key <= '9') {
          onShortcut?.(key);
        }
        break;
    }
  }, [enabled, onShortcut]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return null; // This is a logic component, no visual output
};

export default KeyboardShortcuts;
