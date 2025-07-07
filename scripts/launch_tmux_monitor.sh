#!/bin/bash
# Script to launch a tmux session with podman monitoring in a visible terminal window
# This script will try different terminal emulators until one works

# Create a script that will be executed in the terminal to keep it open
cat > /tmp/tmux_launch_and_wait.sh << 'EOF'
#!/bin/bash
# This script launches tmux and keeps the terminal open

# Function to handle cleanup on exit
cleanup() {
  tmux kill-session -t podman_monitor 2>/dev/null || true
  exit 0
}

# Set up trap for proper cleanup
trap cleanup EXIT

# Launch tmux with monitoring
tmux new-session -s podman_monitor "bash /tmp/monitor_script.sh" \; \
  split-window -h "bash" \; \
  select-layout even-horizontal

# If tmux exits or detaches, don't close the terminal immediately
echo ""
echo "==================================================="
echo "TMUX SESSION ACTIVE"
echo "This terminal will stay open for monitoring."
echo "If the session detaches, type:"
echo "tmux attach-session -t podman_monitor"
echo "==================================================="
echo ""
echo "Press CTRL+C to close this terminal."

# Keep terminal open indefinitely
while true; do
  sleep 60
done
EOF

# Make the script executable
chmod +x /tmp/tmux_launch_and_wait.sh

# Try different terminal emulators in order of preference
if command -v gnome-terminal &> /dev/null; then
    echo "Launching monitor in gnome-terminal..."
    gnome-terminal --title="Podman Monitoring" -- bash /tmp/tmux_launch_and_wait.sh
    exit 0
elif command -v terminator &> /dev/null; then
    echo "Launching monitor in terminator..."
    terminator --title="Podman Monitoring" -e "bash /tmp/tmux_launch_and_wait.sh"
    exit 0
elif command -v konsole &> /dev/null; then
    echo "Launching monitor in konsole..."
    konsole --title="Podman Monitoring" -e "bash /tmp/tmux_launch_and_wait.sh"
    exit 0
elif command -v xfce4-terminal &> /dev/null; then
    echo "Launching monitor in xfce4-terminal..."
    xfce4-terminal --title="Podman Monitoring" -e "bash /tmp/tmux_launch_and_wait.sh"
    exit 0
elif command -v xterm &> /dev/null; then
    echo "Launching monitor in xterm..."
    xterm -title "Podman Monitoring" -e "bash /tmp/tmux_launch_and_wait.sh"
    exit 0
else
    echo "No suitable terminal emulator found. Launching tmux in the background..."
    tmux new-session -d -s podman_monitor "bash /tmp/monitor_script.sh" \; \
    split-window -h "bash" \; \
    select-layout even-horizontal
    echo "To attach to the session, run: tmux attach-session -t podman_monitor"
    exit 1
fi

# Keep the script running for a bit to ensure the terminal has time to start
sleep 5
