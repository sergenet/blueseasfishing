@echo off
REM Blue Seas Fishing - Social Campaign Control Room Launcher
cd /d "C:\blueseasfishing"

REM Refresh campaign data
python -c "import json; sched = json.load(open(r'tools\campaign-30day-schedule.json', encoding='utf-8')); state = {}; (lambda: state.update(json.load(open(r'logs\social-campaign\campaign-state.json', encoding='utf-8'))))() if __import__('os').path.exists(r'logs\social-campaign\campaign-state.json') else None; open(r'control-room\campaign-data.js', 'w', encoding='utf-8').write(f'window.CAMPAIGN_DATA = {json.dumps(sched, indent=2)};\nwindow.CAMPAIGN_STATE = {json.dumps(state, indent=2)};\n')" >nul 2>&1

REM Launch in default browser
start "" "C:\blueseasfishing\control-room\index.html"
