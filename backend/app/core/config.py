#!/usr/bin/env python3
"""
User-configurable variables - modify as needed
"""
import os
import getpass

# User configuration
USER = os.getenv('USER', getpass.getuser())
USER_EMAIL = os.getenv('USER_EMAIL', f"{USER}@{os.getenv('COMPANY_DOMAIN', 'example.com')}")
COMPANY_NAME = os.getenv('COMPANY_NAME', 'Your Company')
COMPANY_DOMAIN = os.getenv('COMPANY_DOMAIN', 'example.com')

# backend/app/core/config.py - Application Configuration

import os
from typing import Dict, List, Any, ClassVar
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # Application Info
    APP_NAME: str = "EE-DE Builder API"
    APP_DESCRIPTION: str = "Ansible Execution Environment and Decision Environment Builder"
    VERSION: str = "1.0.0"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = False
    ENVIRONMENT: str = "production"
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",  # React dev server
        "http://localhost:8000",  # Self
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000"
    ]
    
    # Container Runtime
    CONTAINER_RUNTIME: str = "podman"  # or "docker"
    
    # Paths
    ENVIRONMENTS_DIR: str = "../environments"  # Go up one level from backend/
    PLAYBOOK_PATH: str = "../build_environments.yml"  # Go up one level from backend/
    
    # Build Configuration
    BUILD_CLEANUP_HOURS: int = 1  # Hours to keep completed builds
    MAX_CONCURRENT_BUILDS: int = 3
    BUILD_TIMEOUT_MINUTES: int = 30
    
    # Red Hat Registry
    RH_REGISTRY_URL: str = "registry.redhat.io"
    
    # Available Base Images
    AVAILABLE_BASE_IMAGES: ClassVar[Dict[str, Dict[str, Any]]] = {
        "ee-minimal-rhel9": {
            "name": "registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel9:latest",
            "description": "Minimal RHEL 9 Execution Environment - lightweight base",
            "type": "EE",
            "os": "RHEL 9"
        },
        "ee-supported-rhel9": {
            "name": "registry.redhat.io/ansible-automation-platform-25/ee-supported-rhel9:latest", 
            "description": "Supported RHEL 9 Execution Environment - includes common collections",
            "type": "EE",
            "os": "RHEL 9"
        },
        "de-supported-rhel9": {
            "name": "registry.redhat.io/ansible-automation-platform-25/de-supported-rhel9:latest",
            "description": "Development Environment RHEL 9 - includes development tools",
            "type": "DE", 
            "os": "RHEL 9"
        },
        "ee-minimal-rhel8": {
            "name": "registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel8:latest",
            "description": "Minimal RHEL 8 Execution Environment",
            "type": "EE",
            "os": "RHEL 8"
        },
        "ee-supported-rhel8": {
            "name": "registry.redhat.io/ansible-automation-platform-25/ee-supported-rhel8:latest",
            "description": "Supported RHEL 8 Execution Environment",
            "type": "EE", 
            "os": "RHEL 8"
        }
    }
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


# Create global settings instance
settings = Settings()


# Development override
if os.getenv("DEBUG", "").lower() in ("1", "true", "yes"):
    settings.DEBUG = True
    settings.ENVIRONMENT = "development"
