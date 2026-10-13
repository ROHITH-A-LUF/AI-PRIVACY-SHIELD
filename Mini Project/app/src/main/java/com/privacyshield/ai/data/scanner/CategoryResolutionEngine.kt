package com.privacyshield.ai.data.scanner

import android.content.pm.ApplicationInfo
import com.privacyshield.ai.core.model.AppCategory
import java.util.Locale

object CategoryResolutionEngine {

    // Tier 2: High-Confidence Signature Registry for top application package prefixes
    private val PACKAGE_SIGNATURE_MAP = mapOf(
        "calculator" to AppCategory.CALCULATOR,
        "calc" to AppCategory.CALCULATOR,
        "flashlight" to AppCategory.FLASHLIGHT,
        "torch" to AppCategory.FLASHLIGHT,
        "camera" to AppCategory.CAMERA,
        "maps" to AppCategory.NAVIGATION_MAPS,
        "navigation" to AppCategory.NAVIGATION_MAPS,
        "waze" to AppCategory.NAVIGATION_MAPS,
        "whatsapp" to AppCategory.MESSAGING,
        "telegram" to AppCategory.MESSAGING,
        "signal" to AppCategory.MESSAGING,
        "messenger" to AppCategory.MESSAGING,
        "viber" to AppCategory.MESSAGING,
        "instagram" to AppCategory.SOCIAL_MEDIA,
        "facebook" to AppCategory.SOCIAL_MEDIA,
        "twitter" to AppCategory.SOCIAL_MEDIA,
        "tiktok" to AppCategory.SOCIAL_MEDIA,
        "linkedin" to AppCategory.SOCIAL_MEDIA,
        "spotify" to AppCategory.MUSIC_AUDIO,
        "music" to AppCategory.MUSIC_AUDIO,
        "youtube" to AppCategory.VIDEO_PLAYER,
        "netflix" to AppCategory.VIDEO_PLAYER,
        "vlc" to AppCategory.VIDEO_PLAYER,
        "amazon" to AppCategory.SHOPPING,
        "ebay" to AppCategory.SHOPPING,
        "flipkart" to AppCategory.SHOPPING,
        "swiggy" to AppCategory.FOOD_DELIVERY,
        "zomato" to AppCategory.FOOD_DELIVERY,
        "ubereats" to AppCategory.FOOD_DELIVERY,
        "weather" to AppCategory.WEATHER,
        "strava" to AppCategory.FITNESS_HEALTH,
        "fitness" to AppCategory.FITNESS_HEALTH,
        "health" to AppCategory.FITNESS_HEALTH,
        "scanner" to AppCategory.SCANNER_DOCUMENT,
        "camscanner" to AppCategory.SCANNER_DOCUMENT,
        "chrome" to AppCategory.WEB_BROWSER,
        "firefox" to AppCategory.WEB_BROWSER,
        "browser" to AppCategory.WEB_BROWSER,
        "notes" to AppCategory.NOTES_MEMO,
        "keep" to AppCategory.NOTES_MEMO,
        "bank" to AppCategory.BANKING_FINANCE,
        "pay" to AppCategory.BANKING_FINANCE,
        "wallet" to AppCategory.BANKING_FINANCE
    )

    /**
     * Resolves an application's category using our 3-Tier Contextual Taxonomy.
     */
    fun resolveCategory(
        packageName: String,
        appLabel: String,
        appInfo: ApplicationInfo?
    ): AppCategory {
        val lowerPkg = packageName.lowercase(Locale.ROOT)
        val lowerLabel = appLabel.lowercase(Locale.ROOT)

        // Tier 1: Match against high-confidence package/label signature tokens
        for ((keyword, category) in PACKAGE_SIGNATURE_MAP) {
            if (lowerPkg.contains(keyword) || lowerLabel.contains(keyword)) {
                return category
            }
        }

        // Tier 2: Check OS ApplicationInfo.category (API 26+)
        if (appInfo != null && appInfo.category != ApplicationInfo.CATEGORY_UNDEFINED) {
            return when (appInfo.category) {
                ApplicationInfo.CATEGORY_AUDIO -> AppCategory.MUSIC_AUDIO
                ApplicationInfo.CATEGORY_GAME -> AppCategory.GAMING
                ApplicationInfo.CATEGORY_IMAGE -> AppCategory.CAMERA
                ApplicationInfo.CATEGORY_MAPS -> AppCategory.NAVIGATION_MAPS
                ApplicationInfo.CATEGORY_NEWS -> AppCategory.PRODUCTIVITY_OFFICE
                ApplicationInfo.CATEGORY_PRODUCTIVITY -> AppCategory.PRODUCTIVITY_OFFICE
                ApplicationInfo.CATEGORY_SOCIAL -> AppCategory.SOCIAL_MEDIA
                ApplicationInfo.CATEGORY_VIDEO -> AppCategory.VIDEO_PLAYER
                else -> AppCategory.UNKNOWN
            }
        }

        // Tier 3: Heuristic Keyword Detection
        return when {
            lowerLabel.contains("doc") || lowerLabel.contains("office") || lowerLabel.contains("word") -> AppCategory.PRODUCTIVITY_OFFICE
            lowerLabel.contains("game") || lowerLabel.contains("play") -> AppCategory.GAMING
            lowerLabel.contains("file") || lowerLabel.contains("explorer") -> AppCategory.FILE_MANAGER
            lowerLabel.contains("tool") || lowerLabel.contains("cleaner") -> AppCategory.SYSTEM_UTILITY
            else -> AppCategory.UNKNOWN
        }
    }
}
