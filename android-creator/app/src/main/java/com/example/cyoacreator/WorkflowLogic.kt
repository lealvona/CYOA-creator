package com.example.cyoacreator

data class ProjectProgress(
  val totalNodes: Int,
  val capturedClips: Int,
  val missingClips: Int,
  val endingNodes: Int,
)

fun computeCompleteness(story: StoryDefinition, clips: List<ClipAsset>): Completeness {
  if (story.nodes.isEmpty()) return Completeness.INCOMPLETE
  val allPresent = story.nodes.all { node -> clips.any { it.videoFile == node.videoFile } }
  return if (allPresent) Completeness.COMPLETE else Completeness.INCOMPLETE
}

fun computeProjectProgress(project: CreatorProject): ProjectProgress {
  val total = project.story.nodes.size
  val captured = project.story.nodes.count { node ->
    project.clips.any { clip -> clip.videoFile == node.videoFile }
  }
  val endings = project.story.nodes.count { it.type == "ending" }
  return ProjectProgress(
    totalNodes = total,
    capturedClips = captured,
    missingClips = (total - captured).coerceAtLeast(0),
    endingNodes = endings,
  )
}

fun mergeImportedProject(
  existing: CreatorProject,
  imported: CreatorProject,
  strategy: ImportConflictStrategy,
): CreatorProject {
  return when (strategy) {
    ImportConflictStrategy.OVERWRITE -> {
      imported.copy(
        id = existing.id,
        name = existing.name,
        rawStoryText = existing.rawStoryText,
        parseMode = existing.parseMode,
        completeness = computeCompleteness(imported.story, imported.clips),
      )
    }

    ImportConflictStrategy.MERGE -> {
      val mergedClipMap = LinkedHashMap<String, ClipAsset>()
      existing.clips.forEach { mergedClipMap[it.videoFile] = it }
      imported.clips.forEach { mergedClipMap[it.videoFile] = it }

      val mergedStory = if (imported.story.nodes.isNotEmpty()) imported.story else existing.story
      existing.copy(
        story = mergedStory,
        clips = mergedClipMap.values.toList(),
        completeness = computeCompleteness(mergedStory, mergedClipMap.values.toList()),
      )
    }
  }
}
