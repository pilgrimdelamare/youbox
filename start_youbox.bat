@echo off
REM Avvio automatico di YouBox backend, dashboard, monitor, voting
cd /d "%~dp0"

echo Avvio Backend...
start "YouBox Backend" cmd /k "npm run start-backend"

timeout /t 2 >nul

echo Avvio Dashboard...
start "YouBox Dashboard" cmd /k "npm run start-dashboard"

timeout /t 2 >nul

echo Avvio Monitor...
start "YouBox Monitor" cmd /k "npm run start-monitor"

timeout /t 2 >nul

echo Avvio Voting...
start "YouBox Voting" cmd /k "npm run start-voting"

echo Tutto avviato! Puoi chiudere questa finestra.
pause
exit