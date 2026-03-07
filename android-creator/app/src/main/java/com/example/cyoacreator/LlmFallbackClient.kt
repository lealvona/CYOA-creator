package com.example.cyoacreator

import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import kotlinx.serialization.json.putJsonArray
import kotlinx.serialization.json.putJsonObject
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

@Serializable
data class LlmProviderConfig(
  val baseUrl: String,
  val apiKey: String,
  val model: String
)

class LlmFallbackClient(
  private val config: LlmProviderConfig,
  private val http: OkHttpClient = OkHttpClient(),
  private val json: Json = Json { ignoreUnknownKeys = true }
) {
  suspend fun convertRawTextToStory(rawText: String): StoryDefinition {
    val prompt = """
      Convert the raw story into JSON matching this schema:
      {
        "meta": {"title":"...","description":"...","author":"...","version":"1.0.0","date":"YYYY-MM-DD"},
        "config": {"videoBasePath":"videos","preloadNext":true,"defaultVolume":1.0,"allowRevisit":true,"choiceLeadTime":0},
        "startNodeId": "...",
        "nodes": [
          {"id":"...","title":"...","type":"start|video|ending","videoFile":"id.mp4","subtitle":"...","choices":[{"id":"...","label":"...","targetNodeId":"..."}]}
        ]
      }
      Return JSON only.

      STORY:
      $rawText
    """.trimIndent()

    val payload = buildJsonObject {
      put("model", config.model)
      putJsonArray("messages") {
        add(buildJsonObject {
          put("role", "system")
          put("content", "You output valid JSON only.")
        })
        add(buildJsonObject {
          put("role", "user")
          put("content", prompt)
        })
      }
      put("temperature", 0.1)
    }

    val request = Request.Builder()
      .url(config.baseUrl.trimEnd('/') + "/v1/chat/completions")
      .addHeader("Authorization", "Bearer ${config.apiKey}")
      .addHeader("Content-Type", "application/json")
      .post(payload.toString().toRequestBody("application/json".toMediaType()))
      .build()

    val response = http.newCall(request).execute()
    val body = response.body?.string().orEmpty()
    if (!response.isSuccessful) {
      val detail = body.take(220).ifBlank { response.message }
      throw IllegalStateException("LLM request failed (${response.code}): $detail")
    }

    val root = json.parseToJsonElement(body).jsonObject
    val choices = root["choices"]?.jsonArray ?: JsonArray(emptyList())
    val content = choices.firstOrNull()
      ?.jsonObject
      ?.get("message")
      ?.jsonObject
      ?.get("content")
      ?.jsonPrimitive
      ?.content
      ?.trim()
      ?: throw IllegalStateException("LLM response missing content")

    return json.decodeFromString(StoryDefinition.serializer(), content)
  }
}
