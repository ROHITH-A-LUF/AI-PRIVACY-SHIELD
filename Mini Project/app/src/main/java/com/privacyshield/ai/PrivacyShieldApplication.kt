package com.privacyshield.ai

import android.app.Application
import com.privacyshield.ai.data.local.PrivacyShieldDatabase
import com.privacyshield.ai.data.repository.PrivacyAuditRepositoryImpl
import com.privacyshield.ai.data.scanner.AndroidPackageScanner
import com.privacyshield.ai.domain.repository.PrivacyAuditRepository

class PrivacyShieldApplication : Application() {

    lateinit var repository: PrivacyAuditRepository
        private set

    override fun onCreate() {
        super.onCreate()
        val database = PrivacyShieldDatabase.getInstance(this)
        val scanner = AndroidPackageScanner(this)
        repository = PrivacyAuditRepositoryImpl(database, scanner)
    }
}
