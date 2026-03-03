package com.example.cyoacreator

import android.content.Context
import androidx.room.Room
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json

class ProjectRepository(context: Context) {
  private val db = Room.databaseBuilder(
    context,
    ProjectDatabase::class.java,
    "creator-projects.db"
  ).fallbackToDestructiveMigration().build()

  private val dao = db.projectDao()
  private val json = Json { ignoreUnknownKeys = true; prettyPrint = true }

  fun observeProjects(): Flow<List<CreatorProject>> = dao.observeProjects().map { items ->
    items.mapNotNull { entity ->
      runCatching {
        json.decodeFromString(CreatorProject.serializer(), entity.projectJson)
      }.getOrNull()
    }
  }

  suspend fun save(project: CreatorProject) {
    dao.upsert(
      ProjectEntity(
        id = project.id,
        name = project.name,
        projectJson = json.encodeToString(project.copy(updatedAt = System.currentTimeMillis())),
        updatedAt = System.currentTimeMillis()
      )
    )
  }

  suspend fun delete(projectId: String) {
    dao.delete(projectId)
  }

  suspend fun deleteAll() {
    dao.deleteAll()
  }
}
