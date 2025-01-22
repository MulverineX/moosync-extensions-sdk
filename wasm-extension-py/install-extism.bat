@REM @echo off
set USERHOME="../"
setlocal enabledelayedexpansion

REM Define variables
set "BINARYEN_DIR=.\binaryen"
set "BINARYEN_ZIP=.\binaryen.tar.gz"
set "GITHUB_API=https://api.github.com/repos/WebAssembly/binaryen/releases/latest"
set "TEMP_JSON=.\binaryen_release_info.json"

REM Check if curl is available
where curl >nul 2>&1
if errorlevel 1 (
    echo curl is not installed. Please install curl to proceed.
    exit /b 1
)

REM Fetch the latest release information using curl
echo Fetching the latest Binaryen release information...
curl -s %GITHUB_API% -o "%TEMP_JSON%"
if errorlevel 1 (
    echo Failed to retrieve the release information. Exiting.
    exit /b 1
)

REM Initialize BINARYEN_URL
set "BINARYEN_URL="

REM Extract the download URL for the Windows release
for /f "tokens=*" %%i in (%TEMP_JSON%) do (
    set "line=%%i"
    echo !line! | findstr /i "browser_download_url" >nul
    if not errorlevel 1 (
        echo !line! | findstr /i "x86_64-windows" >nul
        if not errorlevel 1 (
            set "BINARYEN_URL=!line!"
            goto :found_url
        )
    )
)

:found_url
REM Clean up the extracted URL
if defined BINARYEN_URL (
    set "BINARYEN_URL=!BINARYEN_URL:*\https://=https://!"
    set "BINARYEN_URL=!BINARYEN_URL:~0,-1!"
    set "BINARYEN_URL=!BINARYEN_URL:"browser_download_url": "=!"
    set "BINARYEN_URL=!BINARYEN_URL:"=!"
) else (
    echo Failed to find the download URL for the Windows release. Exiting.
    exit /b 1
)

REM Download the latest Binaryen release
echo Downloading Binaryen from %BINARYEN_URL%...
curl -L -o "%BINARYEN_ZIP%" "%BINARYEN_URL%"
if errorlevel 1 (
    echo Failed to download Binaryen. Exiting.
    exit /b 1
)

REM Create the Binaryen directory
if not exist "%BINARYEN_DIR%" (
    mkdir "%BINARYEN_DIR%"
    if errorlevel 1 (
        echo Failed to create directory %BINARYEN_DIR%. Exiting.
        exit /b 1
    )
)

tar -xvf "%BINARYEN_ZIP%" -C "%BINARYEN_DIR%" --strip-components=1
if errorlevel 1 (
    echo Failed to extract Binaryen tar.gz. Exiting.
    exit /b 1
)

REM Delete the downloaded ZIP file
del "%BINARYEN_ZIP%"

REM Update the system PATH
setx PATH "%BINARYEN_DIR%\bin;%PATH%"
if errorlevel 1 (
    echo Failed to update the system PATH. Please add %BINARYEN_DIR%\bin to your PATH manually.
    exit /b 1
)

echo Binaryen tools have been successfully installed to %BINARYEN_DIR%.
echo Please restart your command prompt or computer to apply the PATH changes.

REM Clean up temporary JSON file
del "%TEMP_JSON%"

endlocal

rustc --version >nul 2>&1
if errorlevel 1 (
    echo Rust is not installed. Installing Rust...
    curl --proto '=https' --tlsv1.2 -sSf https://static.rust-lang.org/rustup/dist/i686-pc-windows-gnu/rustup-init.exe -o rustup-init.exe
    if errorlevel 1 (
        echo Failed to download Rust installer. Exiting.
        exit /b 1
    )
    rustup-init.exe -y --quiet
    if errorlevel 1 (
        echo Failed to install Rust. Exiting.
        exit /b 1
    )
    del rustup-init.exe
    echo Rust installed successfully. Ensure the PATH is updated.
    set PATH=%USERPROFILE%\.cargo\bin;%PATH%
) else (
    echo Rust is already installed. Proceeding...
)

echo Adding required Rust targets...
rustup target add wasm32-wasi --toolchain stable
if errorlevel 1 (
    echo Failed to add target wasm32-wasi. Exiting.
    exit /b 1
)

rustup target add wasm32-wasip1 --toolchain stable
if errorlevel 1 (
    echo Failed to add target wasm32-wasip1. Exiting.
    exit /b 1
)

git clone https://github.com/extism/python-pdk

cd python-pdk || exit /b 1

python build.py build

move /Y bin\target\release\extism-py.exe ..\extism-py.exe
if errorlevel 1 (
    echo Failed to move extism-py. Exiting.
    exit /b 1
)

move /Y lib\target\wasm32-wasi\wasi-deps ..\
if errorlevel 1 (
    echo Failed to move wasi-deps. Exiting.
    exit /b 1
)

rmdir /S /Q python-pdk
if errorlevel 1 (
    echo Failed to remove python-pdk directory. Exiting.
    exit /b 1
)

cd .. || exit /b 1

echo Script completed successfully.
