package com.example.cyoacreator

import org.junit.Assert.assertEquals
import org.junit.Test

class WorkflowLogicTest {
  private fun sampleStory() = StoryDefinition(
    meta = StoryMeta(
      title = "Test",
      description = "Desc",
      author = "Author",
      version = "1.0.0",
      date = "2026-03-03"
    ),
    config = StoryConfig(),
    startNodeId = "intro",
    nodes = listOf(
      StoryNode(
        id = "intro",
        title = "Intro",
        type = "start",
        videoFile = "intro.mp4",
        choices = listOf(Choice("to-end", "End", "ending"))
      ),
      StoryNode(
        id = "ending",
        title = "Ending",
        type = "ending",
        videoFile = "ending.mp4",
        choices = emptyList()
      )
    )
  )

  @Test
  fun `compute completeness reflects missing clips`() {
    val story = sampleStory()
    val clips = listOf(ClipAsset(videoFile = "intro.mp4", uri = "file://intro.mp4"))
    assertEquals(Completeness.INCOMPLETE, computeCompleteness(story, clips))

    val completeClips = clips + ClipAsset(videoFile = "ending.mp4", uri = "file://ending.mp4")
    assertEquals(Completeness.COMPLETE, computeCompleteness(story, completeClips))
  }

  @Test
  fun `merge strategy keeps existing identity and merges clips`() {
    val existing = CreatorProject(
      id = "existing-id",
      name = "Existing",
      rawStoryText = "old",
      parseMode = ParseMode.STRUCTURED_MARKDOWN,
      story = sampleStory(),
      clips = listOf(ClipAsset(videoFile = "intro.mp4", uri = "file://old-intro.mp4")),
      completeness = Completeness.INCOMPLETE,
    )

    val imported = CreatorProject(
      id = "imported-id",
      name = "Imported",
      rawStoryText = "new",
      parseMode = ParseMode.LLM_FALLBACK,
      story = sampleStory(),
      clips = listOf(ClipAsset(videoFile = "ending.mp4", uri = "file://ending.mp4")),
      completeness = Completeness.INCOMPLETE,
    )

    val merged = mergeImportedProject(existing, imported, ImportConflictStrategy.MERGE)

    assertEquals("existing-id", merged.id)
    assertEquals(2, merged.clips.size)
    assertEquals(Completeness.COMPLETE, merged.completeness)
  }
}
