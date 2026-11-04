@echo off
title Blue Seas Fishing - send outreach emails
cd /d "C:\Projects\BlueSeasFishing-Website\blueseasfishing"

echo.
echo ======================================================
echo    BLUE SEAS FISHING - send the 2 outreach emails
echo ======================================================
echo.
echo STEP 1 of 2: Here are the 2 emails that will be sent.
echo Read them carefully. Nothing has been sent yet.
echo.
python send-outreach.py
if errorlevel 1 goto problem

echo.
echo ------------------------------------------------------
echo STEP 2 of 2: Did the 2 emails above look correct?
echo.
echo    Press ANY key to SEND them now.
echo    Close this window with the X instead to send nothing.
echo.
pause >nul
python send-outreach.py --send
echo.
echo If you see "OK - accepted by server" above, the emails are
echo sent and the tracker updated automatically.
echo.
echo REMINDER: the X-Head Fishing Charters pitch still needs the
echo contact form filled by hand:
echo https://www.xheadfishingcharters.com/contact
echo.
echo This window closes in 20 seconds.
ping -n 21 127.0.0.1 >nul
exit

:problem
echo.
echo ======================================================
echo SOMETHING WENT WRONG - nothing was sent.
echo ======================================================
echo.
echo The message above tells you what to fix. The usual cause:
echo the password in mail_creds.py is missing or wrong.
echo Remember: it is the EMAIL password for contact@blueseasfishing.com
echo (set in cPanel > Email Accounts), not your Namecheap password.
echo.
echo This window stays open for 45 seconds so you can read it.
ping -n 46 127.0.0.1 >nul
exit
