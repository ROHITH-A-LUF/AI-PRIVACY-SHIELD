@echo off
title PrivacyShield AI - Web Dashboard
cd /d "%~dp0"

echo ========================================================
echo   Starting PrivacyShield AI Web Dashboard...
echo ========================================================
echo.

:: 1. Try python command directly
python --version >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Launching with Python...
    start "" http://127.0.0.1:8765/
    python server.py
    goto :eof
)

:: 2. Try py launcher with Python 3.13
py -3.13 --version >nul 2>nul
if %errorlevel%==0 (
    echo [OK] Launching with Python 3.13...
    start "" http://127.0.0.1:8765/
    py -3.13 server.py
    goto :eof
)

:: 3. Fallback: Open index.html directly in the default browser
echo [INFO] Python server not detected. Opening web dashboard directly in your browser...
start "" "%~dp0index.html"
echo Dashboard launched in browser.
pause
