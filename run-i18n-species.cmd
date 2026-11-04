@echo off
REM Resumable species re-mirror. Safe to re-run: pages already rebuilt are
REM skipped via tools/i18n/manifest.json, and translated strings are cached in
REM tools/i18n/cache/<locale>.json.
cd /d "C:\Projects\BlueSeasFishing-Website\blueseasfishing\blueseas-fishing-working-website\blueseasfishing.com"
echo ==== run started %DATE% %TIME% ==== >> i18n-species-run.log
node tools/i18n/build.mjs --only species/ >> i18n-species-run.log 2>&1
echo ==== DONE exit=%ERRORLEVEL% %DATE% %TIME% ==== >> i18n-species-run.log
