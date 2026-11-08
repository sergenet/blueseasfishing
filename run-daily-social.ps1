# run-daily-social.ps1 - Blue Seas Fishing Daily Social Auto-Poster
#
# Runs daily via Windows Task Scheduler ('BlueSeas Daily Social Poster').
# Rotates images and MP4 videos from C:\blueseasfishing\Assets\zeely-ads,
# formats multi-platform copy with isolated UTM parameters, dispatches via
# configured webhook or local queue, and updates the campaign tracking logs.
#
# Logs to logs\daily-social-YYYY-MM-DD.log. Returns exit code 0 on success.
# NOTE: keep this file ASCII-only for seamless PS 5.1 compatibility.

$ErrorActionPreference = 'Stop'
$root = 'C:\blueseasfishing'
$stamp = (Get-Date).ToString('yyyy-MM-dd')
New-Item -ItemType Directory -Force -Path (Join-Path $root 'logs') | Out-Null
$log = Join-Path $root "logs\daily-social-$stamp.log"

Start-Transcript -Path $log -Append | Out-Null
try {
  Write-Host "=== Blue Seas Daily Social Poster - $stamp ==="

  # 1) Execute today's scheduled rotation post
  $autoposter = Join-Path $root 'tools\social-autoposter.py'
  & python $autoposter --run-today
  if ($LASTEXITCODE -ne 0) { throw "social-autoposter.py exited with code $LASTEXITCODE" }

  # 2) Refresh the campaign effectiveness report
  $measurer = Join-Path $root 'tools\measure-social-effectiveness.py'
  & python $measurer
  if ($LASTEXITCODE -ne 0) { throw "measure-social-effectiveness.py exited with code $LASTEXITCODE" }

  Write-Host "Daily social rotation run complete for $stamp."
  exit 0
} catch {
  Write-Host "DAILY SOCIAL RUN FAILED: $_"
  exit 1
} finally {
  Stop-Transcript | Out-Null
}
