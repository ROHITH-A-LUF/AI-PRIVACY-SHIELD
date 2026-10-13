#!/usr/bin/env python3

import json
import os
import subprocess
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs
import android_bridge


# ============================================================
# PRIVACYSHIELD AI - WINDOWS LIVE BRIDGE
# ============================================================

HOST = "127.0.0.1"
PORT = 8765
ROOT = os.path.dirname(os.path.abspath(__file__))


# ============================================================
# APPLICATION CONFIGURATION
# ============================================================

APP_CONFIGS = {

    # --------------------------------------------------------
    # 1. WHATSAPP DESKTOP
    # --------------------------------------------------------

    "whatsapp": {
        "name": "WhatsApp",
        "processes": [
            "WhatsApp",
            "WhatsAppApp"
        ],
        "capabilities": [
            {
                "raw": "internet",
                "name": "Internet Socket",
                "permission": "INTERNET",
                "risky": False,
                "classification": "Functional Capability"
            },
            {
                "raw": "contacts",
                "name": "Contacts Access",
                "permission": "READ_CONTACTS",
                "risky": True,
                "classification": "Functional Capability"
            },
            {
                "raw": "webcam",
                "name": "Camera Access",
                "permission": "CAMERA",
                "risky": True,
                "classification": "OS-Detected Capability"
            },
            {
                "raw": "microphone",
                "name": "Microphone",
                "permission": "RECORD_AUDIO",
                "risky": True,
                "classification": "OS-Detected Capability"
            },
            {
                "raw": "fileSystem",
                "name": "Shared Files & Media",
                "permission": "READ_EXTERNAL_STORAGE",
                "risky": True,
                "classification": "Functional Capability"
            },
            {
                "raw": "notifications",
                "name": "Notifications",
                "permission": "POST_NOTIFICATIONS",
                "risky": False,
                "classification": "Functional Capability"
            }
        ]
    },


    # --------------------------------------------------------
    # 2. UNITY APPLICATION / ENGINE
    # --------------------------------------------------------

    "unity": {
        "name": "Unity",
        "processes": [
            "Unity",
            "Unity Hub",
            "UnityPlayer",
            "UnityCrashHandler64",
            "UnityCrashHandler32",
            "UnityShaderCompiler"
        ],
        "capabilities": [
            {
                "raw": "unityStorage",
                "name": "File System & Asset Storage",
                "permission": "READ_EXTERNAL_STORAGE",
                "risky": True,
                "classification": "Functional Capability"
            },
            {
                "raw": "unityNetwork",
                "name": "Network & Package Communication",
                "permission": "INTERNET",
                "risky": False,
                "classification": "Functional Capability"
            },
            {
                "raw": "unityAudio",
                "name": "Audio Device Access",
                "permission": "RECORD_AUDIO",
                "risky": True,
                "classification": "Inferred Capability"
            }
        ]
    },


    # --------------------------------------------------------
    # 3. WINDOWS CAMERA
    # --------------------------------------------------------

    "camera": {
        "name": "Windows Camera",
        "processes": [
            "WindowsCamera",
            "CameraApp",
            "WindowsCameraApp",
            "Camera"
        ],
        "capabilities": [
            {
                "raw": "webcam",
                "name": "Camera Access",
                "permission": "CAMERA",
                "risky": True,
                "classification": "OS-Detected Capability"
            }
        ]
    },


    # --------------------------------------------------------
    # 4. WINDOWS CALCULATOR
    # --------------------------------------------------------

    "calculator": {
        "name": "Windows Calculator",
        "processes": [
            "CalculatorApp",
            "Calculator"
        ],
        "capabilities": []
    },


    # --------------------------------------------------------
    # 5. WINDOWS NOTEPAD
    # --------------------------------------------------------

    "notepad": {
        "name": "Windows Notepad",
        "processes": [
            "Notepad"
        ],
        "capabilities": []
    },


    # --------------------------------------------------------
    # 6. FILE EXPLORER
    # --------------------------------------------------------

    "explorer": {
        "name": "File Explorer",
        "processes": [
            "explorer"
        ],
        "capabilities": [
            {
                "raw": "hostFileSystem",
                "name": "File System Access",
                "permission": "READ_EXTERNAL_STORAGE",
                "risky": True,
                "classification": "Functional Capability"
            }
        ]
    },


    # --------------------------------------------------------
    # 7. MICROSOFT EDGE
    # --------------------------------------------------------

    "edge": {
        "name": "Microsoft Edge",
        "processes": [
            "msedge"
        ],
        "capabilities": [
            {
                "raw": "browserNetwork",
                "name": "Internet Network",
                "permission": "INTERNET",
                "risky": False,
                "classification": "Functional Capability"
            }
        ]
    }
}


