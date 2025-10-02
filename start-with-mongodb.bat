@echo off
REM Quick Start Script for Crisp Interview Assistant with MongoDB

echo ========================================
echo  Crisp Interview Assistant
echo  MongoDB Atlas + Email Authentication
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking MongoDB connection...
cd backend
node test-mongodb-connection.js
if %errorlevel% neq 0 (
    echo.
    echo Error: MongoDB connection failed!
    echo Please check MONGODB_EMAIL_AUTH_SETUP.md for troubleshooting
    pause
    exit /b 1
)

echo.
echo [2/4] Installing backend dependencies...
if not exist "node_modules\" (
    call npm install
)

echo.
echo [3/4] Starting backend server...
start "Crisp Backend" cmd /k "npm run dev"

echo.
echo [4/4] Starting frontend...
cd ..
start "Crisp Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo  Servers Starting...
echo ========================================
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:5173
echo ========================================
echo.
echo Press any key to open the application...
pause >nul

start http://localhost:5173

echo.
echo Application is running!
echo Close this window to stop the servers.
echo.
pause
