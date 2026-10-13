package com.privacyshield.ai.ui.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.privacyshield.ai.core.demo.DemoCalculatorProfile
import com.privacyshield.ai.domain.usecase.AnalyzeDemoCalculatorUseCase
import com.privacyshield.ai.domain.usecase.DashboardSummary
import com.privacyshield.ai.domain.usecase.GetDashboardSummaryUseCase
import com.privacyshield.ai.domain.usecase.ScanInstalledApplicationsUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class DashboardUiState {
    object Initial : DashboardUiState()
    data class Scanning(val progressStep: String) : DashboardUiState()
    data class Success(val summary: DashboardSummary) : DashboardUiState()
    data class Error(val message: String) : DashboardUiState()
}

class DashboardViewModel(
    private val getDashboardSummaryUseCase: GetDashboardSummaryUseCase,
    private val scanInstalledApplicationsUseCase: ScanInstalledApplicationsUseCase,
    private val analyzeDemoCalculatorUseCase: AnalyzeDemoCalculatorUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<DashboardUiState>(DashboardUiState.Initial)
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private val _demoAnalysisTarget = MutableStateFlow<String?>(null)
    val demoAnalysisTarget: StateFlow<String?> = _demoAnalysisTarget.asStateFlow()

    init {
        observeDashboard()
    }

    private fun observeDashboard() {
        viewModelScope.launch {
            getDashboardSummaryUseCase().collect { summary ->
                _uiState.value = DashboardUiState.Success(summary)
            }
        }
    }

    fun scanNow() {
        viewModelScope.launch {
            _uiState.value = DashboardUiState.Scanning("Auditing installed applications & permissions...")
            try {
                scanInstalledApplicationsUseCase()
            } catch (e: Exception) {
                _uiState.value = DashboardUiState.Error(e.localizedMessage ?: "Scanning failed")
            }
        }
    }

    fun analyzeDemoCalculator() {
        viewModelScope.launch {
            _uiState.value = DashboardUiState.Scanning("Analyzing Smart Calculator Pro threat profile...")
            try {
                analyzeDemoCalculatorUseCase()
                _demoAnalysisTarget.value = DemoCalculatorProfile.PACKAGE_NAME
            } catch (e: Exception) {
                _uiState.value = DashboardUiState.Error(e.localizedMessage ?: "Demo analysis failed")
            }
        }
    }

    fun consumeDemoAnalysisNavigation() {
        _demoAnalysisTarget.value = null
    }
}
