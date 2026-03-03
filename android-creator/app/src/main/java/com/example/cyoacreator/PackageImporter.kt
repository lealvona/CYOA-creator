package com.example.cyoacreator

import android.content.Context
import android.net.Uri
import kotlinx.serialization.json.Json
import java.io.File
import java.io.FileOutputStream
import java.time.LocalDate
import java.util.UUID
import java.util.zip.ZipInputStream

class PackageImporter(private val context: Context) {
  private val json = Json { ignoreUnknownKeys = true }

  suspend fun importPackage(uri: Uri): CreatorProject {
    val tempId = UUID.randomUUID().toString()
    val projectDir = File(context.filesDir, "projects/$tempId/videos").apply {
      mkdirs()
    }

    var story: StoryDefinition? = null
    val clipAssets = mutableListOf<ClipAsset>()
    var completeness: Completeness = Completeness.INCOMPLETE

    context.contentResolver.openInputStream(uri)?.use { input ->
      ZipInputStream(input).use { zis ->
        var entry = zis.nextEntry
        val buffer = ByteArray(16 * 1024)

        while (entry != null) {
          val name = entry.name.replace("\\", "/")

          if (!entry.isDirectory) {
            when {
              name == "story.json" -> {
                val bytes = zis.readBytes()
                story = json.decodeFromString(StoryDefinition.serializer(), bytes.decodeToString())
              }

              name == "package.manifest.json" -> {
                val raw = zis.readBytes().decodeToString()
                if (raw.contains(""""completeness"\s*:\s*"complete""".toRegex())) {
                  completeness = Completeness.COMPLETE
                }
              }

              name.startsWith("videos/") -> {
                val videoName = name.removePrefix("videos/")
                if (videoName.isNotBlank()) {
                  val out = File(projectDir, videoName)
                  out.parentFile?.mkdirs()
                  FileOutputStream(out).use { fos ->
                    while (true) {
                      val read = zis.read(buffer)
                      if (read <= 0) break
                      fos.write(buffer, 0, read)
                    }
                  }
                  clipAssets += ClipAsset(videoFile = videoName, uri = Uri.fromFile(out).toString())
                }
              }
            }
          }

          zis.closeEntry()
          entry = zis.nextEntry
        }
      }
    }

    val parsedStory = story ?: StoryDefinition(
      meta = StoryMeta(
        title = "Imported Draft",
        description = "Imported package without story.json",
        author = "Unknown",
        version = "1.0.0",
        date = LocalDate.now().toString()
      ),
      config = StoryConfig(),
      startNodeId = "intro",
      nodes = emptyList()
    )

    val inferredCompleteness = if (parsedStory.nodes.isNotEmpty() &&
      parsedStory.nodes.all { node -> clipAssets.any { it.videoFile == node.videoFile } }
    ) {
      Completeness.COMPLETE
    } else {
      completeness
    }

    return CreatorProject(
      id = tempId,
      name = parsedStory.meta.title,
      rawStoryText = "",
      parseMode = ParseMode.STRUCTURED_MARKDOWN,
      story = parsedStory,
      clips = clipAssets,
      completeness = inferredCompleteness
    )
  }
}
