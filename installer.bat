@echo off
setlocal

REM Define the path to the repository and virtual environment
set "repo_url=https://github.com/Lychan23/Ly.JSxPY.git"
set "repo_dir=Ly.JSxPY"
set "venv_dir=deps"

REM Clone the repo
echo Cloning repository...
git clone %repo_url%
if %errorlevel% neq 0 (
    echo Failed to clone the repository.
    exit /b 1
)

REM Change directory
cd %repo_dir%
if %errorlevel% neq 0 (
    echo Failed to change directory.
    exit /b 1
)

REM Check for Python presence
echo Checking for Python installation...
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Please install Python.
    exit /b 1
)

REM Check for Node.js presence
echo Checking for Node.js installation...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js.
    exit /b 1
)

REM Set up Python virtual environment
echo Setting up Python virtual environment...
python -m venv %venv_dir%
if %errorlevel% neq 0 (
    echo Failed to create Python virtual environment.
    exit /b 1
)

REM Activate virtual environment and install Python dependencies
echo Activating virtual environment and installing Python dependencies...
call %venv_dir%\Scripts\activate
if %errorlevel% neq 0 (
    echo Failed to activate virtual environment.
    exit /b 1
)
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Failed to install Python dependencies.
    exit /b 1
)

REM Install npm dependencies
echo Installing npm dependencies...
npm install
if %errorlevel% neq 0 (
    echo Failed to install npm dependencies.
    exit /b 1
)

echo Installation completed successfully.
endlocal
pause
