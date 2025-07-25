#!/bin/bash
bj#!/usr/bin/env bash
# EE-DE_Builder_WebUI_setup.sh
# Sets up UI environment for EE/DE_Builder_WebUI on Fedora/RHEL
# Logs all output to /var/log/EE-DE_Builder_WebUI.log

set -euo pipefail

LOG="/var/log/EE-DE_Builder_WebUI.log"

# Ensure log file exists and is writable by this user
if [ ! -f "$LOG" ]; then
  sudo mkdir -p "$(dirname $LOG)"
  sudo touch "$LOG"
  sudo chown "$USER":"$USER" "$LOG"
fi

# Redirect all output into the log
exec > >(tee -a "$LOG") 2>&1

log()   { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
fail()  { log "ERROR: $*"; exit 1; }

log "=== Starting EE-DE_Builder_WebUI setup ==="

# 1. Must not run as root
if [ "$(id -u)" -eq 0 ]; then
  fail "Please run as regular user (not root)."
fi

# 2. Check internet connectivity
if ! ping -c1 -W2 8.8.8.8 &>/dev/null; then
  fail "No network: cannot reach 8.8.8.8."
fi
log "Network ok."

# 3. Check sudo privilege
if ! sudo -v &>/dev/null; then
  fail "User lacks sudo privileges."
fi
log "Sudo check passed."

# 4. Ensure user in wheel group
if ! id -nG "$USER" | grep -qw wheel; then
  log "User not in wheel group; adding..."
  sudo usermod -aG wheel "$USER"
  log "Added to wheel. Please log out and back in, then rerun."
  exit 0
fi
log "Wheel group check passed."

# 5. OS check
OS_ID=$(grep -E '^ID=' /etc/os-release | cut -d= -f2 | tr -d '"')
if [[ ! "$OS_ID" =~ ^(fedora|rhel)$ ]]; then
  fail "Unsupported OS: $OS_ID. Must be Fedora or RHEL."
fi
log "OS is $OS_ID."

# 6. DNF/YUM repo check
if ! sudo dnf repolist &>/dev/null; then
  fail "Cannot access dnf repositories."
fi
log "DNF repos reachable."

# 7. Firewall: open port 3000 if firewalld is active
if command -v firewall-cmd &>/dev/null && sudo systemctl is-active firewalld &>/dev/null; then
  log "firewalld is active; opening port 3000/tcp..."
  sudo firewall-cmd --add-port=3000/tcp --permanent
  sudo firewall-cmd --reload
  log "Port 3000 opened."
else
  log "firewalld not active or not installed."
fi

# 8. SELinux: configure port context for 3000/tcp
if command -v getenforce &>/dev/null && [[ "$(getenforce)" != "Disabled" ]]; then
  log "SELinux is $(getenforce); configuring port context..."
  if ! command -v semanage &>/dev/null; then
    log "Installing semanage tool..."
    sudo dnf install -y policycoreutils-python-utils
  fi
  # add or modify port
  if ! semanage port -l | grep -wq 'http_port_t.*3000'; then
    sudo semanage port -a -t http_port_t -p tcp 3000 \
      || sudo semanage port -m -t http_port_t -p tcp 3000
  fi
  log "SELinux port context set for 3000/tcp."
else
  log "SELinux disabled or not installed."
fi

# 9. Install shadow-utils
log "Ensuring shadow-utils is installed..."
sudo dnf install -y shadow-utils

# 10. Install curl (required for Chrome download)
if ! command -v curl &>/dev/null; then
  log "Installing curl..."
  sudo dnf install -y curl
fi

# 11. Install Google Chrome if missing
if ! command -v google-chrome-stable &>/dev/null; then
  log "Downloading Google Chrome RPM..."
  TMP_RPM=$(mktemp -p /tmp google-chrome-XXXX.rpm)
  curl -Lo "$TMP_RPM" \
    https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm \
    || fail "Failed to download Chrome RPM."
  log "Installing Chrome..."
  sudo dnf install -y "$TMP_RPM"
  rm -f "$TMP_RPM"
  log "Google Chrome installed."
else
  log "Google Chrome already present."
fi

# 12. Install Python 3.x
for PY in python3 python3.11; do
  if ! command -v $PY &>/dev/null; then
    log "Installing $PY..."
    sudo dnf install -y $PY
  else
    log "$PY present."
  fi
done

# 13. Install pip packages
for PKG in python3-pip python3.11-pip; do
  if ! rpm -q $PKG &>/dev/null; then
    log "Installing $PKG..."
    sudo dnf install -y $PKG
  else
    log "$PKG present."
  fi
done

# 14. Prompt for Red Hat quay.io login & podman auth
log "Logging into quay.io via podman..."
read -p "  Red Hat CDN username: " USERNAME
read -s -p "  Red Hat CDN password: " PASSWORD
echo

if ! sudo podman login quay.io --username "$USERNAME" --password "$PASSWORD"; then
  log "First login attempt failed. Running podman system migrate..."
  sudo podman system migrate
  if ! sudo podman login quay.io --username "$USERNAME" --password "$PASSWORD"; then
    fail "Podman login failed after migration."
  fi
fi
log "Podman login successful."

# 15. Upgrade pip, wheel, setuptools (as regular user)
log "Upgrading pip environment..."
pip3 install --upgrade pip wheel setuptools

# 16. Run UI build
#log "Running make setup && make dev..."
#make setup && make dev \
#  || fail "make setup/dev failed."

# 16. Run UI build as regular user
log "Running UI build as regular user..."

# Execute make as the current user (not root)
if make setup && make dev; then
  log "UI build completed successfully."
else
  fail "UI build failed."
fi

# 17. Install launchers and desktop integration
log "Installing launchers and desktop integration..."

# Get current working directory (should be the project root)
PROJECT_ROOT="$(pwd)"
LAUNCHERS_DIR="$PROJECT_ROOT/Launchers"

# Ensure Launchers directory exists
if [ ! -d "$LAUNCHERS_DIR" ]; then
  fail "Launchers directory not found at $LAUNCHERS_DIR"
fi

# Create user applications directory
mkdir -p "$HOME/.local/share/applications"
log "Created user applications directory: $HOME/.local/share/applications"

# Make Python launcher executable
if [ -f "$LAUNCHERS_DIR/EE-DE_webui_app.py" ]; then
  chmod +x "$LAUNCHERS_DIR/EE-DE_webui_app.py"
  log "Made EE-DE_webui_app.py executable"
else
  log "WARNING: EE-DE_webui_app.py not found"
fi

# Make shell launcher executable
if [ -f "$LAUNCHERS_DIR/launch_gui.sh" ]; then
  chmod +x "$LAUNCHERS_DIR/launch_gui.sh"
  log "Made launch_gui.sh executable"
else
  log "WARNING: launch_gui.sh not found"
fi

# Install Python GUI dependencies
log "Installing Python GUI dependencies..."
if sudo dnf install -y python3-tkinter; then
  log "Python GUI dependencies installed/verified"
else
  log "WARNING: Failed to install python3-tkinter"
fi

# Install requests module for the GUI app
log "Installing Python requests module..."
if pip3 install --user requests; then
  log "Python requests module installed/verified"
else
  log "WARNING: Failed to install requests module"
fi

# Copy and update desktop files
for desktop_file in "$LAUNCHERS_DIR"/*.desktop; do
  if [ -f "$desktop_file" ]; then
    filename=$(basename "$desktop_file")
    
    # Skip the WebUI-App.desktop file (GUI launcher)
    if [[ "$filename" == "EE-DE_WebUI-App.desktop" ]]; then
      log "Skipping GUI launcher desktop file: $filename"
      continue
    fi
    
    target_file="$HOME/.local/share/applications/$filename"
    
    # Copy desktop file and update paths to use absolute paths
    sed "s|/home/sgallego/Downloads/Base_EE-DE_Builder|$PROJECT_ROOT|g; s|/path/to/project|$PROJECT_ROOT|g" "$desktop_file" > "$target_file"
    chmod +x "$target_file"
    
    log "Installed desktop file: $filename"
  fi
done

# Update desktop database
if command -v update-desktop-database &>/dev/null; then
  update-desktop-database "$HOME/.local/share/applications/"
  log "Updated desktop database"
else
  log "WARNING: update-desktop-database not available"
fi

# Create desktop shortcuts if Desktop directory exists
if [ -d "$HOME/Desktop" ]; then
  log "Desktop directory found, creating desktop shortcuts..."
  
  for desktop_file in "$LAUNCHERS_DIR"/*.desktop; do
    if [ -f "$desktop_file" ]; then
      filename=$(basename "$desktop_file")
      
      # Skip the WebUI-App.desktop file (GUI launcher)
      if [[ "$filename" == "EE-DE_WebUI-App.desktop" ]]; then
        log "Skipping GUI launcher desktop shortcut: $filename"
        continue
      fi
      
      desktop_target="$HOME/Desktop/$filename"
      
      # Copy and update desktop file for Desktop directory
      sed "s|/home/sgallego/Downloads/Base_EE-DE_Builder|$PROJECT_ROOT|g; s|/path/to/project|$PROJECT_ROOT|g" "$desktop_file" > "$desktop_target"
      chmod +x "$desktop_target"
      
      # Mark as trusted (for GNOME)
      if command -v gio &>/dev/null; then
        gio set "$desktop_target" metadata::trusted true 2>/dev/null || true
      fi
      
      log "Created desktop shortcut: $filename"
    fi
  done
else
  log "No Desktop directory found, skipping desktop shortcuts"
fi

# Create command-line launcher symlinks for headless systems
log "Creating command-line launchers..."

# Create a local bin directory if it doesn't exist
mkdir -p "$HOME/.local/bin"

# Create symlink for the Python GUI app
if [ -f "$LAUNCHERS_DIR/EE-DE_webui_app.py" ]; then
  ln -sf "$LAUNCHERS_DIR/EE-DE_webui_app.py" "$HOME/.local/bin/ee-de-webui-app"
  log "Created command-line launcher: ee-de-webui-app"
fi

# Create symlink for the shell launcher
if [ -f "$LAUNCHERS_DIR/launch_gui.sh" ]; then
  ln -sf "$LAUNCHERS_DIR/launch_gui.sh" "$HOME/.local/bin/ee-de-webui-gui"
  log "Created command-line launcher: ee-de-webui-gui"
fi

# Add ~/.local/bin to PATH if not already there
if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.bashrc"
  log "Added ~/.local/bin to PATH in ~/.bashrc"
  log "NOTE: Run 'source ~/.bashrc' or start a new terminal to use command-line launchers"
fi

# Install to system-wide applications for headless access
log "Installing system-wide application entries..."

# Create system applications directory if it doesn't exist
if sudo mkdir -p /usr/share/applications; then
  log "System applications directory verified"
else
  log "WARNING: Could not create system applications directory"
fi

# Install system-wide desktop files
for desktop_file in "$LAUNCHERS_DIR"/*.desktop; do
  if [ -f "$desktop_file" ]; then
    filename=$(basename "$desktop_file")
    
    # Skip the WebUI-App.desktop file (GUI launcher)
    if [[ "$filename" == "EE-DE_WebUI-App.desktop" ]]; then
      log "Skipping GUI launcher system-wide installation: $filename"
      continue
    fi
    
    system_target="/usr/share/applications/$filename"
    
    # Copy and update desktop file for system-wide installation
    # First create a temporary file with updated paths, then copy with sudo
    temp_file=$(mktemp)
    if sed "s|/home/sgallego/Downloads/Base_EE-DE_Builder|$PROJECT_ROOT|g; s|/path/to/project|$PROJECT_ROOT|g" "$desktop_file" > "$temp_file"; then
      if sudo cp "$temp_file" "$system_target" && sudo chmod 644 "$system_target"; then
        log "Installed system-wide desktop file: $filename"
      else
        log "WARNING: Failed to install system-wide desktop file: $filename"
      fi
    else
      log "WARNING: Failed to process desktop file: $filename"
    fi
    rm -f "$temp_file"
  fi
done

# Update system desktop database
if command -v update-desktop-database &>/dev/null; then
  if sudo update-desktop-database /usr/share/applications/ 2>/dev/null; then
    log "Updated system desktop database"
  else
    log "WARNING: Failed to update system desktop database (non-critical)"
  fi
else
  log "WARNING: update-desktop-database not available (non-critical)"
fi

log "=== Launcher Installation Summary ==="
log "Desktop applications installed to: $HOME/.local/share/applications/"
if [ -d "$HOME/Desktop" ]; then
  log "Desktop shortcuts created in: $HOME/Desktop/"
fi
log "Command-line launchers available:"
log "  - ee-de-webui-app (Python GUI launcher)"
log "  - ee-de-webui-gui (Shell GUI launcher)"
log "System-wide applications installed to: /usr/share/applications/"
log "=== EE-DE_Builder_WebUI setup complete! ==="

