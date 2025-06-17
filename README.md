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

## 🚀 Quick Start

### Using Make (Recommended)

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

1. **Access the Application**: Open http://localhost:3000
2. **Dashboard**: View build status and environment overview
3. **Create Environment**: Use the wizard to define new EE/DE containers
4. **Monitor Builds**: Real-time build progress and logs
5. **Manage Environments**: Deploy to Automation Hub and Controller

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
