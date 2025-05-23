#!/bin/bash

#Adapted from https://github.com/extism/python-pdk/blob/main/install.sh
if [[ -z "${GITHUB_TOKEN}" ]]; then
  GITHUB_FLAGS=()
else
  GITHUB_FLAGS=('--header' "Authorization: Bearer $GITHUB_TOKEN" '--header' 'X-GitHub-Api-Version: 2022-11-28')
fi

set -eou pipefail

# Get the latest release
RELEASE_API_URL="https://api.github.com/repos/extism/python-pdk/releases/latest"
if [[ ${#GITHUB_FLAGS[@]} -eq 0 ]]; then
  response=$(curl -s "$RELEASE_API_URL")
else
  response=$(curl "${GITHUB_FLAGS[@]}" -s "$RELEASE_API_URL")
fi
if [ -z "$response" ]; then
    echo "Error: Failed to fetch the latest release from GitHub API."
    exit 1
fi

# try to parse tag
LATEST_TAG=$(echo "$response" | grep -m 1 '"tag_name":' | sed -E 's/.*"tag_name": *"([^"]+)".*/\1/')

if [ -z "$LATEST_TAG" ]; then
    echo "Error: Could not find the latest release tag."
    exit 1
fi

echo "Installing extism-py release with tag: $LATEST_TAG"

USER_DATA_DIR='./wasi-deps'
OS=''
case `uname` in
  Darwin*)  
    OS="macos" ;;
    # USER_DATA_DIR="$HOME/Library/Application Support" ;;
  Linux*)
    OS="linux" ;;
    # USER_DATA_DIR="$HOME/.local/share" ;;
  *)        echo "unknown os: $OSTYPE" && exit 1 ;;
esac

ARCH=`uname -m`
case "$ARCH" in
  ix86*|x86_64*)    ARCH="x86_64" ;;
  arm64*|aarch64*)  ARCH="aarch64" ;;
  *)                echo "unknown arch: $ARCH" && exit 1 ;;
esac

BINARYEN_TAG="version_116"
DOWNLOAD_URL="https://github.com/extism/python-pdk/releases/download/$LATEST_TAG/extism-py-$ARCH-$OS-$LATEST_TAG.tar.gz"

# Function to check if a directory is in PATH and writable
is_valid_install_dir() {
  [[ ":$PATH:" == *":$1:"* ]] && [ -w "$1" ]
}

INSTALL_DIR="./"
USE_SUDO=""

# Check for common user-writable directories in PATH
# for dir in "$HOME/bin" "$HOME/.local/bin" "$HOME/.bin"; do
#   if is_valid_install_dir "$dir"; then
#     INSTALL_DIR="$dir"
#     break
#   fi
# done

# If no user-writable directory found, use system directory
# if [ -z "$INSTALL_DIR" ]; then
#   INSTALL_DIR="/usr/local/bin"
#   USE_SUDO=1
# fi

echo "Checking for binaryen..."

if ! which "wasm-merge" > /dev/null || ! which "wasm-opt" > /dev/null; then
  echo "Missing binaryen tool(s)"

  # binaryen use arm64 instead where as extism-py uses aarch64 for release file naming
  case "$ARCH" in
    aarch64*)  ARCH="arm64" ;;
  esac

  # matches the case where the user installs extism-pdk in a Linux-based Docker image running on mac m1
  # binaryen didn't have arm64 release file for linux 
  if [ $ARCH = "arm64" ] && [ $OS = "linux" ]; then
    ARCH="x86_64"
  fi

  if [ $OS = "macos" ]; then
    echo "Installing binaryen and wasm-merge using homebrew"
    brew install binaryen
  else
    if [ ! -e "binaryen-$BINARYEN_TAG-$ARCH-$OS.tar.gz" ]; then
      echo 'Downloading binaryen...'
      curl -L -O "https://github.com/WebAssembly/binaryen/releases/download/$BINARYEN_TAG/binaryen-$BINARYEN_TAG-$ARCH-$OS.tar.gz"
    fi
    rm -rf 'binaryen' "binaryen-$BINARYEN_TAG"
    tar xf "binaryen-$BINARYEN_TAG-$ARCH-$OS.tar.gz"
    mv "binaryen-$BINARYEN_TAG"/ binaryen/
    sudo mkdir -p /usr/local/binaryen
    if ! which 'wasm-merge' > /dev/null; then
      echo "Installing wasm-merge..."
      rm -f /usr/local/binaryen/wasm-merge
      sudo mv binaryen/bin/wasm-merge /usr/local/binaryen/wasm-merge
      sudo ln -s /usr/local/binaryen/wasm-merge /usr/local/bin/wasm-merge
    else
      echo "wasm-merge is already installed"
    fi
    if ! which 'wasm-opt' > /dev/null; then
      echo "Installing wasm-opt..."
      rm -f /usr/local/bin/wasm-opt
      sudo mv binaryen/bin/wasm-opt /usr/local/binaryen/wasm-opt
      sudo ln -s /usr/local/binaryen/wasm-opt /usr/local/bin/wasm-opt
    else
      echo "wasm-opt is already installed"
    fi
  fi
else
  echo "binaryen tools are already installed"
fi

TARGET="$INSTALL_DIR/extism-py"
echo "Downloading extism-py from: $DOWNLOAD_URL"

if curl -fsSL --output /tmp/extism-py.tar.gz "$DOWNLOAD_URL"; then
  tar xzf /tmp/extism-py.tar.gz -C /tmp
  rm -rf "$USER_DATA_DIR"
#   mkdir -p "$USER_DATA_DIR"

  if [ "$USE_SUDO" = "1" ]; then
    echo "No user-writable bin directory found in PATH. Using sudo to install in $INSTALL_DIR"
    sudo mv /tmp/extism-py/bin/extism-py "$TARGET"
    mv /tmp/extism-py/share/extism-py "$USER_DATA_DIR"
  else
    mv /tmp/extism-py/bin/extism-py "$TARGET"
    mv /tmp/extism-py/share/extism-py "$USER_DATA_DIR"
  fi
  chmod +x "$TARGET"

  echo "Successfully installed extism-py to $TARGET"
else
  echo "Failed to download or install extism-py. Curl exit code: $?"
  exit
fi

# Warn the user if the chosen path is not in the path
if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
  echo "Note: $INSTALL_DIR is not in your PATH. You may need to add it to your PATH or use the full path to run extism-py."
fi

echo "Installation complete. Try to run 'extism-py --version' to ensure it was correctly installed."

