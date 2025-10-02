@echo off
echo ========================================
echo   Crisp Interview Assistant Setup
echo ========================================
echo.

echo Checking Node.js installation...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo Installing backend dependencies...
cd backend
call npm install --legacy-peer-deps

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Follow MONGODB_SETUP_GUIDE.md to set up MongoDB
echo 2. Update backend/.env with your MongoDB connection string
echo 3. Run 'start.bat' to launch the application
echo.
pause
