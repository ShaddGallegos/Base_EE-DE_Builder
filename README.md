# EE-DE Builder - Ansible Environment Builder Web Application

A full-stack web application for building and managing Ansible Execution
Environments (EE) and Decision Environments (DE) with an intuitive user
interface.

## Purpose & Workflow

This project serves as a guide and reference implementation for:

1. **Building** custom EE/DE containers with specific dependencies and tools
2. **Publishing** these environments to your Automation Hub
3. **Deploying** them to your AAP Controller
4. **Utilizing** them in your automation workflows

## Key Components

- **Environment Definitions**: Reference implementations demonstrating how to define EE/DE containers
- **Build Scripts**: Utilities to streamline container creation
- **Documentation**: Guidance on integrating with AAP infrastructure
- **Examples**: Working configurations for common use cases

## Environment Definition Templates

The project provides two approaches to defining environments:

### 1. Single-File Definition (`base_environment_definition_1-file`)
- All configuration in a single YAML file
- Simpler for straightforward environments
- Easier management for basic needs

### 2. Multi-File Definition (`base_environment_definition_4-file`)
- Configuration split across multiple specialized files:
  - `execution-environment.yml`: Main configuration
  - `requirements.txt`: Python dependencies
  - `bindep.txt`: System dependencies  
  - `requirements.yml`: Ansible Collections
- Better for complex environments
- More maintainable for larger teams

## Specialized Environment References

Additional reference implementations include:
- RHEL 8-based environments
- Minimal configurations
- Development tool-enhanced environments

## Getting Started

1. Clone this repository:
   ```bash
   git clone https://github.com/ShaddGallegos/Base_EE-DE_Builder.git
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

1. **Access the Application**: Open http://localhost:3000
2. **Dashboard**: View build status and environment overview
3. **Create Environment**: Use the wizard to define new EE/DE containers
4. **Monitor Builds**: Real-time build progress and logs
5. **Manage Environments**: Deploy to Automation Hub and Controller

## Environment Definition Templates

### 1. Single File Definition (`base_environment_definition_1-file`)
- Simple configuration in execution-environment.yml only
- Best for basic environments with minimal dependencies
- Quick setup and testing

### 2. Multi-File Definition (`base_environment_definition_4-file`)
- Configuration split across multiple specialized files:
  - execution-environment.yml: Main configuration
  - requirements.txt: Python dependencies
  - `bindep.txt`: System dependencies  
  - requirements.yml: Ansible Collections
- Better for complex environments
- More maintainable for larger teams

## 🔧 Available Make Commands

## Directory Structure & Naming Convention

Environments follow a standardized directory structure:
```
environments/
└── OS_Type/
    └── major_version/
        └── EE_or_DE/
            └── minimal_or_supported/
                └── optional_vendor/
```

Example:
```
environments/
└── rhel/
    ├── 8/
    │   ├── ee/
    │   │   ├── minimal/
    │   │   └── supported/
    │   └── de/
    │       ├── minimal/
    │       ├── supported/
    │       └── devtools/
    └── 9/
        ├── ee/
        │   ├── minimal/
        │   └── supported/
        └── de/
            ├── minimal/
            └── supported/
```

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

## ⚙️ Configuration

### Backend Configuration

Environment variables (create `.env` in project root):

```bash
# Development settings
DEBUG=true
LOG_LEVEL=info

# Container settings
CONTAINER_RUNTIME=podman  # or docker
REGISTRY_URL=your-registry.example.com
REGISTRY_USERNAME=your-username
REGISTRY_PASSWORD=your-password

# Build settings
BUILD_TIMEOUT=3600
MAX_CONCURRENT_BUILDS=3
```

### Building Environments with Ansible

#### Prerequisites

- Ansible 2.9 or newer
- ansible-builder package
- podman or docker
- Access to container registries:
  ```bash
  podman login registry.redhat.io
  ```

#### Quick Start with Ansible

1. Clone this repository:
   ```bash
   git clone https://github.com/ShaddGallegos/Base_EE-DE_Builder.git
   cd Base_EE-DE_Builder
   ```

2. Build all pre-defined environments:
   ```bash
   ansible-playbook -i localhost, build_environments.yml -K
   ```

3. Push to your Automation Hub:
   ```bash
   podman push your-environment-name your-automation-hub.example.com/your-environment-name
   ```

## Building Specific Environments

To build only specific environments (e.g., just RHEL 9 EE Minimal):

1. Remove or rename other environment directories:
   ```bash
   # Keep only the environment you want to build
   mv environments/rhel-9-ee-minimal environments-keep
   rm -rf environments/*
   mv environments-keep environments/rhel-9-ee-minimal
   ```

2. Run the build playbook:
   ```bash
   ansible-playbook -i localhost, build_environments.yml -K
   ```

## Creating Custom Vendor-Specific Environments

1. Copy an existing environment as a template:
   ```bash
   cp -r environments/rhel-9-ee-minimal environments/rhel-9-ee-minimal-vmware
   ```

2. Customize the environment files:
   - Add vendor-specific collections to requirements.yml
   - Add Python dependencies to requirements.txt
   - Add system packages to `bindep.txt`
   - Modify execution-environment.yml if needed

### Adding Custom Files or RPMs

1. To include local files in your environment, place them in:
   ```
   Base_EE-DE_Builder/files/
   ```

2. Reference these files in your configuration, or use remote resources:
   ```yaml
   # Example in execution-environment.yml
   additional_build_steps:
     prepend:
       - COPY files/custom.rpm /tmp/
       - RUN rpm -i /tmp/custom.rpm
   ```

### Environment Variables

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

```
environments/
├── my-custom-ee/
│   ├── execution-environment.yml
│   ├── requirements.txt
│   ├── requirements.yml
│   └── bindep.txt
```

## Examples

### Chrome-Enabled Development Environment

The `rhel-8-devtools` environment includes Google Chrome for web browser automation:

```yaml
# Example from rhel-8-devtools/execution-environment.yml
additional_build_steps:
  prepend:
    - RUN dnf install -y wget
    - RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
    - RUN dnf localinstall -y google-chrome-stable_current_x86_64.rpm
```

### VMware-Specific Environment

To create a VMware-specific environment:

```bash
cp -r environments/rhel-9-ee-minimal environments/rhel-9-ee-minimal-vmware
```

Then add to requirements.yml:
```yaml
collections:
  - name: community.vmware
  - name: vmware.vmware_rest
```

## 📝 Environment Configuration Examples

### Complete Environment Definition

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
