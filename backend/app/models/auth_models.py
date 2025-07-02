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
