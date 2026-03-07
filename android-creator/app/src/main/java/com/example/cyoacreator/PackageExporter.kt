package com.example.cyoacreator

import android.content.Context
import android.net.Uri
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.io.BufferedInputStream
import java.util.zip.ZipEntry
import java.util.zip.ZipOutputStream

class PackageExporter(private val context: Context) {
  private val json = Json { prettyPrint = true }

  @kotlinx.serialization.Serializable
  private data class PackageManifest(
    val packageVersion: String,
    val storyFile: String,
    val videoDirectory: String,
    val completeness: String,
    val generatedAt: String,
    val missingAssets: List<String>
  )

  data class ExportFile(
    val name: String,
    val uri: Uri
  )

  suspend fun exportProject(
    project: CreatorProject,
    videoFiles: List<ExportFile>,
    outputZipUri: Uri
  ) {
    context.contentResolver.openOutputStream(outputZipUri)?.use { os ->
      ZipOutputStream(os).use { zip ->
        zip.putNextEntry(ZipEntry("story.json"))
        zip.write(json.encodeToString(project.story).toByteArray())
        zip.closeEntry()

        val missingAssets = project.story.nodes
          .map { it.videoFile }
          .filter { expected -> videoFiles.none { it.name == expected } }

        val manifest = PackageManifest(
          packageVersion = "1.0",
          storyFile = "story.json",
          videoDirectory = "videos",
          completeness = if (missingAssets.isEmpty()) "complete" else "incomplete",
          generatedAt = System.currentTimeMillis().toString(),
          missingAssets = missingAssets,
        )

        zip.putNextEntry(ZipEntry("package.manifest.json"))
        zip.write(json.encodeToString(manifest).toByteArray())
        zip.closeEntry()

        val buffer = ByteArray(16 * 1024)
        for (video in videoFiles) {
          zip.putNextEntry(ZipEntry("videos/${video.name}"))
          context.contentResolver.openInputStream(video.uri)?.use { input ->
            BufferedInputStream(input).use { bis ->
              while (true) {
                val read = bis.read(buffer)
                if (read <= 0) break
                zip.write(buffer, 0, read)
              }
            }
          }
          zip.closeEntry()
        }
      }
    }
  }
}
