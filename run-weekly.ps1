# run-weekly.ps1 - triggers the server-side Weekly Regional Bite Brief send.
#
# Windows Task Scheduler weekly trigger; also safe to run by hand.
# The brief content is generated ON THE SERVER at send time from
# assets/data/species.json, so this script only calls the cron endpoint
# in resumable batches until the week is fully covered.
#
# Logs to logs\weekly-YYYY-Www.log. Returns exit code 0 on success.
# NOTE: keep this file ASCII-only (PS 5.1 misparses UTF-8 punctuation w/o BOM).

$ErrorActionPreference = 'Stop'
$root = 'C:\blueseasfishing'
$stamp = (Get-Date).ToString('o-\WW')
New-Item -ItemType Directory -Force -Path (Join-Path $root 'logs') | Out-Null
$log = Join-Path $root "logs\weekly-$stamp.log"

Start-Transcript -Path $log -Append | Out-Null
try {
  Write-Host "=== Blue Seas weekly bite brief - $stamp ==="

  # setx values don't reach already-running parents; read the user env directly
  if (-not $env:BSF_CRON_KEY) { $env:BSF_CRON_KEY = [Environment]::GetEnvironmentVariable('BSF_CRON_KEY', 'User') }
  if (-not $env:BSF_CRON_KEY) { throw "BSF_CRON_KEY not set (run: setx BSF_CRON_KEY <key>)." }

  $status = Invoke-RestMethod -Uri "https://www.blueseasfishing.com/api/weekly-brief-cron.php?key=$env:BSF_CRON_KEY" -TimeoutSec 60
  Write-Host ("Brief status: {0} subscribers; week {1}; batch size {2}; transport {3}" -f `
    $status.data.subscribers, $status.data.week, $status.data.batch_size, $status.data.transport)

  if ([int]$status.data.subscribers -eq 0) {
    Write-Host "No active brief subscribers - nothing to send."
    exit 0
  }

  # The cron sends in resumable batches and reports complete=true only once
  # every active subscriber is covered. Loop until complete.
  $totalSent = 0; $totalFailed = 0; $batches = 0
  while ($true) {
    $send = Invoke-RestMethod -Method Post -Uri "https://www.blueseasfishing.com/api/weekly-brief-cron.php?key=$env:BSF_CRON_KEY" -TimeoutSec 300
    if (-not $send.ok) { throw "weekly brief cron returned error: $($send.error)" }
    $batches++
    $sent  = [int]$send.data.sent
    $failed = [int]$send.data.failed
    $totalSent += $sent; $totalFailed += $failed
    Write-Host ("  batch {0}: sent={1} failed={2} remaining={3} complete={4}" -f $batches, $sent, $failed, $send.data.remaining, $send.data.complete)
    if ($send.data.complete -or ($sent -eq 0 -and $failed -eq 0)) { break }
    if ($batches -ge 100) { throw "weekly brief send still incomplete after 100 batches - aborting" }
  }
  Write-Host ("Weekly brief send complete: {0} sent, {1} failed, across {2} batch(es)" -f $totalSent, $totalFailed, $batches)
  if ($totalFailed -gt 0) { Write-Host "WARNING: $totalFailed recipient(s) failed - see server cron logs." }
  exit 0
} catch {
  Write-Host "WEEKLY RUN FAILED: $_"
  exit 1
} finally {
  Stop-Transcript | Out-Null
}
