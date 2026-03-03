package com.example.cyoacreator

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ElevatedCard
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.vectorResource
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat

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
  val context = LocalContext.current
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
  ) { permissions ->
    val requestedVideoFile = pendingCaptureVideoFile
    pendingCaptureVideoFile = null
    val denied = permissions.entries.filterNot { it.value }.map { it.key }
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

  val title = if (ui.selectedProject == null) "CYOA Creator" else ui.selectedProject!!.name

  Scaffold(
    topBar = {
      TopAppBar(
        title = {
          Text(
            text = title,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
          )
        }
      )
    },
    snackbarHost = { SnackbarHost(snackbarHost) }
  ) { padding ->
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
        },
        onDeleteProject = vm::deleteProject,
        onDeleteAllProjects = vm::deleteAllProjects,
      )
    } else {
      ProjectWorkspace(
        modifier = Modifier.padding(padding),
        project = ui.selectedProject!!,
        isBusy = ui.isBusy,
        onBack = vm::clearSelection,
        onRecord = { videoFile ->
          val hasCamera = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.CAMERA,
          ) == PackageManager.PERMISSION_GRANTED
          val hasAudio = ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.RECORD_AUDIO,
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
        },
        onDeleteNode = vm::deleteNode,
        onDeleteProject = {
          vm.deleteProject(ui.selectedProject!!)
        },
      )
    }
  }
}

