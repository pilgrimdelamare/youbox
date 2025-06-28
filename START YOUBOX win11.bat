@echo off
REM Avvio automatico di YouBox backend, dashboard, monitor, voting in schede della stessa finestra

setlocal
set DIR=%~dp0

REM Rimuove eventuale backslash finale
if "%DIR:~-1%"=="\" set DIR=%DIR:~0,-1%

wt ^
new-tab cmd /k "title YouBox Backend && cd /d \"%DIR%\" && npm run start-backend" ; ^
new-tab cmd /k "title YouBox Dashboard && cd /d \"%DIR%\" && npm run start-dashboard" ; ^
new-tab cmd /k "title YouBox Monitor && cd /d \"%DIR%\" && npm run start-monitor" ; ^
new-tab cmd /k "title YouBox Voting && cd /d \"%DIR%\" && npm run start-voting"

echo Tutto avviato in schede separate di Windows Terminal!
pause
exit
