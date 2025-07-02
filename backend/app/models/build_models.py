# backend/app/models/build_models.py - Build-related models

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class BuildRequest(BaseModel):
    environments: List[str]
    container_runtime: Optional[str] = "podman"


class BuildResponse(BaseModel):
    build_id: str
    status: str
    environments: List[str]
    message: str


class BuildStatus(BaseModel):
    build_id: str
    status: str  # "running", "completed", "failed", "cancelled"
    environments: List[str]
    start_time: datetime
    end_time: Optional[datetime] = None
    return_code: Optional[int] = None
    logs: List[str] = []
    successful_builds: List[str] = []
    failed_builds: List[str] = []


class BuildListItem(BaseModel):
    build_id: str
    status: str
    environments: List[str]
    start_time: datetime
    end_time: Optional[datetime] = None
    environment_count: int


class BuildList(BaseModel):
    builds: List[BuildListItem]
