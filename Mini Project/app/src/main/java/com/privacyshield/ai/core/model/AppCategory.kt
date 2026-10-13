package com.privacyshield.ai.core.model

enum class AppCategory(val displayName: String, val iconRes: String) {
    CALCULATOR("Calculator", "🧮"),
    FLASHLIGHT("Flashlight & Torch", "🔦"),
    CAMERA("Camera & Photography", "📷"),
    NAVIGATION_MAPS("Maps & Navigation", "🗺️"),
    MESSAGING("Chat & Messaging", "💬"),
    SOCIAL_MEDIA("Social Networking", "👥"),
    BANKING_FINANCE("Banking & Finance", "💳"),
    MUSIC_AUDIO("Music & Audio", "🎵"),
    VIDEO_PLAYER("Video Player & Streaming", "🎬"),
    SHOPPING("E-Commerce & Shopping", "🛍️"),
    FOOD_DELIVERY("Food & Delivery", "🍔"),
    WEATHER("Weather Forecast", "⛅"),
    FITNESS_HEALTH("Health & Fitness", "🏃"),
    PRODUCTIVITY_OFFICE("Productivity & Office", "📄"),
    SCANNER_DOCUMENT("Scanner & PDF", "📑"),
    WEB_BROWSER("Web Browser", "🌐"),
    GAMING("Games", "🎮"),
    FILE_MANAGER("File Manager", "📁"),
    SYSTEM_UTILITY("System Utility", "⚙️"),
    NOTES_MEMO("Notes & Memos", "📝"),
    UNKNOWN("General Application", "📱")
}
