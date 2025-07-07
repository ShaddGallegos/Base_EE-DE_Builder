#!/bin/bash
# Script to monitor podman activities during EE/DE builds
# This script runs in a tmux pane and shows live podman information

# Set colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display timestamp
timestamp() {
  date +"%Y-%m-%d %H:%M:%S"
}

# Function to print ASCII art header
print_ascii_header() {
  # Try multiple locations to find the ASCII art
  ASCII_FILE=""
  
  # Check if we have the path in an environment variable
  if [ -n "$EE_DE_BUILDER_PATH" ] && [ -f "$EE_DE_BUILDER_PATH/Images/asciiable.txt" ]; then
    ASCII_FILE="$EE_DE_BUILDER_PATH/Images/asciiable.txt"
  # Check the absolute path
  elif [ -f "/home/sgallego/Downloads/GIT/Base_EE-DE_Builder/Images/asciiable.txt" ]; then
    ASCII_FILE="/home/sgallego/Downloads/GIT/Base_EE-DE_Builder/Images/asciiable.txt"
  # Check relative to script directory (assuming script is in scripts/)
  elif [ -f "$(dirname "$0")/../Images/asciiable.txt" ]; then
    ASCII_FILE="$(dirname "$0")/../Images/asciiable.txt"
  # If we're in /tmp, try a different relative path
  elif [ -f "$(dirname "$0")/../../Images/asciiable.txt" ]; then
    ASCII_FILE="$(dirname "$0")/../../Images/asciiable.txt"
  fi
  
  if [ -n "$ASCII_FILE" ]; then
    echo -e "${BLUE}"
    cat "$ASCII_FILE"
    echo -e "${NC}"
  else
    echo -e "${YELLOW}===== Podman Build Monitor =====${NC}"
  fi
  echo -e "${CYAN}Press Ctrl+C to exit this monitor (won't affect builds)${NC}"
  echo ""
}

# Function to print timestamp header
print_header() {
  echo -e "\n${GREEN}======== $(timestamp) ========${NC}"
}

while true; do
  clear
  print_ascii_header
  print_header
  echo -e "${CYAN}Current Podman Images:${NC}"
  podman images | grep -v "^REPOSITORY" | grep -v "<none>" | sort
  
  # Wait for 5 seconds before refreshing
  sleep 5
done
