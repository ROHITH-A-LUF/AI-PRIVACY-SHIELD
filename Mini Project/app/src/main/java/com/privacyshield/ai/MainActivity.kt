package com.privacyshield.ai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.navigation.compose.rememberNavController
import com.privacyshield.ai.ui.navigation.PrivacyShieldNavGraph
import com.privacyshield.ai.ui.theme.PrivacyShieldTheme

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as PrivacyShieldApplication
        val initialPackageName = intent.getStringExtra("EXTRA_PACKAGE_NAME")

        setContent {
            PrivacyShieldTheme {
                val navController = rememberNavController()
                PrivacyShieldNavGraph(
                    navController = navController,
                    repository = app.repository,
                    initialPackageName = initialPackageName
                )
            }
        }
    }
}
