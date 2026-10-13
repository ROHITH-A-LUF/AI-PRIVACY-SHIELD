package com.privacyshield.ai.ui.components

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.privacyshield.ai.ui.theme.BackgroundDark
import com.privacyshield.ai.ui.theme.CyanAccent
import com.privacyshield.ai.ui.theme.EmeraldSafe
import com.privacyshield.ai.ui.theme.SurfaceGlassBorder
import com.privacyshield.ai.ui.theme.TextPrimary
import com.privacyshield.ai.ui.theme.TextSecondary

@Composable
fun RadialRiskGauge(
    score: Int,
    modifier: Modifier = Modifier,
    size: Dp = 160.dp,
    strokeWidth: Dp = 14.dp,
    isHealthScore: Boolean = true // If true, 100 is good (green); if false (risk score), 100 is critical (red)
) {
    val animatedScore by animateFloatAsState(
        targetValue = score.toFloat(),
        animationSpec = tween(durationMillis = 1200, easing = FastOutSlowInEasing),
        label = "radial_score"
    )

    val progressSweep = (animatedScore / 100f) * 280f

    val indicatorColor = if (isHealthScore) {
        when {
            score >= 80 -> EmeraldSafe
            score >= 50 -> Color(0xFFF59E0B)
            else -> Color(0xFFEF4444)
        }
    } else {
        when {
            score <= 30 -> EmeraldSafe
            score <= 60 -> Color(0xFFF59E0B)
            score <= 80 -> Color(0xFFF97316)
            else -> Color(0xFFEF4444)
        }
    }

    Box(
        contentAlignment = Alignment.Center,
        modifier = modifier.size(size)
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val strokePx = strokeWidth.toPx()
            val arcSize = Size(size.toPx() - strokePx, size.toPx() - strokePx)
            val topLeft = Offset(strokePx / 2, strokePx / 2)

            // Background Track
            drawArc(
                color = SurfaceGlassBorder.copy(alpha = 0.4f),
                startAngle = 130f,
                sweepAngle = 280f,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = strokePx, cap = StrokeCap.Round)
            )

            // Foreground Active Progress
            drawArc(
                brush = Brush.sweepGradient(
                    listOf(indicatorColor.copy(alpha = 0.7f), indicatorColor)
                ),
                startAngle = 130f,
                sweepAngle = progressSweep,
                useCenter = false,
                topLeft = topLeft,
                size = arcSize,
                style = Stroke(width = strokePx, cap = StrokeCap.Round)
            )
        }

        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(
                text = "${animatedScore.toInt()}",
                fontSize = 36.sp,
                fontWeight = FontWeight.ExtraBold,
                color = TextPrimary
            )
            Text(
                text = if (isHealthScore) "HEALTH" else "RISK / 100",
                fontSize = 11.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextSecondary,
                letterSpacing = 1.sp
            )
        }
    }
}
