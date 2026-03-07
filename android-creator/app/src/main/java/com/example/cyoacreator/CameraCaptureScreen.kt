package com.example.cyoacreator

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Environment
import androidx.camera.core.CameraSelector
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.video.FileOutputOptions
import androidx.camera.video.PendingRecording
import androidx.camera.video.Quality
import androidx.camera.video.Recorder
import androidx.camera.video.Recording
import androidx.camera.video.VideoCapture
import androidx.camera.video.VideoRecordEvent
import androidx.camera.view.PreviewView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import androidx.compose.ui.text.font.FontWeight
import java.io.File

@Composable
fun CameraCaptureScreen(
  expectedVideoFile: String,
  onDone: (Uri) -> Unit,
  onCancel: () -> Unit
) {
  val context = LocalContext.current
  val lifecycleOwner = LocalLifecycleOwner.current
  val previewView = remember { PreviewView(context) }
  val recorder = remember {
    Recorder.Builder()
      .setQualitySelector(androidx.camera.video.QualitySelector.from(Quality.HD))
      .build()
  }
  val videoCapture = remember { VideoCapture.withOutput(recorder) }

  var recording by remember { mutableStateOf<Recording?>(null) }
  var status by remember { mutableStateOf("Ready to record") }
  var lensFacing by remember { mutableStateOf(CameraSelector.LENS_FACING_BACK) }
  var hasFrontCamera by remember { mutableStateOf(false) }
  var hasBackCamera by remember { mutableStateOf(true) }

  val hasCameraPermission = ContextCompat.checkSelfPermission(
    context,
    Manifest.permission.CAMERA
  ) == PackageManager.PERMISSION_GRANTED

  val hasAudioPermission = ContextCompat.checkSelfPermission(
    context,
    Manifest.permission.RECORD_AUDIO
  ) == PackageManager.PERMISSION_GRANTED

  LaunchedEffect(hasCameraPermission, lifecycleOwner, lensFacing) {
    if (!hasCameraPermission) return@LaunchedEffect

    val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
    cameraProviderFuture.addListener({
      val cameraProvider = cameraProviderFuture.get()
      hasFrontCamera = cameraProvider.hasCamera(CameraSelector.DEFAULT_FRONT_CAMERA)
      hasBackCamera = cameraProvider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA)

      if (lensFacing == CameraSelector.LENS_FACING_FRONT && !hasFrontCamera) {
        lensFacing = CameraSelector.LENS_FACING_BACK
      }

      val selector = CameraSelector.Builder()
        .requireLensFacing(lensFacing)
        .build()

      val preview = Preview.Builder().build().also {
        it.surfaceProvider = previewView.surfaceProvider
      }
      cameraProvider.unbindAll()
      cameraProvider.bindToLifecycle(
        lifecycleOwner,
        selector,
        preview,
        videoCapture
      )
    }, ContextCompat.getMainExecutor(context))
  }

  Box(modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.background)) {
    AndroidView(
      factory = { previewView },
      modifier = Modifier.fillMaxSize()
    )

    Column(
      modifier = Modifier
        .align(Alignment.BottomCenter)
        .fillMaxWidth()
        .padding(16.dp),
      verticalArrangement = Arrangement.spacedBy(10.dp)
    ) {
      Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(
          containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.92f)
        ),
        modifier = Modifier.fillMaxWidth()
      ) {
        Column(
          modifier = Modifier.padding(14.dp),
          verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
          Text(
            text = "Capture clip",
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold,
            color = MaterialTheme.colorScheme.onSurface,
          )
          Text(
            text = expectedVideoFile,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
          )
          Text(
            text = status,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface,
          )

          Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(onClick = {
              if (!hasCameraPermission) {
                status = "Camera permission required"
                return@Button
              }

              if (recording == null) {
                val outputFile = createOutputFile(context, expectedVideoFile)
                val outputOptions = FileOutputOptions.Builder(outputFile).build()
                var pending: PendingRecording = videoCapture.output
                  .prepareRecording(context, outputOptions)
                if (hasAudioPermission) {
                  pending = pending.withAudioEnabled()
                }

                recording = pending.start(ContextCompat.getMainExecutor(context)) { event ->
                  when (event) {
                    is VideoRecordEvent.Start -> status = "Recording..."
                    is VideoRecordEvent.Finalize -> {
                      recording = null
                      if (event.hasError()) {
                        status = "Recording failed (${event.error})"
                      } else {
                        status = "Saved"
                        onDone(Uri.fromFile(outputFile))
                      }
                    }
                  }
                }
              } else {
                recording?.stop()
              }
            }) {
              Text(if (recording == null) "Record" else "Stop")
            }

            val canFlip = hasFrontCamera && hasBackCamera
            FilledTonalButton(
              enabled = canFlip && recording == null,
              onClick = {
                lensFacing = if (lensFacing == CameraSelector.LENS_FACING_BACK) {
                  CameraSelector.LENS_FACING_FRONT
                } else {
                  CameraSelector.LENS_FACING_BACK
                }
                status = if (lensFacing == CameraSelector.LENS_FACING_FRONT) {
                  "Front camera active"
                } else {
                  "Back camera active"
                }
              }
            ) {
              Text(if (lensFacing == CameraSelector.LENS_FACING_FRONT) "Use Back" else "Use Front")
            }

            Button(onClick = {
              recording?.stop()
              onCancel()
            }) {
              Text("Cancel")
            }
          }
        }
      }
    }
  }
}

private fun createOutputFile(context: Context, expectedVideoFile: String): File {
  val outputDir = File(
    context.getExternalFilesDir(Environment.DIRECTORY_MOVIES),
    "cyoa-capture"
  ).apply { mkdirs() }
  return File(outputDir, expectedVideoFile)
}
