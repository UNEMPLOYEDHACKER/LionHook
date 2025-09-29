@echo off
chcp 65001 >nul
title LionHook V1 - Windows Starter

:: Colors using ANSI escape codes
echo.
echo [33m
echo ██║       ██╗ ██████╗ ███╗   ██╗██╗  ██╗ ██████╗  ██████╗ ██╗  ██╗
echo ██║       ██║██╔═══██╗████╗  ██║██║  ██║██╔═══██╗██╔═══██╗██║ ██╔╝
echo ██║       ██║██║   ██║██╔██╗ ██║███████║██║   ██║██║   ██║█████╔╝ 
echo ██║       ██║██║   ██║██║╚██╗██║██╔══██║██║   ██║██║   ██║██╔═██╗ 
echo ██████   ██║╚██████╔╝██║ ╚████║██║  ██║╚██████╔╝╚██████╔╝██║  ██╗
echo╚═════╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
echo.
echo [36m           LionHook V1 - Windows Starter
echo [32m         Developer: https://t.me/Akhand_Aryavart
echo [34m=================================================
echo [0m

:: Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo [31m❌ Python not found![0m
    echo [33mPlease install Python from:[0m
    echo [36mhttps://www.python.org/downloads/[0m
    echo.
    echo [33mDuring installation:[0m
    echo • Check "Add Python to PATH"
    echo • Install pip
    echo.
    pause
    exit /b 1
)

:: Check if OpenSSL is installed
openssl version >nul 2>&1
if errorlevel 1 (
    echo [33m[!] OpenSSL not found[0m
    echo [33mPlease install OpenSSL from:[0m
    echo [36mhttps://slproweb.com/products/Win32OpenSSL.html[0m
    echo.
    echo [33mDownload the Win64 OpenSSL v1.1.1+ Light version[0m
    echo.
    pause
    exit /b 1
)

:: Install Python packages
echo [34m[*] Installing Python packages...[0m
pip install flask flask-sslify pyopenssl >nul 2>&1
if errorlevel 1 (
    echo [31m[❌] Failed to install Python packages[0m
    echo [33mTry: pip install flask flask-sslify pyopenssl[0m
    pause
    exit /b 1
)
echo [32m[✅] Python packages installed[0m

:: Generate SSL certificate if not exists
if not exist "cert.pem" (
    echo [33m[!] Generating SSL certificate...[0m
    openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" >nul 2>&1
    if errorlevel 1 (
        echo [31m[❌] Failed to generate SSL certificate[0m
        pause
        exit /b 1
    )
    echo [32m[✅] SSL certificate generated[0m
) else (
    echo [32m[✅] SSL certificate found[0m
)

:: Create directories
mkdir templates static data\devices >nul 2>&1
echo [32m[✅] Directory structure created[0m

:: Get local IP address
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do (
    set "ip=%%i"
    goto :display_info
)

:display_info
setlocal enabledelayedexpansion
set "ip=!ip:~1!"
if "!ip!"=="" set "ip=127.0.0.1"

echo.
echo [32m🚀 LionHook V1 Ready![0m
echo [36m🪟 Access URLs:[0m
echo   • [32mLocal:[0m    https://localhost:5000
echo   • [32mNetwork:[0m  https://!ip!:5000
echo.
echo [33m🔐 Default Credentials:[0m
echo   Username: [36mONDORK[0m
echo   Password: [36mONDORK[0m
echo.
echo [34m💡 Windows Tips:[0m
echo   • Allow through Windows Defender Firewall if prompted
echo   • For WAN access: Forward port 5000 on your router
echo   • Use your public IP for external access
echo.
echo [31m⚠️  Legal: Use responsibly and ethically[0m
echo [34m=================================================[0m
echo.

:: Check if main.py exists
if not exist "main.py" (
    echo [31m❌ main.py not found![0m
    echo [33mPlease run this script from LionHook directory[0m
    pause
    exit /b 1
)

:: Start the application
echo [32mStarting LionHook server...[0m
echo [33mPress Ctrl+C to stop the server[0m
echo.
python main.py
