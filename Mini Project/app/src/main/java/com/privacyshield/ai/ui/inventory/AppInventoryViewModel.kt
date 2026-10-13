package com.privacyshield.ai.ui.inventory

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.privacyshield.ai.core.model.ApplicationMetadata
import com.privacyshield.ai.core.model.RiskLevel
import com.privacyshield.ai.domain.repository.PrivacyAuditRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn

enum class InventoryFilter {
    ALL, RISKY, MODERATE, SAFE
}

class AppInventoryViewModel(
    private val repository: PrivacyAuditRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery

    private val _filter = MutableStateFlow(InventoryFilter.ALL)
    val filter = _filter

    val appsList: StateFlow<List<ApplicationMetadata>> = combine(
        repository.getInstalledAppsFlow(),
        _searchQuery,
        _filter
    ) { apps, query, currentFilter ->
        apps.filter { app ->
            val matchesQuery = query.isBlank() ||
                    app.appName.contains(query, ignoreCase = true) ||
                    app.packageName.contains(query, ignoreCase = true)

            val matchesFilter = when (currentFilter) {
                InventoryFilter.ALL -> true
                InventoryFilter.RISKY -> app.riskResult.riskLevel == RiskLevel.HIGH || app.riskResult.riskLevel == RiskLevel.CRITICAL
                InventoryFilter.MODERATE -> app.riskResult.riskLevel == RiskLevel.MEDIUM
                InventoryFilter.SAFE -> app.riskResult.riskLevel == RiskLevel.LOW
            }

            matchesQuery && matchesFilter
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun updateSearch(query: String) {
        _searchQuery.value = query
    }

    fun setFilter(newFilter: InventoryFilter) {
        _filter.value = newFilter
    }
}
