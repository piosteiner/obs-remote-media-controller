@echo off
echo ========================================
echo OBS Remote Media Controller - Frontend
echo ========================================
echo.
echo NOTE: Backend runs on cloud server
echo       obs-media-control.piogino.ch
echo.

REM Check if node_modules exists in frontend
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

echo.
echo ========================================
echo Starting Frontend...
echo ========================================
echo.
echo Frontend: http://localhost:5173
echo Control Panel: http://localhost:5173/control
echo OBS Display: http://localhost:5173/display?slot=1
echo.
echo Backend API: https://obs-media-control.piogino.ch
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start frontend
cd frontend
npm run dev
