#!/bin/bash
# User-configurable variables - modify as needed
USER="${USER}"
USER_EMAIL="${USER}@${COMPANY_DOMAIN:-example.com}"
COMPANY_NAME="${COMPANY_NAME:-Your Company}"
COMPANY_DOMAIN="${COMPANY_DOMAIN:-example.com}"


# Builder WebUI GUI Launcher with Environment Setup
# This script sets up the proper environment and launches the GUI app

# Set environment variables to suppress fontconfig warnings
export FONTCONFIG_FILE=/dev/null
export FONTCONFIG_PATH=/usr/share/fontconfig

# Set display and GUI variables
export DISPLAY=${DISPLAY:-:0}

# Suppress various GUI-related warnings
export PYTHONWARNINGS="ignore:Unverified HTTPS request"
export PYTHONHASHSEED=0

# Change to the script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if Python GUI dependencies are available
if ! /bin/python -c "import tkinter" 2>/dev/null; then
    echo "Error: tkinter not available. Please install python3-tkinter:"
    echo "sudo dnf install python3-tkinter"
    exit 1
fi

if ! /bin/python -c "import requests" 2>/dev/null; then
    echo "Error: requests module not available. Installing..."
    /bin/python -m pip install --user requests
fi

echo "Starting Builder WebUI GUI Application..."

# Launch the Python GUI app with error suppression
exec /bin/python builder_webui_app.py 2>/dev/null
