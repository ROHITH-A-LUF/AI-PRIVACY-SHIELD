package com.privacyshield.ai.ui.components

import android.content.Intent
import android.net.Uri
import android.provider.Settings
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.privacyshield.ai.core.model.ApplicationMetadata
import com.privacyshield.ai.core.model.AuditRecommendation
import com.privacyshield.ai.core.model.PermissionItem
import com.privacyshield.ai.core.model.PermissionSensitivity
import com.privacyshield.ai.core.model.PermissionStatus
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.core.model.ThreatVector
import com.privacyshield.ai.ui.theme.CyanAccent
import com.privacyshield.ai.ui.theme.EmeraldSafe
import com.privacyshield.ai.ui.theme.SurfaceCard
import com.privacyshield.ai.ui.theme.SurfaceGlassBorder
import com.privacyshield.ai.ui.theme.TextMuted
import com.privacyshield.ai.ui.theme.TextPrimary
import com.privacyshield.ai.ui.theme.TextSecondary

@Composable
fun StatMetricCard(
    value: String,
    label: String,
    modifier: Modifier = Modifier,
    accentColor: Color = CyanAccent
) {
    Card(
        modifier = modifier
            .border(1.dp, SurfaceGlassBorder, RoundedCornerShape(14.dp)),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard.copy(alpha = 0.7f)),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = value,
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold,
                color = accentColor
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                color = TextSecondary,
                fontWeight = FontWeight.Medium
            )
        }
    }
}

@Composable
fun RiskLevelBadge(riskLevel: RiskLevel) {
    val color = Color(android.graphics.Color.parseColor(riskLevel.hexColor))
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(color.copy(alpha = 0.15f))
            .border(1.dp, color.copy(alpha = 0.5f), RoundedCornerShape(20.dp))
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = riskLevel.title.uppercase(),
            fontSize = 10.sp,
            fontWeight = FontWeight.Bold,
            color = color,
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun PermissionStatusBadge(status: PermissionStatus) {
    val (badgeBg, badgeBorder, badgeText) = when (status) {
        PermissionStatus.GRANTED -> Triple(Color(0xFF10B981).copy(alpha = 0.15f), Color(0xFF10B981), Color(0xFF10B981))
        PermissionStatus.DENIED -> Triple(Color(0xFFEF4444).copy(alpha = 0.15f), Color(0xFFEF4444), Color(0xFFFCA5A5))
        PermissionStatus.DECLARED -> Triple(Color(0xFF3B82F6).copy(alpha = 0.15f), Color(0xFF3B82F6), Color(0xFF93C5FD))
        PermissionStatus.NOT_REQUESTED -> Triple(Color(0xFF6B7280).copy(alpha = 0.15f), Color(0xFF6B7280), Color(0xFF9CA3AF))
    }

    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(6.dp))
            .background(badgeBg)
            .border(1.dp, badgeBorder.copy(alpha = 0.5f), RoundedCornerShape(6.dp))
            .padding(horizontal = 7.dp, vertical = 2.dp)
    ) {
        Text(
            text = status.label,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            color = badgeText,
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun PermissionAuditRow(permission: PermissionItem) {
    var expanded by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .border(1.dp, if (!permission.isExpectedForCategory) Color(0xFFF97316).copy(alpha = 0.4f) else SurfaceGlassBorder, RoundedCornerShape(10.dp))
            .clickable { expanded = !expanded },
        colors = CardDefaults.cardColors(
            containerColor = if (!permission.isExpectedForCategory) Color(0xFF261917) else SurfaceCard.copy(alpha = 0.5f)
        ),
        shape = RoundedCornerShape(10.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(if (permission.isGranted) EmeraldSafe else if (permission.status == PermissionStatus.DENIED) Color(0xFFEF4444) else TextMuted)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Column {
                        Text(
                            text = permission.simpleName,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = TextPrimary
                        )
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = "${permission.group} • Requested: ",
                                fontSize = 11.sp,
                                color = TextSecondary
                            )
                            Text(
                                text = if (permission.isRequested) "YES" else "NO",
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (permission.isRequested) CyanAccent else TextMuted
                            )
                        }
                    }
                }

                Row(verticalAlignment = Alignment.CenterVertically) {
                    PermissionStatusBadge(status = permission.status)
                    Spacer(modifier = Modifier.width(6.dp))
                    if (!permission.isExpectedForCategory) {
                        Box(
                            modifier = Modifier
                                .clip(RoundedCornerShape(6.dp))
                                .background(Color(0xFFEF4444).copy(alpha = 0.2f))
                                .padding(horizontal = 6.dp, vertical = 2.dp)
                        ) {
                            Text(
                                text = "MISMATCH",
                                fontSize = 9.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFEF4444)
                            )
                        }
                        Spacer(modifier = Modifier.width(6.dp))
                    }

                    Icon(
                        imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = "Expand",
                        tint = TextSecondary,
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            AnimatedVisibility(visible = expanded) {
                Column(modifier = Modifier.padding(top = 10.dp)) {
                    Text(
                        text = "Technical API: ${permission.permissionString}",
                        fontSize = 11.sp,
                        color = CyanAccent,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = "Protection Level: ${permission.protectionLevel}",
                        fontSize = 11.sp,
                        color = TextSecondary,
                        fontWeight = FontWeight.Normal
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Data Exposed: ${permission.dataExposed}",
                        fontSize = 12.sp,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Privacy Risk: ${permission.privacyRiskExplanation}",
                        fontSize = 12.sp,
                        color = Color(0xFFFCA5A5)
                    )
                }
            }
        }
    }
}

