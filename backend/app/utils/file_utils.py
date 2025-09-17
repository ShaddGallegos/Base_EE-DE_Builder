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

# backend/app/utils/file_utils.py - File and filesystem utilities

import os
import tempfile
import yaml
from pathlib import Path
from typing import Optional


def cleanup_temp_file(file_path: Optional[str]):
    """Safely clean up a temporary file"""
    if not file_path:
        return
    
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
            print(f"🧹 Cleaned up temp file: {file_path}")
    except Exception as e:
        print(f"⚠️ Could not clean up temp file {file_path}: {e}")


def create_temp_yaml(data: dict) -> str:
    """Create a temporary YAML file with the given data"""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as temp_file:
        yaml.dump(data, temp_file, default_flow_style=False)
        return temp_file.name


def ensure_directory_exists(directory_path: str) -> Path:
    """Ensure a directory exists, create if it doesn't"""
    path = Path(directory_path)
    path.mkdir(parents=True, exist_ok=True)
    return path


def read_yaml_file(file_path: Path) -> dict:
    """Safely read a YAML file"""
    try:
        with open(file_path, 'r') as f:
            return yaml.safe_load(f) or {}
    except yaml.YAMLError as e:
        raise ValueError(f"Invalid YAML syntax in {file_path}: {e}")
    except FileNotFoundError:
        raise FileNotFoundError(f"File not found: {file_path}")
    except Exception as e:
        raise RuntimeError(f"Error reading {file_path}: {e}")


def write_yaml_file(file_path: Path, data: dict):
    """Safely write data to a YAML file"""
    try:
        with open(file_path, 'w') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
    except Exception as e:
        raise RuntimeError(f"Error writing to {file_path}: {e}")


def write_text_file(file_path: Path, content: str):
    """Write content to a text file"""
    try:
        with open(file_path, 'w') as f:
            f.write(content)
    except Exception as e:
        raise RuntimeError(f"Error writing to {file_path}: {e}")


def get_file_modification_time(file_path: Path) -> Optional[float]:
    """Get file modification time as timestamp"""
    try:
        return file_path.stat().st_mtime if file_path.exists() else None
    except Exception:
        return None
