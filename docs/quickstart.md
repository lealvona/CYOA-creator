# Quick Start Guide

Get up and running with the Interactive Story Engine in 5 minutes.

## Prerequisites

- **Node.js** >= 18 ([Download](https://nodejs.org/))
- **npm** >= 9 (comes with Node.js)
- **ffmpeg** (optional, for placeholder videos)

### Install ffmpeg

```bash
# Windows
winget install ffmpeg

# macOS
brew install ffmpeg

# Linux
sudo apt install ffmpeg
```

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/lealvona/PPD-example.git
cd PPD-example
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages including:
- React 19
- TypeScript
- Vite
- Express
- Testing libraries

### 3. Generate Placeholder Videos (Optional)

If you have ffmpeg installed:

```bash
npm run generate-placeholders
```

This creates sample videos for the demo story.

## Running the Application

### Development Mode

Start both the web app and import API:

```bash
npm run dev:all
```

This starts:
- Web app: http://localhost:5173
- Import API: http://localhost:8787

### Web Only

If you only need the web player:

```bash
npm run dev
```

### API Only

If you only need the import API:

```bash
npm run dev:api
```

## First Steps

### 1. Open the Application

Navigate to http://localhost:5173 in your browser.

You should see the **Story Library** with the sample story.

### 2. Play the Sample Story

1. Click on "The Forgotten Lab" story card
2. Click "Begin Story" on the start screen
3. Watch the video and make choices
4. Experience multiple paths and endings

### 3. Explore the Library

- **Import stories**: Upload ZIP packages
- **View story details**: See metadata and completeness
- **Switch themes**: Use the theme selector (if enabled)

## Creating Your First Story

### 1. Create Story Directory

```bash
mkdir -p public/stories/my-first-story/videos
```

### 2. Create Story Definition

Create `public/stories/my-first-story/story.json`:

```json
{
  "meta": {
    "title": "My First Story",
    "description": "A simple branching story",
    "author": "Your Name",
    "version": "1.0.0",
    "estimatedMinutes": 5
  },
  "config": {
    "videoBasePath": "/stories/my-first-story/videos"
  },
  "startNodeId": "intro",
  "nodes": [
    {
      "id": "intro",
      "title": "Introduction",
      "type": "start",
      "videoFile": "intro.mp4",
      "choices": [
        {
          "id": "choice_a",
          "label": "Go left",
          "targetNodeId": "left_path"
        },
        {
          "id": "choice_b",
          "label": "Go right",
          "targetNodeId": "right_path"
        }
      ]
    },
    {
      "id": "left_path",
      "title": "Left Path",
      "type": "video",
      "videoFile": "left.mp4",
      "choices": [
        {
          "id": "to_ending",
          "label": "Continue",
          "targetNodeId": "ending"
        }
      ]
    },
    {
      "id": "right_path",
      "title": "Right Path",
      "type": "video",
      "videoFile": "right.mp4",
      "choices": [
        {
          "id": "to_ending",
          "label": "Continue",
          "targetNodeId": "ending"
        }
      ]
    },
    {
      "id": "ending",
      "title": "The End",
      "type": "ending",
      "videoFile": "ending.mp4",
      "choices": []
    }
  ]
}
```

### 3. Add Video Files

Place your videos in `public/stories/my-first-story/videos/`:
- `intro.mp4`
- `left.mp4`
- `right.mp4`
- `ending.mp4`

### 4. Validate Your Story

```bash
npm run validate-story public/stories/my-first-story/story.json
```

### 5. Test Your Story

1. Refresh the browser
2. Your story should appear in the library
3. Click "Play" to test it

## Next Steps

### Learn the Story Format

Read [Story Format Documentation](story-format.md) for:
- Advanced node types
- Conditional branching with flags
- Timed choices
- Theme customization per node

### Explore Components

See [Component Reference](components.md) for:
- StoryViewer props
- VideoPlayer configuration
- Custom overlays

### Customize Branding

Check [Branding Guide](branding.md) for:
- Changing colors
- Replacing the logo
- Creating custom themes
- Locking themes for your institution

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web dev server |
| `npm run dev:api` | Start import API |
| `npm run dev:all` | Start both web and API |
| `npm run build` | Production build |
| `npm run test` | Run tests |
| `npm run lint` | Check code style |
| `npm run validate-story [path]` | Validate story JSON |
| `npm run generate-placeholders` | Generate placeholder videos |

## Troubleshooting

### Port Already in Use

If port 5173 or 8787 is in use:

```bash
# Kill processes on those ports
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:5173 | xargs kill -9
```

### Videos Not Playing

1. Check video format (MP4 or WebM recommended)
2. Verify file paths match `story.json`
3. Check browser console for errors
4. Ensure CORS is properly configured (for external videos)

### Story Not Appearing

1. Check `story.json` is valid JSON
2. Run validation: `npm run validate-story [path]`
3. Check browser console for errors
4. Verify file paths are correct

### Theme Not Applying

1. Check browser console for errors
2. Clear localStorage and reload
3. Verify theme configuration
4. Check CSS variables are defined

## Keyboard Shortcuts

While playing a story:

- **Space**: Play/Pause
- **←/→**: Seek backward/forward 10s
- **M**: Toggle mute
- **F**: Toggle fullscreen
- **1-9**: Select choice (when choices shown)
- **Escape**: Close modal / Go back
- **?**: Show keyboard shortcuts
- **R**: Restart story

## Getting Help

- Check [Architecture Documentation](architecture.md) for system overview
- See [API Reference](api-reference.md) for programmatic usage
- Review [Component Reference](components.md) for UI customization
- Read [Branding Guide](branding.md) for theme customization

## Support

For bugs or feature requests, please open an issue on GitHub.

For educational institutions, see the dual-license information in the main README.

---

Happy storytelling! 🎬✨
