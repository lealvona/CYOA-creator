package com.example.cyoacreator

import kotlinx.serialization.Serializable

@Serializable
data class CreatorProject(
  val id: String,
  val name: String,
  val rawStoryText: String,
  val parseMode: ParseMode,
  val story: StoryDefinition,
  val clips: List<ClipAsset> = emptyList(),
  val completeness: Completeness = Completeness.INCOMPLETE,
  val updatedAt: Long = System.currentTimeMillis()
)

@Serializable
data class ClipAsset(
  val videoFile: String,
  val uri: String,
  val recordedAt: Long = System.currentTimeMillis()
)

@Serializable
enum class ParseMode {
  STRUCTURED_MARKDOWN,
  LLM_FALLBACK
}

@Serializable
enum class Completeness {
  COMPLETE,
  INCOMPLETE
}

enum class ImportConflictStrategy {
  MERGE,
  OVERWRITE
}

@Serializable
data class StoryDefinition(
  val meta: StoryMeta,
  val config: StoryConfig,
  val startNodeId: String,
  val nodes: List<StoryNode>
)

@Serializable
data class StoryMeta(
  val title: String,
  val description: String,
  val author: String,
  val version: String,
  val date: String,
  val estimatedMinutes: Int? = null,
  val tags: List<String> = emptyList()
)

@Serializable
data class StoryConfig(
  val videoBasePath: String = "videos",
  val preloadNext: Boolean = true,
  val defaultVolume: Double = 1.0,
  val allowRevisit: Boolean = true,
  val choiceLeadTime: Double = 0.0
)

@Serializable
data class StoryNode(
  val id: String,
  val title: String,
  val type: String,
  val videoFile: String,
  val subtitle: String? = null,
  val choices: List<Choice>
)

@Serializable
data class Choice(
  val id: String,
  val label: String,
  val targetNodeId: String,
  val showAtTime: Double? = null,
  val condition: String? = null
)
