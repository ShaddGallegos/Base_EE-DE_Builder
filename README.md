# EE-DE Builder - Ansible Environment Builder Web Application

A full-stack web application for building and managing Ansible Execution
Environments (EE) and Decision Environments (DE) with an intuitive user
interface.

## 🚀 Features

- **Web-based Interface**: Modern React frontend with PatternFly UI components
- **FastAPI Backend**: High-performance Python API with real-time build monitoring
- **Container Building**: Automated Ansible Builder integration with Podman/Docker support
- **Environment Management**: Create, configure, and deploy custom EE/DE containers
- **Real-time Monitoring**: Live build status and log streaming
- **AAP Integration**: Direct integration with Ansible Automation Platform

## 🏗️ Architecture

```
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

## 🛠️ Technology Stack

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

## 📋 Prerequisites

- **Python 3.9+**
- **Node.js 18+** and **npm**
- **Podman** or **Docker** (for container building)
- **Ansible Builder** (installed via requirements.txt)

### Additional Requirements for Automated Setup

- **Fedora or RHEL** operating system
- **Sudo privileges** and membership in `wheel` group
- **Internet connectivity** for package downloads
- **Quay.io account** for container registry access

### GUI Requirements (Optional)

- **Desktop environment** (GNOME, KDE, XFCE, etc.) for desktop shortcuts
- **Python3-tkinter** for GUI launcher (installed automatically)
- **X11 display** for graphical applications

## 🚀 Quick Start

### Automated Setup (Recommended for Fedora/RHEL)

```bash
# Clone the repository
git clone https://github.com/rlopez133/Base_EE-DE_Builder.git
cd Base_EE-DE_Builder

# Run the automated setup script
chmod +x EE-DE_Builder_WebUI_Install_and_Setup.sh
./EE-DE_Builder_WebUI_Install_and_Setup.sh
```

This automated script will:
1. Validate system requirements and dependencies
2. Configure firewall and SELinux settings
3. Install all required packages (Python, Node.js, Chrome, etc.)
4. Set up container runtime (Podman) authentication
5. Create a Python virtual environment
6. Install all dependencies (backend & frontend)
7. Install desktop launchers and application shortcuts
8. Start both backend and frontend servers
9. Open the application in your browser

### Using Make (Manual Setup)

```bash
# Clone the repository
git clone https://github.com/rlopez133/Base_EE-DE_Builder.git
cd Base_EE-DE_Builder

# Set up everything and start the application
make setup
make dev
```

This will:
1. Create a Python virtual environment
2. Install all dependencies (backend & frontend)
3. Start both backend and frontend servers
4. Open the application in your browser

### Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

#### Backend Setup
```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup
```bash
# Install dependencies
cd frontend
npm install

# Start development server
npm start
```

</details>

## 🖥️ Usage

### Desktop Applications

After running the automated setup script, you can launch the application using:

**GUI Desktop Application:**
- **Builder WebUI**: Direct web interface launcher

**Command Line Launchers:**
```bash
# Python GUI launcher
ee-de-webui-app

# Shell GUI launcher  
ee-de-webui-gui
```

### Web Interface

1. **Access the Application**: Open http://localhost:3000
2. **Dashboard**: View build status and environment overview
3. **Create Environment**: Use the wizard to define new EE/DE containers
4. **Monitor Builds**: Real-time build progress and logs
5. **Manage Environments**: Deploy to Automation Hub and Controller

### Application Locations

- **User Applications**: `~/.local/share/applications/`
- **Desktop Shortcuts**: `~/Desktop/` (if Desktop directory exists)
- **System Applications**: `/usr/share/applications/`
- **Command Line**: `~/.local/bin/` (added to PATH)

## 🔧 Available Make Commands

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

## 🚀 Installation Scripts

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

## ⚙️ Configuration

### Backend Configuration

Environment variables (create `.env` in project root):

```bash
# Server Configuration
DEBUG=true
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

# Container Runtime
CONTAINER_RUNTIME=podman  # or 'docker'

# Build Settings
BUILD_TIMEOUT_MINUTES=30
MAX_CONCURRENT_BUILDS=3
BUILD_CLEANUP_HOURS=1

# Paths (relative to backend/)
ENVIRONMENTS_DIR=../environments
PLAYBOOK_PATH=../build_environments.yml
```

### Frontend Configuration

The frontend automatically proxies API requests to `http://localhost:8000` during development.

## 🔗 API Documentation

When the backend is running, access the interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📁 Environment Definitions

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

## 🐳 Container Building

The application supports both Podman and Docker for container building:

- **Podman** (default): Rootless container building
- **Docker**: Traditional container building (requires Docker daemon)

Set your preference in the configuration or environment variables.

## 🔒 Security

- **CORS**: Configured for local development
- **Input Validation**: Pydantic models ensure data integrity
- **Container Security**: Follows Ansible Builder security practices

## 🧪 Development

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

## 🔍 Troubleshooting

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Check the `/docs` directory for detailed guides
- **API Reference**: Use the interactive docs at `/docs` when running
