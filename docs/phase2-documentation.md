# Phase 2: Documentation Restructure

## Overview

This phase moves all technical documentation from the root README into organized docs/ files, creates comprehensive branding documentation, and rewrites the root README to be exciting and user-focused.

## Branch
`feature/docs-restructure`

## Implementation Steps

### Step 2.1: Create Documentation Structure

Create directory structure:
```
docs/
├── README.md                    # Documentation index
├── phase1-branding.md          # Phase 1 implementation plan
├── phase2-documentation.md     # Phase 2 implementation plan
├── phase3-polish.md            # Phase 3 implementation plan
├── phase4-integration.md       # Phase 4 implementation plan
├── quickstart.md               # Quick start guide
├── architecture.md             # System architecture
├── story-format.md             # Story JSON format
├── api-reference.md            # Engine API reference
├── components.md               # Component reference
├── themes.md                   # Theme system documentation
├── branding.md                 # Brand customization guide
├── contributing.md             # Contribution guidelines
├── android-creator/
│   └── README.md              # Android-specific docs
└── assets/                     # Documentation images
```

### Step 2.2: Extract Quick Start Guide

**Source**: README.md lines 36-63
**Destination**: `docs/quickstart.md`

Content structure:
- Prerequisites (Node.js, npm, ffmpeg)
- Installation steps
- Running the app
- Creating your first story
- Next steps

### Step 2.3: Extract Architecture Documentation

**Source**: README.md lines 67-111
**Destination**: `docs/architecture.md`

Content:
- System overview diagram
- Data flow explanation
- Component hierarchy
- State management
- File organization

### Step 2.4: Extract Story Format Documentation

**Source**: README.md lines 206-310
**Destination**: `docs/story-format.md`

Content:
- JSON schema overview
- Top-level structure
- Node types and fields
- Choice configuration
- Conditional branching with flags
- Complete examples

### Step 2.5: Extract API Reference

**Source**: README.md lines 498-563
**Destination**: `docs/api-reference.md`

Content:
- StoryEngine class methods
- Event system
- useStoryEngine hook
- TypeScript interfaces

### Step 2.6: Extract Component Reference

**Source**: README.md lines 440-495
**Destination**: `docs/components.md`

Content:
- StoryViewer props
- VideoPlayer props
- ChoiceOverlay props
- StartScreen/EndScreen usage

### Step 2.7: Move Android Creator Documentation

**Source**: README.md lines 651-683
**Destination**: `android-creator/README.md`

Create comprehensive Android README:
- Overview of Android creator app
- Setup instructions
- Build commands
- Feature list
- Architecture notes
- Development guide

### Step 2.8: Create Branding Documentation

**File**: `docs/branding.md`

Content:
- Overview of branding system
- How to customize colors
- How to replace assets
- Educational institution best practices
- Color contrast guidelines
- Accessibility requirements
- Theme creation guide

### Step 2.9: Create Theme System Documentation

**File**: `docs/themes.md`

Content:
- Available themes list
- How to switch themes
- System preference detection
- Creating custom themes
- Theme lock functionality
- CSS variable reference

### Step 2.10: Create Contributing Guidelines

**File**: `docs/contributing.md`

Content:
- Code style guidelines
- Commit message format
- Pull request process
- Testing requirements
- Documentation standards

### Step 2.11: Rewrite Root README

**Current**: Technical documentation (740 lines)
**New**: Exciting, user-focused landing page

New structure:

```markdown
# Interactive Story Engine

[Hero Logo/Animation]

> Create immersive, branching video stories that engage and educate.

## ✨ What is it?

The Interactive Story Engine lets you create choose-your-own-adventure 
experiences with video. Viewers watch scenes and make choices that shape 
the narrative, leading to multiple endings.

**Perfect for:**
- 🎓 Educational storytelling
- 🎮 Interactive training
- 🎬 Branching narratives
- 📚 Digital learning experiences

## 🚀 Quick Start

```bash
npm install
npm run dev:all
```

Open http://localhost:5173 and start creating!

[Full Quick Start Guide →](docs/quickstart.md)

## 🎯 Features

- **Branching Narratives** - Create complex story trees with choices
- **Video Playback** - HTML5 video with smooth transitions
- **Conditional Logic** - Flag-based branching for replayability
- **Progress Persistence** - Auto-save and resume anywhere
- **ZIP Import/Export** - Share stories as portable packages
- **Android Creator** - Record and edit on mobile
- **Multi-Theme** - Customize branding for your institution
- **Accessibility** - Keyboard navigation, screen reader support

## 🛠️ Tech Stack

React 19 + TypeScript + Vite + Express + Kotlin

## 📚 Documentation

- [Quick Start](docs/quickstart.md) - Get up and running
- [Architecture](docs/architecture.md) - How it works
- [Story Format](docs/story-format.md) - Create stories
- [API Reference](docs/api-reference.md) - Programmatic usage
- [Components](docs/components.md) - UI components
- [Branding](docs/branding.md) - Customize appearance
- [All Docs](docs/)

## 🎓 Educational Use

This project is dual-licensed for educational institutions.
Free for educational purposes. See [LICENSE](LICENSE) for details.

## 🖼️ Screenshots

[Story Library Screenshot]
[Story Player Screenshot]
[Choice Overlay Screenshot]

## 🤝 Contributing

We welcome contributions! See [Contributing Guide](docs/contributing.md).

---

Built with ❤️ for interactive storytelling.
```

### Step 2.12: Create Documentation Index

**File**: `docs/README.md`

Organized index of all documentation with descriptions and quick links.

### Step 2.13: Commit and Create PR

**Commit Message**:
```
docs: Restructure documentation and rewrite README

- Move technical docs from README to docs/ folder
- Create comprehensive documentation structure
- Move Android docs to android-creator/README.md
- Rewrite root README with exciting, user-focused content
- Add branding customization guide
- Add theme system documentation
- Add contributing guidelines
- Create documentation index

New docs:
- docs/quickstart.md
- docs/architecture.md
- docs/story-format.md
- docs/api-reference.md
- docs/components.md
- docs/themes.md
- docs/branding.md
- docs/contributing.md
- android-creator/README.md
```

**PR Checklist**:
- [ ] All links work correctly
- [ ] README renders well on GitHub
- [ ] Documentation is clear and complete
- [ ] Screenshots added (or placeholders noted)
- [ ] No broken references
- [ ] Android docs complete

## Content Migration Checklist

| Section | Source Lines | Destination | Status |
|---------|-------------|-------------|--------|
| Quick Start | 36-63 | docs/quickstart.md | ⏳ |
| Architecture | 67-111 | docs/architecture.md | ⏳ |
| Story Format | 206-310 | docs/story-format.md | ⏳ |
| API Reference | 498-563 | docs/api-reference.md | ⏳ |
| Components | 440-495 | docs/components.md | ⏳ |
| Android Creator | 651-683 | android-creator/README.md | ⏳ |
| Extending | 566-648 | docs/contributing.md | ⏳ |

## README Rewrite Guidelines

**Tone**: Exciting, welcoming, inspiring
**Audience**: Educators, developers, content creators
**Length**: ~100-150 lines (vs current 740)
**Focus**: Value proposition, features, quick start

**Must Include**:
- Eye-catching hero
- One-line value prop
- 3-step quickstart
- Feature highlights with emojis
- Links to full docs
- Educational license notice
- Screenshots/graphics

**Must Exclude**:
- Detailed API docs
- Technical implementation details
- Long code examples
- CLI tool documentation
- Android build instructions

## Next Phase

After completing Phase 2, proceed to [Phase 3: Polish & Features](phase3-polish.md).
