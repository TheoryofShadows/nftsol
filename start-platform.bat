@echo off
echo 🚀 Starting NFTSol Platform...

echo Starting backend...
cd apps\backend
start "Backend" cmd /k "npm run dev"

timeout /t 5 /nobreak > nul

echo Starting frontend...
cd ..\client
start "Frontend" cmd /k "npm run dev"

echo ✅ Platform started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Close the command windows to stop the services
pause
