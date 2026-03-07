# Markdown Story Format

CYOA Creator supports a human-readable markdown format for creating stories. This format is automatically converted to JSON when you create or import stories.

## Quick Example

```markdown
# Title: Space Adventure
# Author: Jane Doe
# Description: Explore the galaxy and discover alien civilizations

## node:start:start
You are the captain of the starship Horizon. A distress signal is coming from a nearby planet.
-> investigate | Investigate the signal | planet_surface
-> ignore | Continue on your mission | deep_space

## node:planet_surface:video
You land on the mysterious planet. The surface is covered in crystalline structures that hum with energy.
-> explore | Explore the structures | alien_ruins
-> leave | Return to the ship | start

## node:deep_space:video
You chart a course away from the signal. The stars stretch into lines as you engage the warp drive.
-> continue | Continue the journey | ending_safe

## node:alien_ruins:video
The structures lead to ancient ruins. A holographic message activates, welcoming you to the Archives.
-> accept | Accept the invitation | ending_archivist

## node:ending_safe:ending
You complete your patrol without incident. The galaxy remains peaceful, for now.

## node:ending_archivist:ending
You become the keeper of cosmic knowledge, cataloging the wisdom of a thousand civilizations.
```

## Format Specification

### Metadata Section

Start your story with metadata fields:

| Field | Required | Description |
|-------|----------|-------------|
| `# Title:` | ✅ Yes | The story title displayed to users |
| `# Author:` | ✅ Yes | Creator name |
| `# Description:` | ❌ No | Brief description of the story |

Example:
```markdown
# Title: My Amazing Story
# Author: Your Name
# Description: A thrilling adventure through unknown lands
```

### Node Declaration

Nodes are declared using the `## node:` syntax:

```markdown
## node:{id}:{type}
```

**Parameters:**
- `id` - Unique identifier for the node (used for video filename)
- `type` - One of: `start`, `video`, `ending`

**Node Types:**

| Type | Purpose | Video File |
|------|---------|------------|
| `start` | Entry point of the story | `{id}.mp4` |
| `video` | Standard scene with choices | `{id}.mp4` |
| `ending` | Terminal node (no choices) | `{id}.mp4` |

### Node Content

After declaring a node, add:

1. **Subtitle text** (optional) - Description shown below the video
2. **Choices** (optional for endings) - Navigation options

Example:
```markdown
## node:scene1:video
You enter a dark cave. Water drips from stalactites.
-> choice1 | Take the left tunnel | left_tunnel
-> choice2 | Take the right tunnel | right_tunnel
-> choice3 | Go back | entrance
```

### Choice Syntax

Choices connect nodes together:

```markdown
-> {choice_id} | {label} | {target_node_id}
```

**Parameters:**
- `choice_id` - Unique identifier for this choice
- `label` - Text displayed to the user
- `target_node_id` - The node to navigate to when selected

Example:
```markdown
-> go_left | Go left | left_room
-> go_right | Go right | right_room
-> stay | Stay here | current_room
```

### Multi-line Subtitles

You can split subtitles across multiple lines. They will be concatenated with spaces:

```markdown
## node:intro:start
This is the first line of the subtitle.
This is the second line, which will be joined with the first.
-> next | Continue | next_scene
```

Result: "This is the first line of the subtitle. This is the second line, which will be joined with the first."

## Complete Example

