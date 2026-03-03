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

data class MainUiState(
  val projects: List<CreatorProject> = emptyList(),
  val selectedProject: CreatorProject? = null,
  val statusMessage: String? = null,
  val isBusy: Boolean = false,
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
      val story = if (useLlm && llmConfig != null) {
        runCatching {
          withContext(Dispatchers.IO) {
            LlmFallbackClient(llmConfig).convertRawTextToStory(text)
          }
        }.getOrElse {
          setStatus("LLM conversion failed, falling back to markdown parser: ${it.message}")
          StructuredMarkdownParser.parse(text)
        }
      } else {
        StructuredMarkdownParser.parse(text)
      }
      val project = CreatorProject(
        id = UUID.randomUUID().toString(),
        name = name,
        rawStoryText = text,
        parseMode = if (useLlm) ParseMode.LLM_FALLBACK else ParseMode.STRUCTURED_MARKDOWN,
        story = story,
        completeness = computeCompleteness(story, emptyList()),
      )
      repo.save(project)
      _uiState.update {
        it.copy(
          selectedProject = project,
          statusMessage = if (useLlm)
            "Project created. Configure LLM provider and run fallback conversion next."
          else
            "Project created from structured markdown.",
        )
      }
    }
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
