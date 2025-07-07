#!/bin/bash
# Standalone script to launch podman monitoring in a terminal
# This can be run manually by users when needed

# Copy monitor script to /tmp (for consistency with playbook)
cp "$(dirname "$0")/monitor_script.sh" /tmp/monitor_script.sh
chmod +x /tmp/monitor_script.sh

# Launch the monitor
bash "$(dirname "$0")/launch_tmux_monitor.sh"

echo "Podman monitoring terminal should now be running"
