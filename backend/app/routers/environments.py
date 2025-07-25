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

# backend/app/routers/environments.py - Environment management endpoints

from fastapi import APIRouter
from app.models.environment_models import EnvironmentList
from app.services.environment_service import environment_service

router = APIRouter()


@router.get("", response_model=EnvironmentList)
async def get_environments():
    """Get list of available environments"""
    return environment_service.get_environments()
