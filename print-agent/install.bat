@echo off
REM FlavorHub Print Agent installer for Windows.
REM Right-click -> "Run as administrator" (needed for auto-start setup).
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Download the LTS version from https://nodejs.org
  echo install it, then run this file again.
  pause
  exit /b 1
)

if not exist .env (
  copy .env.example .env >nul
  echo A new .env file was created and will now open in Notepad.
  echo Fill in SERVER_URL, BRANCH_ID and AGENT_KEY, save, close Notepad,
  echo then run this installer again.
  notepad .env
  pause
  exit /b 1
)

echo Installing dependencies...
call npm install
if errorlevel 1 ( echo npm install failed & pause & exit /b 1 )

echo Installing pm2 (auto-start manager)...
call npm install -g pm2 pm2-windows-startup
if errorlevel 1 ( echo pm2 install failed & pause & exit /b 1 )

call pm2-startup install
call pm2 delete flavorhub-print-agent >nul 2>nul
call pm2 start agent.js --name flavorhub-print-agent
call pm2 save

echo.
echo ================================================================
echo  Done! The print agent is running and will start automatically
echo  every time this PC is turned on and logged in.
echo  Check the dashboard: Settings -^> Printer -^> "Print agent online"
echo ================================================================
pause