```markdown
# Title: The Enchanted Forest
# Author: Story Weaver
# Description: Discover the secrets of an ancient woodland

## node:beginning:start
You stand at the edge of an ancient forest. Sunlight filters through the canopy, creating patterns on the forest floor.
-> path | Follow the winding path | clearing
-> trees | Venture into the deep woods | dark_woods
-> home | Turn back home | ending_home

## node:clearing:video
You emerge in a sunlit clearing. Wildflowers carpet the ground, and you hear the sound of running water.
-> stream | Follow the water | stream_bank
-> flowers | Pick some flowers | fairy_encounter

## node:dark_woods:video
The woods grow dark and silent. Your footsteps make no sound on the mossy ground.
-> light | Head toward a distant light | will_o_wisp
-> sit | Rest against a tree | tree_spirit

## node:stream_bank:video
A crystal-clear stream flows here. You can see colorful stones on the bottom.
-> drink | Drink from the stream | ending_healing
-> stones | Collect some stones | ending_wealth

## node:fairy_encounter:video
As you reach for a flower, a tiny fairy appears. She offers you a gift in exchange for your kindness.
-> accept | Accept the gift | ending_magic
-> decline | Politely decline | ending_wisdom

## node:will_o_wisp:video
The light leads you to a beautiful grove where ethereal beings dance.
-> join | Join the dance | ending_eternal
-> watch | Simply watch | ending_artist

## node:tree_spirit:video
The tree you rest against is actually an ancient spirit. It shares its wisdom with you.
-> listen | Listen to the wisdom | ending_sage
-> sleep | Fall asleep | ending_dream

## node:ending_home:ending
You return home safely. Sometimes the greatest adventure is knowing when to turn back.

## node:ending_healing:ending
The water grants you healing powers. You become the village healer.

## node:ending_wealth:ending
The stones are precious gems! You live comfortably but always wonder what else you missed.

## node:ending_magic:ending
The fairy's gift gives you magical abilities. You become a legendary wizard.

## node:ending_wisdom:ending
The fairy is impressed by your humility. She teaches you the secrets of nature.

## node:ending_eternal:ending
You dance forever with the spirits, experiencing joy beyond mortal understanding.

## node:ending_artist:ending
You capture the scene in your mind and become a famous painter of the fantastical.

## node:ending_sage:ending
You carry the spirit's wisdom and become a counselor to kings.

## node:ending_dream:ending
You sleep for a hundred years and wake in a changed world, ready for new adventures.
```

## Tips

1. **Node IDs**: Use descriptive, lowercase IDs with underscores for spaces (e.g., `dark_forest`, `treasure_room`)

2. **Video Files**: Each node corresponds to a video file named `{id}.mp4`. Make sure to create these videos.

3. **Start Node**: Mark your entry point with type `start`. If you don't, the first node becomes the start.

4. **Endings**: Use type `ending` for final scenes. These don't need choices.

5. **Testing**: Use the "Preview" button in the markdown creator to validate your story before downloading.

6. **Structure**: Plan your story flow first. Draw a diagram of how nodes connect before writing.

## Video File Naming

Each node needs a corresponding video file:

```
story-folder/
├── story.json (generated from markdown)
├── videos/
│   ├── start.mp4
│   ├── clearing.mp4
│   ├── dark_woods.mp4
│   ├── stream_bank.mp4
│   ├── fairy_encounter.mp4
│   ├── will_o_wisp.mp4
│   ├── tree_spirit.mp4
│   ├── ending_home.mp4
│   ├── ending_healing.mp4
│   └── ... (etc)
```

## Validation

The markdown creator will check for:
- ✅ Title and Author metadata
- ✅ At least one node defined
- ✅ Valid node syntax
- ✅ Choices before node definitions

Warnings (not errors):
- ⚠️ Ending nodes with choices (choices will be ignored)
- ⚠️ Nodes without subtitles
- ⚠️ Choices targeting non-existent nodes (only checked at runtime)

## Converting to JSON

When you click "Create Story", the markdown is converted to JSON format:

```json
{
  "meta": {
    "title": "The Enchanted Forest",
    "author": "Story Weaver",
    "description": "Discover the secrets of an ancient woodland",
    "version": "1.0.0",
    "date": "2024-01-15"
  },
  "config": {
    "videoBasePath": "videos",
    "preloadNext": true,
    "defaultVolume": 1.0
  },
  "startNodeId": "beginning",
  "nodes": [
    {
      "id": "beginning",
      "title": "Beginning",
      "type": "start",
      "videoFile": "beginning.mp4",
      "subtitle": "You stand at the edge of an ancient forest...",
      "choices": [
        {
          "id": "path",
          "label": "Follow the winding path",
          "targetNodeId": "clearing"
        }
      ]
    }
  ]
}
```

This JSON file can then be packaged with your videos into a ZIP file for import.

## Integration with Android App

The markdown format used here is compatible with the Android app's markdown parser. You can:
1. Create stories in the web UI
2. Download the JSON
3. Use the same markdown in the Android app
4. Both will produce identical story structures

## Advanced Features (Future)

Planned enhancements to the markdown format:
- Timed choices (`showAtTime`)
- Conditional logic (`condition`)
- Custom transitions
- Flag setting (`setsFlags`)
- Theme overrides per node

For now, these features require editing the JSON directly after conversion.
