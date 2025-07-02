# backend/app/services/environment_service.py - Environment Management Service

import yaml
from datetime import datetime
from pathlib import Path
from typing import List, Dict

from app.models.environment_models import Environment, EnvironmentList, EnvironmentHealth, EnvironmentAnalysis
from app.core.config import settings


class EnvironmentService:
    """Service for managing execution environments"""
    
    def get_environments(self) -> EnvironmentList:
        """Get list of available environments"""
        environments = []
        environments_dir = Path(settings.ENVIRONMENTS_DIR)
        
        if not environments_dir.exists():
            return EnvironmentList(environments=[])
        
        for env_dir in environments_dir.iterdir():
            if env_dir.is_dir() and not env_dir.name.startswith('.'):
                ee_file = env_dir / "execution-environment.yml"
                if ee_file.exists():
                    environments.append(Environment(
                        name=env_dir.name,
                        path=str(env_dir),
                        has_execution_environment=True
                    ))
        
        return EnvironmentList(environments=sorted(environments, key=lambda x: x.name))
    
    def analyze_environment_health(self, env_dir: Path) -> EnvironmentHealth:
        """Analyze an environment for build readiness and issues"""
        issues = []
        severity = "low"
        ready = True
        
        ee_file = env_dir / "execution-environment.yml"
        
        if not ee_file.exists():
            return EnvironmentHealth(
                ready=False,
                issues=["Missing execution-environment.yml"],
                severity="high"
            )
        
        try:
            with open(ee_file, 'r') as f:
                ee_config = yaml.safe_load(f)
            
            if not ee_config:
                return EnvironmentHealth(
                    ready=False,
                    issues=["Empty execution-environment.yml"],
                    severity="high"
                )
            
            # Check required fields
            if "version" not in ee_config:
                issues.append("Missing version field")
                severity = "medium"
            
            # Check for base image
            if "images" not in ee_config and "image" not in ee_config:
                issues.append("No base image specified")
                severity = "high"
                ready = False
            
            # Check dependency files
            dependencies = ee_config.get("dependencies", {})
            
            # Check Python requirements
            python_deps = dependencies.get("python")
            if python_deps:
                req_file = self._extract_requirement_file(python_deps)
                if req_file and not (env_dir / req_file).exists():
                    issues.append(f"Missing {req_file}")
                    severity = "medium"
            
            # Check Ansible requirements
            galaxy_deps = dependencies.get("galaxy")
            if galaxy_deps:
                req_file = self._extract_requirement_file(galaxy_deps)
                if req_file and not (env_dir / req_file).exists():
                    issues.append(f"Missing {req_file}")
                    severity = "medium"
            
            # Check system packages
            system_deps = dependencies.get("system")
            if system_deps:
                req_file = self._extract_requirement_file(system_deps)
                if req_file and not (env_dir / req_file).exists():
                    issues.append(f"Missing {req_file}")
                    severity = "medium"
            
        except yaml.YAMLError as e:
            return EnvironmentHealth(
                ready=False,
                issues=[f"Invalid YAML syntax: {str(e)[:50]}..."],
                severity="high"
            )
        except Exception as e:
            return EnvironmentHealth(
                ready=False,
                issues=[f"Parse error: {str(e)[:50]}..."],
                severity="high"
            )
        
        if severity in ["medium", "high"]:
            ready = False
        
        return EnvironmentHealth(ready=ready, issues=issues, severity=severity)
    
    def estimate_image_size(self, env_dir: Path) -> int:
        """Estimate container image size based on dependencies"""
        base_size = 200  # Base EE image ~200MB
        estimated_size = base_size
        
        ee_file = env_dir / "execution-environment.yml"
        if not ee_file.exists():
            return estimated_size
        
        try:
            with open(ee_file, 'r') as f:
                ee_config = yaml.safe_load(f)
            
            if not ee_config:
                return estimated_size
            
            dependencies = ee_config.get("dependencies", {})
            
            # Estimate based on dependencies
            estimated_size += self._estimate_python_packages(env_dir, dependencies.get("python"))
            estimated_size += self._estimate_galaxy_collections(env_dir, dependencies.get("galaxy"))
            estimated_size += self._estimate_system_packages(env_dir, dependencies.get("system"))
            
        except Exception as e:
            print(f"❌ Error estimating size for {env_dir.name}: {e}")
        
        return min(estimated_size, 2000)  # Cap at 2GB
    
    def _extract_requirement_file(self, dep_config) -> str:
        """Extract requirement file path from dependency configuration"""
        if isinstance(dep_config, str):
            return dep_config
        elif isinstance(dep_config, dict):
            return dep_config.get("requirements") or dep_config.get("bindep")
        return None
    
    def _estimate_python_packages(self, env_dir: Path, python_deps) -> int:
        """Estimate size of Python packages"""
        if not python_deps:
            return 0
        
        req_file = self._extract_requirement_file(python_deps)
        if not req_file:
            return 0
        
        req_path = env_dir / req_file
        if not req_path.exists():
            return 0
        
        try:
            with open(req_path, 'r') as f:
                lines = f.readlines()
            package_count = len([line for line in lines if line.strip() and not line.startswith('#')])
            return package_count * 10  # ~10MB per package
        except:
            return 0
    
    def _estimate_galaxy_collections(self, env_dir: Path, galaxy_deps) -> int:
        """Estimate size of Ansible collections"""
        if not galaxy_deps:
            return 0
        
        req_file = self._extract_requirement_file(galaxy_deps)
        if not req_file:
            return 0
        
        req_path = env_dir / req_file
        if not req_path.exists():
            return 0
        
        try:
            with open(req_path, 'r') as f:
                galaxy_config = yaml.safe_load(f)
            
            if galaxy_config and "collections" in galaxy_config:
                collection_count = len(galaxy_config["collections"])
                return collection_count * 15  # ~15MB per collection
        except:
            pass
        
        return 0
    
    def _estimate_system_packages(self, env_dir: Path, system_deps) -> int:
        """Estimate size of system packages"""
        if not system_deps:
            return 0
        
        req_file = self._extract_requirement_file(system_deps)
        if not req_file:
            return 0
        
        req_path = env_dir / req_file
        if not req_path.exists():
            return 0
        
        try:
            with open(req_path, 'r') as f:
                lines = f.readlines()
            package_count = len([line for line in lines if line.strip() and not line.startswith('#')])
            return package_count * 20  # ~20MB per system package
        except:
            return 0


# Create global service instance
environment_service = EnvironmentService()
