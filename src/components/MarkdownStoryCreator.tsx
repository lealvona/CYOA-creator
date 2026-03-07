import { useState, type FC } from "react";
import { parseMarkdownStory, validateMarkdownStory } from "../utils/markdownParser";
import type { StoryDefinition } from "../types/story";
import "./MarkdownStoryCreator.css";

export interface MarkdownStoryCreatorProps {
  onStoryCreated: (story: StoryDefinition, filename: string) => void;
  onCancel?: () => void;
}

const EXAMPLE_MARKDOWN = `# Title: My Adventure
# Author: Story Creator
# Description: A sample branching story

## node:intro:start
You wake up in a mysterious room with two doors.
-> red_door | Take the red door | red_room
-> blue_door | Take the blue door | blue_room

## node:red_room:video
The red door leads to a fiery chamber. It's getting hot!
-> go_back | Go back | intro
-> jump_in | Jump into the flames | ending_fire

## node:blue_room:video
The blue door opens to a peaceful garden. Birds are singing.
-> explore | Explore the garden | ending_garden
-> go_back | Go back | intro

## node:ending_fire:ending
You embraced the flames and discovered your true power. The end.

## node:ending_garden:ending
You found peace in the garden. A perfect ending.`;

export const MarkdownStoryCreator: FC<MarkdownStoryCreatorProps> = ({
  onStoryCreated,
  onCancel,
}) => {
  const [markdown, setMarkdown] = useState(EXAMPLE_MARKDOWN);
  const [filename, setFilename] = useState("my-story");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsedStory, setParsedStory] = useState<StoryDefinition | null>(null);

  const handleParse = () => {
    const errors = validateMarkdownStory(markdown);
    setValidationErrors(errors);
    
    if (errors.length === 0) {
      const story = parseMarkdownStory(markdown);
      setParsedStory(story);
    } else {
      setParsedStory(null);
    }
  };

  const handleCreate = () => {
    if (parsedStory) {
      const safeFilename = filename.replace(/[^a-z0-9-_]/gi, "-").toLowerCase();
      onStoryCreated(parsedStory, safeFilename);
    }
  };

  const handleLoadExample = () => {
    setMarkdown(EXAMPLE_MARKDOWN);
    setValidationErrors([]);
    setParsedStory(null);
  };

  const handleClear = () => {
    setMarkdown("# Title: \n# Author: \n# Description: \n\n## node:start:start\n");
    setValidationErrors([]);
    setParsedStory(null);
  };

  return (
    <div className="markdown-story-creator">
      <div className="markdown-story-creator__header">
        <h2>Create Story from Markdown</h2>
        <p className="markdown-story-creator__description">
          Write your story using simple markdown syntax. The story structure will be 
          automatically converted to JSON format.
        </p>
        
        <div className="markdown-story-creator__actions">
          <button 
            className="markdown-story-creator__btn-secondary"
            onClick={handleLoadExample}
          >
            Load Example
          </button>
          <button 
            className="markdown-story-creator__btn-secondary"
            onClick={handleClear}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="markdown-story-creator__form">
        <div className="markdown-story-creator__field">
          <label htmlFor="story-filename">Story Filename (no extension):</label>
          <input
            id="story-filename"
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            placeholder="my-awesome-story"
          />
        </div>

        <div className="markdown-story-creator__field">
          <label htmlFor="story-markdown">Story Markdown:</label>
          <textarea
            id="story-markdown"
            value={markdown}
            onChange={(e) => {
              setMarkdown(e.target.value);
              setValidationErrors([]);
              setParsedStory(null);
            }}
            rows={20}
            spellCheck={false}
          />
        </div>

        {validationErrors.length > 0 && (
          <div className="markdown-story-creator__errors">
            <h4>Validation Errors:</h4>
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {parsedStory && (
          <div className="markdown-story-creator__preview">
            <h4>Story Preview:</h4>
            <dl>
              <dt>Title:</dt>
              <dd>{parsedStory.meta.title}</dd>
              
              <dt>Author:</dt>
              <dd>{parsedStory.meta.author}</dd>
              
              <dt>Nodes:</dt>
              <dd>{parsedStory.nodes.length}</dd>
              
              <dt>Start Node:</dt>
              <dd>{parsedStory.startNodeId}</dd>
            </dl>
            
            <h5>Node Breakdown:</h5>
            <ul>
              {parsedStory.nodes.map((node: { id: string; type: string; choices: { length: number } }) => (
                <li key={node.id}>
                  {node.id} ({node.type}) - {node.choices.length} choice
                  {node.choices.length !== 1 ? "s" : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="markdown-story-creator__footer">
        <div className="markdown-story-creator__syntax-help">
          <strong>Syntax Quick Reference:</strong>
          <pre>{
`# Title: Story Name
# Author: Your Name
# Description: Brief description

## node:unique_id:start
Subtitle text describing the scene.
-> choice_id | Choice Label | target_node_id

## node:another_id:video
More content...

## node:ending_id:ending
Ending scene (no choices)`
          }</pre>
        </div>

        <div className="markdown-story-creator__buttons">
          {onCancel && (
            <button 
              className="markdown-story-creator__btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          <button 
            className="markdown-story-creator__btn-primary"
            onClick={handleParse}
          >
            Preview Story
          </button>
          
          <button 
            className="markdown-story-creator__btn-primary"
            onClick={handleCreate}
            disabled={!parsedStory || validationErrors.length > 0}
          >
            Create Story
          </button>
        </div>
      </div>
    </div>
  );
};
