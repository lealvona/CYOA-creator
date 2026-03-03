/**
 * Keyboard shortcuts configuration
 */

export interface KeyboardShortcut {
  key: string;
  action: string;
  context: string;
}

export const SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Space', action: 'Play/Pause video', context: 'Video Player' },
  { key: '←', action: 'Seek backward 10s', context: 'Video Player' },
  { key: '→', action: 'Seek forward 10s', context: 'Video Player' },
  { key: 'M', action: 'Toggle mute', context: 'Video Player' },
  { key: 'F', action: 'Toggle fullscreen', context: 'Video Player' },
  { key: '1-9', action: 'Select choice N', context: 'Choice Overlay' },
  { key: 'Escape', action: 'Close modal / Go back', context: 'Global' },
  { key: '?', action: 'Show this help', context: 'Global' },
  { key: 'R', action: 'Restart story', context: 'Story Viewer' },
];
