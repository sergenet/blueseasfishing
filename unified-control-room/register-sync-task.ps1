# Register hourly GA4 synchronization task in Windows Task Scheduler
$Action = New-ScheduledTaskAction -Execute "python.exe" -Argument "C:\Projects\BlueSeasFishing-Website\blueseasfishing\unified-control-room\sync-ga4.py" -WorkingDirectory "C:\Projects\BlueSeasFishing-Website\blueseasfishing\unified-control-room"
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName "TrafficControlRoom-GA4Sync" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Syncs GA4 analytics hourly to control.blueseasfishing.com" -Force

Write-Host "Hourly GA4 sync task successfully registered in Windows Task Scheduler!" -ForegroundColor Green
