# register-daily-social-task.ps1 - Registers the Blue Seas Daily Social Poster task
# with catch-up-if-missed enabled. Uses schtasks XML round-trip (works on all
# Windows builds; no dependency on newer PowerShell trigger cmdlets).
#
# Run once: powershell -NoProfile -ExecutionPolicy Bypass -File register-daily-social-task.ps1

$ErrorActionPreference = 'Stop'
$taskName = 'BlueSeas Daily Social Poster'
$taskXml = Join-Path $env:TEMP 'bsf-daily-social-task.xml'

# 1) Base task: daily at 08:30 AM
schtasks /Create /TN $taskName /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\blueseasfishing\run-daily-social.ps1" /SC DAILY /ST 08:30 /F | Out-Null
if ($LASTEXITCODE -ne 0) { throw "schtasks create failed" }

# 2) Export the task XML, enable StartWhenAvailable (run ASAP if machine was asleep/off), re-import
schtasks /Query /TN $taskName /XML | Out-File -FilePath $taskXml -Encoding Unicode
$xml = Get-Content $taskXml -Raw
if ($xml -notmatch '<StartWhenAvailable>') {
  $xml = $xml -replace '<Settings>', "<Settings>`n    <StartWhenAvailable>true</StartWhenAvailable>"
  Set-Content -Path $taskXml -Value $xml -Encoding Unicode
}
schtasks /Create /TN $taskName /XML $taskXml /F | Out-Null
if ($LASTEXITCODE -ne 0) { throw "schtasks re-import failed" }
Remove-Item $taskXml -ErrorAction SilentlyContinue

Write-Host 'Registered: BlueSeas Daily Social Poster - Daily at 08:30 AM, catches up if missed.'
