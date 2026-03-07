package com.example.cyoacreator

import android.app.Application
import android.net.Uri
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.UUID

sealed class CreationStep {
  data object Idle : CreationStep()
  data class Progress(val message: String) : CreationStep()
  data class ReviewLlmResult(
    val rawText: String,
    val story: StoryDefinition,
    val name: String,
    val config: LlmProviderConfig
  ) : CreationStep()
}

data class MainUiState(
  val projects: List<CreatorProject> = emptyList(),
  val selectedProject: CreatorProject? = null,
  val statusMessage: String? = null,
  val isBusy: Boolean = false,
  val creationStep: CreationStep = CreationStep.Idle,
)

class MainViewModel(app: Application) : AndroidViewModel(app) {
  private val context = app.applicationContext
  private val repo = ProjectRepository(context)
  private val importer = PackageImporter(context)
  private val exporter = PackageExporter(context)

  private val _uiState = MutableStateFlow(MainUiState())
  val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

  init {
    viewModelScope.launch {
      repo.observeProjects().collect { projects ->
        _uiState.update { state ->
          val selected = state.selectedProject?.id?.let { selectedId ->
            projects.firstOrNull { it.id == selectedId }
          }
          state.copy(projects = projects, selectedProject = selected)
        }
      }
    }
  }

  fun createProject(
    name: String,
    text: String,
    useLlm: Boolean,
    llmConfig: LlmProviderConfig?
  ) {
    viewModelScope.launch {
      val trimmedName = name.trim()
      val trimmedText = text.trim()

      if (trimmedName.isBlank()) {
        setStatus("Project name is required.")
        return@launch
      }
      if (trimmedText.isBlank()) {
        setStatus("Story text is required.")
        return@launch
      }

      _uiState.update { it.copy(isBusy = true, statusMessage = null) }

      if (useLlm) {
        val config = llmConfig?.copy(
          baseUrl = llmConfig.baseUrl.trim(),
          apiKey = llmConfig.apiKey.trim(),
          model = llmConfig.model.trim(),
        )
        if (config == null || config.baseUrl.isBlank() || config.apiKey.isBlank() || config.model.isBlank()) {
          _uiState.update {
            it.copy(
              isBusy = false,
              statusMessage = "LLM is enabled, but Base URL, Model, and API key are all required.",
            )
          }
          return@launch
        }

        _uiState.update { it.copy(creationStep = CreationStep.Progress("Generating title...")) }

        val needsTitle = trimmedName == "New Story" || trimmedName.isBlank()
        val finalName = if (needsTitle) {
          runCatching {
            withContext(Dispatchers.IO) {
              LlmFallbackClient(config).generateTitle(trimmedText)
            }
          }.getOrElse { trimmedName }
        } else {
          trimmedName
        }

        _uiState.update { it.copy(creationStep = CreationStep.Progress("Contacting LLM...")) }

        runCatching {
          withContext(Dispatchers.IO) {
            LlmFallbackClient(config).convertRawTextToStory(trimmedText)
          }
        }.onSuccess { story ->
          _uiState.update {
            it.copy(
              isBusy = false,
              creationStep = CreationStep.ReviewLlmResult(
                rawText = trimmedText,
                story = story,
                name = finalName,
                config = config
              ),
            )
          }
        }.onFailure { err ->
          _uiState.update {
            it.copy(
              isBusy = false,
              creationStep = CreationStep.Idle,
              statusMessage = "LLM conversion failed: ${err.message}. Project was not created.",
            )
          }
        }
        return@launch
      }

      runCatching {
        StructuredMarkdownParser.parse(trimmedText)
      }.onSuccess { story ->
        val project = CreatorProject(
          id = UUID.randomUUID().toString(),
          name = trimmedName,
          rawStoryText = trimmedText,
          parseMode = ParseMode.STRUCTURED_MARKDOWN,
          story = story,
          completeness = computeCompleteness(story, emptyList()),
        )
        repo.save(project)
        _uiState.update {
          it.copy(
            isBusy = false,
            selectedProject = project,
            statusMessage = "Project created from structured markdown.",
          )
        }
      }.onFailure { err ->
        _uiState.update {
          it.copy(
            isBusy = false,
            statusMessage = "Could not parse story text: ${err.message}",
          )
        }
      }
    }
  }

