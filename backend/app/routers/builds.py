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

# backend/app/routers/builds.py - Build management endpoints

from fastapi import APIRouter, HTTPException
from typing import List
from app.models.build_models import BuildRequest, BuildResponse, BuildStatus, BuildListItem
from app.services.build_service import build_service

router = APIRouter()


@router.post("/start", response_model=BuildResponse)
async def start_build(build_request: BuildRequest):
    """Start building selected environments"""
    try:
        return await build_service.start_build(build_request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start build: {str(e)}")


@router.get("/{build_id}/status", response_model=BuildStatus)
async def get_build_status(build_id: str):
    """Get build status, logs, and results"""
    try:
        return await build_service.get_build_status(build_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("", response_model=List[BuildListItem])
async def list_builds():
    """List all builds (running and completed)"""
    return build_service.list_builds()


@router.delete("/{build_id}")
async def cancel_build(build_id: str):
    """Cancel a running build"""
    try:
        return await build_service.cancel_build(build_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
