#!/usr/bin/env python3
"""
PrivacyShield AI — Android Device Bridge
Connects to real Android mobile devices via ADB, scans all downloaded (3rd-party) applications,
inspects Camera, Microphone, and sensitive permissions, computes CBPRA Threat Score (0-100),
and generates actionable security suggestions.
"""

import os
import re
import subprocess
import concurrent.futures
import json
import zipfile
import tempfile
import threading

# Permission Knowledge Base with weights and categories
PERMISSION_DEF = {
    "CAMERA": {"name": "Camera", "category": "CAMERA", "weight": 25, "desc": "Accesses camera feed and captures photos/videos"},
    "RECORD_AUDIO": {"name": "Microphone", "category": "MICROPHONE", "weight": 25, "desc": "Records live acoustic ambient audio"},
    "ACCESS_FINE_LOCATION": {"name": "GPS Location", "category": "LOCATION", "weight": 25, "desc": "Precise real-time GPS coordinates"},
    "ACCESS_BACKGROUND_LOCATION": {"name": "24/7 Background Location", "category": "LOCATION", "weight": 35, "desc": "Passive persistent location tracking"},
    "READ_CONTACTS": {"name": "Read Contacts", "category": "CONTACTS", "weight": 25, "desc": "Full address book & phone numbers"},
    "READ_SMS": {"name": "Read SMS / 2FA OTP", "category": "SMS", "weight": 35, "desc": "Reads SMS inbox and banking verification codes"},
    "RECEIVE_SMS": {"name": "Receive SMS", "category": "SMS", "weight": 35, "desc": "Monitors incoming SMS messages in real-time"},
    "READ_CALL_LOG": {"name": "Call Logs", "category": "PHONE", "weight": 30, "desc": "Call history, durations, and timestamps"},
    "READ_PHONE_STATE": {"name": "Device Identity", "category": "PHONE", "weight": 20, "desc": "IMEI, SIM status & device fingerprinting"},
    "READ_EXTERNAL_STORAGE": {"name": "Shared Storage", "category": "STORAGE / PHOTOS / MEDIA", "weight": 15, "desc": "Legacy shared storage partitions"},
    "READ_MEDIA_IMAGES": {"name": "Photos Library", "category": "STORAGE / PHOTOS / MEDIA", "weight": 15, "desc": "Granular access to photo library (Android 13+)"},
    "READ_MEDIA_VIDEO": {"name": "Videos Library", "category": "STORAGE / PHOTOS / MEDIA", "weight": 15, "desc": "Granular access to video files (Android 13+)"},
    "READ_MEDIA_AUDIO": {"name": "Audio Library", "category": "STORAGE / PHOTOS / MEDIA", "weight": 10, "desc": "Granular access to audio/music files (Android 13+)"},
    "READ_CALENDAR": {"name": "Calendar Events", "category": "CALENDAR", "weight": 20, "desc": "Personal calendar schedules and appointments"},
    "CALL_PHONE": {"name": "Direct Phone Calls", "category": "PHONE", "weight": 25, "desc": "Directly places phone calls"},
    "BLUETOOTH_CONNECT": {"name": "Bluetooth Accessories", "category": "BLUETOOTH", "weight": 10, "desc": "Connects to paired Bluetooth devices"},
    "BLUETOOTH_SCAN": {"name": "Bluetooth Scan", "category": "BLUETOOTH", "weight": 20, "desc": "Scans nearby Bluetooth hardware beacons"},
    "NEARBY_WIFI_DEVICES": {"name": "Nearby Wi-Fi Devices", "category": "NEARBY DEVICES", "weight": 15, "desc": "Discovers proximate Wi-Fi peer devices"},
    "INTERNET": {"name": "Internet Network", "category": "INTERNET", "weight": 5, "desc": "Cloud network connection / data egress"},
    "POST_NOTIFICATIONS": {"name": "Notifications", "category": "NOTIFICATIONS", "weight": 5, "desc": "Posts alerts on notification bar"},
    "VIBRATE": {"name": "Vibration", "category": "OTHER", "weight": 2, "desc": "Haptic motor feedback"},
}

ANDROID_PERM_MAP = {
    "android.permission.CAMERA": "CAMERA",
    "android.permission.RECORD_AUDIO": "RECORD_AUDIO",
    "android.permission.ACCESS_FINE_LOCATION": "ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_COARSE_LOCATION": "ACCESS_FINE_LOCATION",
    "android.permission.ACCESS_BACKGROUND_LOCATION": "ACCESS_BACKGROUND_LOCATION",
    "android.permission.READ_CONTACTS": "READ_CONTACTS",
    "android.permission.WRITE_CONTACTS": "READ_CONTACTS",
    "android.permission.READ_SMS": "READ_SMS",
    "android.permission.RECEIVE_SMS": "RECEIVE_SMS",
    "android.permission.SEND_SMS": "READ_SMS",
    "android.permission.READ_CALL_LOG": "READ_CALL_LOG",
    "android.permission.READ_PHONE_STATE": "READ_PHONE_STATE",
    "android.permission.CALL_PHONE": "CALL_PHONE",
    "android.permission.READ_CALENDAR": "READ_CALENDAR",
    "android.permission.WRITE_CALENDAR": "READ_CALENDAR",
    "android.permission.READ_EXTERNAL_STORAGE": "READ_EXTERNAL_STORAGE",
    "android.permission.WRITE_EXTERNAL_STORAGE": "READ_EXTERNAL_STORAGE",
    "android.permission.READ_MEDIA_IMAGES": "READ_MEDIA_IMAGES",
    "android.permission.READ_MEDIA_VIDEO": "READ_MEDIA_VIDEO",
    "android.permission.READ_MEDIA_AUDIO": "READ_MEDIA_AUDIO",
    "android.permission.BLUETOOTH_CONNECT": "BLUETOOTH_CONNECT",
    "android.permission.BLUETOOTH_SCAN": "BLUETOOTH_SCAN",
    "android.permission.NEARBY_WIFI_DEVICES": "NEARBY_WIFI_DEVICES",
    "android.permission.INTERNET": "INTERNET",
    "android.permission.POST_NOTIFICATIONS": "POST_NOTIFICATIONS",
    "android.permission.VIBRATE": "VIBRATE",
}

