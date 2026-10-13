PrivacyShield AI - Live Windows Application Demo
================================================

This demo monitors five Windows applications through the local bridge:
1. Windows Calculator
2. Windows Notepad
3. File Explorer
4. Windows Camera
5. Microsoft Edge

How to run
----------
1. Open this folder: Downloads\Mini Project
2. Double-click start_privacyshield.bat
3. Keep the black Command Prompt window open.
4. Open: http://127.0.0.1:8765/
5. Open/close the Windows applications and watch their Process state update.

Notes on detection
------------------
- Calculator, Notepad and Camera are inspected through their AppX manifest when available.
- File Explorer and Edge are desktop/Win32 processes. Windows does not expose a simple AppX permission list for them in the same way, so the demo uses conservative functional classifications (file-system access for Explorer and network access for Edge). These are clearly described in the dashboard as classifications, not Windows permission grants.
- The CBPRA score is calculated in the browser from the capabilities returned by the local bridge.

Python
------
The launcher explicitly uses Python 3.13 because the py launcher on this PC was pointing at a missing Python 3.14 executable.


RESET / RE-ANALYZE
- Use "Analyze All Apps" to run CBPRA analysis for all five live monitors.
- Use "Reset All Analysis" to clear all risk scores and return every monitor to READY.
- After reset, the bridge still updates RUNNING/NOT RUNNING status, but risk scores stay cleared until Analyze is pressed again.
