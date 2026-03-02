package com.example.cyoacreator

import android.Manifest
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.core.content.ContextCompat
import android.content.pm.PackageManager
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

private enum class NodeFilter {
  ALL,
  MISSING,
  READY,
}

class MainActivity : ComponentActivity() {
  private val vm by viewModels<MainViewModel>()

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      MaterialTheme {
        CreatorApp(vm)
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreatorApp(vm: MainViewModel) {
  val ui by vm.uiState.collectAsState()
  val snackbarHost = remember { SnackbarHostState() }

  var pendingAttachVideoFile by remember { mutableStateOf<String?>(null) }
  var captureVideoFile by remember { mutableStateOf<String?>(null) }
  var pendingCaptureVideoFile by remember { mutableStateOf<String?>(null) }
  var importConflictStrategy by remember { mutableStateOf(ImportConflictStrategy.MERGE) }

  val pickMedia = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.GetContent()
  ) { uri ->
    val expected = pendingAttachVideoFile
    pendingAttachVideoFile = null
    if (uri != null && expected != null) {
      vm.attachClip(expected, uri)
    }
  }

  val createExportDocument = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.CreateDocument("application/zip")
  ) { uri ->
    if (uri != null) {
      vm.exportCurrentProject(uri)
    }
  }

  val importPackage = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.OpenDocument()
  ) { uri ->
    if (uri != null) {
      vm.importPackage(uri, importConflictStrategy)
    }
  }

  val requestPermissions = rememberLauncherForActivityResult(
    contract = ActivityResultContracts.RequestMultiplePermissions()
  )
  {
    val requestedVideoFile = pendingCaptureVideoFile
    pendingCaptureVideoFile = null
    val denied = it.entries.filterNot { pair -> pair.value }.map { pair -> pair.key }
    if (denied.isNotEmpty()) {
      vm.setStatus("Missing permissions: ${denied.joinToString()}")
      captureVideoFile = null
    } else if (requestedVideoFile != null) {
      captureVideoFile = requestedVideoFile
    }
  }

  LaunchedEffect(ui.statusMessage) {
    ui.statusMessage?.let {
      snackbarHost.showSnackbar(it)
      vm.setStatus(null)
    }
  }

  if (captureVideoFile != null) {
    CameraCaptureScreen(
      expectedVideoFile = captureVideoFile!!,
      onDone = { uri ->
        vm.attachClip(captureVideoFile!!, uri)
        captureVideoFile = null
      },
      onCancel = { captureVideoFile = null }
    )
    return
  }

  Scaffold(snackbarHost = { SnackbarHost(snackbarHost) }) { padding ->
    if (ui.selectedProject == null) {
      ProjectHome(
        modifier = Modifier.padding(padding),
        projects = ui.projects,
        isBusy = ui.isBusy,
        onCreate = vm::createProject,
        onOpen = vm::selectProject,
        onImportPackage = { strategy ->
          importConflictStrategy = strategy
          importPackage.launch(arrayOf("application/zip", "application/octet-stream"))
        }
      )
    } else {
      ProjectWorkspace(
        modifier = Modifier.padding(padding),
        project = ui.selectedProject,
        isBusy = ui.isBusy,
        onBack = vm::clearSelection,
        onRecord = { videoFile ->
          val hasCamera = ContextCompat.checkSelfPermission(
            vm.getApplication(),
            Manifest.permission.CAMERA
          ) == PackageManager.PERMISSION_GRANTED
          val hasAudio = ContextCompat.checkSelfPermission(
            vm.getApplication(),
            Manifest.permission.RECORD_AUDIO
          ) == PackageManager.PERMISSION_GRANTED

          if (hasCamera && hasAudio) {
            captureVideoFile = videoFile
          } else {
            pendingCaptureVideoFile = videoFile
            requestPermissions.launch(
              arrayOf(Manifest.permission.CAMERA, Manifest.permission.RECORD_AUDIO)
            )
          }
        },
        onAttach = { videoFile ->
          pendingAttachVideoFile = videoFile
          pickMedia.launch("video/*")
        },
        onRemoveClip = vm::removeClip,
        onExport = {
          val name = "${ui.selectedProject!!.name.replace(" ", "_")}.zip"
          createExportDocument.launch(name)
        }
      )
    }
  }
}