CATEGORY_EXPECTED = {
    "CALCULATOR": ["VIBRATE", "INTERNET"],
    "FLASHLIGHT": ["CAMERA", "VIBRATE"],
    "CAMERA": ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION", "VIBRATE", "INTERNET", "POST_NOTIFICATIONS"],
    "NAVIGATION_MAPS": ["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "INTERNET", "RECORD_AUDIO", "POST_NOTIFICATIONS", "VIBRATE", "READ_PHONE_STATE"],
    "MESSAGING": ["INTERNET", "READ_CONTACTS", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS", "READ_SMS", "RECEIVE_SMS", "READ_CALL_LOG", "READ_PHONE_STATE", "VIBRATE"],
    "SOCIAL_MEDIA": ["INTERNET", "READ_CONTACTS", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS", "VIBRATE", "READ_PHONE_STATE"],
    "BANKING_FINANCE": ["INTERNET", "CAMERA", "POST_NOTIFICATIONS", "ACCESS_FINE_LOCATION", "READ_PHONE_STATE", "READ_SMS", "RECEIVE_SMS", "READ_CONTACTS", "VIBRATE"],
    "FITNESS_HEALTH": ["INTERNET", "ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "POST_NOTIFICATIONS", "VIBRATE"],
    "NOTES_MEMO": ["VIBRATE", "READ_EXTERNAL_STORAGE", "CAMERA", "RECORD_AUDIO", "INTERNET", "POST_NOTIFICATIONS", "READ_CONTACTS"],
    "GAMING": ["INTERNET", "VIBRATE", "POST_NOTIFICATIONS", "READ_EXTERNAL_STORAGE", "RECORD_AUDIO"],
    "STREAMING_MEDIA": ["INTERNET", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS", "VIBRATE", "READ_PHONE_STATE", "RECORD_AUDIO"],
    "SHOPPING": ["INTERNET", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS", "VIBRATE", "READ_EXTERNAL_STORAGE", "CAMERA"],
    "UTILITY": ["INTERNET", "VIBRATE", "POST_NOTIFICATIONS", "READ_EXTERNAL_STORAGE", "READ_PHONE_STATE"]
}

KNOWN_APP_NAMES = {
    "com.whatsapp": ("WhatsApp Messenger", "MESSAGING", "💬"),
    "com.instagram.android": ("Instagram", "SOCIAL_MEDIA", "📸"),
    "com.instagram.barcelona": ("Threads", "SOCIAL_MEDIA", "🧵"),
    "org.telegram.messenger": ("Telegram", "MESSAGING", "✈️"),
    "org.thunderdog.challegram": ("Telegram X", "MESSAGING", "✈️"),
    "com.snapchat.android": ("Snapchat", "SOCIAL_MEDIA", "👻"),
    "com.spotify.music": ("Spotify", "STREAMING_MEDIA", "🎵"),
    "com.truecaller": ("Truecaller", "UTILITY", "📞"),
    "com.google.android.youtube": ("YouTube", "STREAMING_MEDIA", "▶️"),
    "com.zhiliaoapp.musically": ("TikTok", "SOCIAL_MEDIA", "🎵"),
    "com.facebook.katana": ("Facebook", "SOCIAL_MEDIA", "📘"),
    "com.twitter.android": ("X (Twitter)", "SOCIAL_MEDIA", "🐦"),
    "com.netflix.mediaclient": ("Netflix", "STREAMING_MEDIA", "🎬"),
    "com.amazon.mShop.android.shopping": ("Amazon Shopping", "SHOPPING", "📦"),
    "com.google.android.apps.nbu.paisa.user": ("Google Pay (GPay)", "BANKING_FINANCE", "💳"),
    "com.phonepe.app": ("PhonePe", "BANKING_FINANCE", "💳"),
    "com.paytm": ("Paytm", "BANKING_FINANCE", "💳"),
    "in.swiggy.android": ("Swiggy", "SHOPPING", "🍲"),
    "com.zomato": ("Zomato", "SHOPPING", "🍕"),
    "com.application.zomato": ("Zomato", "SHOPPING", "🍕"),
    "com.ubercab": ("Uber", "NAVIGATION_MAPS", "🚗"),
    "com.olacabs.customer": ("Ola Cabs", "NAVIGATION_MAPS", "🚕"),
    "com.rapido.passenger": ("Rapido", "NAVIGATION_MAPS", "🛵"),
    "in.redbus.android": ("redBus", "NAVIGATION_MAPS", "🚌"),
    "cris.org.in.prs.ima": ("IRCTC Rail Connect", "NAVIGATION_MAPS", "🚆"),
    "com.whereismytrain.android": ("Where is my Train", "NAVIGATION_MAPS", "🚆"),
    "com.lemon.lvoverseas": ("CapCut", "CAMERA", "✂️"),
    "com.camerasideas.instashot": ("InShot", "CAMERA", "🎬"),
    "com.adobe.lrmobile": ("Adobe Lightroom", "CAMERA", "🎨"),
    "com.dts.freefiremax": ("Free Fire MAX", "GAMING", "🔥"),
    "com.nautilus.realcricket": ("Real Cricket™ 24", "GAMING", "🏏"),
    "com.miniclip.cricketleague": ("Cricket League", "GAMING", "🏏"),
    "in.dreamgamestudios.games.sports.dreamcricket3d": ("Dream Cricket 24", "GAMING", "🏏"),
    "com.maleo.bussimulatorin": ("Bus Simulator Indonesia", "GAMING", "🚌"),
    "com.mxtech.videoplayer.ad": ("MX Player", "STREAMING_MEDIA", "▶️"),
    "com.myairtelapp": ("Airtel Thanks", "UTILITY", "📶"),
    "tv.accedo.airtel.wynk": ("Wynk Music", "STREAMING_MEDIA", "🎵"),
    "com.apple.android.music": ("Apple Music", "STREAMING_MEDIA", "🎵"),
    "in.startv.hotstar": ("Disney+ Hotstar", "STREAMING_MEDIA", "⭐"),
    "com.openai.chatgpt": ("ChatGPT", "UTILITY", "🤖"),
    "com.linkedin.android": ("LinkedIn", "SOCIAL_MEDIA", "💼"),
    "com.pinterest": ("Pinterest", "SOCIAL_MEDIA", "📌"),
    "com.flipkart.android": ("Flipkart", "SHOPPING", "🛍️"),
    "com.bigbasket.mobileapp": ("Bigbasket", "SHOPPING", "🛒"),
    "com.digilocker.android": ("DigiLocker", "UTILITY", "🪪"),
    "com.google.android.apps.authenticator2": ("Google Authenticator", "UTILITY", "🔐"),
    "com.google.android.apps.docs": ("Google Drive", "UTILITY", "📁"),
    "com.google.android.apps.docs.editors.docs": ("Google Docs", "NOTES_MEMO", "📄"),
    "com.google.android.apps.docs.editors.sheets": ("Google Sheets", "NOTES_MEMO", "📊"),
    "com.google.android.apps.docs.editors.slides": ("Google Slides", "NOTES_MEMO", "📽️"),
    "com.google.android.apps.walletnfcrel": ("Google Wallet", "BANKING_FINANCE", "💳"),
    "com.iob.iobconnect": ("IOB Mobile Banking", "BANKING_FINANCE", "🏦"),
    "com.figma.mirror": ("Figma Mirror", "UTILITY", "🎨"),
    "org.localsend.localsend_app": ("LocalSend", "UTILITY", "📲"),
    "com.coherendz.vaave": ("Vaave Alumni", "SOCIAL_MEDIA", "👥"),
    "com.cricheroes.cricheroes.alpha": ("CricHeroes", "GAMING", "🏏"),
    "com.jrzheng.supervpnpayment": ("SuperVPN", "UTILITY", "🛡️"),
    "com.fundevs.app.mediaconverter": ("Media Converter", "UTILITY", "🔄"),
    "story.tv.drama.reels": ("ShortMax Reels", "STREAMING_MEDIA", "📺"),
    "com.coloros.calculator": ("Calculator", "CALCULATOR", "🧮"),
    "com.sec.android.app.popupcalculator": ("Samsung Calculator", "CALCULATOR", "🧮"),
    "com.google.android.calculator": ("Google Calculator", "CALCULATOR", "🧮"),
    "com.miui.calculator": ("Mi Calculator", "CALCULATOR", "🧮"),
}

CACHE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app_names_cache.json")
APP_LABEL_CACHE = {}
_cache_lock = threading.Lock()

def load_label_cache():
    global APP_LABEL_CACHE
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                APP_LABEL_CACHE = json.load(f)
        except Exception:
            APP_LABEL_CACHE = {}

def save_label_cache():
    with _cache_lock:
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(APP_LABEL_CACHE, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

load_label_cache()

def get_aapt_path():
    """Locates aapt executable in Android SDK build-tools."""
    candidates = [
        r"C:\Users\ROHITH A\AppData\Local\Android\Sdk\build-tools\34.0.0\aapt.exe",
        r"C:\Users\ROHITH A\AppData\Local\Android\Sdk\build-tools\36.0.0\aapt.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    sdk_root = os.path.expandvars(r"%LOCALAPPDATA%\Android\Sdk\build-tools")
    if os.path.isdir(sdk_root):
        for s in sorted(os.listdir(sdk_root), reverse=True):
            cand = os.path.join(sdk_root, s, "aapt.exe")
            if os.path.exists(cand):
                return cand
    return None


def get_adb_path():
    """Locates adb executable."""
    candidates = [
        r"C:\Users\ROHITH A\AppData\Local\Android\Sdk\platform-tools\adb.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    try:
        res = subprocess.run(["where", "adb"], capture_output=True, text=True, timeout=2)
        if res.returncode == 0:
            lines = [l.strip() for l in res.stdout.strip().splitlines() if l.strip()]
            if lines:
                return lines[0]
    except Exception:
        pass
    return "adb"


def run_adb_cmd(adb, dev_id, args, timeout=10):
    """Runs an adb command targeting a specific device."""
    cmd = [adb]
    if dev_id:
        cmd.extend(["-s", dev_id])
    cmd.extend(args)
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, errors="ignore")
        return res.stdout or ""
    except Exception:
        return ""


def get_device_status():
    """Checks ADB device connectivity and returns detailed device metadata."""
    adb = get_adb_path()
    try:
        res = subprocess.run([adb, "devices", "-l"], capture_output=True, text=True, timeout=4, errors="ignore")
        if res.returncode != 0:
            return {"ok": False, "adb_found": False, "connected": False, "error": "Could not run ADB command"}

        lines = [l.strip() for l in res.stdout.strip().splitlines() if l.strip()]
        devices = []
        for line in lines[1:]:
            parts = line.split()
            if len(parts) >= 2:
                devices.append({
                    "id": parts[0],
                    "status": parts[1],
                    "details": " ".join(parts[2:])
                })

        if not devices:
            return {
                "ok": True,
                "adb_found": True,
                "connected": False,
                "instructions": [
                    "1. Connect your Android phone to this computer using a USB cable.",
                    "2. On your phone, go to Settings > About Phone > tap 'Build Number' 7 times to enable Developer Options.",
                    "3. Open Settings > System > Developer Options and turn on 'USB Debugging'.",
                    "4. When your phone displays 'Allow USB debugging?', tap 'Allow' or 'Always allow from this computer'."
                ],
                "message": "No Android device detected. Connect your phone via USB and enable USB Debugging."
            }

        target = devices[0]
        dev_id = target["id"]
        status = target["status"]

        if status == "unauthorized":
            return {
                "ok": True,
                "adb_found": True,
                "connected": False,
                "unauthorized": True,
                "device_id": dev_id,
                "message": "Phone is connected, but unauthorized! Check your phone screen and tap 'Allow USB debugging'."
            }

        if status != "device":
            return {
                "ok": True,
                "adb_found": True,
                "connected": False,
                "device_id": dev_id,
                "message": f"Device in state '{status}'. Please reconnect USB cable."
            }

        # Device is connected and authorized
        model = run_adb_cmd(adb, dev_id, ["shell", "getprop", "ro.product.model"]).strip() or "Android Device"
        mfr = run_adb_cmd(adb, dev_id, ["shell", "getprop", "ro.product.manufacturer"]).strip().title() or "Phone"
        ver = run_adb_cmd(adb, dev_id, ["shell", "getprop", "ro.build.version.release"]).strip() or "Unknown"
        sdk = run_adb_cmd(adb, dev_id, ["shell", "getprop", "ro.build.version.sdk"]).strip() or ""

        # Battery
        battery_out = run_adb_cmd(adb, dev_id, ["shell", "dumpsys", "battery"])
        battery = "100%"
        for line in battery_out.splitlines():
            if "level:" in line:
                battery = line.split("level:")[1].strip() + "%"
                break

        # Count 3rd party packages
        pkg_out = run_adb_cmd(adb, dev_id, ["shell", "pm", "list", "packages", "-3"])
        downloaded_count = len([p for p in pkg_out.splitlines() if p.strip().startswith("package:")])

        return {
            "ok": True,
            "adb_found": True,
            "connected": True,
            "device": {
                "id": dev_id,
                "name": f"{mfr} {model}",
                "model": model,
                "manufacturer": mfr,
                "android_version": ver,
                "sdk_version": sdk,
                "battery": battery,
                "downloaded_apps_count": downloaded_count
            }
        }
    except Exception as exc:
        return {"ok": False, "adb_found": False, "connected": False, "error": str(exc)}


def parse_package_dumpsys(dumpsys_text):
    """Extracts declared requested permissions, runtime granted permissions, denied permissions, and version from dumpsys package."""
    req_perms = []
    granted_perms = []
    denied_perms = []

    req_section = re.search(r'requested permissions:(.*?)(?:install permissions:|runtime permissions:|User \d+:|$)', dumpsys_text, re.DOTALL)
    if req_section:
        for line in req_section.group(1).splitlines():
            line = line.strip()
            if line.startswith("android.permission.") or "." in line:
                p_clean = line.split(":")[0].strip()
                if p_clean and p_clean not in req_perms:
                    req_perms.append(p_clean)

    for line in dumpsys_text.splitlines():
        line = line.strip()
        m_grant = re.search(r'([a-zA-Z0-9_\.]+):\s*granted=true', line)
        if m_grant:
            p = m_grant.group(1)
            if p not in granted_perms:
                granted_perms.append(p)
        m_deny = re.search(r'([a-zA-Z0-9_\.]+):\s*granted=false', line)
        if m_deny:
            p = m_deny.group(1)
            if p not in denied_perms:
                denied_perms.append(p)

    # Reconcile requested permissions:
    # Normal install-time permissions (like INTERNET) are granted upon install if declared
    for p in req_perms:
        if p in denied_perms:
            if p in granted_perms:
                granted_perms.remove(p)
        elif p not in granted_perms:
            if p in ["android.permission.INTERNET", "android.permission.VIBRATE", "android.permission.ACCESS_NETWORK_STATE"]:
                granted_perms.append(p)
            else:
                denied_perms.append(p)

    version_match = re.search(r'versionName=([^\s]+)', dumpsys_text)
    version = version_match.group(1) if version_match else "1.0.0"

    return req_perms, list(set(granted_perms)), list(set(denied_perms)), version


def extract_real_app_label(adb, dev_id, pkg):
    """Extracts the exact official application name/label from the APK via aapt, resolve-activity, or cache."""
    with _cache_lock:
        if pkg in APP_LABEL_CACHE and APP_LABEL_CACHE[pkg]:
            return APP_LABEL_CACHE[pkg]

    if pkg in KNOWN_APP_NAMES:
        label = KNOWN_APP_NAMES[pkg][0]
        with _cache_lock:
            APP_LABEL_CACHE[pkg] = label
        save_label_cache()
        return label

    # 1. Try nonLocalizedLabel from resolve-activity (very fast, ~40ms)
    try:
        res_out = run_adb_cmd(
            adb, dev_id,
            ["shell", "cmd", "package", "resolve-activity", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", pkg],
            timeout=3
        )
        m = re.search(r'nonLocalizedLabel=([^\s]+.*?)\s+(?:icon=|banner=|logo=)', res_out)
        if m:
            val = m.group(1).strip()
            if val and val != "null":
                with _cache_lock:
                    APP_LABEL_CACHE[pkg] = val
                save_label_cache()
                return val
    except Exception:
        pass

    # 2. Extract exact label from APK's AndroidManifest.xml & resources.arsc via aapt
    aapt = get_aapt_path()
    if aapt:
        try:
            path_out = run_adb_cmd(adb, dev_id, ["shell", "pm", "path", pkg], timeout=4)
            lines = [l for l in path_out.strip().splitlines() if l.startswith("package:")]
            if lines:
                apk_path = lines[0].replace("package:", "").strip()
                tmp_tag = f"{abs(hash(pkg)) % 100000}"
                remote_m = f"/data/local/tmp/m_{tmp_tag}.xml"
                remote_r = f"/data/local/tmp/r_{tmp_tag}.arsc"

                cmd = f'unzip -p "{apk_path}" AndroidManifest.xml > {remote_m} 2>/dev/null && unzip -p "{apk_path}" resources.arsc > {remote_r} 2>/dev/null'
                run_adb_cmd(adb, dev_id, ["shell", cmd], timeout=4)

                local_dir = tempfile.gettempdir()
                local_m = os.path.join(local_dir, f"ps_m_{tmp_tag}.xml")
                local_r = os.path.join(local_dir, f"ps_r_{tmp_tag}.arsc")
                local_apk = os.path.join(local_dir, f"ps_mini_{tmp_tag}.apk")

                run_adb_cmd(adb, dev_id, ["pull", remote_m, local_m], timeout=3)
                run_adb_cmd(adb, dev_id, ["pull", remote_r, local_r], timeout=4)
                run_adb_cmd(adb, dev_id, ["shell", f"rm -f {remote_m} {remote_r}"], timeout=2)

                if os.path.exists(local_m):
                    with zipfile.ZipFile(local_apk, "w") as z:
                        z.write(local_m, "AndroidManifest.xml")
                        if os.path.exists(local_r):
                            z.write(local_r, "resources.arsc")

                    res = subprocess.run([aapt, "dump", "badging", local_apk], capture_output=True, text=True, timeout=4)
                    label = None
                    for line in res.stdout.splitlines():
                        if line.startswith("application-label:"):
                            label = line.split(":", 1)[1].strip("'\"")
                            break
                        if not label and line.startswith("application-label-en:"):
                            label = line.split(":", 1)[1].strip("'\"")
                            break

                    for f in [local_m, local_r, local_apk]:
                        if os.path.exists(f):
                            try:
                                os.remove(f)
                            except Exception:
                                pass

                    if label and label.strip():
                        val = label.strip()
                        with _cache_lock:
                            APP_LABEL_CACHE[pkg] = val
                        save_label_cache()
                        return val
        except Exception:
            pass

    # 3. Fallback: clean up package name nicely
    parts = pkg.split(".")
    raw_name = parts[-1] if len(parts) > 1 else pkg
    if raw_name.lower() in ["android", "app", "mobile", "client"] and len(parts) > 2:
        raw_name = parts[-2]
    fallback_label = raw_name.replace("_", " ").replace("-", " ").title()
    with _cache_lock:
        APP_LABEL_CACHE[pkg] = fallback_label
    save_label_cache()
    return fallback_label


def infer_app_info(pkg_name, exact_label=None):
    """Resolves friendly name, category, and icon for an Android package."""
    label = exact_label
    if not label:
        if pkg_name in KNOWN_APP_NAMES:
            label = KNOWN_APP_NAMES[pkg_name][0]
        elif pkg_name in APP_LABEL_CACHE:
            label = APP_LABEL_CACHE[pkg_name]
        else:
            parts = pkg_name.split(".")
            raw_name = parts[-1] if len(parts) > 1 else pkg_name
            label = raw_name.replace("_", " ").replace("-", " ").title()

    search_str = f"{label.lower()} {pkg_name.lower()}"
    if any(k in search_str for k in ["calc", "math"]):
        return (label, "CALCULATOR", "🧮")
    if any(k in search_str for k in ["flash", "torch"]):
        return (label, "FLASHLIGHT", "🔦")
    if any(k in search_str for k in ["cam", "photo", "gallery", "image", "snap", "inshot", "lightroom", "capcut"]):
        return (label, "CAMERA", "📷")
    if any(k in search_str for k in ["map", "nav", "gps", "waze", "cab", "ride", "rapido", "uber", "ola", "redbus", "train", "irctc"]):
        return (label, "NAVIGATION_MAPS", "🗺️")
    if any(k in search_str for k in ["chat", "messag", "sms", "talk", "mail", "whatsapp", "telegram"]):
        return (label, "MESSAGING", "💬")
    if any(k in search_str for k in ["social", "feed", "post", "share", "friend", "instagram", "threads", "twitter", "facebook", "linkedin", "pinterest"]):
        return (label, "SOCIAL_MEDIA", "👥")
    if any(k in search_str for k in ["bank", "pay", "wallet", "finance", "money", "upi", "card", "gpay", "phonepe", "paytm", "iob"]):
        return (label, "BANKING_FINANCE", "💳")
    if any(k in search_str for k in ["fit", "health", "workout", "gym", "step", "heart"]):
        return (label, "FITNESS_HEALTH", "🏃")
    if any(k in search_str for k in ["note", "memo", "todo", "task", "keep", "doc", "sheet", "slide"]):
        return (label, "NOTES_MEMO", "📝")
    if any(k in search_str for k in ["game", "play", "arcade", "craft", "race", "puzzle", "cricket", "free fire"]):
        return (label, "GAMING", "🎮")
    if any(k in search_str for k in ["music", "audio", "stream", "video", "media", "spotify", "wynk", "jiosaavn", "youtube", "netflix", "hotstar", "player", "reels", "song"]):
        return (label, "STREAMING_MEDIA", "🎬")
    if any(k in search_str for k in ["shop", "store", "buy", "cart", "flipkart", "amazon", "meesho", "myntra", "zepto", "blinkit", "instamart", "bigbasket", "swiggy", "zomato"]):
        return (label, "SHOPPING", "🛍️")

    return (label, "UTILITY", "📱")


def compute_cbpra(category, perms_list, granted_list=None):
    """
    Computes CBPRA threat score out of 100 with normalized sensitivity, mismatch penalty, and threat combos.
    Crucial Rule: Only declared/requested permissions are evaluated. Unrequested permissions contribute 0.
    Differentiates between declared & granted (active capability) vs declared but denied (inactive capability).
    """
    if granted_list is None:
        granted_list = []

    expected = CATEGORY_EXPECTED.get(category, ["INTERNET", "VIBRATE", "POST_NOTIFICATIONS", "READ_EXTERNAL_STORAGE"])
    raw_sensitivity = 0
    raw_mismatch = 0
    drivers = []
    unexpected_perms = []

    for p in perms_list:
        p_def = PERMISSION_DEF.get(p)
        if not p_def:
            continue
        is_granted = (p in granted_list)
        # Declared & Granted = active risk (full weight)
        # Declared but Denied by user = potential capability blocked by user (reduced 35% weight)
        weight_factor = 1.0 if is_granted else 0.35
        raw_sensitivity += p_def["weight"] * weight_factor

        if p not in expected:
            factor = 1.5 if is_granted else 0.4
            raw_mismatch += p_def["weight"] * factor
            status_text = "GRANTED" if is_granted else "DENIED"
            unexpected_perms.append(f"{p_def['name']} [{status_text}]")
            drivers.append(f"Unexpected {p_def['name']} ({status_text}) in {category.replace('_', ' ').title()}")

    # 1. Base Sensitivity (Max 30 points)
    base_sensitivity = min(30.0, (raw_sensitivity / 140.0) * 30.0)

    # 2. Context Mismatch Penalty (Max 45 points)
    mismatch_penalty = min(45.0, (raw_mismatch / 70.0) * 45.0)

    # 3. Synergistic Threat Combos (Max 25 points) - ONLY evaluated if permissions are declared
    threat_vectors = []
    threat_penalty = 0

    has_internet = "INTERNET" in perms_list
    has_sms = "READ_SMS" in perms_list or "RECEIVE_SMS" in perms_list
    has_camera = "CAMERA" in perms_list
    has_mic = "RECORD_AUDIO" in perms_list
    has_bg_gps = "ACCESS_BACKGROUND_LOCATION" in perms_list
    has_contacts = "READ_CONTACTS" in perms_list

    sms_granted = "READ_SMS" in granted_list or "RECEIVE_SMS" in granted_list
    cam_granted = "CAMERA" in granted_list
    mic_granted = "RECORD_AUDIO" in granted_list

    if has_sms and has_internet and category not in ["MESSAGING", "BANKING_FINANCE"]:
        if sms_granted:
            threat_vectors.append({
                "id": "THREAT_OTP_EXFILTRATION",
                "title": "Credential & 2FA OTP Interception Vector [ACTIVE]",
                "desc": "Possesses active SMS reading capabilities alongside Internet egress outside messaging/finance context. Can intercept banking verification OTPs and exfiltrate them."
            })
            threat_penalty += 15
            drivers.append("Synergistic Threat: OTP Exfiltration Vector (Active)")
        else:
            threat_vectors.append({
                "id": "THREAT_OTP_EXFILTRATION_LATENT",
                "title": "SMS Interception Capability [BLOCKED BY USER]",
                "desc": "Declared SMS permissions alongside Internet egress, but SMS is currently DENIED by user."
            })
            threat_penalty += 5
            drivers.append("Synergistic Threat: OTP Vector (Blocked by User)")

    if has_camera and has_mic and category not in ["CAMERA", "MESSAGING", "SOCIAL_MEDIA"]:
        if cam_granted and mic_granted:
            threat_vectors.append({
                "id": "THREAT_AV_SURVEILLANCE",
                "title": "Surreptitious Audio/Visual Surveillance Vector [ACTIVE]",
                "desc": "Bundles concurrent active Camera and Microphone access in an unexpected context. Capable of simultaneous room recording."
            })
            threat_penalty += 12
            drivers.append("Synergistic Threat: Audio/Visual Surveillance (Active)")
        elif cam_granted or mic_granted:
            threat_vectors.append({
                "id": "THREAT_AV_SURVEILLANCE_PARTIAL",
                "title": "Partial Sensor Surveillance Vector",
                "desc": f"Requests Camera and Microphone. One sensor is active ({'Camera' if cam_granted else 'Microphone'}), while the other is denied."
            })
            threat_penalty += 6
            drivers.append("Synergistic Threat: Partial Sensor Access")
        else:
            threat_vectors.append({
                "id": "THREAT_AV_SURVEILLANCE_BLOCKED",
                "title": "Audio/Visual Sensor Capabilities [BLOCKED BY USER]",
                "desc": "Requests Camera and Microphone in manifest, but both are currently DENIED by user."
            })
            threat_penalty += 3
            drivers.append("Synergistic Threat: A/V Sensors (Shielded)")

    if has_bg_gps and has_internet and category not in ["NAVIGATION_MAPS", "FITNESS_HEALTH"]:
        bg_gps_granted = "ACCESS_BACKGROUND_LOCATION" in granted_list
        threat_vectors.append({
            "id": "THREAT_BG_LOCATION",
            "title": f"24/7 Persistent Geolocation Tracking Vector [{ 'ACTIVE' if bg_gps_granted else 'DENIED' }]",
            "desc": "Continuous background GPS tracking outside navigation/fitness. Harvests daily travel patterns."
        })
        threat_penalty += 12 if bg_gps_granted else 4
        drivers.append("Synergistic Threat: 24/7 Geolocation Profiling")

    if has_contacts and has_internet and category not in ["MESSAGING", "SOCIAL_MEDIA", "BANKING_FINANCE", "NOTES_MEMO"]:
        contacts_granted = "READ_CONTACTS" in granted_list
        threat_vectors.append({
            "id": "THREAT_CONTACTS_HARVEST",
            "title": f"Social Graph & Contacts Harvesting Vector [{ 'ACTIVE' if contacts_granted else 'DENIED' }]",
            "desc": "Extracts phone contacts alongside network transmission in an application that does not require social graph communication."
        })
        threat_penalty += 8 if contacts_granted else 3
        drivers.append("Synergistic Threat: Social Graph Scraping")

    threat_penalty = min(25.0, threat_penalty)
    raw_score = base_sensitivity + mismatch_penalty + threat_penalty
    final_score = min(100, max(5, round(raw_score)))

    if final_score >= 81:
        risk_level = "CRITICAL"
        badge_class = "badge-critical"
    elif final_score >= 61:
        risk_level = "HIGH"
        badge_class = "badge-high"
    elif final_score >= 31:
        risk_level = "MEDIUM"
        badge_class = "badge-medium"
    else:
        risk_level = "LOW"
        badge_class = "badge-safe"

    # AI Explanation
    if risk_level == "LOW":
        ai_exp = f"This application operates within normal privacy parameters for a {category.replace('_', ' ').title()} application. Declared permissions align with standard functional baselines."
    elif risk_level == "MEDIUM":
        ai_exp = f"Moderate privacy considerations ({final_score}/100). Requesting {', '.join(unexpected_perms) if unexpected_perms else 'secondary capabilities'} represents mild functional drift."
    elif risk_level == "HIGH":
        ai_exp = f"High privacy risk detected ({final_score}/100). A {category.replace('_', ' ').title()} application has no legitimate reason to access {', '.join(unexpected_perms)}. Keeping unnecessary permissions revoked protects your personal data."
    else:
        ai_exp = f"CRITICAL PRIVACY ALERT: Severe threat score ({final_score}/100). The combination of permissions requested ({', '.join(unexpected_perms)}) introduces potential surveillance or data exfiltration channels."

    return {
        "threat_score": final_score,
        "risk_level": risk_level,
        "badge_class": badge_class,
        "base_sensitivity": round(base_sensitivity),
        "mismatch_penalty": round(mismatch_penalty),
        "threat_penalty": round(threat_penalty),
        "threat_vectors": threat_vectors,
        "dominant_drivers": drivers[:3],
        "unexpected_perms": unexpected_perms,
        "ai_explanation": ai_exp
    }


def generate_privacy_suggestion(name, category, score, has_cam, has_mic, granted_cam, granted_mic, perms, threat_vectors):
    """Generates precise security suggestions highlighting Camera, Microphone, and Threat level."""
    points = []

    # 1. Camera & Microphone evaluation
    if not has_cam and not has_mic:
        points.append(
            f"🛡️ HARDWARE PRIVACY SAFEGUARD: '{name}' does NOT request Camera or Microphone access. "
            f"Zero audio-visual surveillance risk exists from this application."
        )
    elif not has_cam and has_mic:
        status_tag = "ACTIVE (GRANTED)" if granted_mic else "DENIED BY USER"
        points.append(
            f"📷 CAMERA SENSOR: NOT REQUESTED by '{name}' (0 risk).\n"
            f"🎙️ MICROPHONE SENSOR [{status_tag}]: " +
            (f"'{name}' has active permission to record ambient audio." if granted_mic else f"'{name}' declared microphone in manifest, but permission is currently DENIED.")
        )
    elif has_cam and not has_mic:
        status_tag = "ACTIVE (GRANTED)" if granted_cam else "DENIED BY USER"
        points.append(
            f"📷 CAMERA SENSOR [{status_tag}]: " +
            (f"'{name}' has active camera access." if granted_cam else f"'{name}' declared camera in manifest, but permission is currently DENIED.\n") +
            f"🎙️ MICROPHONE SENSOR: NOT REQUESTED by '{name}' (0 risk)."
        )
    else: # Both declared
        cam_tag = "GRANTED" if granted_cam else "DENIED"
        mic_tag = "GRANTED" if granted_mic else "DENIED"
        if category not in ["CAMERA", "MESSAGING", "SOCIAL_MEDIA"]:
            if granted_cam and granted_mic:
                points.append(
                    f"🚨 SURREPTITIOUS SURVEILLANCE RISK [Camera: ACTIVE | Mic: ACTIVE]: '{name}' is a {category} app but accesses BOTH CAMERA and MICROPHONE. "
                    f"This combination enables simultaneous audio-visual eavesdropping. "
                    f"Recommendation: Tap 'Manage Permissions in Android Settings' below and revoke both Camera and Microphone immediately."
                )
            else:
                points.append(
                    f"⚠️ SENSOR ACCESS RESTRICTED [Camera: {cam_tag} | Mic: {mic_tag}]: '{name}' declared both sensors. "
                    f"Keep sensitive permissions revoked to maintain hardware protection."
                )
        else:
            points.append(
                f"📷 CAMERA ({cam_tag}) & 🎙️ MICROPHONE ({mic_tag}): Used for media capture/communication in {category}. "
                f"Suggestion: Set permissions to 'While using the app' in Android Settings to prevent background access."
            )

    # 2. Synergistic Threat vectors
    for tv in threat_vectors:
        points.append(f"⚡ {tv['title']}: {tv['desc']}")

    # 3. Overall threat score advice
    if score >= 81:
        points.append(
            f"🔴 THREAT LEVEL {score}/100 [CRITICAL]: Severe privacy exposure. Revoke all non-essential permissions immediately in Android Settings, or consider uninstalling."
        )
    elif score >= 61:
        points.append(
            f"🟠 THREAT LEVEL {score}/100 [HIGH]: Significant risk footprint. Limit sensor access and disable background data usage."
        )
    elif score >= 31:
        points.append(
            f"🟡 THREAT LEVEL {score}/100 [MEDIUM]: Minor permission drift. Review permissions periodically."
        )
    else:
        points.append(
            f"🟢 THREAT LEVEL {score}/100 [SAFE]: This application requests minimal and well-justified permissions."
        )

    return "\n\n".join(points)


def audit_single_package(adb, dev_id, pkg):
    """Queries package details and runs CBPRA audit."""
    dumpsys = run_adb_cmd(adb, dev_id, ["shell", "dumpsys", "package", pkg], timeout=6)
    req_perms_raw, granted_perms_raw, denied_perms_raw, ver = parse_package_dumpsys(dumpsys)

    normalized_perms = []
    normalized_granted = []
    normalized_denied = []

    for p in req_perms_raw:
        mapped = ANDROID_PERM_MAP.get(p)
        if mapped and mapped not in normalized_perms:
            normalized_perms.append(mapped)

    for p in granted_perms_raw:
        mapped = ANDROID_PERM_MAP.get(p)
        if mapped and mapped not in normalized_granted:
            normalized_granted.append(mapped)

    for p in denied_perms_raw:
        mapped = ANDROID_PERM_MAP.get(p)
        if mapped and mapped not in normalized_denied:
            normalized_denied.append(mapped)

    exact_label = extract_real_app_label(adb, dev_id, pkg)
    label, category, icon = infer_app_info(pkg, exact_label=exact_label)
    cbpra = compute_cbpra(category, normalized_perms, normalized_granted)

    has_cam = "CAMERA" in normalized_perms
    has_mic = "RECORD_AUDIO" in normalized_perms
    granted_cam = "CAMERA" in normalized_granted
    granted_mic = "RECORD_AUDIO" in normalized_granted

    has_loc = any(p in normalized_perms for p in ["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION"])
    granted_loc = any(p in normalized_granted for p in ["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION"])

    has_contacts = "READ_CONTACTS" in normalized_perms
    granted_contacts = "READ_CONTACTS" in normalized_granted

    has_sms = any(p in normalized_perms for p in ["READ_SMS", "RECEIVE_SMS"])
    granted_sms = any(p in normalized_granted for p in ["READ_SMS", "RECEIVE_SMS"])

    has_storage = any(p in normalized_perms for p in ["READ_EXTERNAL_STORAGE", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "READ_MEDIA_AUDIO"])
    granted_storage = any(p in normalized_granted for p in ["READ_EXTERNAL_STORAGE", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "READ_MEDIA_AUDIO"])

    has_net = "INTERNET" in normalized_perms
    granted_net = "INTERNET" in normalized_granted or has_net

    sensor_matrix = {
        "camera": {
            "name": "Camera",
            "icon": "📷",
            "requested": has_cam,
            "granted": granted_cam,
            "status": "GRANTED" if granted_cam else ("DENIED" if has_cam else "NOT_REQUESTED"),
            "statusText": "GRANTED" if granted_cam else ("DENIED" if has_cam else "NOT REQUESTED")
        },
        "microphone": {
            "name": "Microphone",
            "icon": "🎤",
            "requested": has_mic,
            "granted": granted_mic,
            "status": "GRANTED" if granted_mic else ("DENIED" if has_mic else "NOT_REQUESTED"),
            "statusText": "GRANTED" if granted_mic else ("DENIED" if has_mic else "NOT REQUESTED")
        },
        "location": {
            "name": "Location",
            "icon": "📍",
            "requested": has_loc,
            "granted": granted_loc,
            "status": "GRANTED" if granted_loc else ("DENIED" if has_loc else "NOT_REQUESTED"),
            "statusText": "GRANTED" if granted_loc else ("DENIED" if has_loc else "NOT REQUESTED")
        },
        "contacts": {
            "name": "Contacts",
            "icon": "👥",
            "requested": has_contacts,
            "granted": granted_contacts,
            "status": "GRANTED" if granted_contacts else ("DENIED" if has_contacts else "NOT_REQUESTED"),
            "statusText": "GRANTED" if granted_contacts else ("DENIED" if has_contacts else "NOT REQUESTED")
        },
        "sms": {
            "name": "SMS / 2FA",
            "icon": "✉️",
            "requested": has_sms,
            "granted": granted_sms,
            "status": "GRANTED" if granted_sms else ("DENIED" if has_sms else "NOT_REQUESTED"),
            "statusText": "GRANTED" if granted_sms else ("DENIED" if has_sms else "NOT REQUESTED")
        },
        "storage": {
            "name": "Storage / Photos",
            "icon": "📁",
            "requested": has_storage,
            "granted": granted_storage,
            "status": "GRANTED" if granted_storage else ("DENIED" if has_storage else "NOT_REQUESTED"),
            "statusText": "GRANTED" if granted_storage else ("DENIED" if has_storage else "NOT REQUESTED")
        },
        "internet": {
            "name": "Internet",
            "icon": "🌐",
            "requested": has_net,
            "granted": granted_net,
            "status": "GRANTED" if granted_net else ("DECLARED" if has_net else "NOT_REQUESTED"),
            "statusText": "GRANTED" if granted_net else ("DECLARED" if has_net else "NOT REQUESTED")
        }
    }

    permission_details = []
    for p in normalized_perms:
        p_def = PERMISSION_DEF.get(p, {"name": p, "category": "OTHER", "weight": 5, "desc": "System capability"})
        is_p_granted = p in normalized_granted
        is_normal = p_def["category"] in ["INTERNET", "NOTIFICATIONS", "OTHER"]
        status_val = "GRANTED" if is_p_granted else ("DECLARED" if is_normal else "DENIED")
        permission_details.append({
            "id": p,
            "name": p_def["name"],
            "category": p_def["category"],
            "weight": p_def["weight"],
            "desc": p_def["desc"],
            "requested": True,
            "granted": is_p_granted,
            "status": status_val,
            "statusText": status_val,
            "protectionLevel": "NORMAL" if is_normal else "DANGEROUS"
        })

    suggestion = generate_privacy_suggestion(
        label, category, cbpra["threat_score"],
        has_cam, has_mic, granted_cam, granted_mic,
        normalized_perms, cbpra["threat_vectors"]
    )

    return {
        "id": pkg,
        "packageName": pkg,
        "name": label,
        "category": category,
        "categoryDisplay": f"{category.replace('_', ' ').title()} {icon}",
        "icon": icon,
        "version": ver,
        "permissions": normalized_perms,
        "grantedPermissions": normalized_granted,
        "deniedPermissions": normalized_denied,
        "sensorMatrix": sensor_matrix,
        "permissionDetails": permission_details,
        "hasCamera": has_cam,
        "hasMicrophone": has_mic,
        "hasLocation": has_loc,
        "hasContacts": has_contacts,
        "hasSms": has_sms,
        "hasStorage": has_storage,
        "hasInternet": has_net,
        "grantedCamera": granted_cam,
        "grantedMicrophone": granted_mic,
        "grantedLocation": granted_loc,
        "grantedContacts": granted_contacts,
        "grantedSms": granted_sms,
        "threatScore": cbpra["threat_score"],
        "riskLevel": cbpra["risk_level"],
        "badgeClass": cbpra["badge_class"],
        "baseSensitivity": cbpra["base_sensitivity"],
        "mismatchPenalty": cbpra["mismatch_penalty"],
        "threatPenalty": cbpra["threat_penalty"],
        "threatVectors": cbpra["threat_vectors"],
        "dominantDrivers": cbpra["dominant_drivers"],
        "unexpectedPerms": cbpra["unexpected_perms"],
        "aiExplanation": cbpra["ai_explanation"],
        "suggestion": suggestion,
        "recommendation": {
            "action": "REVOKE PERMISSIONS" if cbpra["threat_score"] >= 61 else ("REVIEW" if cbpra["threat_score"] >= 31 else "ALLOW"),
            "badgeClass": "rec-deny" if cbpra["threat_score"] >= 61 else ("rec-allow-once" if cbpra["threat_score"] >= 31 else "rec-allow"),
            "text": suggestion
        }
    }


def rescan_single_package(pkg):
    """Re-scans a specific package via ADB (or demo), recomputes CBPRA, and returns updated audit."""
    adb = get_adb_path()
    status = get_device_status()
    if status.get("connected"):
        dev_id = status["device"]["id"]
        audit = audit_single_package(adb, dev_id, pkg)
        return {
            "ok": True,
            "updated": True,
            "package": pkg,
            "app": audit,
            "message": f"Permission state updated for {audit['name']} ({pkg})"
        }
    else:
        # Fallback to demo scan
        demo = get_demo_scan()
        for app in demo.get("apps", []):
            if app["packageName"] == pkg or app["id"] == pkg:
                return {
                    "ok": True,
                    "updated": True,
                    "package": pkg,
                    "app": app,
                    "message": f"Permission state updated for {app['name']} ({pkg})"
                }
        return {"ok": False, "error": f"Package {pkg} not found in inventory"}


def scan_downloaded_apps():
    """Scans all installed applications (3rd-party + user-facing launcher apps) from the connected Android phone."""
    adb = get_adb_path()
    status = get_device_status()
    if not status.get("connected"):
        return {
            "ok": False,
            "connected": False,
            "mode": "DISCONNECTED",
            "device": None,
            "totalScanned": 0,
            "apps": [],
            "message": "PHONE DISCONNECTED. Connect your Android phone via USB with USB Debugging enabled."
        }

    dev_id = status["device"]["id"]
    pkg_out = run_adb_cmd(adb, dev_id, ["shell", "pm", "list", "packages", "-3"], timeout=8)
    packages = [
        p.replace("package:", "").strip()
        for p in pkg_out.splitlines()
        if p.strip().startswith("package:")
    ]

    # Also include launcher packages (user visible apps like Maps, YouTube, Chrome, Authenticator)
    launcher_out = run_adb_cmd(adb, dev_id, ["shell", "cmd", "package", "query-activities", "--brief", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER"], timeout=6)
    for line in launcher_out.splitlines():
        line = line.strip()
        if "/" in line and not line.startswith("Activity"):
            p = line.split("/")[0].strip()
            if p and p not in packages and not p.startswith("com.android.internal") and p != "android" and p != "com.privacyshield.ai":
                packages.append(p)

    # Filter out self
    packages = [p for p in packages if p != "com.privacyshield.ai"]

    results = []
    # Concurrently audit packages for high speed
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
        future_map = {executor.submit(audit_single_package, adb, dev_id, pkg): pkg for pkg in packages}
        for future in concurrent.futures.as_completed(future_map):
            try:
                res = future.result()
                if res and res.get("packageName"):
                    results.append(res)
            except Exception:
                pass

    results.sort(key=lambda a: a["threatScore"], reverse=True)

    return {
        "ok": True,
        "connected": True,
        "mode": "REAL_PHONE",
        "device": status.get("device", {}),
        "totalScanned": len(results),
        "apps": results
    }


def open_app_settings(pkg):
    """Opens the application details/settings page directly on the connected phone."""
    adb = get_adb_path()
    status = get_device_status()
    if not status.get("connected"):
        return {"ok": False, "error": "No connected Android device found"}

    dev_id = status["device"]["id"]
    run_adb_cmd(adb, dev_id, ["shell", "am", "start", "-a", "android.settings.APPLICATION_DETAILS_SETTINGS", "-d", f"package:{pkg}"])
    return {"ok": True, "message": f"Opened Android Settings for {pkg} on your phone screen."}


PERM_NAME_TO_ANDROID = {
    "CAMERA": "android.permission.CAMERA",
    "MICROPHONE": "android.permission.RECORD_AUDIO",
    "RECORD_AUDIO": "android.permission.RECORD_AUDIO",
    "LOCATION": "android.permission.ACCESS_FINE_LOCATION",
    "ACCESS_FINE_LOCATION": "android.permission.ACCESS_FINE_LOCATION",
    "ACCESS_BACKGROUND_LOCATION": "android.permission.ACCESS_BACKGROUND_LOCATION",
    "CONTACTS": "android.permission.READ_CONTACTS",
    "READ_CONTACTS": "android.permission.READ_CONTACTS",
    "SMS": "android.permission.READ_SMS",
    "READ_SMS": "android.permission.READ_SMS",
    "STORAGE": "android.permission.READ_EXTERNAL_STORAGE",
    "READ_EXTERNAL_STORAGE": "android.permission.READ_EXTERNAL_STORAGE",
}


def change_package_permission(pkg, permission, action):
    """
    Manages real Android application permission via ADB pm revoke / grant on the connected phone.
    Follows Android runtime permission model:
    1. Validates physical device is connected.
    2. Validates package exists on device.
    3. Validates permission was actually declared / requested in manifest by that package.
       (Rejects with error if application does not request the permission).
    4. Executes ADB pm revoke or pm grant.
    5. Reads the phone again via dumpsys to verify new permission state.
    6. Returns verified state and updated CBPRA audit.
    """
    if not pkg:
        return {"ok": False, "reason": "No package specified"}

    status = get_device_status()
    if not status.get("connected"):
        return {
            "ok": False,
            "connected": False,
            "reason": "Physical Android phone is disconnected. Connect Vivo V2561 via USB with USB Debugging enabled."
        }

    adb = get_adb_path()
    dev_id = status["device"]["id"]

    # 1. Normalize permission name
    perm_upper = str(permission).strip().upper()
    android_perm = PERM_NAME_TO_ANDROID.get(perm_upper, permission)
    if not android_perm.startswith("android.permission."):
        android_perm = f"android.permission.{perm_upper}"

    clean_perm_key = ANDROID_PERM_MAP.get(android_perm, perm_upper)
    display_name = PERMISSION_DEF.get(clean_perm_key, {}).get("name", perm_upper)

    # 2. Check if package exists on phone
    pkg_check = run_adb_cmd(adb, dev_id, ["shell", "pm", "path", pkg], timeout=4).strip()
    if not pkg_check.startswith("package:"):
        return {
            "ok": False,
            "connected": True,
            "package": pkg,
            "reason": f"Package '{pkg}' is not installed on connected device."
        }

    # 3. Read package manifest to verify permission was declared
    dumpsys_before = run_adb_cmd(adb, dev_id, ["shell", "dumpsys", "package", pkg], timeout=6)
    req_perms_raw, granted_perms_raw, denied_perms_raw, ver = parse_package_dumpsys(dumpsys_before)

    # Validate if permission is declared/requested by package
    is_requested = (android_perm in req_perms_raw) or any(
        ANDROID_PERM_MAP.get(p) == clean_perm_key for p in req_perms_raw
    )

    if not is_requested:
        return {
            "ok": False,
            "connected": True,
            "package": pkg,
            "permission": clean_perm_key,
            "reason": f"Permission {android_perm} is not requested by this application"
        }

    # 4. Perform operation
    is_grant = str(action).strip().lower() in ("grant", "on", "allow", "true", "1")
    target_action = "grant" if is_grant else "revoke"

    cmd = ["shell", "pm", target_action, pkg, android_perm]
    cmd_out = run_adb_cmd(adb, dev_id, cmd, timeout=6)

    # 5. RE-READ THE PHONE AGAIN TO VERIFY
    audit_after = audit_single_package(adb, dev_id, pkg)
    verified_granted = clean_perm_key in audit_after.get("grantedPermissions", [])

    if is_grant:
        if verified_granted:
            return {
                "ok": True,
                "verified": True,
                "action": "grant",
                "package": pkg,
                "permission": clean_perm_key,
                "app": audit_after,
                "message": f"✓ {display_name} permission granted on connected phone"
            }
        else:
            return {
                "ok": False,
                "verified": True,
                "action": "grant",
                "canOpenSettings": True,
                "package": pkg,
                "permission": clean_perm_key,
                "app": audit_after,
                "reason": f"Android OS restricted direct ADB grant for {display_name}. Please grant it via Android Settings.",
                "message": f"❌ Direct grant restricted by Android OS. Use 'Manage Permissions' to open settings."
            }
    else: # revoke
        if not verified_granted:
            return {
                "ok": True,
                "verified": True,
                "action": "revoke",
                "package": pkg,
                "permission": clean_perm_key,
                "app": audit_after,
                "message": f"✓ {display_name} permission revoked on connected phone"
            }
        else:
            return {
                "ok": False,
                "verified": True,
                "action": "revoke",
                "canOpenSettings": True,
                "package": pkg,
                "permission": clean_perm_key,
                "app": audit_after,
                "reason": f"Unable to revoke {display_name} permission on connected phone (system restriction: {cmd_out.strip()}).",
                "message": f"❌ Unable to change {display_name} permission"
            }


def toggle_app_camera(pkg, action):
    """Backward-compatible wrapper routing to change_package_permission."""
    return change_package_permission(pkg, "CAMERA", action)


def get_app_permissions(pkg):
    """Returns verified permission audit for a single package from connected phone."""
    status = get_device_status()
    if not status.get("connected"):
        return {"ok": False, "connected": False, "error": "No phone connected"}
    adb = get_adb_path()
    dev_id = status["device"]["id"]
    audit = audit_single_package(adb, dev_id, pkg)
    return {"ok": True, "connected": True, "app": audit}


def get_demo_scan():
    """Returns a realistic scan result simulating real-world downloaded Android apps."""
    demo_packages = [
        ("com.coloros.calculator", "Smart Calculator Pro", "CALCULATOR", "🧮", "3.1.2",
         ["INTERNET", "CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION", "READ_SMS"],
         ["INTERNET", "CAMERA", "RECORD_AUDIO"]),
        ("com.flashlight.brightesttorch", "Super Bright Flashlight", "FLASHLIGHT", "🔦", "2.0.4",
         ["CAMERA", "RECORD_AUDIO", "ACCESS_FINE_LOCATION", "INTERNET"],
         ["CAMERA", "RECORD_AUDIO"]),
        ("com.spotify.music", "Spotify", "STREAMING_MEDIA", "🎵", "8.9.20",
         ["INTERNET", "POST_NOTIFICATIONS", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"],
         ["INTERNET", "POST_NOTIFICATIONS"]),
        ("com.google.android.apps.authenticator2", "Google Authenticator", "UTILITY", "🔐", "6.0",
         ["CAMERA", "INTERNET"],
         ["CAMERA"]),
        ("com.whatsapp", "WhatsApp Messenger", "MESSAGING", "💬", "2.24.12",
         ["INTERNET", "READ_CONTACTS", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS", "VIBRATE"],
         ["INTERNET", "READ_CONTACTS", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"]),
        ("com.instagram.android", "Instagram", "SOCIAL_MEDIA", "📸", "315.0.0",
         ["INTERNET", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS"],
         ["INTERNET", "CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"]),
        ("com.apex.finance.bank", "Apex Mobile Banking", "BANKING_FINANCE", "💳", "5.0.3",
         ["INTERNET", "CAMERA", "ACCESS_FINE_LOCATION", "POST_NOTIFICATIONS"],
         ["INTERNET", "CAMERA", "ACCESS_FINE_LOCATION"]),
        ("com.google.android.apps.nbu.paisa.user", "Google Pay (GPay)", "BANKING_FINANCE", "💳", "182.1.3",
         ["INTERNET", "CAMERA", "ACCESS_FINE_LOCATION", "READ_CONTACTS", "POST_NOTIFICATIONS"],
         ["INTERNET", "CAMERA", "ACCESS_FINE_LOCATION"]),
        ("com.photo.hdr.camera", "Pro HDR Camera", "CAMERA", "📷", "3.2.0",
         ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "ACCESS_FINE_LOCATION"],
         ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"]),
        ("com.camerasideas.instashot", "InShot Video Editor", "CAMERA", "🎬", "1.98.0",
         ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS"],
         ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"]),
        ("com.google.android.apps.maps", "Google Maps", "NAVIGATION_MAPS", "🗺️", "11.110.0",
         ["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION", "INTERNET", "RECORD_AUDIO", "POST_NOTIFICATIONS"],
         ["ACCESS_FINE_LOCATION", "INTERNET", "RECORD_AUDIO"]),
        ("com.ubercab", "Uber Rides", "NAVIGATION_MAPS", "🚗", "4.502.1",
         ["ACCESS_FINE_LOCATION", "INTERNET", "POST_NOTIFICATIONS"],
         ["ACCESS_FINE_LOCATION", "INTERNET"]),
        ("com.google.android.youtube", "YouTube", "STREAMING_MEDIA", "▶️", "19.09.37",
         ["INTERNET", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS"],
         ["INTERNET", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"]),
        ("com.openai.chatgpt", "ChatGPT", "UTILITY", "🤖", "1.2024.08",
         ["INTERNET", "RECORD_AUDIO", "POST_NOTIFICATIONS"],
         ["INTERNET", "RECORD_AUDIO"]),
        ("com.flipkart.android", "Flipkart", "SHOPPING", "🛍️", "7.94",
         ["INTERNET", "CAMERA", "ACCESS_FINE_LOCATION", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS"],
         ["INTERNET", "ACCESS_FINE_LOCATION", "READ_EXTERNAL_STORAGE"]),
        ("com.truecaller", "Truecaller: Caller ID & Spam", "UTILITY", "📞", "14.2.5",
         ["READ_CONTACTS", "READ_PHONE_STATE", "READ_CALL_LOG", "READ_SMS", "RECEIVE_SMS", "INTERNET", "RECORD_AUDIO"],
         ["READ_CONTACTS", "READ_PHONE_STATE", "READ_CALL_LOG", "READ_SMS", "INTERNET", "RECORD_AUDIO"]),
        ("org.telegram.messenger", "Telegram Messenger", "MESSAGING", "✈️", "10.8.1",
         ["INTERNET", "CAMERA", "RECORD_AUDIO", "READ_CONTACTS", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS"],
         ["INTERNET", "CAMERA", "RECORD_AUDIO", "READ_CONTACTS"]),
        ("com.dts.freefiremax", "Free Fire MAX", "GAMING", "🔥", "2.103.1",
         ["INTERNET", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS"],
         ["INTERNET", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"]),
        ("com.digilocker.android", "DigiLocker Govt App", "UTILITY", "🪪", "5.2.1",
         ["INTERNET", "CAMERA", "READ_EXTERNAL_STORAGE", "POST_NOTIFICATIONS"],
         ["INTERNET", "READ_EXTERNAL_STORAGE"]),
        ("com.offline.notes", "Minimalist Note Keeper", "NOTES_MEMO", "📝", "1.0.2",
         ["READ_EXTERNAL_STORAGE", "VIBRATE"],
         ["READ_EXTERNAL_STORAGE", "VIBRATE"]),
    ]

    results = []
    for pkg, name, cat, icon, ver, perms, granted in demo_packages:
        granted_list = list(granted)
        cbpra = compute_cbpra(cat, perms, granted_list)
        has_cam = "CAMERA" in perms
        has_mic = "RECORD_AUDIO" in perms
        granted_cam = "CAMERA" in granted_list
        granted_mic = "RECORD_AUDIO" in granted_list

        has_loc = any(p in perms for p in ["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION"])
        granted_loc = any(p in granted_list for p in ["ACCESS_FINE_LOCATION", "ACCESS_BACKGROUND_LOCATION"])

        has_contacts = "READ_CONTACTS" in perms
        granted_contacts = "READ_CONTACTS" in granted_list

        has_sms = any(p in perms for p in ["READ_SMS", "RECEIVE_SMS"])
        granted_sms = any(p in granted_list for p in ["READ_SMS", "RECEIVE_SMS"])

        has_storage = any(p in perms for p in ["READ_EXTERNAL_STORAGE", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "READ_MEDIA_AUDIO"])
        granted_storage = any(p in granted_list for p in ["READ_EXTERNAL_STORAGE", "READ_MEDIA_IMAGES", "READ_MEDIA_VIDEO", "READ_MEDIA_AUDIO"])

        has_net = "INTERNET" in perms
        granted_net = "INTERNET" in granted_list or has_net

        sensor_matrix = {
            "camera": {
                "name": "Camera",
                "icon": "📷",
                "requested": has_cam,
                "granted": granted_cam,
                "status": "GRANTED" if granted_cam else ("DENIED" if has_cam else "NOT_REQUESTED"),
                "statusText": "GRANTED" if granted_cam else ("DENIED" if has_cam else "NOT REQUESTED")
            },
            "microphone": {
                "name": "Microphone",
                "icon": "🎤",
                "requested": has_mic,
                "granted": granted_mic,
                "status": "GRANTED" if granted_mic else ("DENIED" if has_mic else "NOT_REQUESTED"),
                "statusText": "GRANTED" if granted_mic else ("DENIED" if has_mic else "NOT REQUESTED")
            },
            "location": {
                "name": "Location",
                "icon": "📍",
                "requested": has_loc,
                "granted": granted_loc,
                "status": "GRANTED" if granted_loc else ("DENIED" if has_loc else "NOT_REQUESTED"),
                "statusText": "GRANTED" if granted_loc else ("DENIED" if has_loc else "NOT REQUESTED")
            },
            "contacts": {
                "name": "Contacts",
                "icon": "👥",
                "requested": has_contacts,
                "granted": granted_contacts,
                "status": "GRANTED" if granted_contacts else ("DENIED" if has_contacts else "NOT_REQUESTED"),
                "statusText": "GRANTED" if granted_contacts else ("DENIED" if has_contacts else "NOT REQUESTED")
            },
            "sms": {
                "name": "SMS / 2FA",
                "icon": "✉️",
                "requested": has_sms,
                "granted": granted_sms,
                "status": "GRANTED" if granted_sms else ("DENIED" if has_sms else "NOT_REQUESTED"),
                "statusText": "GRANTED" if granted_sms else ("DENIED" if has_sms else "NOT REQUESTED")
            },
            "storage": {
                "name": "Storage / Photos",
                "icon": "📁",
                "requested": has_storage,
                "granted": granted_storage,
                "status": "GRANTED" if granted_storage else ("DENIED" if has_storage else "NOT_REQUESTED"),
                "statusText": "GRANTED" if granted_storage else ("DENIED" if has_storage else "NOT REQUESTED")
            },
            "internet": {
                "name": "Internet",
                "icon": "🌐",
                "requested": has_net,
                "granted": granted_net,
                "status": "GRANTED" if granted_net else ("DECLARED" if has_net else "NOT_REQUESTED"),
                "statusText": "GRANTED" if granted_net else ("DECLARED" if has_net else "NOT REQUESTED")
            }
        }

        permission_details = []
        for p in perms:
            p_def = PERMISSION_DEF.get(p, {"name": p, "category": "OTHER", "weight": 5, "desc": "System capability"})
            is_p_granted = p in granted_list
            is_normal = p_def["category"] in ["INTERNET", "NOTIFICATIONS", "OTHER"]
            status_val = "GRANTED" if is_p_granted else ("DECLARED" if is_normal else "DENIED")
            permission_details.append({
                "id": p,
                "name": p_def["name"],
                "category": p_def["category"],
                "weight": p_def["weight"],
                "desc": p_def["desc"],
                "requested": True,
                "granted": is_p_granted,
                "status": status_val,
                "statusText": status_val,
                "protectionLevel": "NORMAL" if is_normal else "DANGEROUS"
            })

        suggestion = generate_privacy_suggestion(
            name, cat, cbpra["threat_score"],
            has_cam, has_mic, granted_cam, granted_mic,
            perms, cbpra["threat_vectors"]
        )

        results.append({
            "id": pkg,
            "packageName": pkg,
            "name": name,
            "category": cat,
            "categoryDisplay": f"{cat.replace('_', ' ').title()} {icon}",
            "icon": icon,
            "version": ver,
            "permissions": perms,
            "grantedPermissions": granted_list,
            "deniedPermissions": [p for p in perms if p not in granted_list],
            "sensorMatrix": sensor_matrix,
            "permissionDetails": permission_details,
            "hasCamera": has_cam,
            "hasMicrophone": has_mic,
            "hasLocation": has_loc,
            "hasContacts": has_contacts,
            "hasSms": has_sms,
            "hasStorage": has_storage,
            "hasInternet": has_net,
            "grantedCamera": granted_cam,
            "grantedMicrophone": granted_mic,
            "grantedLocation": granted_loc,
            "grantedContacts": granted_contacts,
            "grantedSms": granted_sms,
            "threatScore": cbpra["threat_score"],
            "riskLevel": cbpra["risk_level"],
            "badgeClass": cbpra["badge_class"],
            "baseSensitivity": cbpra["base_sensitivity"],
            "mismatchPenalty": cbpra["mismatch_penalty"],
            "threatPenalty": cbpra["threat_penalty"],
            "threatVectors": cbpra["threat_vectors"],
            "dominantDrivers": cbpra["dominant_drivers"],
            "unexpectedPerms": cbpra["unexpected_perms"],
            "aiExplanation": cbpra["ai_explanation"],
            "suggestion": suggestion,
            "recommendation": {
                "action": "REVOKE PERMISSIONS" if cbpra["threat_score"] >= 61 else ("REVIEW" if cbpra["threat_score"] >= 31 else "ALLOW"),
                "badgeClass": "rec-deny" if cbpra["threat_score"] >= 61 else ("rec-allow-once" if cbpra["threat_score"] >= 31 else "rec-allow"),
                "text": suggestion
            }
        })

    results.sort(key=lambda a: a["threatScore"], reverse=True)

    return {
        "ok": True,
        "isDemo": True,
        "device": {
            "id": "DEMO-GALAXY-S24",
            "name": "Samsung Galaxy S24 Ultra (Live Simulation)",
            "model": "SM-S928B",
            "manufacturer": "Samsung",
            "android_version": "14",
            "battery": "87%",
            "downloaded_apps_count": len(results)
        },
        "totalScanned": len(results),
        "apps": results
    }
