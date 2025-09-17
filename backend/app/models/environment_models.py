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

# backend/app/models/environment_models.py - Environment models

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class Environment(BaseModel):
    name: str
    path: str
    has_execution_environment: bool


class EnvironmentList(BaseModel):
    environments: List[Environment]


class EnvironmentHealth(BaseModel):
    ready: bool
    issues: List[str]
    severity: str  # "low", "medium", "high"


class EnvironmentAnalysis(BaseModel):
    name: str
    health: EnvironmentHealth
    estimated_size_mb: int
    last_modified: Optional[datetime] = None