# ============================================================
# POWERSHELL ARRAY HELPER
# ============================================================

def ps_array(values):

    escaped = []

    for value in values:

        value = str(value)

        value = value.replace("'", "''")

        escaped.append("'" + value + "'")

    if not escaped:

        return "@()"

    return "@(" + ",".join(escaped) + ")"


# ============================================================
# POWERSHELL EXECUTION
# ============================================================

def run_powershell(script, timeout=5):

    result = subprocess.run(
        [
            "powershell.exe",
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script
        ],
        capture_output=True,
        text=True,
        timeout=timeout
    )

    if result.returncode != 0:

        raise RuntimeError(
            result.stderr.strip()
            or
            "PowerShell command failed"
        )

    return result.stdout.strip()


# ============================================================
# GENERIC PROCESS CHECK
# ============================================================

def is_process_running(process_names):

    process_patterns = ps_array(process_names)

    script = f"""
$found = $false

foreach ($name in {process_patterns}) {{

    $processes = @(
        Get-Process -Name $name -ErrorAction SilentlyContinue
    )

    if ($processes.Count -gt 0) {{

        $found = $true

        break
    }}
}}

if ($found) {{

    Write-Output "true"

}}
else {{

    Write-Output "false"

}}
"""

    try:

        output = run_powershell(
            script,
            timeout=5
        )

        return output.strip().lower() == "true"

    except Exception:

        return False


# ============================================================
# WHATSAPP PROCESS CHECK
# ============================================================

def is_whatsapp_running():

    """
    WhatsApp Desktop can use different process names depending
    on the installed Windows package/version.

    First check the normal WhatsApp process.
    Then perform a broader process-name search.
    """

    # --------------------------------------------------------
    # Normal process names
    # --------------------------------------------------------

    if is_process_running(
        [
            "WhatsApp",
            "WhatsAppApp"
        ]
    ):

        return True


    # --------------------------------------------------------
    # Broader process-name search
    # --------------------------------------------------------

    script = r"""
$found = @(
    Get-Process -ErrorAction SilentlyContinue |
    Where-Object {
        $_.ProcessName -like '*WhatsApp*'
    }
)

if ($found.Count -gt 0) {

    Write-Output "true"

}
else {

    Write-Output "false"

}
"""

    try:

        output = run_powershell(
            script,
            timeout=5
        )

        return output.strip().lower() == "true"

    except Exception:

        return False


# ============================================================
# UNITY PROCESS CHECK
# ============================================================

def is_unity_running():

    """
    Checks if Unity Editor, Unity Hub, or a Unity-based application/build
    is currently running in Windows.
    """

    if is_process_running(
        [
            "Unity",
            "Unity Hub",
            "UnityPlayer",
            "UnityCrashHandler64",
            "UnityCrashHandler32",
            "UnityShaderCompiler"
        ]
    ):

        return True

    script = r"""
$found = @(
    Get-Process -ErrorAction SilentlyContinue |
    Where-Object {
        $_.ProcessName -like '*Unity*' -or
        $_.MainWindowTitle -like '*Unity*'
    }
)

if ($found.Count -gt 0) {

    Write-Output "true"

}
else {

    Write-Output "false"

}
"""

    try:

        output = run_powershell(
            script,
            timeout=5
        )

        return output.strip().lower() == "true"

    except Exception:

        return False


# ============================================================
# FILE EXPLORER WINDOW CHECK
# ============================================================

def is_file_explorer_open():

    """
    explorer.exe remains running in Windows even when
    all File Explorer windows are closed.

    Therefore we check actual Explorer windows through
    Shell.Application.
    """

    script = r"""
try {

    $shell = New-Object -ComObject Shell.Application

    $windows = @(
        $shell.Windows() |
        Where-Object {
            $_.FullName -and
            $_.FullName -like '*explorer.exe'
        }
    )

    if ($windows.Count -gt 0) {

        Write-Output "true"

    }
    else {

        Write-Output "false"

    }

}
catch {

    Write-Output "false"

}
"""

    try:

        output = run_powershell(
            script,
            timeout=5
        )

        return output.strip().lower() == "true"

    except Exception:

        return False


# ============================================================
# GET APPLICATION DATA
# ============================================================

