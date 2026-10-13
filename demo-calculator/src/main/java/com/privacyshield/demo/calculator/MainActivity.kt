package com.privacyshield.demo.calculator

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                CalculatorScreen()
            }
        }
    }
}

@Composable
fun CalculatorScreen() {
    var display by remember { mutableStateOf("0") }
    var operandA by remember { mutableStateOf<Double?>(null) }
    var pendingOp by remember { mutableStateOf<String?>(null) }
    var freshEntry by remember { mutableStateOf(true) }

    fun applyPendingOp(nextValue: Double) {
        val a = operandA
        val op = pendingOp
        if (a != null && op != null) {
            display = when (op) {
                "+" -> formatResult(a + nextValue)
                "−" -> formatResult(a - nextValue)
                "×" -> formatResult(a * nextValue)
                "÷" -> if (nextValue != 0.0) formatResult(a / nextValue) else "Error"
                else -> formatResult(nextValue)
            }
        }
        operandA = null
        pendingOp = null
    }

    fun onDigit(d: String) {
        display = if (freshEntry || display == "0" || display == "Error") {
            freshEntry = false
            d
        } else {
            display + d
        }
    }

    fun onAction(label: String) {
        when (label) {
            "C" -> {
                display = "0"
                operandA = null
                pendingOp = null
                freshEntry = true
            }
            "+", "−", "×", "÷" -> {
                val current = display.toDoubleOrNull() ?: return
                if (operandA != null && pendingOp != null && !freshEntry) {
                    applyPendingOp(current)
                } else {
                    operandA = current
                }
                pendingOp = label
                freshEntry = true
            }
            "=" -> {
                val current = display.toDoubleOrNull() ?: return
                applyPendingOp(current)
                freshEntry = true
            }
            "." -> {
                if (freshEntry) {
                    display = "0."
                    freshEntry = false
                } else if (!display.contains(".")) {
                    display += "."
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(16.dp),
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column {
            Text(
                text = "Smart Calculator Pro",
                color = Color(0xFF94A3B8),
                fontSize = 14.sp,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF1E293B))
                    .padding(20.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                Text(
                    text = display,
                    color = Color.White,
                    fontSize = 42.sp,
                    fontWeight = FontWeight.Light,
                    textAlign = TextAlign.End,
                    modifier = Modifier.fillMaxWidth()
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Demo app — scan with PrivacyShield AI to reveal hidden permission threats.",
                color = Color(0xFF64748B),
                fontSize = 11.sp,
                lineHeight = 14.sp
            )
        }

        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            CalcButtonRow(listOf("C", "÷", "×", "−"), ::onDigit, ::onAction)
            CalcButtonRow(listOf("7", "8", "9", "+"), ::onDigit, ::onAction)
            CalcButtonRow(listOf("4", "5", "6", "="), ::onDigit, ::onAction)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                CalcKey("1", Modifier.weight(1f), ::onDigit, ::onAction)
                CalcKey("2", Modifier.weight(1f), ::onDigit, ::onAction)
                CalcKey("3", Modifier.weight(1f), ::onDigit, ::onAction)
                CalcKey("=", Modifier.weight(1f), ::onDigit, ::onAction, accent = true)
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                CalcKey("0", Modifier.weight(2f), ::onDigit, ::onAction)
                CalcKey(".", Modifier.weight(1f), ::onDigit, ::onAction)
                CalcKey("=", Modifier.weight(1f), ::onDigit, ::onAction, accent = true)
            }
        }
    }
}

@Composable
private fun CalcButtonRow(
    labels: List<String>,
    onDigit: (String) -> Unit,
    onAction: (String) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        labels.forEach { label ->
            CalcKey(
                label = label,
                modifier = Modifier.weight(1f),
                onDigit = onDigit,
                onAction = onAction,
                accent = label == "="
            )
        }
    }
}

@Composable
private fun CalcKey(
    label: String,
    modifier: Modifier,
    onDigit: (String) -> Unit,
    onAction: (String) -> Unit,
    accent: Boolean = false
) {
    val bg = when {
        accent -> Color(0xFF06B6D4)
        label in listOf("+", "−", "×", "÷", "C") -> Color(0xFF334155)
        else -> Color(0xFF1E293B)
    }
    val fg = if (accent) Color(0xFF0F172A) else Color.White

    Box(
        modifier = modifier
            .height(64.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(bg)
            .clickable {
                if (label.first().isDigit()) onDigit(label) else onAction(label)
            },
        contentAlignment = Alignment.Center
    ) {
        Text(text = label, color = fg, fontSize = 22.sp, fontWeight = FontWeight.Medium)
    }
}

private fun formatResult(value: Double): String {
    return if (value == value.toLong().toDouble()) value.toLong().toString() else "%.6f".format(value).trimEnd('0').trimEnd('.')
}
