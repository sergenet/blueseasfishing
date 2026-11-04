# register-monthly-task.ps1 — (re)registers the Blue Seas monthly pipeline task
# with catch-up-if-missed enabled. Uses schtasks XML round-trip (works on all
# Windows builds; no dependency on newer PowerShell trigger cmdlets).
#
# Run once: powershell -NoProfile -ExecutionPolicy Bypass -File register-monthly-task.ps1

$ErrorActionPreference = 'Stop'
$taskName = 'BlueSeas Monthly Pipeline'
$taskXml = Join-Path $env:TEMP 'bsf-monthly-task.xml'

# 1) Base task: monthly on the 1st at 06:00.
schtasks /Create /TN $taskName /TR "powershell.exe -NoProfile -ExecutionPolicy Bypass -File C:\blueseasfishing\run-monthly.ps1" /SC MONTHLY /D 1 /ST 06:00 /F | Out-Null
if ($LASTEXITCODE -ne 0) { throw "schtasks create failed" }

# 2) Export the task XML, enable StartWhenAvailable (run ASAP if the machine
#    was asleep/off at 06:00), re-import.
schtasks /Query /TN $taskName /XML | Out-File -FilePath $taskXml -Encoding Unicode
$xml = Get-Content $taskXml -Raw
if ($xml -notmatch '<StartWhenAvailable>') {
  $xml = $xml -replace '<Settings>', "<Settings>`n    <StartWhenAvailable>true</StartWhenAvailable>"
  Set-Content -Path $taskXml -Value $xml -Encoding Unicode
}
schtasks /Create /TN $taskName /XML $taskXml /F | Out-Null
if ($LASTEXITCODE -ne 0) { throw "schtasks re-import failed" }
Remove-Item $taskXml -ErrorAction SilentlyContinue

Write-Host 'Registered: BlueSeas Monthly Pipeline — 1st of each month 06:00, catches up if missed.'