@Composable
private fun ProjectHome(
  modifier: Modifier,
  projects: List<CreatorProject>,
  isBusy: Boolean,
  onCreate: (name: String, text: String, useLlm: Boolean, llmConfig: LlmProviderConfig?) -> Unit,
  onOpen: (CreatorProject) -> Unit,
  onImportPackage: (ImportConflictStrategy) -> Unit,
) {
  var name by remember { mutableStateOf("New Story") }
  var content by remember {
    mutableStateOf(
      """
      # Title: My Adventure
      # Author: Me
      # Description: A branchy story

      ## node:intro:start
      You wake up in a hallway.
      -> go_left | Go left | left_room
      -> go_right | Go right | right_room

      ## node:left_room:ending
      You found the exit.

      ## node:right_room:ending
      You hit a dead end.
      """.trimIndent()
    )
  }
  var llmFallback by remember { mutableStateOf(false) }
  var llmBaseUrl by remember { mutableStateOf("https://api.openai.com") }
  var llmApiKey by remember { mutableStateOf("") }
  var llmModel by remember { mutableStateOf("gpt-4o-mini") }

  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(12.dp)
  ) {
    Text("CYOA Creator", style = MaterialTheme.typography.headlineMedium)
    Text("Create, capture, import drafts, and export package ZIPs from your phone.")

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
      Button(onClick = { onImportPackage(ImportConflictStrategy.MERGE) }) {
        Text("Import (Merge)")
      }
      Button(onClick = { onImportPackage(ImportConflictStrategy.OVERWRITE) }) {
        Text("Import (Overwrite)")
      }
      if (isBusy) CircularProgressIndicator()
    }

    OutlinedTextField(
      value = name,
      onValueChange = { name = it },
      label = { Text("Project Name") },
      modifier = Modifier.fillMaxWidth()
    )

    OutlinedTextField(
      value = content,
      onValueChange = { content = it },
      label = { Text("Story text (structured markdown or raw)") },
      modifier = Modifier
        .fillMaxWidth()
        .weight(1f)
    )

    if (llmFallback) {
      OutlinedTextField(
        value = llmBaseUrl,
        onValueChange = { llmBaseUrl = it },
        label = { Text("LLM Base URL (OpenAI-compatible)") },
        modifier = Modifier.fillMaxWidth()
      )
      OutlinedTextField(
        value = llmModel,
        onValueChange = { llmModel = it },
        label = { Text("Model") },
        modifier = Modifier.fillMaxWidth()
      )
      OutlinedTextField(
        value = llmApiKey,
        onValueChange = { llmApiKey = it },
        label = { Text("API Key") },
        modifier = Modifier.fillMaxWidth()
      )
    }

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
      TextButton(onClick = { llmFallback = !llmFallback }) {
        Text(if (llmFallback) "LLM fallback: ON" else "LLM fallback: OFF")
      }
      Button(onClick = {
        val config = if (llmFallback) {
          LlmProviderConfig(
            baseUrl = llmBaseUrl,
            apiKey = llmApiKey,
            model = llmModel,
          )
        } else {
          null
        }
        onCreate(name, content, llmFallback, config)
      }) {
        Text("Create Project")
      }
    }

    Text("Saved Projects", fontWeight = FontWeight.SemiBold)
    LazyColumn(
      contentPadding = PaddingValues(bottom = 32.dp),
      verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
      items(projects) { project ->
        Card(onClick = { onOpen(project) }) {
          Column(Modifier.padding(12.dp)) {
            Text(project.name, fontWeight = FontWeight.Bold)
            Text(project.story.meta.title)
            Text("${project.story.nodes.size} nodes · ${project.completeness}")
          }
        }
      }
    }
  }
}

@Composable
private fun ProjectWorkspace(
  modifier: Modifier,
  project: CreatorProject,
  isBusy: Boolean,
  onBack: () -> Unit,
  onRecord: (videoFile: String) -> Unit,
  onAttach: (videoFile: String) -> Unit,
  onRemoveClip: (videoFile: String) -> Unit,
  onExport: () -> Unit,
) {
  var filter by remember { mutableStateOf(NodeFilter.ALL) }
  val filteredNodes = remember(project, filter) {
    project.story.nodes.filter { node ->
      val hasClip = project.clips.any { it.videoFile == node.videoFile }
      when (filter) {
        NodeFilter.ALL -> true
        NodeFilter.MISSING -> !hasClip
        NodeFilter.READY -> hasClip
      }
    }
  }

  Column(
    modifier = modifier
      .fillMaxSize()
      .padding(16.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp)
  ) {
    Row(
      modifier = Modifier.fillMaxWidth(),
      horizontalArrangement = Arrangement.SpaceBetween
    ) {
      Text(project.name, style = MaterialTheme.typography.headlineSmall)
      TextButton(onClick = onBack) { Text("Back") }
    }

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
      Button(onClick = onExport) { Text("Export ZIP") }
      if (isBusy) CircularProgressIndicator()
    }

    Text("Story: ${project.story.meta.title}")
    Text("Progress: ${project.clips.size}/${project.story.nodes.size} clips · ${project.completeness}")

    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
      TextButton(onClick = { filter = NodeFilter.ALL }) { Text("All") }
      TextButton(onClick = { filter = NodeFilter.MISSING }) { Text("Missing") }
      TextButton(onClick = { filter = NodeFilter.READY }) { Text("Ready") }
      Spacer(modifier = Modifier.weight(1f))
      Text("Filter: ${filter.name.lowercase()}")
    }

    Card {
      Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text("Story flow graph", fontWeight = FontWeight.SemiBold)
        if (project.story.nodes.isEmpty()) {
          Text("No nodes yet")
        } else {
          project.story.nodes.forEach { node ->
            val targetList = if (node.choices.isEmpty()) {
              "(end)"
            } else {
              node.choices.joinToString { choice -> choice.targetNodeId }
            }
            Text("${node.id} -> $targetList")
          }
        }
      }
    }

    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
      items(filteredNodes) { node ->
        val clip = project.clips.firstOrNull { it.videoFile == node.videoFile }
        Card {
          Column(Modifier.padding(12.dp)) {
            Text(node.title, fontWeight = FontWeight.Bold)
            Text("Node ID: ${node.id} · Type: ${node.type}")
            Text("Expected clip: ${node.videoFile}")
            Text("Status: ${if (clip == null) "Missing" else "Ready"}")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              Button(onClick = { onRecord(node.videoFile) }) {
                Text(if (clip == null) "Record" else "Retake")
              }
              TextButton(onClick = { onAttach(node.videoFile) }) {
                Text("Attach Existing")
              }
              if (clip != null) {
                TextButton(onClick = { onRemoveClip(node.videoFile) }) {
                  Text("Remove")
                }
              }
            }
          }
        }
      }
    }
  }
}
