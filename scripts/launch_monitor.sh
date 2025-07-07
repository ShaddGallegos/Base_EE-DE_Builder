#!/bin/bash
# Script to launch the podman monitoring terminal
# Can be executed at any time to view podman activity

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PARENT_DIR="$( cd "$SCRIPT_DIR/.." && pwd )"

# Copy the monitoring script to /tmp if it doesn't exist
if [ ! -f "/tmp/monitor_script.sh" ]; then
    echo "Copying monitoring script to /tmp..."
    cp "$SCRIPT_DIR/monitor_script.sh" /tmp/
    chmod +x /tmp/monitor_script.sh
fi

# Launch the monitoring terminal
echo "Launching Podman monitoring terminal..."
"$PARENT_DIR/scripts/launch_tmux_monitor.sh"
