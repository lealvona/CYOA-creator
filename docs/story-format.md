# Story Format Reference

Complete guide to creating story definition files.

## Overview

Stories are defined in JSON files. Each story consists of:
- **Metadata**: Title, author, description
- **Configuration**: Video paths, settings
- **Nodes**: Individual scenes with videos and choices

## Basic Structure

```json
{
  "meta": {
    "title": "Story Title",
    "description": "Brief description",
    "author": "Author Name",
    "version": "1.0.0",
    "date": "2026-01-15",
    "estimatedMinutes": 10,
    "tags": ["adventure", "mystery"]
  },
  "config": {
    "videoBasePath": "/stories/my-story/videos",
    "preloadNext": true,
    "defaultVolume": 0.8,
    "choiceLeadTime": 0,
    "allowRevisit": true
  },
  "startNodeId": "intro",
  "nodes": [
    // Array of story nodes
  ]
}
```

## Top-Level Fields

### `meta` (required)

Story metadata for display.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Story title shown in library and start screen |
| `description` | string | Yes | Brief description (1-2 sentences) |
| `author` | string | No | Author or organization name |
| `version` | string | No | Version number (semver) |
| `date` | string | No | Creation date (ISO 8601) |
| `estimatedMinutes` | number | No | Estimated play time |
| `tags` | string[] | No | Array of tags for categorization |

Example:
```json
{
  "meta": {
    "title": "The Forgotten Lab",
    "description": "Explore an abandoned laboratory and uncover its secrets.",
    "author": "Interactive PPD Team",
    "version": "1.0.0",
    "date": "2026-01-15",
    "estimatedMinutes": 5,
    "tags": ["mystery", "sci-fi", "adventure"]
  }
}
```

### `config` (required)

Playback configuration.

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `videoBasePath` | string | Yes | - | Directory containing videos |
| `preloadNext` | boolean | No | true | Preload upcoming videos |
| `defaultVolume` | number | No | 1.0 | Initial volume (0.0-1.0) |
| `choiceLeadTime` | number | No | 0 | Seconds before end to show choices |
| `allowRevisit` | boolean | No | false | Allow going back to previous nodes |

Example:
```json
{
  "config": {
    "videoBasePath": "/stories/my-story/videos",
    "preloadNext": true,
    "defaultVolume": 0.8,
    "choiceLeadTime": 2,
    "allowRevisit": true
  }
}
```

### `startNodeId` (required)

The ID of the first node to play.

```json
{
  "startNodeId": "intro"
}
```

### `nodes` (required)

