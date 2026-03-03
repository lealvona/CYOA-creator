# Android Creator App

The Android Creator is a companion mobile app for creating interactive stories on Android devices.

## Overview

The Android Creator allows you to:
- Create and manage story projects
- Record video scenes in-app
- Write story scripts with markdown
- Export complete story packages
- Import and edit existing packages

## Features

### Project Management
- Create new projects
- Resume existing projects
- Organize scenes and scripts
- Room database persistence

### Video Recording
- CameraX integration
- In-app recording flow
- Record/Retake functionality
- Gallery import option

### Script Writing
- Markdown-based script format
- Structured scene templates
- LLM fallback for prose conversion
- Real-time preview

### Export/Import
- ZIP package export
- Streaming video encoding
- Package manifest generation
- Import incomplete drafts

## Project Structure

```
android-creator/
├── app/
│   ├── build.gradle.kts
│   └── src/
│       └── main/
│           ├── AndroidManifest.xml
│           ├── java/
│           │   └── com/example/cyoacreator/
│           │       ├── MainActivity.kt
│           │       ├── MainViewModel.kt
│           │       ├── MarkdownParser.kt
│           │       ├── LlmFallbackClient.kt
│           │       ├── PackageExporter.kt
│           │       ├── ProjectDatabase.kt
│           │       └── ProjectRepository.kt
│           └── res/
│               ├── layout/
│               └── values/
├── build.gradle.kts
├── settings.gradle.kts
└── gradle/
    └── wrapper/
```

## Setup Instructions

### Prerequisites

- Android Studio Arctic Fox or later
- Android SDK 21+ (Android 5.0)
- Kotlin 1.5+
- Gradle 7.0+

### Build

```bash
cd android-creator
./gradlew assembleDebug
```

### Run

1. Open project in Android Studio
2. Connect Android device or start emulator
3. Click "Run" (Shift+F10)

## Architecture

### MVVM Pattern

- **Model**: Room database entities
- **View**: Compose UI components
- **ViewModel**: Business logic and state management

### Key Components

**MainActivity.kt**
- Entry point
- Navigation host
- Permission handling

**MainViewModel.kt**
- Project state management
- User actions
- Data transformation

**ProjectDatabase.kt**
- Room database setup
- Entity definitions
- DAO interfaces

**MarkdownParser.kt**
- Parse markdown to story JSON
- Scene extraction
- Choice detection

**LlmFallbackClient.kt**
- OpenAI-compatible API client
- Prose to structured conversion
- Error handling

**PackageExporter.kt**
- ZIP creation
- Video transcoding
- Manifest generation

## Script Format

The app uses markdown for writing stories:

```markdown
# My Story

## Scene 1: Introduction

You stand at the entrance of an ancient temple.

### Choices:
- [Enter the temple](scene2)
- [Walk away](ending1)

## Scene 2: The Chamber

Inside, you see mysterious symbols on the walls.

### Choices:
- [Examine symbols](ending2)
- [Leave quickly](ending1)
```

### Markdown Conventions

- `# Title` - Story title
- `## Scene ID: Title` - Scene header
- Scene content - Description/narration
- `### Choices:` - Choice section
- `- [Label](target)` - Choice format

## Export Format

Exported packages follow the web app format:

```
package.zip
├── package.manifest.json
├── story.json
└── videos/
    ├── scene1.mp4
    ├── scene2.mp4
    └── ...
```

### Manifest Format

```json
{
  "format": "interactive-story",
  "version": "1.0.0",
  "title": "My Story",
  "storyFile": "story.json",
  "videos": ["scene1.mp4", "scene2.mp4"],
  "completeness": "complete"
}
```

## Import Flow

1. User selects ZIP file
2. App validates manifest
3. Extracts videos to app storage
4. Parses story.json
5. Creates editable project
6. Shows completion status

## Development Status

**Complete:**
- Project structure
- Database schema
- Basic UI scaffold
- Package export logic

**In Progress:**
- CameraX capture UI polish
- Export wizard finalization

**Future:**
- Cloud sync
- Collaboration features
- Advanced editing tools

## Known Limitations

- CameraX capture UI needs polish
- Full export wizard pending
- No cloud backup yet
- Limited to single-device editing

## Contributing

To contribute to the Android app:

1. Fork the repository
2. Create feature branch
3. Follow Kotlin style guide
4. Add tests for new features
5. Submit PR with description

## Resources

- [Android Developer Guide](https://developer.android.com/)
- [CameraX Documentation](https://developer.android.com/training/camerax)
- [Room Persistence Library](https://developer.android.com/training/data-storage/room)
- [Jetpack Compose](https://developer.android.com/jetpack/compose)

## License

See main project LICENSE file. Dual-licensed for educational use.
