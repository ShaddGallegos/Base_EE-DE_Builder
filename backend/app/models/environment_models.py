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
