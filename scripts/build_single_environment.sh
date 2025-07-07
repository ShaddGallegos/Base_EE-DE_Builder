#!/bin/bash

# Enhanced build script for Ansible Execution Environments
# This script provides live logging and handles podman namespace issues

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENVIRONMENTS_DIR="$SCRIPT_DIR/environments"
DEFAULT_ENVIRONMENT=""

usage() {
    echo "Usage: $0 [environment_name]"
    echo ""
    echo "Available environments:"
    find "$ENVIRONMENTS_DIR" -maxdepth 1 -type d -name "rhel-*" -o -name "*-environment*" | sort | while read -r env; do
        env_name=$(basename "$env")
        echo "  - $env_name"
    done
    echo ""
    echo "If no environment is specified, all environments will be built."
    exit 1
}

build_environment() {
    local env_name="$1"
    local env_path="$ENVIRONMENTS_DIR/$env_name"
    local timestamp=$(date "+%Y%m%d-%H%M%S")
    local tag="${env_name}:latest"
    local log_file="/tmp/${env_name}_build_log_${timestamp}.log"
    
    echo "============================================="
    echo "BUILDING: $env_name"
    echo "============================================="
    echo "Environment: $env_name"
    echo "Path: $env_path"
    echo "Tag: $tag"
    echo "Log: $log_file"
    echo "Start time: $(date)"
    echo "============================================="
    
    if [ ! -d "$env_path" ]; then
        echo "ERROR: Environment directory not found: $env_path"
        return 1
    fi
    
    cd "$env_path"
    
    # Clean up any existing context with proper permissions
    sudo rm -rf context/ 2>/dev/null || rm -rf context/ 2>/dev/null || true
    
    # Try rootless podman first
    echo "Attempting rootless build..."
    if timeout 1800 /usr/local/bin/ansible-builder build \
        --build-arg ANSIBLE_GALAXY_CLI_COLLECTION_OPTS=--ignore-certs \
        --container-runtime podman \
        --file execution-environment.yml \
        --tag "$tag" \
        --verbosity 3 \
        --no-cache \
        --build-arg BUILDAH_FORMAT=docker \
        --build-arg MAX_JOBS=2 \
        2>&1 | tee "$log_file"
    then
        # Check if image was actually created
        if podman inspect "$tag" >/dev/null 2>&1; then
            echo ""
            echo "============================================="
            echo "BUILD SUCCESSFUL (ROOTLESS)!"
            echo "============================================="
            echo "Tag: $tag"
            echo "End time: $(date)"
            echo "Log: $log_file"
            return 0
        else
            echo "Build command succeeded but image not found. Trying rootful mode..."
        fi
    else
        echo "Rootless build failed. Trying rootful mode..."
    fi
    
    # Try rootful podman
    echo ""
    echo "============================================="
    echo "TRYING ROOTFUL PODMAN BUILD"
    echo "============================================="
    
    if sudo timeout 1800 /usr/local/bin/ansible-builder build \
        --build-arg ANSIBLE_GALAXY_CLI_COLLECTION_OPTS=--ignore-certs \
        --container-runtime podman \
        --file execution-environment.yml \
        --tag "$tag" \
        --verbosity 3 \
        --no-cache \
        --build-arg BUILDAH_FORMAT=docker \
        --build-arg MAX_JOBS=2 \
        2>&1 | tee -a "$log_file"
    then
        # Check if image was actually created (try both user and root podman)
        if sudo podman inspect "$tag" >/dev/null 2>&1 || podman inspect "$tag" >/dev/null 2>&1; then
            echo ""
            echo "============================================="
            echo "BUILD SUCCESSFUL (ROOTFUL)!"
            echo "============================================="
            echo "Tag: $tag"
            echo "End time: $(date)"
            echo "Log: $log_file"
            return 0
        fi
    fi
    
    # Try docker if available
    if command -v docker &> /dev/null; then
        echo ""
        echo "============================================="
        echo "TRYING DOCKER AS FALLBACK"
        echo "============================================="
        
        if timeout 1800 /usr/local/bin/ansible-builder build \
            --build-arg ANSIBLE_GALAXY_CLI_COLLECTION_OPTS=--ignore-certs \
            --container-runtime docker \
            --file execution-environment.yml \
            --tag "$tag" \
            --verbosity 3 \
            --no-cache \
            2>&1 | tee -a "$log_file"
        then
            if docker inspect "$tag" >/dev/null 2>&1; then
                echo ""
                echo "============================================="
                echo "BUILD SUCCESSFUL (DOCKER)!"
                echo "============================================="
                echo "Tag: $tag"
                echo "End time: $(date)"
                echo "Log: $log_file"
                return 0
            fi
        fi
    fi
    
    echo ""
    echo "============================================="
    echo "BUILD FAILED FOR: $env_name"
    echo "============================================="
    echo "All build methods failed"
    echo "End time: $(date)"
    echo "Check log: $log_file"
    return 1
    
    # Clean up context
    sudo rm -rf context/ 2>/dev/null || rm -rf context/ 2>/dev/null || true
}

main() {
    if [ $# -eq 0 ]; then
        # Build all environments
        echo "Building all environments..."
        find "$ENVIRONMENTS_DIR" -maxdepth 1 -type d -name "rhel-*" -o -name "*-environment*" | sort | while read -r env_dir; do
            env_name=$(basename "$env_dir")
            if [ "$env_name" != "base_environment_definition_1-file" ] && [ "$env_name" != "base_environment_definition_4_file" ]; then
                build_environment "$env_name"
            fi
        done
    elif [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
        usage
    else
        # Build specific environment
        build_environment "$1"
    fi
}

main "$@"
