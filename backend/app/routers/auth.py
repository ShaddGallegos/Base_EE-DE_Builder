# backend/app/routers/auth.py - Authentication endpoints

from fastapi import APIRouter
from app.models.auth_models import RHAuthRequest, RHAuthResponse, AuthStatus, LogoutResponse
from app.services.auth_service import auth_service

router = APIRouter()


@router.post("/redhat-login", response_model=RHAuthResponse)
async def redhat_registry_login(auth_request: RHAuthRequest):
    """Authenticate with Red Hat registry"""
    return await auth_service.login_redhat_registry(auth_request)


@router.get("/redhat-status", response_model=AuthStatus)
async def redhat_registry_status():
    """Check Red Hat registry authentication status"""
    return await auth_service.get_auth_status()


@router.post("/redhat-logout", response_model=LogoutResponse)
async def redhat_registry_logout():
    """Logout from Red Hat registry"""
    return await auth_service.logout_redhat_registry()
