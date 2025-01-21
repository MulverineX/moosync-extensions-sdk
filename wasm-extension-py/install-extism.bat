@REM @echo off

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
if errorlevel 1 (
    echo Failed to clone the repository. Exiting.
    exit /b 1
)

cd python-pdk || exit /b 1

python build.py build
if errorlevel 1 (
    echo Build failed. Exiting.
    exit /b 1
)

move /Y bin\target\release\extism-py ..\extism-py
if errorlevel 1 (
    echo Failed to move extism-py. Exiting.
    exit /b 1
)

move /Y lib\target\wasm32-wasi\wasi-deps ..\
if errorlevel 1 (
    echo Failed to move wasi-deps. Exiting.
    exit /b 1
)

cd .. || exit /b 1

rmdir /S /Q python-pdk
if errorlevel 1 (
    echo Failed to remove python-pdk directory. Exiting.
    exit /b 1
)

echo Script completed successfully.