def get_app_data(app_id):

    config = APP_CONFIGS[app_id]


    # --------------------------------------------------------
    # FILE EXPLORER
    # --------------------------------------------------------

    if app_id == "explorer":

        running = is_file_explorer_open()


    # --------------------------------------------------------
    # WHATSAPP
    # --------------------------------------------------------

    elif app_id == "whatsapp":

        running = is_whatsapp_running()


    # --------------------------------------------------------
    # UNITY
    # --------------------------------------------------------

    elif app_id == "unity":

        running = is_unity_running()


    # --------------------------------------------------------
    # OTHER APPLICATIONS
    # --------------------------------------------------------

    else:

        running = is_process_running(
            config["processes"]
        )


    # --------------------------------------------------------
    # PERMISSION KEYS
    # --------------------------------------------------------

    capabilities = config["capabilities"]

    permission_keys = []

    for capability in capabilities:

        permission = capability.get(
            "permission"
        )

        if (
            permission
            and
            permission not in permission_keys
        ):

            permission_keys.append(
                permission
            )


    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "ok": True,

        "id": app_id,

        "name": config["name"],

        "package": config["name"],

        "version": "",

        "running": running,

        "capabilities": capabilities,

        "permissionKeys": permission_keys

    }


# ============================================================
# HTTP HANDLER
# ============================================================

