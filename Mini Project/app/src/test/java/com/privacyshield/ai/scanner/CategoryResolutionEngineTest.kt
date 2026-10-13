package com.privacyshield.ai.scanner

import com.privacyshield.ai.core.model.AppCategory
import com.privacyshield.ai.data.scanner.CategoryResolutionEngine
import org.junit.Assert.assertEquals
import org.junit.Test

class CategoryResolutionEngineTest {

    @Test
    fun testCalculatorResolution() {
        val cat1 = CategoryResolutionEngine.resolveCategory("com.google.android.calculator", "Calculator", null)
        assertEquals(AppCategory.CALCULATOR, cat1)

        val cat2 = CategoryResolutionEngine.resolveCategory("com.sec.android.app.popupcalculator", "Calc Pro", null)
        assertEquals(AppCategory.CALCULATOR, cat2)
    }

    @Test
    fun testFlashlightResolution() {
        val cat = CategoryResolutionEngine.resolveCategory("com.dev.flashlight.torch", "Super Bright Flashlight", null)
        assertEquals(AppCategory.FLASHLIGHT, cat)
    }

    @Test
    fun testMessagingResolution() {
        val cat1 = CategoryResolutionEngine.resolveCategory("com.whatsapp", "WhatsApp", null)
        assertEquals(AppCategory.MESSAGING, cat1)

        val cat2 = CategoryResolutionEngine.resolveCategory("org.telegram.messenger", "Telegram", null)
        assertEquals(AppCategory.MESSAGING, cat2)
    }

    @Test
    fun testMapsResolution() {
        val cat = CategoryResolutionEngine.resolveCategory("com.google.android.apps.maps", "Google Maps", null)
        assertEquals(AppCategory.NAVIGATION_MAPS, cat)
    }
}
