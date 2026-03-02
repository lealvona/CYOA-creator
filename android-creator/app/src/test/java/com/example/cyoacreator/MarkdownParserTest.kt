package com.example.cyoacreator

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MarkdownParserTest {
  @Test
  fun `parse structured markdown into expected graph`() {
    val input = """
      # Title: Sample Mission
      # Author: Test Writer
      # Description: Branching mission

      ## node:intro:start
      You stand at mission control.
      -> left_path | Take the left path | left_room
      -> right_path | Take the right path | right_room

      ## node:left_room:video
      The left corridor is clear.
      -> left_end | Continue | ending_safe

      ## node:right_room:ending
      You hit a trap.

      ## node:ending_safe:ending
      You reach the extraction zone.
    """.trimIndent()

    val story = StructuredMarkdownParser.parse(input)

    assertEquals("Sample Mission", story.meta.title)
    assertEquals("Test Writer", story.meta.author)
    assertEquals("intro", story.startNodeId)
    assertEquals(4, story.nodes.size)

    val intro = story.nodes.first { it.id == "intro" }
    assertEquals("start", intro.type)
    assertEquals(2, intro.choices.size)
    assertEquals("left_room", intro.choices.first().targetNodeId)

    val ending = story.nodes.first { it.id == "ending_safe" }
    assertTrue(ending.choices.isEmpty())
    assertEquals("ending", ending.type)
  }
}
