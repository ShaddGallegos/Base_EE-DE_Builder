# EE-DE Builder - Ansible Environment Builder

A system for building and managing Ansible Execution Environments (EE) and Development Environments (DE) with streamlined scripts and monitoring capabilities.

## Overview

EE-DE Builder allows you to build RHEL-based execution environments (EEs) and development environments (DEs) for Ansible automation. It provides a set of streamlined scripts and tools for creating, testing, and managing these environments.

## Features

- **Streamlined Building**: Simple command-line interface for building environments
- **Fixed Environments**: Automatic fixes for common build issues (dnf/microdnf, Python dependencies)
- **Live Monitoring**: Real-time podman monitoring with tmux
- **Environment Testing**: Built-in container testing
- **Comprehensive Logging**: Detailed logs for debugging

## Prerequisites

- Linux system with `podman` installed
- `sudo` access for container operations
- `ansible-builder` installed
- `tmux` for monitoring

## Directory Structure

- `scripts/`: Contains all build and utility scripts
  - `ee_de_builder.sh`: Main script for building and managing environments
  - `ee_de_monitor.sh`: Script for monitoring podman during builds
  - `ee_de_utils.sh`: Common utility functions used by other scripts
- `environments/`: Contains all environment definitions
- `Images/`: Contains ASCII art for the monitor
- `Launchers/`: Contains desktop launchers

## Available Environments

1. `rhel-8-devtools`: Development tools for RHEL 8
2. `rhel-8-ee-supported`: Supported execution environment for RHEL 8
3. `rhel-8-ee-minimal`: Minimal execution environment for RHEL 8
4. `rhel-8-de-supported`: Supported development environment for RHEL 8
5. `rhel-8-de-minimal`: Minimal development environment for RHEL 8
6. `rhel-9-devtools`: Development tools for RHEL 9
7. `rhel-9-ee-supported`: Supported execution environment for RHEL 9
8. `rhel-9-ee-minimal`: Minimal execution environment for RHEL 9
9. `rhel-9-de-supported`: Supported development environment for RHEL 9
10. `rhel-9-de-minimal`: Minimal development environment for RHEL 9

## Fixed Environments

We've made significant improvements to address build issues in the environment definitions:

1. **Consolidated `rhel-8-devtools`**: A single, robust environment combining the best fixes from:
   - `rhel-8-devtools-simple`: For dnf/microdnf fixes
   - `rhel-8-devtools-minimal`: For reduced dependencies
   - `rhel-8-devtools-fixed`: For manual edits and fixes

2. **Key fixes implemented directly in the build_environments.yml playbook**:
   - RPM package conflict resolution via constraints and pip configuration
   - Special build parameters for problematic environments
   - Filtered requirements to remove conflicting packages
   - Environment-specific fixes applied automatically

## Quick Start

### Building an Environment

Use the main Ansible playbook to build all environments:

```bash
# Build all environments
ansible-playbook build_environments.yml

# Build specific environments
ansible-playbook build_environments.yml -e "selected_environments=['rhel-8-devtools']"

# Create a fixed version of an environment (through the shell script helper)
./scripts/ee_de_builder.sh --fix rhel-8-devtools simple
```

This will:
1. Launch a monitoring terminal with tmux
2. Clean up podman resources
3. Build the environment using ansible-builder
4. Tag the image for use

### Testing an Environment

After building, test the environment:

```bash
./scripts/ee_de_builder.sh --test rhel-8-devtools
```

This will:
1. Run a container from the built image
2. Check Python, Ansible versions
3. List installed packages
4. Verify Git installation

## Additional Commands

List available environments:
```bash
./scripts/ee_de_builder.sh --list
```

Build all environments:
```bash
./scripts/ee_de_builder.sh --all
```

Launch just the monitoring terminal:
```bash
./scripts/ee_de_monitor.sh --tmux
```

Remove backup files:
```bash
./scripts/ee_de_builder.sh --rm-backups
```

