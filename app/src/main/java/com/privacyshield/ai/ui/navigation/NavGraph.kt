package com.privacyshield.ai.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.privacyshield.ai.domain.repository.PrivacyAuditRepository
import com.privacyshield.ai.domain.usecase.AnalyzeDemoCalculatorUseCase
import com.privacyshield.ai.domain.usecase.GetAppRiskDetailUseCase
import com.privacyshield.ai.domain.usecase.GetDashboardSummaryUseCase
import com.privacyshield.ai.domain.usecase.ScanInstalledApplicationsUseCase
import com.privacyshield.ai.ui.dashboard.DashboardScreen
import com.privacyshield.ai.ui.dashboard.DashboardViewModel
import com.privacyshield.ai.ui.detail.AppDetailScreen
import com.privacyshield.ai.ui.detail.AppDetailViewModel
import com.privacyshield.ai.ui.history.AuditHistoryScreen
import com.privacyshield.ai.ui.history.AuditHistoryViewModel
import com.privacyshield.ai.ui.inventory.AppInventoryScreen
import com.privacyshield.ai.ui.inventory.AppInventoryViewModel

@Composable
fun PrivacyShieldNavGraph(
    navController: NavHostController,
    repository: PrivacyAuditRepository,
    initialPackageName: String? = null
) {
    val startDestination = if (initialPackageName != null) {
        Screen.AppDetail.createRoute(initialPackageName)
    } else {
        Screen.Dashboard.route
    }

    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Dashboard.route) {
            val viewModel = DashboardViewModel(
                getDashboardSummaryUseCase = GetDashboardSummaryUseCase(repository),
                scanInstalledApplicationsUseCase = ScanInstalledApplicationsUseCase(repository),
                analyzeDemoCalculatorUseCase = AnalyzeDemoCalculatorUseCase(repository)
            )
            DashboardScreen(
                viewModel = viewModel,
                onNavigateToInventory = { navController.navigate(Screen.Inventory.route) },
                onNavigateToDetail = { pkg -> navController.navigate(Screen.AppDetail.createRoute(pkg)) },
                onNavigateToHistory = { navController.navigate(Screen.History.route) }
            )
        }

        composable(Screen.Inventory.route) {
            val viewModel = AppInventoryViewModel(repository)
            AppInventoryScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() },
                onNavigateToDetail = { pkg -> navController.navigate(Screen.AppDetail.createRoute(pkg)) }
            )
        }

        composable(
            route = Screen.AppDetail.route,
            arguments = listOf(navArgument("packageName") { type = NavType.StringType })
        ) { backStackEntry ->
            val packageName = backStackEntry.arguments?.getString("packageName") ?: ""
            val viewModel = AppDetailViewModel(
                getAppRiskDetailUseCase = GetAppRiskDetailUseCase(repository),
                rescanSingleAppUseCase = com.privacyshield.ai.domain.usecase.RescanSingleAppUseCase(repository)
            )
            AppDetailScreen(
                packageName = packageName,
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.History.route) {
            val viewModel = AuditHistoryViewModel(repository)
            AuditHistoryScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
