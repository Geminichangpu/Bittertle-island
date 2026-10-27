$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
function Run {
    param([string]$command, [Parameter(ValueFromRemainingArguments=$true)][string[]]$arguments)
    & $command @arguments
    if ($LASTEXITCODE -ne 0) { throw "$command failed ($LASTEXITCODE)" }
}
try {
    $pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
    $pnpmExe = if ($pnpmCommand) { $pnpmCommand.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd' }
    if (-not (Test-Path -LiteralPath $pnpmExe)) { throw 'pnpm not found. Install Node.js 24 and pnpm, then retry.' }
    Run git @('rev-parse','--is-inside-work-tree')
    if ((& git branch --show-current) -ne 'main') { throw 'Switch to main before updating.' }
    Run git @('remote','get-url','origin')
    Run git @('status','--short')
    Write-Host 'Building viewer from the root layout and building editor...'
    Run $pnpmExe @('build:viewer','--','--use-project-layout')
    Run $pnpmExe @('build')
    Run git @('status','--short')
    Write-Host 'Review changes above. Existing staged files will be included.'
    if ((Read-Host 'Stage all non-ignored changes and continue? Type YES') -cne 'YES') { return }
    Run git @('add','-A')
    Run git @('diff','--cached','--stat')
    $objects = & git ls-files --stage | ForEach-Object { if ($_ -match '^\d+ ([0-9a-f]+) \d+\s') { $Matches[1] } }
    $large = $objects | & git cat-file '--batch-check=%(objectsize) %(objectname)' | Where-Object { ($_ -split ' ')[0] -match '^\d+$' -and [long](($_ -split ' ')[0]) -gt 100MB }
    if ($LASTEXITCODE -ne 0) { throw 'Could not inspect staged Git objects.' }
    if ($large) { throw "Staged Git objects exceed 100 MiB; inspect them and review Git LFS: $large" }
    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 1) {
        $message = Read-Host 'Commit message (empty cancels)'
        if ([string]::IsNullOrWhiteSpace($message)) { return }
        Run git @('commit','-m',$message)
    } elseif ($LASTEXITCODE -ne 0) { throw 'Could not inspect staged changes.' }
    Run git @('fetch','origin')
    & git show-ref --verify --quiet 'refs/remotes/origin/main'
    if ($LASTEXITCODE -eq 0) {
        & git merge-base --is-ancestor origin/main HEAD
        if ($LASTEXITCODE -ne 0) { throw 'Remote main contains changes not in local main. Integrate them manually; no push performed.' }
    } elseif ($LASTEXITCODE -ne 1) { throw 'Could not check remote main.' }
    Write-Host 'Ready to push main to origin (no force).'
    if ((Read-Host 'Type YES to push') -cne 'YES') { return }
    Run git @('push','-u','origin','main')
    Write-Host 'Push completed. Check GitHub Actions for deployment status.'
} catch { Write-Host "Update stopped: $_" -ForegroundColor Red; exit 1 }