@Composable
private fun StatChip(label: String, value: String) {
  Surface(
    shape = MaterialTheme.shapes.small,
    tonalElevation = 2.dp,
    modifier = Modifier.padding(end = 6.dp, bottom = 6.dp)
  ) {
    Text(
      text = "$label: $value",
      style = MaterialTheme.typography.labelMedium,
      modifier = Modifier.padding(horizontal = 8.dp, vertical = 6.dp)
    )
  }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun ProjectHome(
  modifier: Modifier,
  projects: List<CreatorProject>,
  isBusy: Boolean,
  onCreate: (name: String, text: String, useLlm: Boolean, llmConfig: LlmProviderConfig?) -> Unit,
  onOpen: (CreatorProject) -> Unit,
  onImportPackage: (ImportConflictStrategy) -> Unit,
  onDeleteProject: (CreatorProject) -> Unit,
  onDeleteAllProjects: () -> Unit,
) {
  var showDeleteAllDialog by remember { mutableStateOf(false) }
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

  LazyColumn(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = 12.dp),
    contentPadding = PaddingValues(bottom = 28.dp, top = 8.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    item {
      ElevatedCard {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
          Text("Story Drafting", style = MaterialTheme.typography.titleMedium)
          Text(
            "Paste markdown or free text, then create a project to start capture.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )

          FlowRow {
            StatChip("Projects", projects.size.toString())
            val totalNodes = projects.sumOf { it.story.nodes.size }
            StatChip("Total Nodes", totalNodes.toString())
            val complete = projects.count { it.completeness == Completeness.COMPLETE }
            StatChip("Complete", complete.toString())
          }

          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilledTonalButton(onClick = { onImportPackage(ImportConflictStrategy.MERGE) }) {
              Text("Import Merge")
            }
            FilledTonalButton(onClick = { onImportPackage(ImportConflictStrategy.OVERWRITE) }) {
              Text("Import Overwrite")
            }
            if (projects.isNotEmpty()) {
              TextButton(
                onClick = { showDeleteAllDialog = true },
                colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
                  contentColor = MaterialTheme.colorScheme.error
                )
              ) {
                Text("Delete All")
              }
            }
            if (isBusy) {
              CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterVertically))
            }
          }

          OutlinedTextField(
            value = name,
            onValueChange = { name = it },
            label = { Text("Project Name") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
          )

          OutlinedTextField(
            value = content,
            onValueChange = { content = it },
            label = { Text("Story text (markdown or prose)") },
            modifier = Modifier
              .fillMaxWidth()
              .heightIn(min = 180.dp),
          )

          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
              selected = llmFallback,
              onClick = { llmFallback = !llmFallback },
              label = { Text(if (llmFallback) "LLM Enabled" else "LLM Disabled") },
            )
            AssistChip(
              onClick = {
                content = """
                  # Title: Rescue Mission
                  # Author: Team
                  # Description: Navigate a branching rescue operation

                  ## node:intro:start
                  You're at mission control.
                  -> scout | Send scout drone | drone_feed
                  -> team | Send rescue team | rescue_team

                  ## node:drone_feed:video
                  The drone spots movement near the bridge.
                  -> bridge | Approach the bridge | bridge_scene

                  ## node:rescue_team:ending
                  Team gets trapped by debris.

                  ## node:bridge_scene:ending
                  Survivors found and evacuated.
                """.trimIndent()
              },
              label = { Text("Use Template") },
            )
          }

          if (llmFallback) {
            OutlinedTextField(
              value = llmBaseUrl,
              onValueChange = { llmBaseUrl = it },
              label = { Text("LLM Base URL") },
              singleLine = true,
              modifier = Modifier.fillMaxWidth(),
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
              OutlinedTextField(
                value = llmModel,
                onValueChange = { llmModel = it },
                label = { Text("Model") },
                singleLine = true,
                modifier = Modifier.weight(1f),
              )
              OutlinedTextField(
                value = llmApiKey,
                onValueChange = { llmApiKey = it },
                label = { Text("API Key") },
                singleLine = true,
                modifier = Modifier.weight(1f),
              )
            }
          }

          Button(
            onClick = {
              val config = if (llmFallback) {
                LlmProviderConfig(baseUrl = llmBaseUrl, apiKey = llmApiKey, model = llmModel)
              } else {
                null
              }
              onCreate(name, content, llmFallback, config)
            },
            modifier = Modifier.fillMaxWidth(),
          ) {
            Text("Create Project")
          }
        }
      }
    }

    item {
      Text(
        "Saved Projects",
        style = MaterialTheme.typography.titleMedium,
        fontWeight = FontWeight.SemiBold,
      )
    }

    if (projects.isEmpty()) {
      item {
        Card {
          Text(
            "No projects yet. Create one above or import a package.",
            modifier = Modifier.padding(12.dp),
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
        }
      }
    } else {
      items(projects) { project ->
        val progress = computeProjectProgress(project)
        var showDeleteDialog by remember { mutableStateOf(false) }

        ElevatedCard(onClick = { onOpen(project) }) {
          Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            Row(
              modifier = Modifier.fillMaxWidth(),
              horizontalArrangement = Arrangement.SpaceBetween,
              verticalAlignment = Alignment.CenterVertically
            ) {
              Text(project.name, fontWeight = FontWeight.Bold)
              IconButton(
                onClick = { showDeleteDialog = true },
                modifier = Modifier.padding(0.dp)
              ) {
                Text("×", style = MaterialTheme.typography.titleLarge, color = MaterialTheme.colorScheme.error)
              }
            }
            Text(
              "${project.story.meta.author} · ${project.story.meta.version}",
              style = MaterialTheme.typography.bodySmall,
              color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
              "Nodes ${progress.totalNodes} · Captured ${progress.capturedClips} · Missing ${progress.missingClips}",
              style = MaterialTheme.typography.bodySmall,
            )
            LinearProgressIndicator(
              progress = {
                if (progress.totalNodes == 0) 0f
                else progress.capturedClips.toFloat() / progress.totalNodes.toFloat()
              },
              modifier = Modifier.fillMaxWidth(),
            )
          }
        }

        if (showDeleteDialog) {
          AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("Delete Project") },
            text = { Text("Are you sure you want to delete '${project.name}'? This cannot be undone.") },
            confirmButton = {
              TextButton(
                onClick = {
                  onDeleteProject(project)
                  showDeleteDialog = false
                },
                colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
                  contentColor = MaterialTheme.colorScheme.error
                )
              ) {
                Text("Delete")
              }
            },
            dismissButton = {
              TextButton(onClick = { showDeleteDialog = false }) {
                Text("Cancel")
              }
            }
          )
        }
      }
    }
  }

  if (showDeleteAllDialog) {
    AlertDialog(
      onDismissRequest = { showDeleteAllDialog = false },
      title = { Text("Delete All Projects") },
      text = { Text("Are you sure you want to delete ALL projects? This cannot be undone.") },
      confirmButton = {
        TextButton(
          onClick = {
            onDeleteAllProjects()
            showDeleteAllDialog = false
          },
          colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
            contentColor = MaterialTheme.colorScheme.error
          )
        ) {
          Text("Delete All")
        }
      },
      dismissButton = {
        TextButton(onClick = { showDeleteAllDialog = false }) {
          Text("Cancel")
        }
      }
    )
  }
}

