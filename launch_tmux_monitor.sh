#!/bin/bash
# Script to launch a tmux session with podman monitoring in a visible terminal window
# This script will try different terminal emulators until one works

# Define the tmux command
TMUX_CMD="tmux new-session -s podman_monitor \"bash /tmp/monitor_script.sh\" \; split-window -h \"bash\" \; select-layout even-horizontal \; attach-session -t podman_monitor"

# Try different terminal emulators in order of preference
if command -v gnome-terminal &> /dev/null; then
    echo "Launching monitor in gnome-terminal..."
    gnome-terminal -- bash -c "$TMUX_CMD"
    exit $?
elif command -v terminator &> /dev/null; then
    echo "Launching monitor in terminator..."
    terminator -e "$TMUX_CMD"
    exit $?
elif command -v konsole &> /dev/null; then
    echo "Launching monitor in konsole..."
    konsole -e "$TMUX_CMD"
    exit $?
elif command -v xfce4-terminal &> /dev/null; then
    echo "Launching monitor in xfce4-terminal..."
    xfce4-terminal -e "$TMUX_CMD"
    exit $?
elif command -v xterm &> /dev/null; then
    echo "Launching monitor in xterm..."
    xterm -e "$TMUX_CMD"
    exit $?
else
    echo "No suitable terminal emulator found. Launching tmux in the background..."
    tmux new-session -d -s podman_monitor "bash /tmp/monitor_script.sh" \; \
    split-window -h "bash" \; \
    select-layout even-horizontal
    echo "To attach to the session, run: tmux attach-session -t podman_monitor"
    exit 1
fi
