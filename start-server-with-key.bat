@echo off
REM This script sets the BUBBLEGUM_PRIVATE_KEY environment variable and starts the server
REM IMPORTANT: Set your actual private key in the environment variable below
REM You can also set it in your system environment variables or .env file

REM Check if BUBBLEGUM_PRIVATE_KEY is already set
if "%BUBBLEGUM_PRIVATE_KEY%"=="" (
    echo Warning: BUBBLEGUM_PRIVATE_KEY not set in environment
    echo Please set BUBBLEGUM_PRIVATE_KEY in your environment or .env file
    echo Example: set BUBBLEGUM_PRIVATE_KEY=your_base58_private_key_here
    pause
    exit /b 1
)

cd apps\backend
npm run dev
