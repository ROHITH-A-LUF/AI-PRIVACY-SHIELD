package com.privacyshield.ai.ui.detail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.privacyshield.ai.core.model.ApplicationMetadata
import com.privacyshield.ai.domain.usecase.GetAppRiskDetailUseCase
import com.privacyshield.ai.domain.usecase.RescanSingleAppUseCase
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AppDetailUiState {
    object Loading : AppDetailUiState()
    data class Success(val app: ApplicationMetadata) : AppDetailUiState()
    data class Error(val message: String) : AppDetailUiState()
}

class AppDetailViewModel(
    private val getAppRiskDetailUseCase: GetAppRiskDetailUseCase,
    private val rescanSingleAppUseCase: RescanSingleAppUseCase? = null
) : ViewModel() {

    private val _uiState = MutableStateFlow<AppDetailUiState>(AppDetailUiState.Loading)
    val uiState: StateFlow<AppDetailUiState> = _uiState.asStateFlow()

    private val _statusMessage = MutableStateFlow<String?>(null)
    val statusMessage: StateFlow<String?> = _statusMessage.asStateFlow()

    fun dismissStatusMessage() {
        _statusMessage.value = null
    }

    fun loadApp(packageName: String) {
        viewModelScope.launch {
            _uiState.value = AppDetailUiState.Loading
            try {
                // If rescan is available, perform fresh query from PackageManager
                val app = rescanSingleAppUseCase?.invoke(packageName) ?: getAppRiskDetailUseCase(packageName)
                if (app != null) {
                    _uiState.value = AppDetailUiState.Success(app)
                } else {
                    _uiState.value = AppDetailUiState.Error("Application not found in audit index")
                }
            } catch (e: Exception) {
                _uiState.value = AppDetailUiState.Error(e.localizedMessage ?: "Failed to load app details")
            }
        }
    }

    /**
     * Re-scans the package directly from PackageManager, compares previous permission state,
     * recalculates CBPRA score, updates UI, and notifies the user.
     */
    fun rescanApp(packageName: String, isReturnFromSettings: Boolean = false) {
        viewModelScope.launch {
            val previousApp = (_uiState.value as? AppDetailUiState.Success)?.app
            val prevGrantedSet = previousApp?.requestedPermissions?.filter { it.isGranted }?.map { it.permissionString }?.toSet() ?: emptySet()

            try {
                val updatedApp = rescanSingleAppUseCase?.invoke(packageName) ?: getAppRiskDetailUseCase(packageName)
                if (updatedApp != null) {
                    _uiState.value = AppDetailUiState.Success(updatedApp)

                    val newGrantedSet = updatedApp.requestedPermissions.filter { it.isGranted }.map { it.permissionString }.toSet()
                    if (prevGrantedSet.isNotEmpty() && prevGrantedSet != newGrantedSet) {
                        val revokedCount = (prevGrantedSet - newGrantedSet).size
                        val grantedCount = (newGrantedSet - prevGrantedSet).size
                        val msg = when {
                            revokedCount > 0 && grantedCount > 0 -> "Permission state updated ($revokedCount revoked, $grantedCount granted). CBPRA score recalculated: ${updatedApp.riskResult.finalScore}/100"
                            revokedCount > 0 -> "Permission state updated: $revokedCount permission(s) revoked. CBPRA risk score recalculated: ${updatedApp.riskResult.finalScore}/100"
                            grantedCount > 0 -> "Permission state updated: $grantedCount permission(s) granted. CBPRA risk score recalculated: ${updatedApp.riskResult.finalScore}/100"
                            else -> "Permission state updated. CBPRA Risk Score: ${updatedApp.riskResult.finalScore}/100"
                        }
                        _statusMessage.value = msg
                    } else if (isReturnFromSettings) {
                        _statusMessage.value = "Permission state verified from Android system. No change detected."
                    }
                }
            } catch (e: Exception) {
                // Keep existing state if rescan failed
            }
        }
    }
}
