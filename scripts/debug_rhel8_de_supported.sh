#!/bin/bash

# Debug script for RHEL 8 DevTools environment build
# This script will build with maximum verbosity and logging

set -e

ENVIRONMENT="rhel-8-devtools"
ENVIRONMENTS_DIR="/home/sgallego/Downloads/GIT/Base_EE-DE_Builder/environments"
TIMESTAMP=$(date "+%Y%m%d-%H%M%S")

echo "============================================="
echo "DEBUG BUILD FOR: $ENVIRONMENT"
echo "============================================="
echo "Start time: $(date)"
echo "Timestamp: $TIMESTAMP"
echo "Environment directory: $ENVIRONMENTS_DIR/$ENVIRONMENT"
echo "============================================="

# Check if environment directory exists
if [ ! -d "$ENVIRONMENTS_DIR/$ENVIRONMENT" ]; then
    echo "ERROR: Environment directory not found: $ENVIRONMENTS_DIR/$ENVIRONMENT"
    exit 1
fi

cd "$ENVIRONMENTS_DIR/$ENVIRONMENT"

echo "Current directory: $(pwd)"
echo "Contents:"
ls -la

echo ""
echo "============================================="
echo "EXECUTION ENVIRONMENT CONFIGURATION"
echo "============================================="
cat execution-environment.yml

echo ""
echo "============================================="
echo "REQUIREMENTS.TXT"
echo "============================================="
cat requirements.txt

echo ""
echo "============================================="
echo "REQUIREMENTS.YML"
echo "============================================="
cat requirements.yml

echo ""
echo "============================================="
echo "BINDEP.TXT"
echo "============================================="
cat bindep.txt

echo ""
echo "============================================="
echo "STARTING BUILD WITH MAXIMUM VERBOSITY"
echo "============================================="

# Clean up any existing context
rm -rf context/ || true

# Build with podman first
echo "Attempting build with podman (rootless)..."
echo "Build command:"
echo "/usr/local/bin/ansible-builder build \\"
echo "  --build-arg ANSIBLE_GALAXY_CLI_COLLECTION_OPTS=--ignore-certs \\"
echo "  --container-runtime podman \\"
echo "  --file execution-environment.yml \\"
echo "  --tag $ENVIRONMENT:debug-$TIMESTAMP \\"
echo "  --verbosity 3 \\"
echo "  --no-cache \\"
echo "  --build-arg BUILDAH_FORMAT=docker"

echo ""
echo "Starting build..."

# Run the build and capture the exit code properly
timeout 1800 /usr/local/bin/ansible-builder build \
    --build-arg ANSIBLE_GALAXY_CLI_COLLECTION_OPTS=--ignore-certs \
    --container-runtime podman \
    --file execution-environment.yml \
    --tag "$ENVIRONMENT:debug-$TIMESTAMP" \
    --verbosity 3 \
    --no-cache \
    --build-arg BUILDAH_FORMAT=docker \
    2>&1 | tee "/tmp/${ENVIRONMENT}_build_log_${TIMESTAMP}.log"

build_exit_code=${PIPESTATUS[0]}

# Check if the build actually succeeded by looking for the image
if [ $build_exit_code -eq 0 ] && podman inspect "$ENVIRONMENT:debug-$TIMESTAMP" >/dev/null 2>&1; then
    echo ""
    echo "============================================="
    echo "BUILD SUCCESSFUL!"
    echo "============================================="
    echo "Tag: $ENVIRONMENT:debug-$TIMESTAMP"
    echo "End time: $(date)"
    echo "Log saved to: /tmp/${ENVIRONMENT}_build_log_${TIMESTAMP}.log"
    
    # Show final image info
    echo ""
    echo "Image information:"
    podman inspect "$ENVIRONMENT:debug-$TIMESTAMP" | head -20
    exit 0
else
    echo ""
    echo "============================================="
    echo "BUILD FAILED WITH PODMAN (ROOTLESS)!"
    echo "============================================="
    echo "Exit code: $build_exit_code"
    echo "End time: $(date)"
    echo "Log saved to: /tmp/${ENVIRONMENT}_build_log_${TIMESTAMP}.log"
    echo "Log saved to: /tmp/${ENVIRONMENT}_build_log_${TIMESTAMP}.log"
    
    # Try with podman in rootful mode
    echo ""
    echo "============================================="
    echo "TRYING WITH PODMAN (ROOTFUL MODE)"
    echo "============================================="
    
    if sudo timeout 1800 /usr/local/bin/ansible-builder build \
        --build-arg ANSIBLE_GALAXY_CLI_COLLECTION_OPTS=--ignore-certs \
        --container-runtime podman \
        --file execution-environment.yml \
        --tag "$ENVIRONMENT:debug-$TIMESTAMP" \
        --verbosity 3 \
        --no-cache \
        --build-arg BUILDAH_FORMAT=docker \
        2>&1 | tee -a "/tmp/${ENVIRONMENT}_build_log_${TIMESTAMP}.log"; then
        
        echo ""
        echo "============================================="
        echo "PODMAN ROOTFUL BUILD SUCCESSFUL!"
        echo "============================================="
        echo "Tag: $ENVIRONMENT:debug-$TIMESTAMP"
        echo "End time: $(date)"
        exit 0
    else
        podman_rootful_exit_code=$?
        echo ""
        echo "============================================="
        echo "PODMAN ROOTFUL BUILD ALSO FAILED!"
        echo "============================================="
        echo "Podman rootful exit code: $podman_rootful_exit_code"
    fi
    
    # Try with docker if available
    if command -v docker &> /dev/null; then
        echo ""
        echo "============================================="
        echo "TRYING WITH DOCKER AS FALLBACK"
        echo "============================================="
        
        if timeout 1800 /usr/local/bin/ansible-builder build \
            --build-arg ANSIBLE_GALAXY_CLI_COLLECTION_OPTS=--ignore-certs \
            --container-runtime docker \
            --file execution-environment.yml \
            --tag "$ENVIRONMENT:debug-$TIMESTAMP" \
            --verbosity 3 \
            --no-cache \
            2>&1 | tee -a "/tmp/${ENVIRONMENT}_build_log_${TIMESTAMP}.log"; then
            
            echo ""
            echo "============================================="
            echo "DOCKER BUILD SUCCESSFUL!"
            echo "============================================="
            echo "Tag: $ENVIRONMENT:debug-$TIMESTAMP"
            echo "End time: $(date)"
        else
            docker_exit_code=$?
            echo ""
            echo "============================================="
            echo "DOCKER BUILD ALSO FAILED!"
            echo "============================================="
            echo "Docker exit code: $docker_exit_code"
            echo "End time: $(date)"
            exit $docker_exit_code
        fi
    else
        echo "Docker not available for fallback"
        exit $build_exit_code
    fi
fi

# Clean up context
rm -rf context/ || true

echo ""
echo "============================================="
echo "DEBUG BUILD COMPLETED"
echo "============================================="
echo "Check the log file for detailed output:"
echo "/tmp/${ENVIRONMENT}_build_log_${TIMESTAMP}.log"