Show help:
```bash
./scripts/ee_de_builder.sh --help
```

## Common Issues and Solutions

1. **Permission Denied**: Make sure you run scripts with appropriate permissions or use `sudo`
2. **DNF/MicroDNF Issues**: The simple/minimal environments use a symlink from dnf to microdnf
3. **Missing Dependencies**: Pre-install rsync in the container to avoid assemble script failures
4. **Python Version**: System Python (python3-devel) is used instead of installing a separate Python
5. **RPM Package Conflicts**: Some Python packages are installed via RPM in the base image, causing pip uninstall errors. Solutions include:
   - Use pip constraints: `--constraint constraints.txt`
   - Set `ignore-installed` flags: `--ignore-installed botocore boto3`
   - Filter requirements to exclude problematic packages
   - Set `PIP_BREAK_SYSTEM_PACKAGES=1`

## Maintenance

After building environments, you can clean up resources:

```bash
sudo podman system prune -af
```

## Environment Configuration Template

The execution environments are defined using a YAML configuration file. Here's a template structure:

```yaml
---
# Version declaration - Required
version: 3

# Images Configuration - Required
images:
  base_image:
    name: 'registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel9:latest'
    options:
      pull_policy: missing
      tls_verify: false

# Dependencies - Required
dependencies:
  python: requirements.txt
  system: bindep.txt
  galaxy: requirements.yml
  
# Options - Optional
options:
  package_manager_path: /usr/bin/microdnf

# Additional Build Steps - Optional
additional_build_steps:
  prepend_builder: |
    # Add symlink from /usr/bin/dnf to /usr/bin/microdnf
    RUN ln -s /usr/bin/microdnf /usr/bin/dnf || true
    
    # Install basic development tools
    RUN microdnf install -y gcc python3-devel python3-pip
    
    # Pre-install rsync to avoid the dnf issue
    RUN microdnf install -y rsync

  prepend_final: |
    # Install additional tools
    RUN microdnf install -y git || true
    
    # Standard upgrade steps - minimal
    RUN python3 -m pip install --no-cache-dir --upgrade pip setuptools wheel || true

  append_final: |
    USER root
    RUN microdnf clean all || true
```

## Recent Improvements

The EE-DE Builder scripts have been consolidated and streamlined for better maintainability and easier use. We've reduced the number of scripts from over 25 to just 3 main scripts with clear responsibilities:

### Python Package Management Fixes (July 2025)

We've implemented robust solutions to handle RPM-installed Python packages that were causing build failures:

1. **PIP Configuration**:
   - Created custom pip.conf files for problematic environments
   - Implemented ignore-installed flags for system packages
   - Added constraints files to prevent installation of conflicting packages

2. **Environment-Specific Build Optimizations**:
   - Special handling in the Ansible playbook for problematic environments
   - Automatic filtering of requirements.txt to remove conflicting packages
   - Dynamic pip configuration based on environment needs
   - Build-time environment variables set appropriately

3. **Documentation Improvements**:
   - Added READMEs to environment directories
   - Documented known issues and solutions
   - Updated main README with common fixes

1. **Consolidated Core Scripts**:
   - `ee_de_utils.sh`: Contains reusable functions and utilities
   - `ee_de_builder.sh`: Main script for building and managing environments
   - `ee_de_monitor.sh`: Unified script for all monitoring functionality

2. **Implemented Function-Based Design**:
   - Common operations extracted into reusable functions
   - Each function has a clear single responsibility
   - Functions are well-documented with comments

3. **Created a Command-Line Interface**:
   - Added proper command-line argument handling
   - Implemented help and usage documentation
   - Added options for all common operations

4. **Organized File Structure**:
   - Backed up all old scripts for reference
   - Created symbolic links for backward compatibility
   - Removed redundant and obsolete scripts
   - Added automatic cleanup of .bak and .backup files

## Contributing

To make changes:
1. Create new fixed environments in `environments/`
2. Update the build scripts in `scripts/`
3. Test thoroughly with the test functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.
