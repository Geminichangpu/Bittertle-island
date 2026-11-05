@echo off
cd /d "%~dp0"
start "" "http://127.0.0.1:4185/"
node scripts\serve.mjs dist 4185
pause
