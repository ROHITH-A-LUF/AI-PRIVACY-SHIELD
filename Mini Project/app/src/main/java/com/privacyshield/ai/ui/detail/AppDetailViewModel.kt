package com.privacyshield.ai.ui.detail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.privacyshield.ai.core.model.ApplicationMetadata
import com.privacyshield.ai.domain.usecase.GetAppRiskDetailUseCase
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
    private val getAppRiskDetailUseCase: GetAppRiskDetailUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow<AppDetailUiState>(AppDetailUiState.Loading)
    val uiState: StateFlow<AppDetailUiState> = _uiState.asStateFlow()

    fun loadApp(packageName: String) {
        viewModelScope.launch {
            _uiState.value = AppDetailUiState.Loading
            try {
                val app = getAppRiskDetailUseCase(packageName)
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
}
