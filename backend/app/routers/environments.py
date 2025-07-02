# backend/app/routers/environments.py - Environment management endpoints

from fastapi import APIRouter
from app.models.environment_models import EnvironmentList
from app.services.environment_service import environment_service

router = APIRouter()


@router.get("", response_model=EnvironmentList)
async def get_environments():
    """Get list of available environments"""
    return environment_service.get_environments()
