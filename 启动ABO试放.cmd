@echo off
start "" "http://127.0.0.1:5186/"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Start-Island.ps1"
pause
