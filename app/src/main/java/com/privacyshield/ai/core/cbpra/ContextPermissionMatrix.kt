package com.privacyshield.ai.core.cbpra

import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.core.model.PermissionSensitivity

data class PermissionDefinition(
    val permission: String,
    val simpleName: String,
    val group: String,
    val sensitivity: PermissionSensitivity,
    val dataExposed: String,
    val baseExplanation: String,
    val privacyRiskExplanation: String
)

object ContextPermissionMatrix {

    // Global permission registry with security attributes and clear privacy explanations
    val KNOWN_PERMISSIONS = mapOf(
        "android.permission.CAMERA" to PermissionDefinition(
            permission = "android.permission.CAMERA",
            simpleName = "Camera",
            group = "Hardware & Media",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Visual camera feed, images, and live video capture",
            baseExplanation = "Allows the application to capture photos and record video streams.",
            privacyRiskExplanation = "An unauthorized or mismatched app can secretly capture visual recordings of your environment and facial features."
        ),
        "android.permission.RECORD_AUDIO" to PermissionDefinition(
            permission = "android.permission.RECORD_AUDIO",
            simpleName = "Microphone",
            group = "Audio & Speech",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Live ambient audio, conversation streams, and speech acoustics",
            baseExplanation = "Allows the app to record sound using the device microphone.",
            privacyRiskExplanation = "Can be used to eavesdrop on private conversations, background room audio, or ambient acoustic signatures without user visibility."
        ),
        "android.permission.ACCESS_FINE_LOCATION" to PermissionDefinition(
            permission = "android.permission.ACCESS_FINE_LOCATION",
            simpleName = "Precise Location (GPS)",
            group = "Location",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Exact physical GPS coordinates (within meters), movement velocity, and elevation",
            baseExplanation = "Allows the app to determine your exact physical location using GPS and network towers.",
            privacyRiskExplanation = "Enables precise real-world tracking, location profiling, habits surveillance, and routine pattern reconstruction."
        ),
        "android.permission.ACCESS_COARSE_LOCATION" to PermissionDefinition(
            permission = "android.permission.ACCESS_COARSE_LOCATION",
            simpleName = "Approximate Location",
            group = "Location",
            sensitivity = PermissionSensitivity.MEDIUM,
            dataExposed = "City-level / neighborhood geolocation estimate",
            baseExplanation = "Allows the app to determine your general approximate location using cell towers and Wi-Fi.",
            privacyRiskExplanation = "Discloses your general geographic neighborhood or city region to tracking servers."
        ),
        "android.permission.ACCESS_BACKGROUND_LOCATION" to PermissionDefinition(
            permission = "android.permission.ACCESS_BACKGROUND_LOCATION",
            simpleName = "Background Location",
            group = "Location",
            sensitivity = PermissionSensitivity.CRITICAL,
            dataExposed = "Continuous 24/7 autonomous trajectory tracking even when app is closed",
            baseExplanation = "Allows the application to track your geographic location persistently in the background.",
            privacyRiskExplanation = "Extremely invasive. Creates an unbroken breadcrumb trail of your daily travel, home/work locations, and sensitive destination visits."
        ),
        "android.permission.READ_CONTACTS" to PermissionDefinition(
            permission = "android.permission.READ_CONTACTS",
            simpleName = "Read Contacts",
            group = "Personal Social Graph",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Full address book, phone numbers, email addresses, familial relationships, and contact notes",
            baseExplanation = "Allows the app to read all contact details saved in your device address book.",
            privacyRiskExplanation = "Exposes your personal social graph and acquaintances' phone numbers and emails to potential commercial targeting or scraping."
        ),
        "android.permission.WRITE_CONTACTS" to PermissionDefinition(
            permission = "android.permission.WRITE_CONTACTS",
            simpleName = "Modify Contacts",
            group = "Personal Social Graph",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Device address book modification and deletion",
            baseExplanation = "Allows the app to edit, create, or delete contacts in your address book.",
            privacyRiskExplanation = "Can overwrite or delete contact information or insert spam entries into your contacts."
        ),
        "android.permission.READ_SMS" to PermissionDefinition(
            permission = "android.permission.READ_SMS",
            simpleName = "Read SMS / OTP Messages",
            group = "Communications & Security",
            sensitivity = PermissionSensitivity.CRITICAL,
            dataExposed = "Private text messages, two-factor authentication (2FA) OTP codes, financial transaction alerts",
            baseExplanation = "Allows the application to read all SMS messages stored on your device or SIM.",
            privacyRiskExplanation = "Severe security threat. Can intercept bank verification OTPs, password reset codes, and private conversations."
        ),
        "android.permission.RECEIVE_SMS" to PermissionDefinition(
            permission = "android.permission.RECEIVE_SMS",
            simpleName = "Receive SMS Live",
            group = "Communications & Security",
            sensitivity = PermissionSensitivity.CRITICAL,
            dataExposed = "Live incoming text message interception before user sees it",
            baseExplanation = "Allows the app to receive and process incoming text messages in real time.",
            privacyRiskExplanation = "Enables real-time interception of authentication tokens, banking OTPs, and private communications."
        ),
        "android.permission.SEND_SMS" to PermissionDefinition(
            permission = "android.permission.SEND_SMS",
            simpleName = "Send SMS",
            group = "Communications & Security",
            sensitivity = PermissionSensitivity.CRITICAL,
            dataExposed = "SMS transmitter and carrier billing charges",
            baseExplanation = "Allows the app to send text messages without user confirmation.",
            privacyRiskExplanation = "Can subscribe the device to premium toll SMS services or send unauthorized messages."
        ),
        "android.permission.READ_CALL_LOG" to PermissionDefinition(
            permission = "android.permission.READ_CALL_LOG",
            simpleName = "Read Call History",
            group = "Telephony & Metadata",
            sensitivity = PermissionSensitivity.CRITICAL,
            dataExposed = "Dialed numbers, received calls, missed calls, call timestamps, call durations",
            baseExplanation = "Allows the app to read your entire phone call history.",
            privacyRiskExplanation = "Exposes personal communication frequency, intimate calling habits, and contact relationships."
        ),
        "android.permission.READ_PHONE_STATE" to PermissionDefinition(
            permission = "android.permission.READ_PHONE_STATE",
            simpleName = "Read Phone State & Identifiers",
            group = "Device Identity",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Cellular network info, SIM state, carrier ID, and phone call status",
            baseExplanation = "Allows read-only access to phone state, including current cellular network and phone call status.",
            privacyRiskExplanation = "Can be abused for persistent cross-app device fingerprinting and tracking user identity."
        ),
        "android.permission.READ_EXTERNAL_STORAGE" to PermissionDefinition(
            permission = "android.permission.READ_EXTERNAL_STORAGE",
            simpleName = "Read Shared Storage / Media",
            group = "Storage & Files",
            sensitivity = PermissionSensitivity.MEDIUM,
            dataExposed = "Shared files, downloaded documents, photos, audio clips, and PDFs",
            baseExplanation = "Allows the app to read files from external and shared storage partitions.",
            privacyRiskExplanation = "Provides access to downloaded documents, private screenshots, exported receipts, and shared media files."
        ),
        "android.permission.READ_MEDIA_IMAGES" to PermissionDefinition(
            permission = "android.permission.READ_MEDIA_IMAGES",
            simpleName = "Access Photo Library",
            group = "Storage & Files",
            sensitivity = PermissionSensitivity.MEDIUM,
            dataExposed = "Personal photo library and image EXIF geolocation metadata",
            baseExplanation = "Allows the app to view and load photos stored on your device.",
            privacyRiskExplanation = "Can inspect personal photos and extract hidden EXIF metadata including GPS coordinates where photos were shot."
        ),
        "android.permission.READ_MEDIA_VIDEO" to PermissionDefinition(
            permission = "android.permission.READ_MEDIA_VIDEO",
            simpleName = "Access Video Library",
            group = "Storage & Files",
            sensitivity = PermissionSensitivity.MEDIUM,
            dataExposed = "Personal video recordings and metadata",
            baseExplanation = "Allows the app to view and load stored video files.",
            privacyRiskExplanation = "Can access personal video recordings."
        ),
        "android.permission.READ_MEDIA_AUDIO" to PermissionDefinition(
            permission = "android.permission.READ_MEDIA_AUDIO",
            simpleName = "Access Audio Files",
            group = "Storage & Files",
            sensitivity = PermissionSensitivity.LOW,
            dataExposed = "Music tracks, voice recordings, and podcasts",
            baseExplanation = "Allows reading audio files from device storage.",
            privacyRiskExplanation = "Discloses personal audio libraries and voice recordings stored in shared folders."
        ),
        "android.permission.BODY_SENSORS" to PermissionDefinition(
            permission = "android.permission.BODY_SENSORS",
            simpleName = "Biometric & Body Sensors",
            group = "Biometrics & Health",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Heart rate, physiological biometrics, step cadence, and vital health telemetry",
            baseExplanation = "Allows access to data from sensors measuring body conditions such as heart rate.",
            privacyRiskExplanation = "Discloses intimate personal health metrics and biological status."
        ),
        "android.permission.ACTIVITY_RECOGNITION" to PermissionDefinition(
            permission = "android.permission.ACTIVITY_RECOGNITION",
            simpleName = "Physical Activity Recognition",
            group = "Motion & Physical State",
            sensitivity = PermissionSensitivity.MEDIUM,
            dataExposed = "Physical motion status (walking, running, driving, cycling, stationary)",
            baseExplanation = "Allows the app to recognize your physical activity state.",
            privacyRiskExplanation = "Permits continuous profiling of your physical locomotion and daily movement routines."
        ),
        "android.permission.POST_NOTIFICATIONS" to PermissionDefinition(
            permission = "android.permission.POST_NOTIFICATIONS",
            simpleName = "Display Notifications",
            group = "User Interaction",
            sensitivity = PermissionSensitivity.LOW,
            dataExposed = "Push alert channel on lock screen and notification shade",
            baseExplanation = "Allows the app to post alerts, heads-up badges, and messages to the notification shade.",
            privacyRiskExplanation = "Can be abused for spamming commercial advertisements and aggressive user engagement nudging."
        ),
        "android.permission.INTERNET" to PermissionDefinition(
            permission = "android.permission.INTERNET",
            simpleName = "Internet Network Access",
            group = "Network",
            sensitivity = PermissionSensitivity.LOW,
            dataExposed = "Remote socket communication to cloud servers",
            baseExplanation = "Allows the application to open network sockets to communicate over Wi-Fi and mobile data.",
            privacyRiskExplanation = "Acts as the primary egress channel for exfiltrating gathered device data to remote servers."
        ),
        "android.permission.ACCESS_NETWORK_STATE" to PermissionDefinition(
            permission = "android.permission.ACCESS_NETWORK_STATE",
            simpleName = "View Network Status",
            group = "Network",
            sensitivity = PermissionSensitivity.LOW,
            dataExposed = "Wi-Fi connection state, mobile data connectivity type",
            baseExplanation = "Allows the app to check whether the device is connected to the internet.",
            privacyRiskExplanation = "Low risk utility permission."
        ),
        "android.permission.VIBRATE" to PermissionDefinition(
            permission = "android.permission.VIBRATE",
            simpleName = "Haptic Vibration",
            group = "Other",
            sensitivity = PermissionSensitivity.LOW,
            dataExposed = "Haptic feedback motor",
            baseExplanation = "Allows control of the vibration hardware.",
            privacyRiskExplanation = "Harmless hardware trigger."
        ),
        "android.permission.READ_CALENDAR" to PermissionDefinition(
            permission = "android.permission.READ_CALENDAR",
            simpleName = "Read Calendar Events",
            group = "Calendar",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Calendar schedules, appointments, meetings, attendee identities, and personal reminders",
            baseExplanation = "Allows the app to read all events and details stored in your device calendars.",
            privacyRiskExplanation = "Discloses personal schedule, sensitive meetings, and life routines."
        ),
        "android.permission.WRITE_CALENDAR" to PermissionDefinition(
            permission = "android.permission.WRITE_CALENDAR",
            simpleName = "Modify Calendar",
            group = "Calendar",
            sensitivity = PermissionSensitivity.MEDIUM,
            dataExposed = "Calendar schedule editing and insertion",
            baseExplanation = "Allows the app to add, modify, or delete calendar events.",
            privacyRiskExplanation = "Can insert unwanted calendar spam or alter scheduled entries."
        ),
        "android.permission.CALL_PHONE" to PermissionDefinition(
            permission = "android.permission.CALL_PHONE",
            simpleName = "Direct Phone Calls",
            group = "Phone",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Telephony dialing interface and carrier billing",
            baseExplanation = "Allows the app to initiate phone calls without going through the dialer UI.",
            privacyRiskExplanation = "Can place unauthorized calls to toll numbers or trigger unintended dial-outs."
        ),
        "android.permission.BLUETOOTH_CONNECT" to PermissionDefinition(
            permission = "android.permission.BLUETOOTH_CONNECT",
            simpleName = "Bluetooth Connect",
            group = "Bluetooth",
            sensitivity = PermissionSensitivity.MEDIUM,
            dataExposed = "Paired Bluetooth accessories, headphones, audio gear, and peripherals",
            baseExplanation = "Allows the app to connect to paired Bluetooth devices.",
            privacyRiskExplanation = "Identifies connected accessories and nearby hardware ecosystem."
        ),
        "android.permission.BLUETOOTH_SCAN" to PermissionDefinition(
            permission = "android.permission.BLUETOOTH_SCAN",
            simpleName = "Bluetooth Scan",
            group = "Bluetooth",
            sensitivity = PermissionSensitivity.HIGH,
            dataExposed = "Nearby Bluetooth beacon signatures and ambient hardware beacons",
            baseExplanation = "Allows the app to discover nearby Bluetooth devices and beacons.",
            privacyRiskExplanation = "Can be abused for passive indoor location tracking and proximity profiling."
        ),
        "android.permission.BLUETOOTH_ADVERTISE" to PermissionDefinition(
            permission = "android.permission.BLUETOOTH_ADVERTISE",
            simpleName = "Bluetooth Broadcast",
            group = "Bluetooth",
            sensitivity = PermissionSensitivity.MEDIUM,
            dataExposed = "Device Bluetooth beacon broadcast signal",
            baseExplanation = "Allows broadcasting Bluetooth advertisements to nearby devices.",
            privacyRiskExplanation = "Emits hardware signals detectable by neighboring devices."
        ),
        "android.permission.NEARBY_WIFI_DEVICES" to PermissionDefinition(
            permission = "android.permission.NEARBY_WIFI_DEVICES",
            simpleName = "Nearby Wi-Fi Devices",
            group = "Nearby Devices",
            sensitivity = PermissionSensitivity.MEDIUM,
            dataExposed = "Nearby local Wi-Fi peer devices without requiring location permission",
            baseExplanation = "Allows discovering and connecting to nearby Wi-Fi devices.",
            privacyRiskExplanation = "Reveals proximate local network hardware."
        ),
        "android.permission.MANAGE_EXTERNAL_STORAGE" to PermissionDefinition(
            permission = "android.permission.MANAGE_EXTERNAL_STORAGE",
            simpleName = "All Files Access",
            group = "Storage / Photos / Media",
            sensitivity = PermissionSensitivity.CRITICAL,
            dataExposed = "Unrestricted read and write access to all files on device storage",
            baseExplanation = "Broad access to all shared storage on device.",
            privacyRiskExplanation = "Extremely broad. Can access, read, and modify any file on device storage."
        ),
        "android.permission.READ_MEDIA_VISUAL_USER_SELECTED" to PermissionDefinition(
            permission = "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
            simpleName = "Selected Photos / Videos",
            group = "Storage / Photos / Media",
            sensitivity = PermissionSensitivity.LOW,
            dataExposed = "Only specific photos and videos chosen by the user in system picker",
            baseExplanation = "Allows access only to photos and videos you explicitly select.",
            privacyRiskExplanation = "Granular privacy-preserving photo access (Android 14+)."
        )
    )

