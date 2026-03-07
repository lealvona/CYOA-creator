@echo off
setlocal EnableDelayedExpansion

:: CYOA Creator Server Setup Script for Windows
:: Interactive setup with error handling

title CYOA Creator Server Setup
color 0F
cls

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║                                                            ║
echo ║         CYOA Creator Server Setup Assistant                ║
echo ║                         (Windows)                          ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo [INFO] This script will help you set up and run the CYOA Creator server.
echo [INFO] It will check prerequisites, install dependencies, and start the server.
echo.
pause
cls

:: Detect Windows version
echo [STEP] Detecting Windows version...
ver | findstr /i "10." > nul
if %errorlevel% == 0 (
    echo [SUCCESS] Windows 10/11 detected
    set "WINDOWS_VERSION=modern"
) else (
    ver | findstr /i "6." > nul
    if %errorlevel% == 0 (
        echo [SUCCESS] Windows 7/8 detected
        set "WINDOWS_VERSION=legacy"
    ) else (
        echo [WARNING] Unknown Windows version
        set "WINDOWS_VERSION=unknown"
    )
)
echo.

:: Check for Node.js
echo [STEP] Checking for Node.js installation...
node --version > nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%a in ('node --version') do set "NODE_VERSION=%%a"
    echo [SUCCESS] Node.js found: !NODE_VERSION!
    
    :: Extract major version number
    set "NODE_MAJOR=!NODE_VERSION:v=~0,2!"
    if !NODE_MAJOR! LSS 18 (
        echo [ERROR] Node.js version !NODE_VERSION! is too old. Need version 18 or higher.
        goto :install_node
    )
) else (
    echo [ERROR] Node.js is not installed!
    goto :install_node
)
goto :check_npm

:install_node
echo.
echo [WARNING] Node.js is required but not found or too old.
echo [INFO] Node.js 18+ is needed to run the server.
echo.
set /p INSTALL_NODE="Would you like to open the Node.js download page? (Y/n): "
if /i "!INSTALL_NODE!"=="n" (
    echo [INFO] Please install Node.js 18+ manually from https://nodejs.org/ and try again.
    pause
    exit /b 1
)

:: Open download page
start https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi
echo.
echo [INFO] A browser window should have opened with the Node.js installer.
echo [INFO] Please download and install it, then run this script again.
echo.
pause
exit /b 1

:check_npm
echo.
echo [STEP] Checking for npm...
npm --version > nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%a in ('npm --version') do set "NPM_VERSION=%%a"
    echo [SUCCESS] npm found: !NPM_VERSION!
) else (
    echo [ERROR] npm not found! It should come with Node.js.
    echo [INFO] Please reinstall Node.js from https://nodejs.org/
    pause
    exit /b 1
)
echo.

:: Check for package.json
echo [STEP] Checking project files...
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo [INFO] Are you in the right directory?
    echo [INFO] Please make sure you're running this script from the CYOA Creator folder.
    pause
    exit /b 1
)
echo [SUCCESS] Project files found
echo.

:: Setup data directory
echo [STEP] Setting up data directory...
if not exist "data" (
    mkdir data\stories 2> nul
    mkdir data\tmp 2> nul
    echo [SUCCESS] Created data directories
) else (
    echo [INFO] Data directory already exists
)
echo.

:: Install dependencies
echo [STEP] Installing project dependencies...
if exist "node_modules" (
    echo [INFO] Dependencies already installed ^(node_modules exists^)
    set /p REINSTALL="Do you want to reinstall/update dependencies? (y/N): "
    if /i "!REINSTALL!"=="y" (
        goto :do_install
    ) else (
        goto :skip_install
    )
)

:do_install
echo [INFO] Running: npm install
echo [INFO] This may take a few minutes...
echo.
npm install
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to install dependencies!
    echo [INFO] Common causes:
    echo   - No internet connection
    echo   - npm registry is down
    echo   - Antivirus blocking npm
    echo.
    echo [INFO] Try running: npm install --verbose
    echo [INFO] To see more details about what went wrong.
    pause
    exit /b 1
)
echo.
echo [SUCCESS] Dependencies installed successfully!

:skip_install
echo.
echo [SUCCESS] Setup complete! Everything is ready to go.
echo.

:: Check if port is in use
netstat -an | findstr ":8787" | findstr "LISTENING" > nul
if %errorlevel% == 0 (
    echo [WARNING] Port 8787 is already in use!
    echo [INFO] Another instance might be running.
    echo.
    set /p KILL_PORT="Do you want to kill the process using port 8787? (y/N): "
    if /i "!KILL_PORT!"=="y" (
        for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8787" ^| findstr "LISTENING"') do (
            taskkill /F /PID %%a 2> nul
            if !errorlevel! == 0 (
                echo [SUCCESS] Killed process on port 8787
            ) else (
                echo [WARNING] Could not kill process. You may need to run as administrator.
            )
        )
    ) else (
        echo [INFO] Please stop the other process first, or use a different port.
        echo [INFO] To use a different port: set PORT=3000 && npm run dev:api
        pause
        exit /b 1
    )
)

:: Ask to start server
set /p START_SERVER="Would you like to start the server now? (Y/n): "
if /i "!START_SERVER!"=="n" (
    echo.
    echo [INFO] You can start the server later by running:
    echo   npm run dev:api
    echo.
    echo [INFO] Or run both frontend and backend together:
    echo   npm run dev:all
    echo.
    pause
    exit /b 0
)

echo.
echo [SUCCESS] Starting server on http://localhost:8787
echo [INFO]
echo [INFO] The server is now running! You can:
echo [INFO]   1. Open your browser to http://localhost:5173 (frontend)
echo [INFO]   2. Use the Android app to upload stories
echo [INFO]
echo [INFO] Press Ctrl+C to stop the server
echo.

:: Start the server
npm run dev:api

:: If we get here, the server stopped
echo.
echo [INFO] Server stopped.
pause
