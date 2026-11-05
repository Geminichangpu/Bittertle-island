param([switch]$Viewer)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue
$nodeExe = if ($nodeCmd) { $nodeCmd.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
if (-not (Test-Path -LiteralPath $nodeExe)) { throw '需要 Node.js 24 或更新版本。请安装后重试。' }
$folder = if ($Viewer) { 'dist-viewer' } else { 'dist' }
$port = 5186
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot "$folder\index.html"))) { throw '缺少构建文件，请先按照 README 构建。' }
$existing = $null
try { $existing = Invoke-WebRequest -Uri "http://127.0.0.1:$port/" -UseBasicParsing -TimeoutSec 2 } catch {}
if ($existing) {
    if ($Viewer) { throw '5186 端口已在使用；请先关闭现有服务再启动展示版。' }
    if ($existing.Content -notmatch 'Bittertle island') { throw '5186 端口被其他程序占用。' }
    Write-Host "比特尔特岛已在运行：http://127.0.0.1:$port/" -ForegroundColor Green
    return
}
Write-Host "比特尔特岛：请在浏览器打开 http://127.0.0.1:$port/" -ForegroundColor Green
Write-Host '关闭窗口或按 Ctrl+C 即可停止本地服务。编辑器请固定使用相同地址，以恢复本地存档。'
& $nodeExe (Join-Path $PSScriptRoot 'scripts\serve.mjs') $folder $port
