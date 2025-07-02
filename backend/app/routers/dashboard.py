# backend/app/routers/dashboard.py - Dashboard and analytics endpoints

from fastapi import APIRouter
from app.models.dashboard_models import DashboardStats
from app.services.dashboard_service import dashboard_service

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get dashboard statistics for environment health and build monitoring"""
    return dashboard_service.get_dashboard_stats()