Array of story nodes. See [Node Types](#node-types).

```json
{
  "nodes": [
    {
      "id": "intro",
      "type": "start",
      // ...
    }
  ]
}
```

## Node Types

### Start Node

Entry point of the story. Exactly one required.

```json
{
  "id": "intro",
  "title": "Introduction",
  "type": "start",
  "videoFile": "intro.mp4",
  "choices": [
    {
      "id": "begin",
      "label": "Enter the lab",
      "targetNodeId": "hallway"
    }
  ]
}
```

### Video Node

Standard scene with choices leading to other nodes.

```json
{
  "id": "hallway",
  "title": "The Hallway",
  "type": "video",
  "videoFile": "hallway.mp4",
  "subtitle": "A long corridor stretches ahead.",
  "choices": [
    {
      "id": "left",
      "label": "Go left",
      "targetNodeId": "storage"
    },
    {
      "id": "right",
      "label": "Go right",
      "targetNodeId": "terminal"
    }
  ],
  "setsFlags": ["visited_hallway"]
}
```

### Ending Node

Terminal node with no choices.

```json
{
  "id": "good_ending",
  "title": "Escape Successful",
  "type": "ending",
  "videoFile": "ending_good.mp4",
  "choices": []
}
```

## Node Fields

### Common Fields (All Types)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `title` | string | Yes | Human-readable title |
| `type` | string | Yes | `"start"`, `"video"`, or `"ending"` |
| `videoFile` | string | Yes | Video filename |
| `choices` | array | Yes | Available choices (empty for endings) |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `subtitle` | string | Text shown below video |
| `theme` | string | CSS class or color for this node |
| `setsFlags` | string[] | Flags to set when visiting |
| `choiceTiming` | string | When to show choices |

## Choice Configuration

### Basic Choice

```json
{
  "id": "choice_left",
  "label": "Go left",
  "targetNodeId": "storage_room"
}
```

### Conditional Choice

Only shown if player has flag:

```json
{
  "id": "use_keycard",
  "label": "Use the keycard",
  "targetNodeId": "secret_room",
  "condition": "has_keycard"
}
```

### Timed Choice

Shown at specific time during video:

```json
{
  "id": "choice_quick",
  "label": "Act quickly!",
  "targetNodeId": "escape",
  "showAtTime": 4.5
}
```

## Choice Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique within node |
| `label` | string | Yes | Button text |
| `targetNodeId` | string | Yes | Node to navigate to |
| `condition` | string | No | Required flag |
| `showAtTime` | number | No | Show at this timestamp (seconds) |

## Conditional Branching with Flags

Flags enable complex story logic.

### Setting Flags

```json
{
  "id": "storage",
  "type": "video",
  "videoFile": "storage.mp4",
  "setsFlags": ["has_keycard", "visited_storage"],
  "choices": [...]
}
```

### Using Flags

```json
// Node that checks for flag
{
  "id": "exit",
  "type": "video",
  "videoFile": "exit.mp4",
  "choices": [
    {
      "id": "use_keycard",
      "label": "Use the keycard",
      "targetNodeId": "secret_exit",
      "condition": "has_keycard"
    },
    {
      "id": "regular_exit",
      "label": "Exit normally",
      "targetNodeId": "lobby"
    }
  ]
}
```

### Flag Best Practices

- Use descriptive names: `has_item`, `visited_location`, `talked_to_npc`
- Set multiple flags: `["has_key", "knows_password"]`
- Check single flags per choice
- Flags persist for entire playthrough

## Choice Timing

Control when choices appear.

### `choiceTiming` Field

| Value | Description |
|-------|-------------|
| `"on_end"` | Show after video ends (default) |
| `"during_video"` | Show while video plays |
| `"on_pause"` | Show when user pauses |

### Example: During Video

```json
{
  "id": "timed_decision",
  "type": "video",
  "videoFile": "action.mp4",
  "choiceTiming": "during_video",
  "choices": [
    {
      "id": "quick",
      "label": "Act now!",
      "targetNodeId": "success",
      "showAtTime": 3.0
    },
    {
      "id": "wait",
      "label": "Wait...",
      "targetNodeId": "too_late",
      "showAtTime": 8.0
    }
  ]
}
```

## Complete Example

```json
{
  "meta": {
    "title": "The Lab",
    "description": "A short branching story.",
    "author": "Your Name",
    "version": "1.0.0",
    "estimatedMinutes": 3
  },
  "config": {
    "videoBasePath": "/stories/lab/videos",
    "preloadNext": true,
    "defaultVolume": 1.0,
    "allowRevisit": false
  },
  "startNodeId": "intro",
  "nodes": [
    {
      "id": "intro",
      "title": "The Lab Entrance",
      "type": "start",
      "videoFile": "intro.mp4",
      "choices": [
        {
          "id": "enter",
          "label": "Enter the lab",
          "targetNodeId": "hallway"
        }
      ]
    },
    {
      "id": "hallway",
      "title": "Dark Hallway",
      "type": "video",
      "videoFile": "hallway.mp4",
      "choices": [
        {
          "id": "left",
          "label": "Check the storage room",
          "targetNodeId": "storage"
        },
        {
          "id": "right",
          "label": "Go to the exit",
          "targetNodeId": "exit"
        }
      ]
    },
    {
      "id": "storage",
      "title": "Storage Room",
      "type": "video",
      "videoFile": "storage.mp4",
      "setsFlags": ["has_keycard"],
      "choices": [
        {
          "id": "back",
          "label": "Return to hallway",
          "targetNodeId": "hallway"
        }
      ]
    },
    {
      "id": "exit",
      "title": "The Exit",
      "type": "video",
      "videoFile": "exit.mp4",
      "choices": [
        {
          "id": "use_keycard",
          "label": "Use the keycard",
          "targetNodeId": "secret_ending",
          "condition": "has_keycard"
        },
        {
          "id": "leave",
          "label": "Leave without it",
          "targetNodeId": "normal_ending"
        }
      ]
    },
    {
      "id": "secret_ending",
      "title": "Secret Escape",
      "type": "ending",
      "videoFile": "secret.mp4",
      "choices": []
    },
    {
      "id": "normal_ending",
      "title": "Standard Exit",
      "type": "ending",
      "videoFile": "normal.mp4",
      "choices": []
    }
  ]
}
```

## Video File Naming

Name videos to match node IDs:

```
videos/
├── intro.mp4       # intro node
├── hallway.mp4     # hallway node
├── storage.mp4     # storage node
├── exit.mp4        # exit node
├── secret.mp4      # secret_ending node
└── normal.mp4      # normal_ending node
```

## Validation

Validate your story:

```bash
npm run validate-story path/to/story.json
```

Checks:
- Required fields present
- Valid node types
- Start node exists
- All choice targets valid
- No duplicate IDs
- No unreachable nodes

## Best Practices

### Story Structure

1. **Start simple**: Begin with 3-5 nodes
2. **Test often**: Validate after each change
3. **Plan endings**: Have multiple endings for replayability
4. **Use flags**: Create meaningful branches
5. **Keep videos short**: 30-60 seconds per scene

### Node IDs

- Use descriptive names: `intro`, `hallway`, `boss_fight`
- Use lowercase with underscores: `storage_room`, `secret_exit`
- Keep under 30 characters
- Avoid special characters

### Choices

- Clear, actionable labels
- 2-4 choices per node (not too many)
- Meaningful consequences
- Use flags for hidden options

### File Organization

```
my-story/
├── story.json
└── videos/
    ├── intro.mp4
    ├── scene1.mp4
    └── ending.mp4
```

## Next Steps

- [Quick Start Guide](quickstart.md)
- [API Reference](api-reference.md)
- [Component Reference](components.md)
- [Architecture](architecture.md)
