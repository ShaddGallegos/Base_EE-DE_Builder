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

# backend/app/models/auth_models.py - Authentication models

from typing import Optional
from pydantic import BaseModel


class RHAuthRequest(BaseModel):
    username: str
    password: str


class RHAuthResponse(BaseModel):
    success: bool
    message: str


class AuthStatus(BaseModel):
    authenticated: bool
    username: Optional[str] = None
    message: str


class LogoutResponse(BaseModel):
    success: bool
    message: str