class PrivacyShieldHandler(
    SimpleHTTPRequestHandler
):


    def __init__(
        self,
        *args,
        **kwargs
    ):

        super().__init__(
            *args,
            directory=ROOT,
            **kwargs
        )


    # --------------------------------------------------------
    # HEADERS
    # --------------------------------------------------------

    def end_headers(self):

        self.send_header(
            "Cache-Control",
            "no-store"
        )

        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )

        super().end_headers()


    # --------------------------------------------------------
    # GET
    # --------------------------------------------------------

    def do_GET(self):

        path = self.path.split("?")[0]


        # ----------------------------------------------------
        # ----------------------------------------------------
        # ANDROID API
        # ----------------------------------------------------

        if path.startswith("/api/android/"):
            sub = path[len("/api/android/"):].strip()
            parsed = urlparse(self.path)
            query_params = parse_qs(parsed.query)

            if sub == "status":
                data = android_bridge.get_device_status()
                self.send_json(data, 200)
                return

            if sub == "scan":
                data = android_bridge.scan_downloaded_apps()
                self.send_json(data, 200)
                return

            if sub == "demo-scan":
                data = android_bridge.get_demo_scan()
                self.send_json(data, 200)
                return

            # Match /api/android/app/<package>/permissions
            m_perms = re.match(r"^app/([^/]+)/permissions$", sub)
            if m_perms:
                pkg = m_perms.group(1)
                data = android_bridge.get_app_permissions(pkg)
                self.send_json(data, 200 if data.get("ok") else 400)
                return

            if sub == "app/permissions":
                pkg = query_params.get("package", [""])[0]
                data = android_bridge.get_app_permissions(pkg)
                self.send_json(data, 200 if data.get("ok") else 400)
                return

            # Match /api/android/app/<package>/settings
            m_set = re.match(r"^app/([^/]+)/settings$", sub)
            if m_set:
                pkg = m_set.group(1)
                data = android_bridge.open_app_settings(pkg)
                self.send_json(data, 200)
                return

            if sub in ("open-settings", "app/settings"):
                pkg = query_params.get("package", [""])[0]
                data = android_bridge.open_app_settings(pkg)
                self.send_json(data, 200)
                return

            if sub == "rescan-package":
                pkg = query_params.get("package", [""])[0]
                data = android_bridge.rescan_single_package(pkg)
                self.send_json(data, 200)
                return

            # Support GET for permission revoke/grant for convenience
            m_perm_action = re.match(r"^app/([^/]+)/permission/(revoke|grant)$", sub)
            if m_perm_action:
                pkg = m_perm_action.group(1)
                action = m_perm_action.group(2)
                perm = query_params.get("permission", ["CAMERA"])[0]
                data = android_bridge.change_package_permission(pkg, perm, action)
                self.send_json(data, 200 if data.get("ok") else 400)
                return

            if sub == "camera-toggle":
                pkg = query_params.get("package", [""])[0]
                action = query_params.get("action", ["off"])[0]
                data = android_bridge.toggle_app_camera(pkg, action)
                self.send_json(data, 200)
                return

            self.send_json({"ok": False, "error": f"Unknown android endpoint: {sub}"}, 404)
            return

        # ----------------------------------------------------
        # WINDOWS LIVE BRIDGE API
        # ----------------------------------------------------

        if path.startswith("/api/"):

            app_id = (
                path[len("/api/"):]
                .strip()
                .lower()
            )


            if app_id not in APP_CONFIGS:

                self.send_json(
                    {
                        "ok": False,
                        "error": "Unknown application"
                    },
                    404
                )

                return


            try:

                data = get_app_data(
                    app_id
                )

                self.send_json(
                    data,
                    200
                )

            except Exception as exc:

                self.send_json(
                    {
                        "ok": False,
                        "id": app_id,
                        "error": str(exc)
                    },
                    500
                )

            return


        # ----------------------------------------------------
        # WEBSITE
        # ----------------------------------------------------

        super().do_GET()


    # --------------------------------------------------------
    # POST
    # --------------------------------------------------------

    def do_POST(self):

        path = self.path.split("?")[0]
        parsed = urlparse(self.path)
        query_params = parse_qs(parsed.query)

        content_len = int(self.headers.get("Content-Length", 0))
        post_body = self.rfile.read(content_len).decode("utf-8") if content_len > 0 else "{}"
        try:
            body_json = json.loads(post_body)
        except Exception:
            body_json = {}

        def get_field(name, default=""):
            val = body_json.get(name)
            if val is not None and str(val).strip():
                return str(val).strip()
            q_val = query_params.get(name, [""])[0]
            if q_val:
                return q_val.strip()
            return default

        if path.startswith("/api/android/"):
            sub = path[len("/api/android/"):].strip()

            # 1. Permission Revoke: POST /api/android/app/<package>/permission/revoke or /api/android/app/permission/revoke
            m_revoke = re.match(r"^app/([^/]+)/permission/revoke$", sub)
            if m_revoke or sub == "app/permission/revoke":
                pkg = m_revoke.group(1) if m_revoke else get_field("package")
                perm = get_field("permission", "CAMERA")
                data = android_bridge.change_package_permission(pkg, perm, "revoke")
                self.send_json(data, 200 if data.get("ok") else 400)
                return

            # 2. Permission Grant: POST /api/android/app/<package>/permission/grant or /api/android/app/permission/grant
            m_grant = re.match(r"^app/([^/]+)/permission/grant$", sub)
            if m_grant or sub == "app/permission/grant":
                pkg = m_grant.group(1) if m_grant else get_field("package")
                perm = get_field("permission", "CAMERA")
                data = android_bridge.change_package_permission(pkg, perm, "grant")
                self.send_json(data, 200 if data.get("ok") else 400)
                return

            # 3. Settings: POST /api/android/app/<package>/settings or /api/android/app/settings or /api/android/open-settings
            m_set = re.match(r"^app/([^/]+)/settings$", sub)
            if m_set or sub in ("open-settings", "app/settings"):
                pkg = m_set.group(1) if m_set else get_field("package")
                data = android_bridge.open_app_settings(pkg)
                self.send_json(data, 200 if data.get("ok") else 400)
                return

            # 4. Rescan: POST /api/android/rescan-package
            if sub in ("rescan-package", "app/rescan"):
                pkg = get_field("package")
                data = android_bridge.rescan_single_package(pkg)
                self.send_json(data, 200)
                return

            # 5. Legacy camera-toggle: POST /api/android/camera-toggle
            if sub == "camera-toggle":
                pkg = get_field("package")
                action = get_field("action", "off")
                data = android_bridge.toggle_app_camera(pkg, action)
                self.send_json(data, 200)
                return

            self.send_json({"ok": False, "error": f"Unknown android POST endpoint: {sub}"}, 404)
            return

        self.send_json({"ok": False, "error": "Not Found"}, 404)


    # --------------------------------------------------------
    # OPTIONS
    # --------------------------------------------------------

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()


    # --------------------------------------------------------
    # SEND JSON
    # --------------------------------------------------------

    def send_json(
        self,
        data,
        status=200
    ):

        body = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")


        self.send_response(
            status
        )

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Content-Length",
            str(len(body))
        )

        self.send_header(
            "Connection",
            "close"
        )

        self.end_headers()

        self.wfile.write(
            body
        )
        try:
            self.wfile.flush()
        except Exception:
            pass
        self.close_connection = True


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    print()

    print("=" * 65)

    print(
        " PrivacyShield AI - Windows Live Bridge"
    )

    print("=" * 65)

    print()

    print(
        f"Dashboard:"
    )

    print(
        f"http://{HOST}:{PORT}/"
    )

    print()

    print("Monitoring:")

    print(
        "  [1] WhatsApp"
    )

    print(
        "  [2] Unity"
    )

    print(
        "  [3] Windows Camera"
    )

    print(
        "  [4] Windows Calculator"
    )

    print(
        "  [5] Windows Notepad"
    )

    print(
        "  [6] File Explorer"
    )

    print(
        "  [7] Microsoft Edge"
    )

    print()

    print(
        "Keep this CMD window open."
    )

    print()

    print("=" * 65)

    print()


    server = ThreadingHTTPServer(
        (
            HOST,
            PORT
        ),
        PrivacyShieldHandler
    )


    server.serve_forever()