    // Expected / Legitimate Permission Baseline Matrix per Application Category
    private val EXPECTED_PERMISSIONS_MATRIX: Map<AppCategory, Set<String>> = mapOf(
        AppCategory.CALCULATOR to setOf(
            "android.permission.VIBRATE",
            "android.permission.INTERNET" // Currency conversion/calculators
        ),
        AppCategory.FLASHLIGHT to setOf(
            "android.permission.CAMERA", // Needed for Camera Flash LED control in legacy APIs
            "android.permission.VIBRATE"
        ),
        AppCategory.CAMERA to setOf(
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.READ_MEDIA_VIDEO",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.ACCESS_FINE_LOCATION", // Geotagging photos
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.VIBRATE"
        ),
        AppCategory.NAVIGATION_MAPS to setOf(
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_BACKGROUND_LOCATION",
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.RECORD_AUDIO", // Voice search
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.VIBRATE"
        ),
        AppCategory.MESSAGING to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.READ_CONTACTS",
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.READ_MEDIA_VIDEO",
            "android.permission.READ_MEDIA_AUDIO",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.VIBRATE",
            "android.permission.READ_SMS",
            "android.permission.RECEIVE_SMS",
            "android.permission.SEND_SMS"
        ),
        AppCategory.SOCIAL_MEDIA to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.READ_CONTACTS",
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.READ_MEDIA_VIDEO",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.VIBRATE"
        ),
        AppCategory.BANKING_FINANCE to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.CAMERA", // Check deposit / QR scanning
            "android.permission.USE_BIOMETRIC",
            "android.permission.USE_FINGERPRINT",
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.ACCESS_COARSE_LOCATION", // Fraud detection
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.VIBRATE"
        ),
        AppCategory.MUSIC_AUDIO to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.READ_MEDIA_AUDIO",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.RECORD_AUDIO", // Equalizer / Visualizer
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.FOREGROUND_SERVICE"
        ),
        AppCategory.VIDEO_PLAYER to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.READ_MEDIA_VIDEO",
            "android.permission.READ_MEDIA_AUDIO",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.POST_NOTIFICATIONS"
        ),
        AppCategory.SHOPPING to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_FINE_LOCATION", // Store locator / address auto-fill
            "android.permission.CAMERA", // Barcode search
            "android.permission.POST_NOTIFICATIONS"
        ),
        AppCategory.FOOD_DELIVERY to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.POST_NOTIFICATIONS",
            "android.permission.CALL_PHONE" // Calling delivery driver
        ),
        AppCategory.WEATHER to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.POST_NOTIFICATIONS"
        ),
        AppCategory.FITNESS_HEALTH to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.ACCESS_BACKGROUND_LOCATION", // Workout route tracking
            "android.permission.BODY_SENSORS",
            "android.permission.ACTIVITY_RECOGNITION",
            "android.permission.POST_NOTIFICATIONS"
        ),
        AppCategory.PRODUCTIVITY_OFFICE to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.CAMERA", // Document scanning
            "android.permission.POST_NOTIFICATIONS"
        ),
        AppCategory.SCANNER_DOCUMENT to setOf(
            "android.permission.CAMERA",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.INTERNET"
        ),
        AppCategory.WEB_BROWSER to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.POST_NOTIFICATIONS"
        ),
        AppCategory.GAMING to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.VIBRATE",
            "android.permission.POST_NOTIFICATIONS"
        ),
        AppCategory.FILE_MANAGER to setOf(
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.READ_MEDIA_VIDEO",
            "android.permission.READ_MEDIA_AUDIO",
            "android.permission.MANAGE_EXTERNAL_STORAGE",
            "android.permission.INTERNET"
        ),
        AppCategory.SYSTEM_UTILITY to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.VIBRATE",
            "android.permission.POST_NOTIFICATIONS"
        ),
        AppCategory.NOTES_MEMO to setOf(
            "android.permission.VIBRATE",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.READ_MEDIA_IMAGES",
            "android.permission.CAMERA", // Attach photo to note
            "android.permission.RECORD_AUDIO", // Voice memos
            "android.permission.INTERNET", // Cloud sync
            "android.permission.POST_NOTIFICATIONS"
        ),
        AppCategory.UNKNOWN to setOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.VIBRATE",
            "android.permission.POST_NOTIFICATIONS"
        )
    )

    /**
     * Checks if a permission is functionally expected for a given category baseline.
     */
    fun isPermissionExpected(category: AppCategory, permissionString: String): Boolean {
        val expectedSet = EXPECTED_PERMISSIONS_MATRIX[category] ?: EXPECTED_PERMISSIONS_MATRIX[AppCategory.UNKNOWN]!!
        return expectedSet.contains(permissionString)
    }

    /**
     * Returns definition or creates a safe fallback descriptor for custom/vendor permissions.
     */
    fun getDefinition(permissionString: String): PermissionDefinition {
        return KNOWN_PERMISSIONS[permissionString] ?: PermissionDefinition(
            permission = permissionString,
            simpleName = permissionString.substringAfterLast("."),
            group = "Other / Custom",
            sensitivity = if (permissionString.contains("READ", ignoreCase = true) || 
                              permissionString.contains("ACCESS", ignoreCase = true)) {
                PermissionSensitivity.MEDIUM
            } else {
                PermissionSensitivity.LOW
            },
            dataExposed = "Application specific boundary or service interface",
            baseExplanation = "Permission requested by the application for internal functionality.",
            privacyRiskExplanation = "Non-standard permission. Ensure you trust the developer."
        )
    }

    /**
     * Maps an Android permission string to one of the canonical human-readable categories.
     * Guaranteed never to assign a category unless the actual package declares it.
     */
    fun getPermissionCategoryGroup(permissionString: String): String {
        val upper = permissionString.uppercase()
        return when {
            upper.contains("CAMERA") -> "CAMERA"
            upper.contains("RECORD_AUDIO") || upper.contains("CAPTURE_AUDIO") -> "MICROPHONE"
            upper.contains("LOCATION") -> "LOCATION"
            upper.contains("CONTACT") -> "CONTACTS"
            upper.contains("CALL_LOG") || upper.contains("PHONE_STATE") || upper.contains("CALL_PHONE") -> "PHONE"
            upper.contains("SMS") || upper.contains("MMS") -> "SMS"
            upper.contains("CALENDAR") -> "CALENDAR"
            upper.contains("STORAGE") || upper.contains("MEDIA") -> "STORAGE / PHOTOS / MEDIA"
            upper.contains("NOTIFICATION") -> "NOTIFICATIONS"
            upper.contains("BODY_SENSORS") || upper.contains("ACTIVITY_RECOGNITION") -> "SENSORS"
            upper.contains("NEARBY") || upper.contains("UWB") -> "NEARBY DEVICES"
            upper.contains("BLUETOOTH") -> "BLUETOOTH"
            upper.contains("INTERNET") || upper.contains("NETWORK_STATE") || upper.contains("WIFI") -> "INTERNET"
            else -> "OTHER"
        }
    }
}
