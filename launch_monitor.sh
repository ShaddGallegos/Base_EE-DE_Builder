#!/bin/bash
# Launch podman monitoring in a tmux session
# This script can be used to manually launch the monitoring terminal

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if monitor script exists, otherwise copy it
if [ ! -f "/tmp/monitor_script.sh" ]; then
    echo "Copying monitoring script to /tmp..."
    cp "$SCRIPT_DIR/scripts/monitor_script.sh" /tmp/
    chmod +x /tmp/monitor_script.sh
fi

# Launch the monitoring terminal
echo "Launching monitoring terminal..."
bash "$SCRIPT_DIR/scripts/launch_tmux_monitor.sh"

echo "Monitoring terminal launched. If it's not visible, check /tmp/tmux_launch.log for errors."
