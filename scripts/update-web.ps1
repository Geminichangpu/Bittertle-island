$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
function Run {
    param([string]$command, [string[]]$arguments)
    & $command @arguments
    if ($LASTEXITCODE -ne 0) { throw "$command failed ($LASTEXITCODE)" }
}
try {
    # Refresh the permanent Windows PATH, and do not use Codex's bundled runtime.
    $pathParts = @([Environment]::GetEnvironmentVariable('Path','Machine'), [Environment]::GetEnvironmentVariable('Path','User'), $env:Path) -join ';'
    $env:Path = (($pathParts -split ';') | Where-Object { $_ -and $_ -notmatch '(?i)[\\/]\.cache[\\/]codex-runtimes[\\/]' } | Select-Object -Unique) -join ';'
    $nodeCommand = Get-Command node.exe -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $nodeCommand) { throw '未找到系统 Node.js。请安装 Node.js 24 LTS，勾选加入 PATH，重新打开本窗口后再运行。' }
    $nodeExe = $nodeCommand.Source
    $env:Path = (Split-Path -Parent $nodeExe) + ';' + $env:Path
    $nodeVersion = & $nodeExe --version
    if ($LASTEXITCODE -ne 0 -or $nodeVersion -notmatch '^v(\d+)\.' -or [int]$Matches[1] -lt 24) { throw "Node.js 版本不符合要求（$nodeVersion）。请安装 Node.js 24 LTS 或更新版本。" }
    $pnpmCommand = Get-Command pnpm.cmd -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $pnpmCommand) { throw '未找到 pnpm。请在系统 Node.js 安装完成后安装 pnpm 10，然后重新运行。' }
    $pnpmExe = $pnpmCommand.Source
    $pnpmVersion = & $pnpmExe --version
    if ($LASTEXITCODE -ne 0 -or $pnpmVersion -notmatch '^(10|11)\.') { throw "pnpm 不可用或版本不兼容（$pnpmVersion）。请安装 pnpm 10 或 11。" }
    if (-not (Test-Path -LiteralPath 'node_modules\vite\bin\vite.js')) { throw '项目依赖尚未安装。请先在项目目录运行 pnpm install --frozen-lockfile，再重新运行。' }
    Write-Host "环境检查通过：Node.js $nodeVersion ($nodeExe)，pnpm $pnpmVersion ($pnpmExe)"
    Run git -arguments @('rev-parse','--is-inside-work-tree')
    if ((& git branch --show-current) -ne 'main') { throw '当前分支不是 main，请先切换到 main。' }
    Run git -arguments @('remote','get-url','origin')
    Run git -arguments @('status','--short')
    Write-Host '正在使用根目录布局构建只读网页和编辑器……'
    Run $pnpmExe -arguments @('build:viewer','--','--use-project-layout')
    Run $pnpmExe -arguments @('build')
    Run git -arguments @('status','--short')
    Write-Host '请检查以上变更；已有暂存文件也会包含在提交中。'
    if ((Read-Host '暂存所有未忽略的变更并继续？请输入 YES') -cne 'YES') { return }
    Run git -arguments @('add','-A')
    Run git -arguments @('diff','--cached','--stat')
    $objects = & git ls-files --stage | ForEach-Object { if ($_ -match '^\d+ ([0-9a-f]+) \d+\s') { $Matches[1] } }
    $large = $objects | & git cat-file '--batch-check=%(objectsize) %(objectname)' | Where-Object { ($_ -split ' ')[0] -match '^\d+$' -and [long](($_ -split ' ')[0]) -gt 100MB }
    if ($LASTEXITCODE -ne 0) { throw 'Could not inspect staged Git objects.' }
    if ($large) { throw "Staged Git objects exceed 100 MiB; inspect them and review Git LFS: $large" }
    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 1) {
        $message = Read-Host '请输入提交说明（留空取消）'
        if ([string]::IsNullOrWhiteSpace($message)) { return }
        Run git -arguments @('commit','-m',$message)
    } elseif ($LASTEXITCODE -ne 0) { throw 'Could not inspect staged changes.' }
    Run git -arguments @('fetch','origin')
    & git show-ref --verify --quiet 'refs/remotes/origin/main'
    if ($LASTEXITCODE -eq 0) {
        & git merge-base --is-ancestor origin/main HEAD
        if ($LASTEXITCODE -ne 0) { throw '远端 main 包含本地没有的提交，请先手动整合；没有推送。' }
    } elseif ($LASTEXITCODE -ne 1) { throw 'Could not check remote main.' }
    Write-Host '准备普通推送 main 到 origin，不会强制推送。'
    if ((Read-Host '请输入 YES 确认推送') -cne 'YES') { return }
    Run git -arguments @('push','-u','origin','main')
    Write-Host '推送完成。请在 GitHub Actions 检查部署结果。'
} catch { Write-Host "更新已停止：$_" -ForegroundColor Red; exit 1 }

