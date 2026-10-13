package com.privacyshield.ai.receiver

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.privacyshield.ai.MainActivity
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.data.local.PrivacyShieldDatabase
import com.privacyshield.ai.data.repository.PrivacyAuditRepositoryImpl
import com.privacyshield.ai.data.scanner.AndroidPackageScanner
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class PackageInstallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_PACKAGE_ADDED || action == Intent.ACTION_PACKAGE_REPLACED) {
            val packageName = intent.data?.schemeSpecificPart ?: return

            // Avoid auditing self
            if (packageName == context.packageName) return

            val pendingResult = goAsync()
            CoroutineScope(Dispatchers.IO).launch {
                try {
                    val db = PrivacyShieldDatabase.getInstance(context)
                    val scanner = AndroidPackageScanner(context)
                    val repository = PrivacyAuditRepositoryImpl(db, scanner)

                    val appMeta = repository.auditSinglePackage(packageName)
                    if (appMeta != null) {
                        // If newly installed app has High or Critical risk, post real-time proactive notification
                        if (appMeta.riskResult.riskLevel == RiskLevel.HIGH || 
                            appMeta.riskResult.riskLevel == RiskLevel.CRITICAL ||
                            appMeta.detectedThreatVectors.isNotEmpty()) {
                            
                            postPrivacyRiskAlert(context, appMeta.appName, packageName, appMeta.riskResult.finalScore, appMeta.riskResult.dominantThreatDrivers)
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                } finally {
                    pendingResult.finish()
                }
            }
        }
    }

    private fun postPrivacyRiskAlert(
        context: Context,
        appName: String,
        packageName: String,
        riskScore: Int,
        dominantDrivers: List<String>
    ) {
        val channelId = "privacyshield_alerts_channel"
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Privacy Risk Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifies when newly installed applications request excessive or risky permissions"
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("EXTRA_PACKAGE_NAME", packageName)
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            packageName.hashCode(),
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val driverSummary = dominantDrivers.take(2).joinToString("; ")
        val notification = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_alert)
            .setContentTitle("🛡️ Privacy Risk: $appName ($riskScore/100)")
            .setContentText("Potential functional mismatch detected: $driverSummary")
            .setStyle(
                NotificationCompat.BigTextStyle()
                    .bigText("PrivacyShield AI audited $appName. It requests permissions outside its expected functional context:\n$driverSummary\n\nTap to review and configure permissions before launching.")
            )
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        notificationManager.notify(packageName.hashCode(), notification)
    }
}
