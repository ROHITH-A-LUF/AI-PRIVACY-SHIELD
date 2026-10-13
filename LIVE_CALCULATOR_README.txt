PRIVACYSHIELD AI - LIVE WINDOWS APPLICATION DEMO

WHAT WAS ADDED
- Live Windows Calculator Monitor in index.html
- Live Windows Notepad Monitor in index.html
- Automatic 3-second polling for both applications in app.js
- Local server.py bridge that reads installed Windows AppX manifests and process state
- Mapping from Windows privacy capabilities to the existing CBPRA permission engine
- Live risk score, risk level, capabilities and threat-vector display for both apps
- start_privacyshield.bat launcher

HOW TO RUN
1. Make sure Python 3 is installed.
2. Double-click start_privacyshield.bat.
3. Keep the black terminal window open.
4. The dashboard opens at http://127.0.0.1:8765/
5. Open/close Windows Calculator; the Process field updates automatically.
6. Click Analyze Calculator Now or Analyze Notepad Now for an immediate scan.
7. Open/close Windows Notepad; its Process field updates automatically.

IMPORTANT
A normal browser page cannot directly inspect another desktop application's
permissions because of browser security. The LOCAL bridge is the connection
between Windows Calculator and the dashboard. It listens only on 127.0.0.1.

This demo analyzes Windows Calculator and Windows Notepad on the laptop. It is separate
from the Android demo-calculator module in the same project. The bridge reports AppX
manifest capabilities and process state; the CBPRA engine then computes the demo risk score.
