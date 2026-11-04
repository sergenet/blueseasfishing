# run-monthly.ps1 - the monthly content + distribution pipeline for blueseasfishing.com
#
# Runs the full generator chain (including the 30-page freshness rotation and
# the state-personalized newsletter issues), deploys, pings IndexNow, and
# triggers the server-side newsletter send. Designed to be invoked by the
# Windows Task Scheduler monthly trigger; also safe to run by hand.
#
# Optional args:
#   -SkipDeploy     build + verify only, no upload
#   -SkipNewsletter build + deploy + ping, but no newsletter send
#
# Logs to logs\monthly-YYYY-MM.log. Returns exit code 0 on success.
# NOTE: keep this file ASCII-only (PS 5.1 misparses UTF-8 punctuation w/o BOM).

param(
  [switch]$SkipDeploy,
  [switch]$SkipNewsletter
)

$ErrorActionPreference = 'Stop'
$root = 'C:\blueseasfishing'
$site = Join-Path $root 'blueseas-fishing-working-website\blueseasfishing.com'
$stamp = (Get-Date).ToString('yyyy-MM')
New-Item -ItemType Directory -Force -Path (Join-Path $root 'logs') | Out-Null
$log = Join-Path $root "logs\monthly-$stamp.log"

Start-Transcript -Path $log -Append | Out-Null
try {
  Write-Host "=== Blue Seas monthly pipeline - $stamp ==="

  # 1) Content pipeline (generators + sitemap + verify-seo; verify failure aborts)
  Push-Location $site
  try {
    node tools/monthly-pipeline.mjs
    if ($LASTEXITCODE -ne 0) { throw "pipeline failed (verify-seo gate)" }
  } finally { Pop-Location }

  if (-not $SkipDeploy) {
    # 2) Deploy web root (zips locally, uploads, unzips server-side)
    Push-Location $root
    try {
      python deploy-zip.py --skip-images --skip-verify
      if ($LASTEXITCODE -ne 0) { throw "deploy failed" }
    } finally { Pop-Location }

    # 3) Upload the newsletter issue bundle + newsletter PHP endpoints
    #    (must exist at webroot/newsletter-issues/<stamp>/ for the PHP cron;
    #    HTTP access to that path is blocked in .htaccess).
    Push-Location $root
    try {
      python .\upload-newsletter-issues.py
      if ($LASTEXITCODE -ne 0) { throw "newsletter issue upload failed" }
    } finally { Pop-Location }

    # 4) IndexNow: ping the updated sitemap so new/refreshed URLs get crawled fast
    Push-Location $root
    try {
      powershell -NoProfile -ExecutionPolicy Bypass -File .\submit-indexnow.ps1
      # non-fatal: IndexNow hiccups shouldn't fail the run
    } finally { Pop-Location }
  }

  # 5) Newsletter send (server-side cron; resumable batches, send-once per month)
  if (-not $SkipNewsletter) {
    # setx values don't reach already-running parents; read the user env directly
    if (-not $env:BSF_CRON_KEY) { $env:BSF_CRON_KEY = [Environment]::GetEnvironmentVariable('BSF_CRON_KEY', 'User') }
    if (-not $env:BSF_CRON_KEY) { throw "BSF_CRON_KEY not set (run: setx BSF_CRON_KEY <key>)." }
    $status = Invoke-RestMethod -Uri "https://www.blueseasfishing.com/api/newsletter-cron.php?key=$env:BSF_CRON_KEY" -TimeoutSec 60
    Write-Host ("Newsletter cron status: {0} subscribers; issues uploaded: {1}; send mode: {2}" -f $status.data.subscribers, $status.data.issues_uploaded, $status.data.send_mode)
    if (-not $status.data.issues_uploaded) {
      Write-Host "WARNING: issue bundle for this month is not on the server - skipping the send."
    } else {
      # The cron sends in resumable batches (one POST = up to NEWSLETTER_BATCH
      # recipients) and reports complete=true only once no subscribers remain
      # past its cursor. A single POST would silently cap the send at one batch
      # and leave the rest of the list un-mailed, so loop until it is complete.
      $totalSent = 0; $totalFailed = 0; $batches = 0
      while ($true) {
        $send = Invoke-RestMethod -Method Post -Uri "https://www.blueseasfishing.com/api/newsletter-cron.php?key=$env:BSF_CRON_KEY" -TimeoutSec 300
        if (-not $send.ok) { throw "newsletter cron returned error: $($send.error)" }
        $batches++
        $sent  = [int]$send.data.sent
        $failed = [int]$send.data.failed
        $totalSent += $sent; $totalFailed += $failed
        Write-Host ("  batch {0}: sent={1} failed={2} remaining={3} complete={4}" -f $batches, $sent, $failed, $send.data.remaining, $send.data.complete)
        # stop when the server says the month is fully covered, or when a batch
        # made no progress (guards against an endless loop on a stuck cursor)
        if ($send.data.complete -or ($sent -eq 0 -and $failed -eq 0)) { break }
        if ($batches -ge 200) { throw "newsletter send still incomplete after 200 batches - aborting" }
      }
      Write-Host ("Newsletter send complete: {0} sent, {1} failed, across {2} batch(es)" -f $totalSent, $totalFailed, $batches)
      if ($totalFailed -gt 0) { Write-Host "WARNING: $totalFailed recipient(s) failed to send - see cron logs." }
    }
  }

  # 6) Self-check watchdog: verifies DB, subscriber count, issue bundle and
  #    the Node API; emails contact@blueseasfishing.com if anything is wrong.
  #    A failure here sets exit code 1 (Task Scheduler shows Last Run Failed)
  #    but does NOT undo the successful pipeline/send above.
  try {
    $sc = Invoke-RestMethod -Uri "https://www.blueseasfishing.com/api/selfcheck.php?key=$env:BSF_CRON_KEY" -TimeoutSec 60
    Write-Host ("Self-check: {0} (api: {1}, mode: {2})" -f $sc.status, $sc.data.api, $sc.data.send_mode)
  } catch {
    Write-Host "SELF-CHECK FAILED - alert email sent to contact@blueseasfishing.com"
    exit 1
  }

  Write-Host "=== Monthly run complete ==="
  exit 0
} catch {
  Write-Host "MONTHLY RUN FAILED: $_"
  exit 1
} finally {
  Stop-Transcript | Out-Null
}
