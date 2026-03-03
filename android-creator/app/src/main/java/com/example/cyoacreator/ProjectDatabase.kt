package com.example.cyoacreator

import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.RoomDatabase
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "projects")
data class ProjectEntity(
  @PrimaryKey val id: String,
  val name: String,
  val projectJson: String,
  val updatedAt: Long
)

@Dao
interface ProjectDao {
  @Query("SELECT * FROM projects ORDER BY updatedAt DESC")
  fun observeProjects(): Flow<List<ProjectEntity>>

  @Query("SELECT * FROM projects WHERE id = :id LIMIT 1")
  suspend fun getProject(id: String): ProjectEntity?

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  suspend fun upsert(project: ProjectEntity)

  @Query("DELETE FROM projects WHERE id = :id")
  suspend fun delete(id: String)

  @Query("DELETE FROM projects")
  suspend fun deleteAll()
}

@Database(entities = [ProjectEntity::class], version = 2, exportSchema = false)
abstract class ProjectDatabase : RoomDatabase() {
  abstract fun projectDao(): ProjectDao
}
