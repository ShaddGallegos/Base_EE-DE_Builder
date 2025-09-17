# Base_EE-DE_Builder

A robust Ansible-based automation project for building, managing, and customizing Red Hat Execution Environments (EEs) and development environments. This project is designed to streamline the process of preparing, configuring, and building containerized Ansible execution environments for RHEL-based systems.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Features](#features)
- [Directory Structure](#directory-structure)
- [Quick Start](#quick-start)
- [Usage](#usage)
  - [Running the CLI](#running-the-cli)
  - [Running the Web UI](#running-the-web-ui)
  - [Customizing for Vendor Products](#customizing-for-vendor-products)
  - [Additional Steps](#additional-steps)
- [Configuration](#configuration)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Authors](#authors)
- [EE-DE Builder - Ansible Environment Builder Web Application](#ee-de-builder---ansible-environment-builder-web-application)
  - [Features (Web UI)](#features-web-ui)
  - [Architecture](#architecture)
  - [Technology Stack](#technology-stack)
  - [Prerequisites (Web UI)](#prerequisites-web-ui)
  - [Available Make Commands](#available-make-commands)
  - [Installation Scripts](#installation-scripts)
  - [API Documentation](#api-documentation)
  - [Environment Definitions](#environment-definitions)
  - [Container Building](#container-building)
  - [Security (Web UI)](#security-web-ui)
  - [Development](#development)
  - [Troubleshooting (Web UI)](#troubleshooting-web-ui)
  - [Contributing](#contributing)
  - [License (Web UI)](#license-web-ui)
  - [Support](#support)

## Prerequisites

### System Requirements
- **Operating System**: RHEL 8+, Fedora 35+, or compatible Linux distribution
- **Python**: 3.9+ (3.11+ recommended)
- **Container Runtime**: Podman 4.0+ (preferred) or Docker
- **Ansible**: 2.12+ (installed automatically if not present)
- **Memory**: Minimum 4GB RAM
- **Disk Space**: At least 10GB free space for builds

### Required Credentials
- Valid Red Hat Customer Portal account
- Access to registry.redhat.io
- Ansible Automation Platform subscription (for certain base images)

### Permissions
- Sudo privileges for package installation
- User namespace configuration (`/etc/subuid` and `/etc/subgid`)
- Firewall configuration access (if using Web UI)

## Features

### Core Features
- **Automated Environment Setup**: Complete system preparation and dependency installation
- **Multi-Distribution Support**: Works on RHEL, Fedora, and compatible systems
- **Intelligent Authentication**: Automatic registry login with fallback mechanisms
- **Rootless Container Builds**: Secure container building without root privileges
- **Build Validation**: Pre and post-build verification
- **Comprehensive Logging**: Detailed build logs and error reporting

### Advanced Features
- **Interactive Environment Selection**: Choose from multiple pre-configured environments
- **Custom Environment Creation**: Build vendor-specific or custom environments
- **Configuration Management**: Automated handling of build contexts and dependencies
- **Build Optimization**: Intelligent caching and incremental builds
- **Registry Integration**: Seamless push/pull from Red Hat registries

## Directory Structure

```
Base_EE-DE_Builder/
├── README.md                           # This file
├── ansible.cfg                         # Ansible configuration
├── site.yml                           # Main entry point playbook
├── build_environments.yml             # Environment build automation
├── requirements.txt                    # Python dependencies
├── roles/                             # Ansible roles
│   ├── system_setup/                  # System preparation
│   ├── credential_manager/            # Credential handling
│   ├── ee_builder/                    # Container building
│   └── ee_test/                       # Build validation
├── environments/                      # EE/DE definitions
│   ├── rhel-8-ee-minimal/
│   ├── rhel-9-ee-minimal/
│   └── custom-environments/
├── configs/                           # Build configurations
├── templates/                         # Jinja2 templates
├── Launchers/                         # Desktop integration
├── frontend/                          # React TypeScript UI
├── backend/                           # FastAPI backend
└── scripts/                           # Utility scripts
```

## Quick Start

### Method 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Base_EE-DE_Builder

# Set your Red Hat credentials (optional - will be prompted if not set)
export RH_CDN_USER="your-username@redhat.com"
export RH_CDN_PASS="your-password"

# Run the main playbook
ansible-playbook site.yml
```

### Method 2: Manual Credential Setup

```bash
# Create credential file
mkdir -p ~/.ansible/conf
cat > ~/.ansible/conf/env.conf << EOL
rh_cdn_user=your-username@redhat.com
rh_cdn_pass=your-password
EOL

# Run the playbook
ansible-playbook site.yml
```

### Method 3: Web UI Setup

```bash
# Run automated web UI installation
chmod +x EE-DE_Builder_WebUI_Install_and_Setup.sh
./EE-DE_Builder_WebUI_Install_and_Setup.sh

# Or use Make commands
make setup
make dev
```

## Usage

### Running the CLI

The CLI provides a straightforward way to build execution environments:

```bash
# Build environments with interactive selection
ansible-playbook build_environments.yml

# Build specific environment
ansible-playbook build_environments.yml -e "target_environment=rhel-9-ee-minimal"

# Skip prompts with pre-configured credentials
ansible-playbook site.yml --extra-vars "@configs/production.yml"
```

### Running the Web UI

After setup, launch the web interface:

```bash
# Command line launchers
ee-de-webui-app      # GUI launcher
ee-de-webui-gui      # Shell launcher

# Direct browser access
firefox http://localhost:3000

# Manual server start
make dev
```

### Customizing for Vendor Products

Create vendor-specific environments by copying and modifying existing ones:

```bash
# Example: Create VMware-compatible environment
cp -r environments/rhel-9-ee-minimal environments/rhel-9-ee-minimal-vmware

# Edit the new environment
cd environments/rhel-9-ee-minimal-vmware
# Modify requirements.yml, requirements.txt, and bindep.txt
```

### Additional Steps

1. **Review and edit environment definitions:**
   - Add or modify directories under `environments/` for each RHEL EE you wish to build.
   - Ensure each environment has an `execution-environment.yml` file.

2. **Check build logs:**
   - Logs are available in `/var/log/ansible-builder.log` and `/tmp/ee-build-<env>/build.log`.

## Configuration

### Environment Variables

```bash
# Registry Authentication
RH_CDN_USER=your-username@redhat.com
RH_CDN_PASS=your-password

# Build Configuration
BUILD_USER=ansible                     # User for builds
CONTAINER_RUNTIME=podman              # podman or docker
BUILD_PARALLEL=true                   # Enable parallel builds
```

### System Configuration

The playbook automatically configures:
- Container runtime (Podman/Docker)
- User namespaces for rootless containers
- Registry authentication
- Build directories and permissions
- Firewall rules (for Web UI)

### Custom Configurations

Modify `group_vars/all.yml` for global settings:

```yaml
# Build settings
base_images:
  rhel8: "registry.redhat.io/ansible-automation-platform-24/ee-minimal-rhel8:latest"
  rhel9: "registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel9:latest"

# Registry settings
registry_url: "registry.redhat.io"
push_images: false
cleanup_builds: true
```

## Security

### Credential Management
- Credentials stored in `~/.ansible/conf/env.conf` with restricted permissions (600)
- No credentials logged or displayed in output
- Automatic credential validation and secure prompting

### Container Security
- Rootless container builds by default
- User namespace isolation
- No privileged container operations
- Registry authentication with secure token handling

### Network Security
- Web UI uses localhost binding by default
- Configurable firewall rules
- HTTPS support for production deployments

## Troubleshooting

### Common Issues

#### 1. Registry Authentication Failures

**Problem**: `podman login` fails with permission errors

**Solution**:
```bash
# Check rootless configuration
podman info --format '{{ .host.security.rootless }}'

# Manual login test
sudo podman login registry.redhat.io --username your-user

# Fix user namespaces
echo "$(id -un):100000:65536" | sudo tee -a /etc/subuid
echo "$(id -gn):100000:65536" | sudo tee -a /etc/subgid
```

#### 2. Subscription Manager Issues

**Problem**: `subscription-manager` command fails on non-RHEL systems

**Solution**: The playbook automatically detects non-RHEL systems and uses alternative repositories.

#### 3. Build Failures

**Problem**: Container builds fail with space or permission errors

**Solution**:
```bash
# Check disk space
df -h

# Clean old containers
podman system prune -a

# Check build logs
tail -f /tmp/ee-build-*/build.log
```

#### 4. Web UI Connection Issues

**Problem**: Cannot access web interface

**Solution**:
```bash
# Check services
systemctl --user status podman
ss -tlnp | grep -E '(3000|8000)'

# Restart services
make clean && make dev
```

### Debug Mode

Enable verbose logging:

```bash
# CLI debug
ansible-playbook site.yml -vvv

# Web UI debug
DEBUG=true make dev
```

### Log Files

Check these locations for detailed logs:
- `/var/log/ansible-builder.log` - Build logs
- `/tmp/ee-build-<env>/build.log` - Environment-specific logs
- `~/.ansible/conf/env.conf` - Credential configuration
- `/var/log/EE-DE_Builder_WebUI.log` - Web UI installation log

## License

This project is licensed under the MIT License. See `LICENSE` file for details.

## Authors

- **Primary Maintainer**: shaddgallegos
- **Contributors**: See `CONTRIBUTORS.md` for full list

# EE-DE Builder - Ansible Environment Builder Web Application

A full-stack web application for building and managing Ansible Execution Environments (EE) and Decision Environments (DE) with an intuitive user interface.

## Features (Web UI)

- **Web-based Interface**: Modern React frontend with PatternFly UI components
- **FastAPI Backend**: High-performance Python API with real-time build monitoring
- **Container Building**: Automated Ansible Builder integration with Podman/Docker support
- **Environment Management**: Create, configure, and deploy custom EE/DE containers
- **Real-time Monitoring**: Live build status and log streaming
- **AAP Integration**: Direct integration with Ansible Automation Platform

## Architecture

```text
├── backend/           # FastAPI backend application
│   ├── app/
│   │   ├── core/      # Configuration and settings
│   │   ├── routers/   # API endpoints
│   │   ├── services/  # Business logic
│   │   ├── models/    # Data models
│   │   └── utils/     # Utility functions
│   └── requirements.txt
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types/
│   └── package.json
├── environments/      # Environment definitions
├── artifact/          # Build artifacts
└── Makefile          # Development automation
```

## Technology Stack

### Backend

- **FastAPI**: Modern Python web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Data validation and settings
- **Ansible Builder**: Container building
- **Python 3.9+**

### Frontend

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe JavaScript
- **PatternFly**: Enterprise-grade UI components
- **Axios**: HTTP client
- **React Router**: Navigation

## Prerequisites (Web UI)

- Python 3.9+
- Node.js 18+ and npm
- Podman or Docker (for container building)
- Ansible Builder (installed via requirements.txt)

### Additional Requirements for Automated Setup

- Fedora or RHEL operating system
- Sudo privileges and membership in `wheel` group
- Internet connectivity for package downloads
- Quay.io account for container registry access

### GUI Requirements (Optional)

- Desktop environment (GNOME, KDE, XFCE, etc.) for desktop shortcuts
- Python3-tkinter for GUI launcher (installed automatically)
- X11 display for graphical applications

## Available Make Commands

```bash
make setup          # Complete project setup
make dev             # Start development servers
make backend         # Start only backend server
make frontend        # Start only frontend server
make install-backend # Install Python dependencies
make install-frontend # Install Node.js dependencies
make clean           # Clean build artifacts
make test            # Run tests
make build           # Build for production
make help            # Show available commands
```

## Installation Scripts

### Automated Setup Script

The `EE-DE_Builder_WebUI_Install_and_Setup.sh` script provides a complete automated installation:

```bash
./EE-DE_Builder_WebUI_Install_and_Setup.sh
```

**Features:**

- System validation (OS, network, sudo privileges)
- Package installation (Python, Node.js, Chrome, dependencies)
- Firewall and SELinux configuration
- Container runtime setup and authentication
- Desktop application installation
- Command-line launcher creation
- Comprehensive logging to `/var/log/EE-DE_Builder_WebUI.log`

**Launcher Installation:**

- Creates desktop applications in `~/.local/share/applications/`
- Installs desktop shortcuts to `~/Desktop/` (if exists)
- Adds command-line launchers to `~/.local/bin/`
- Installs system-wide applications to `/usr/share/applications/`
- Updates desktop databases automatically

## API Documentation

When the backend is running, access the interactive API documentation:

- **Swagger UI**: <http://localhost:8000/docs>
- **ReDoc**: <http://localhost:8000/redoc>

## Environment Definitions

Place your Ansible Builder environment definitions in the `environments/` directory:

```yaml
# environments/my-custom-ee/execution-environment.yml
version: 3
images:
  base_image:
    name: registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel9:latest
dependencies:
  python: requirements.txt
  system: bindep.txt
  galaxy: requirements.yml
additional_build_steps:
  prepend_base:
    - RUN whoami
  append_final:
    - RUN echo "Build complete"
```

## Container Building

The application supports both Podman and Docker for container building:

- **Podman (default)**: Rootless container building
- **Docker**: Traditional container building (requires Docker daemon)

Set your preference in the configuration or environment variables.

## Security (Web UI)

- **CORS**: Configured for local development
- **Input Validation**: Pydantic models ensure data integrity
- **Container Security**: Follows Ansible Builder security practices

## Development

### Project Structure Guidelines

- **Backend**: Follow FastAPI best practices with dependency injection
- **Frontend**: Use TypeScript and functional components with hooks
- **API**: RESTful design with proper HTTP status codes
- **Error Handling**: Comprehensive error handling on both ends

### Adding New Features

1. **Backend**: Add routes in `backend/app/routers/`
2. **Frontend**: Add components in `frontend/src/components/`
3. **Models**: Define data models in `backend/app/models/`
4. **Services**: Business logic in `backend/app/services/`

## Troubleshooting (Web UI)

### Common Issues

**Port Already in Use**

```bash
# Kill processes on ports 3000 and 8000
make clean
```

**Virtual Environment Issues**

```bash
# Remove and recreate virtual environment
rm -rf venv
make setup
```

**Container Runtime Issues**

```bash
# Check Podman/Docker installation
podman --version
# or
docker --version

# Ensure service is running
systemctl --user start podman
```

**Desktop Launcher Issues**

```bash
# Reinstall launchers manually
mkdir -p ~/.local/share/applications
cp Launchers/*.desktop ~/.local/share/applications/
chmod +x ~/.local/share/applications/*.desktop
update-desktop-database ~/.local/share/applications/

# For desktop shortcuts
mkdir -p ~/Desktop
cp Launchers/*.desktop ~/Desktop/
chmod +x ~/Desktop/*.desktop
```

**GUI Application Not Starting**

```bash
# Install GUI dependencies
sudo dnf install python3-tkinter

# Check display variable
echo $DISPLAY

# Test GUI availability
python3 -c "import tkinter; tkinter.Tk()"
```

**Command Line Launchers Not Found**

```bash
# Add to PATH
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# Or run directly
~/.local/bin/ee-de-webui-app
```

**"Already Installed" Messages**

```bash
# These messages are normal and indicate successful dependency verification:
# "Package python3-tkinter-X.X.X is already installed"
# "Requirement already satisfied: requests"
# This means the script is working correctly and skipping unnecessary reinstalls
```

**Installation Script Hangs or Stops**

```bash
# Check the log file for detailed error information
tail -f /var/log/EE-DE_Builder_WebUI.log

# If the script stops at system-wide installation, try manual installation:
sudo cp Launchers/*.desktop /usr/share/applications/
sudo chmod 644 /usr/share/applications/EE-DE_*.desktop
sudo update-desktop-database /usr/share/applications/
```

## Contributing

Contributions welcome! Please submit pull requests with:

- Clear descriptions of changes
- Test results from staging environments
- Updates to documentation as needed

## License (Web UI)

This section covers licensing for the Web UI components of this project. The project is licensed under the MIT License — see the top-level LICENSE file for full terms and copyright information.

## Support

For support, please contact the maintainers or open an issue on the GitHub repository.