  fun confirmLlmResult(rawText: String, story: StoryDefinition, name: String, editedStory: StoryDefinition?) {
    viewModelScope.launch {
      val finalStory = editedStory ?: story
      val project = CreatorProject(
        id = UUID.randomUUID().toString(),
        name = name,
        rawStoryText = rawText,
        parseMode = ParseMode.LLM_FALLBACK,
        story = finalStory,
        completeness = computeCompleteness(finalStory, emptyList()),
      )
      repo.save(project)
      _uiState.update {
        it.copy(
          creationStep = CreationStep.Idle,
          selectedProject = project,
          statusMessage = "Project created using LLM conversion.",
        )
      }
    }
  }

  fun cancelCreation() {
    _uiState.update {
      it.copy(
        isBusy = false,
        creationStep = CreationStep.Idle,
        statusMessage = "Project creation cancelled.",
      )
    }
  }

  fun clearCreationStep() {
    _uiState.update { it.copy(creationStep = CreationStep.Idle) }
  }

  fun selectProject(project: CreatorProject) {
    _uiState.update { it.copy(selectedProject = project) }
  }

  fun clearSelection() {
    _uiState.update { it.copy(selectedProject = null) }
  }

  fun setStatus(message: String?) {
    _uiState.update { it.copy(statusMessage = message) }
  }

  fun attachClip(videoFile: String, uri: Uri) {
    val selected = _uiState.value.selectedProject ?: return
    viewModelScope.launch {
      val updated = selected.withClip(videoFile, uri.toString())
      repo.save(updated)
      _uiState.update {
        it.copy(
          selectedProject = updated,
          statusMessage = "Attached clip for $videoFile",
        )
      }
    }
  }

  fun removeClip(videoFile: String) {
    val selected = _uiState.value.selectedProject ?: return
    viewModelScope.launch {
      val updated = selected.copy(
        clips = selected.clips.filterNot { it.videoFile == videoFile },
        completeness = computeCompleteness(
          selected.story,
          selected.clips.filterNot { it.videoFile == videoFile },
        )
      )
      repo.save(updated)
      _uiState.update {
        it.copy(
          selectedProject = updated,
          statusMessage = "Removed clip for $videoFile",
        )
      }
    }
  }

  /**
   * Delete the entire project from the database.
   */
  fun deleteProject(project: CreatorProject) {
    viewModelScope.launch {
      repo.delete(project.id)
      if (_uiState.value.selectedProject?.id == project.id) {
        _uiState.update { it.copy(selectedProject = null) }
      }
      _uiState.update { it.copy(statusMessage = "Deleted project: ${project.name}") }
    }
  }

  /**
   * Delete all projects from the database.
   */
  fun deleteAllProjects() {
    viewModelScope.launch {
      repo.deleteAll()
      _uiState.update { it.copy(selectedProject = null, statusMessage = "All projects deleted") }
    }
  }