data class SensorCategoryStatus(
    val icon: String,
    val displayName: String,
    val isRequested: Boolean,
    val isGranted: Boolean,
    val statusText: String,
    val statusColor: Color
)

@Composable
fun PermissionSensorMatrixCard(
    app: ApplicationMetadata,
    onOpenSettings: () -> Unit
) {
    val categories = listOf(
        // 1. Microphone
        SensorCategoryStatus(
            icon = "🎤",
            displayName = "Microphone",
            isRequested = app.hasMicrophoneRequested,
            isGranted = app.isMicrophoneGranted,
            statusText = if (app.hasMicrophoneRequested) (if (app.isMicrophoneGranted) "GRANTED (ON)" else "DENIED (OFF)") else "NOT REQUESTED",
            statusColor = if (app.hasMicrophoneRequested) (if (app.isMicrophoneGranted) EmeraldSafe else Color(0xFFEF4444)) else Color(0xFF6B7280)
        ),
        // 2. Camera
        SensorCategoryStatus(
            icon = "📷",
            displayName = "Camera",
            isRequested = app.hasCameraRequested,
            isGranted = app.isCameraGranted,
            statusText = if (app.hasCameraRequested) (if (app.isCameraGranted) "GRANTED (ON)" else "DENIED (OFF)") else "NOT REQUESTED",
            statusColor = if (app.hasCameraRequested) (if (app.isCameraGranted) EmeraldSafe else Color(0xFFEF4444)) else Color(0xFF6B7280)
        ),
        // 3. Location
        SensorCategoryStatus(
            icon = "📍",
            displayName = "Location",
            isRequested = app.hasLocationRequested,
            isGranted = app.isLocationGranted,
            statusText = if (app.hasLocationRequested) (if (app.isLocationGranted) "GRANTED (ON)" else "DENIED (OFF)") else "NOT REQUESTED",
            statusColor = if (app.hasLocationRequested) (if (app.isLocationGranted) EmeraldSafe else Color(0xFFEF4444)) else Color(0xFF6B7280)
        ),
        // 4. Internet
        SensorCategoryStatus(
            icon = "🌐",
            displayName = "Internet",
            isRequested = app.hasInternetRequested,
            isGranted = app.hasInternetRequested,
            statusText = if (app.hasInternetRequested) "DECLARED" else "NOT REQUESTED",
            statusColor = if (app.hasInternetRequested) CyanAccent else Color(0xFF6B7280)
        ),
        // 5. Contacts
        SensorCategoryStatus(
            icon = "👥",
            displayName = "Contacts",
            isRequested = app.isPermissionRequested("android.permission.READ_CONTACTS"),
            isGranted = app.isPermissionGranted("android.permission.READ_CONTACTS"),
            statusText = if (app.isPermissionRequested("android.permission.READ_CONTACTS")) (if (app.isPermissionGranted("android.permission.READ_CONTACTS")) "GRANTED (ON)" else "DENIED (OFF)") else "NOT REQUESTED",
            statusColor = if (app.isPermissionRequested("android.permission.READ_CONTACTS")) (if (app.isPermissionGranted("android.permission.READ_CONTACTS")) EmeraldSafe else Color(0xFFEF4444)) else Color(0xFF6B7280)
        ),
        // 6. SMS
        SensorCategoryStatus(
            icon = "✉️",
            displayName = "SMS / 2FA",
            isRequested = app.isPermissionRequested("android.permission.READ_SMS") || app.isPermissionRequested("android.permission.RECEIVE_SMS"),
            isGranted = app.isPermissionGranted("android.permission.READ_SMS") || app.isPermissionGranted("android.permission.RECEIVE_SMS"),
            statusText = if (app.isPermissionRequested("android.permission.READ_SMS") || app.isPermissionRequested("android.permission.RECEIVE_SMS")) (if (app.isPermissionGranted("android.permission.READ_SMS") || app.isPermissionGranted("android.permission.RECEIVE_SMS")) "GRANTED (ON)" else "DENIED (OFF)") else "NOT REQUESTED",
            statusColor = if (app.isPermissionRequested("android.permission.READ_SMS") || app.isPermissionRequested("android.permission.RECEIVE_SMS")) (if (app.isPermissionGranted("android.permission.READ_SMS") || app.isPermissionGranted("android.permission.RECEIVE_SMS")) EmeraldSafe else Color(0xFFEF4444)) else Color(0xFF6B7280)
        )
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, SurfaceGlassBorder, RoundedCornerShape(14.dp)),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard.copy(alpha = 0.7f)),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Key Sensors & Permission State",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "Separating Declared / Requested from Current Status",
                        fontSize = 11.sp,
                        color = TextSecondary
                    )
                }
                Button(
                    onClick = onOpenSettings,
                    colors = ButtonDefaults.buttonColors(containerColor = CyanAccent),
                    shape = RoundedCornerShape(8.dp),
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                ) {
                    Text(text = "⚙️ Manage", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Color(0xFF0A0E17))
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            categories.forEach { cat ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 5.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(text = cat.icon, fontSize = 16.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Column {
                            Text(
                                text = cat.displayName,
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = TextPrimary
                            )
                            Text(
                                text = "Requested: ${if (cat.isRequested) "YES" else "NO"}",
                                fontSize = 10.sp,
                                color = if (cat.isRequested) CyanAccent else TextMuted
                            )
                        }
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(cat.statusColor.copy(alpha = 0.15f))
                            .border(1.dp, cat.statusColor.copy(alpha = 0.4f), RoundedCornerShape(6.dp))
                            .padding(horizontal = 8.dp, vertical = 3.dp)
                    ) {
                        Text(
                            text = cat.statusText,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold,
                            color = cat.statusColor
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ThreatVectorCard(vector: ThreatVector) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
            .border(1.dp, Color(0xFFEF4444).copy(alpha = 0.5f), RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF2A1517)),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(modifier = Modifier.padding(14.dp), verticalAlignment = Alignment.Top) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Threat",
                tint = Color(0xFFEF4444),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(
                    text = vector.title,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFFFCA5A5)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = vector.description,
                    fontSize = 12.sp,
                    color = TextSecondary,
                    lineHeight = 16.sp
                )
            }
        }
    }
}

@Composable
fun RecommendationBanner(
    packageName: String,
    recommendation: AuditRecommendation
) {
    val context = LocalContext.current
    val actionColor = Color(android.graphics.Color.parseColor(recommendation.primaryAction.badgeColor))

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, actionColor.copy(alpha = 0.5f), RoundedCornerShape(14.dp)),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Security,
                    contentDescription = "Shield",
                    tint = actionColor,
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = recommendation.headline,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = recommendation.rationale,
                fontSize = 13.sp,
                color = TextSecondary,
                lineHeight = 18.sp
            )

            Spacer(modifier = Modifier.height(14.dp))
            Button(
                onClick = {
                    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                        data = Uri.parse("package:$packageName")
                        flags = Intent.FLAG_ACTIVITY_NEW_TASK
                    }
                    context.startActivity(intent)
                },
                colors = ButtonDefaults.buttonColors(containerColor = actionColor),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = "⚙️ Configure Permissions in System Settings",
                    color = TextPrimary,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 13.sp
                )
            }
        }
    }
}
