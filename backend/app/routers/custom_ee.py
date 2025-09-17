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

# backend/app/routers/custom_ee.py - Custom EE wizard endpoints

from fastapi import APIRouter, HTTPException
from app.models.custom_ee_models import CustomEERequest, CustomEEResponse, EETemplates
from app.services.custom_ee_service import custom_ee_service
from app.core.config import settings

router = APIRouter()


@router.get("/base-images")
async def get_available_base_images():
    """Get list of available base images for custom EE creation"""
    return {"base_images": settings.AVAILABLE_BASE_IMAGES}


@router.post("/create", response_model=CustomEEResponse)
async def create_custom_ee(custom_ee: CustomEERequest):
    """Create a custom execution environment with wizard inputs or YAML import"""
    try:
        return await custom_ee_service.create_custom_ee(custom_ee)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileExistsError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/templates", response_model=EETemplates)
async def get_ee_templates():
    """Get common templates/examples for custom EE creation"""
    return custom_ee_service.get_ee_templates()
