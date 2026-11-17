@echo off
chcp 65001 >nul
setlocal
where node.exe >nul 2>nul
if errorlevel 1 (
  echo 需要安装 Node.js 才能启动比特尔特岛。
  pause
  exit /b 1
)
node.exe "%~dp0网页内容\launch-island.mjs"
if errorlevel 1 pause