@OptIn(ExperimentalLayoutApi::class)
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
  onDeleteNode: (String) -> Unit,
  onDeleteProject: () -> Unit,
) {
  val progress = computeProjectProgress(project)
  var filter by remember { mutableStateOf(NodeFilter.ALL) }
  var query by remember { mutableStateOf("") }
  var showDeleteProjectDialog by remember { mutableStateOf(false) }
  var nodeToDelete by remember { mutableStateOf<String?>(null) }

  val filteredNodes = remember(project, filter, query) {
    project.story.nodes.filter { node ->
      val hasClip = project.clips.any { it.videoFile == node.videoFile }
      val byState = when (filter) {
        NodeFilter.ALL -> true
        NodeFilter.MISSING -> !hasClip
        NodeFilter.READY -> hasClip
      }
      val byQuery = query.isBlank() ||
        node.id.contains(query, ignoreCase = true) ||
        node.title.contains(query, ignoreCase = true) ||
        node.videoFile.contains(query, ignoreCase = true)
      byState && byQuery
    }
  }

  LazyColumn(
    modifier = modifier
      .fillMaxSize()
      .padding(horizontal = 12.dp),
    contentPadding = PaddingValues(bottom = 24.dp, top = 8.dp),
    verticalArrangement = Arrangement.spacedBy(10.dp),
  ) {
    item {
      ElevatedCard {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
          Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            Column(Modifier.weight(1f)) {
              Text(project.story.meta.title, style = MaterialTheme.typography.titleMedium)
              Text(
                "${project.story.meta.author} · ${project.story.meta.version}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
              )
            }
            TextButton(onClick = onBack) { Text("Back") }
          }

          FlowRow {
            StatChip("Nodes", progress.totalNodes.toString())
            StatChip("Endings", progress.endingNodes.toString())
            StatChip("Captured", progress.capturedClips.toString())
            StatChip("Missing", progress.missingClips.toString())
            StatChip("State", project.completeness.name)
          }

          LinearProgressIndicator(
            progress = {
              if (progress.totalNodes == 0) 0f
              else progress.capturedClips.toFloat() / progress.totalNodes.toFloat()
            },
            modifier = Modifier.fillMaxWidth(),
          )

          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = onExport, modifier = Modifier.weight(1f)) {
              Text("Export ZIP")
            }
            TextButton(
              onClick = { showDeleteProjectDialog = true },
              colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
                contentColor = MaterialTheme.colorScheme.error
              )
            ) {
              Text("Delete")
            }
            if (isBusy) CircularProgressIndicator(modifier = Modifier.align(Alignment.CenterVertically))
          }

          Text(
            "Workflow: 1) Parse story  2) Capture each node clip  3) Export package",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
        }
      }
    }

    item {
      Card {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
          OutlinedTextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("Search nodes") },
            singleLine = true,
            modifier = Modifier.fillMaxWidth(),
          )

          FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(
              selected = filter == NodeFilter.ALL,
              onClick = { filter = NodeFilter.ALL },
              label = { Text("All") },
            )
            FilterChip(
              selected = filter == NodeFilter.MISSING,
              onClick = { filter = NodeFilter.MISSING },
              label = { Text("Missing") },
            )
            FilterChip(
              selected = filter == NodeFilter.READY,
              onClick = { filter = NodeFilter.READY },
              label = { Text("Ready") },
            )
          }
        }
      }
    }

    item {
      Card {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
          Text("Story flow graph", fontWeight = FontWeight.SemiBold)
          if (project.story.nodes.isEmpty()) {
            Text("No nodes yet")
          } else {
            project.story.nodes.forEach { node ->
              val targetList = if (node.choices.isEmpty()) "(end)"
              else node.choices.joinToString { choice -> choice.targetNodeId }
              Text(
                "${node.id} -> $targetList",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
              )
            }
          }
        }
      }
    }

    items(filteredNodes) { node ->
      val clip = project.clips.firstOrNull { it.videoFile == node.videoFile }
      ElevatedCard {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
          Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            Text(node.title, fontWeight = FontWeight.Bold)
            Text(
              if (clip == null) "Missing" else "Ready",
              color = if (clip == null) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary,
              style = MaterialTheme.typography.labelMedium,
            )
          }

          Text(
            "${node.id} · ${node.type} · ${node.videoFile}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
          if (!node.subtitle.isNullOrBlank()) {
            Text(
              node.subtitle,
              style = MaterialTheme.typography.bodySmall,
              maxLines = 2,
              overflow = TextOverflow.Ellipsis,
            )
          }

          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilledTonalButton(onClick = { onRecord(node.videoFile) }) {
              Text(if (clip == null) "Record" else "Retake")
            }
            TextButton(onClick = { onAttach(node.videoFile) }) {
              Text("Attach")
            }
            if (clip != null) {
              TextButton(onClick = { onRemoveClip(node.videoFile) }) {
                Text("Remove")
              }
            }
            TextButton(
              onClick = { nodeToDelete = node.id },
              colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
                contentColor = MaterialTheme.colorScheme.error
              )
            ) {
              Text("Delete Node")
            }
          }
        }
      }
    }

    if (filteredNodes.isEmpty()) {
      item {
        Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
          Text(
            "No nodes match this filter/search.",
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(16.dp),
          )
        }
      }
    }
  }

  // Delete Node Confirmation Dialog
  if (nodeToDelete != null) {
    AlertDialog(
      onDismissRequest = { nodeToDelete = null },
      title = { Text("Delete Node") },
      text = { Text("Are you sure you want to delete this node? This will also remove any choices that point to this node. This cannot be undone.") },
      confirmButton = {
        TextButton(
          onClick = {
            onDeleteNode(nodeToDelete!!)
            nodeToDelete = null
          },
          colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
            contentColor = MaterialTheme.colorScheme.error
          )
        ) {
          Text("Delete")
        }
      },
      dismissButton = {
        TextButton(onClick = { nodeToDelete = null }) {
          Text("Cancel")
        }
      }
    )
  }

  // Delete Project Confirmation Dialog
  if (showDeleteProjectDialog) {
    AlertDialog(
      onDismissRequest = { showDeleteProjectDialog = false },
      title = { Text("Delete Project") },
      text = { Text("Are you sure you want to delete '${project.name}'? This will remove all nodes, clips, and data. This cannot be undone.") },
      confirmButton = {
        TextButton(
          onClick = {
            onDeleteProject()
            showDeleteProjectDialog = false
          },
          colors = androidx.compose.material3.ButtonDefaults.textButtonColors(
            contentColor = MaterialTheme.colorScheme.error
          )
        ) {
          Text("Delete")
        }
      },
      dismissButton = {
        TextButton(onClick = { showDeleteProjectDialog = false }) {
          Text("Cancel")
        }
      }
    )
  }
}