  /**
   * Delete a node from the story.
   * Also removes any choices that point to this node from other nodes.
   */
  fun deleteNode(nodeId: String) {
    val selected = _uiState.value.selectedProject ?: return
    viewModelScope.launch {
      // Remove the node
      val updatedNodes = selected.story.nodes.filterNot { it.id == nodeId }

      // Remove choices pointing to this node from other nodes
      val cleanedNodes = updatedNodes.map { node ->
        node.copy(choices = node.choices.filterNot { it.targetNodeId == nodeId })
      }

      // If we deleted the start node, set a new start node if available
      val newStartNodeId = if (selected.story.startNodeId == nodeId) {
        cleanedNodes.firstOrNull { it.type == "start" }?.id
          ?: cleanedNodes.firstOrNull()?.id
          ?: ""
      } else {
        selected.story.startNodeId
      }

      val updatedStory = selected.story.copy(
        nodes = cleanedNodes,
        startNodeId = newStartNodeId
      )

      // Also remove any clip associated with this node
      val updatedClips = selected.clips.filterNot { it.videoFile == "$nodeId.mp4" }

      val updated = selected.copy(
        story = updatedStory,
        clips = updatedClips,
        completeness = computeCompleteness(updatedStory, updatedClips)
      )

      repo.save(updated)
      _uiState.update {
        it.copy(
          selectedProject = updated,
          statusMessage = "Deleted node: $nodeId"
        )
      }
    }
  }

  /**
   * Delete a specific choice from a node.
   */
  fun deleteChoice(nodeId: String, choiceId: String) {
    val selected = _uiState.value.selectedProject ?: return
    viewModelScope.launch {
      val updatedNodes = selected.story.nodes.map { node ->
        if (node.id == nodeId) {
          node.copy(choices = node.choices.filterNot { it.id == choiceId })
        } else {
          node
        }
      }

      val updatedStory = selected.story.copy(nodes = updatedNodes)
      val updated = selected.copy(
        story = updatedStory,
        completeness = computeCompleteness(updatedStory, selected.clips)
      )

      repo.save(updated)
      _uiState.update {
        it.copy(
          selectedProject = updated,
          statusMessage = "Deleted choice: $choiceId"
        )
      }
    }
  }

  fun importPackage(uri: Uri, strategy: ImportConflictStrategy) {
    viewModelScope.launch {
      _uiState.update { it.copy(isBusy = true, statusMessage = "Importing package...") }
      runCatching {
        withContext(Dispatchers.IO) { importer.importPackage(uri) }
      }.onSuccess { imported ->
        val existing = _uiState.value.projects.firstOrNull {
          it.story.meta.title.equals(imported.story.meta.title, ignoreCase = true) &&
            it.story.meta.author.equals(imported.story.meta.author, ignoreCase = true)
        }

        val finalProject = if (existing == null) {
          imported
        } else {
          mergeImportedProject(existing, imported, strategy)
        }

        repo.save(finalProject)
        _uiState.update {
          it.copy(
            isBusy = false,
            selectedProject = finalProject,
            statusMessage = if (existing == null)
              "Package imported (${finalProject.completeness.name.lowercase()})"
            else
              "Package imported with ${strategy.name.lowercase()} strategy (${finalProject.completeness.name.lowercase()})",
          )
        }
      }.onFailure { err ->
        _uiState.update {
          it.copy(isBusy = false, statusMessage = "Import failed: ${err.message}")
        }
      }
    }
  }

  fun exportCurrentProject(zipUri: Uri) {
    val project = _uiState.value.selectedProject ?: return
    viewModelScope.launch {
      _uiState.update { it.copy(isBusy = true, statusMessage = "Exporting package...") }
      runCatching {
        withContext(Dispatchers.IO) {
          exporter.exportProject(
            project = project,
            videoFiles = project.clips.map { clip ->
              PackageExporter.ExportFile(name = clip.videoFile, uri = Uri.parse(clip.uri))
            },
            outputZipUri = zipUri,
          )
        }
      }.onSuccess {
        _uiState.update {
          it.copy(isBusy = false, statusMessage = "Export complete")
        }
      }.onFailure { err ->
        _uiState.update {
          it.copy(isBusy = false, statusMessage = "Export failed: ${err.message}")
        }
      }
    }
  }

  private fun CreatorProject.withClip(videoFile: String, uri: String): CreatorProject {
    val updatedClips = clips.filterNot { it.videoFile == videoFile } +
      ClipAsset(videoFile = videoFile, uri = uri)
    return copy(clips = updatedClips, completeness = computeCompleteness(story, updatedClips))
  }
}
