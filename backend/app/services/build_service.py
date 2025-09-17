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

# backend/app/services/build_service.py - Build Management Service

import asyncio
import uuid
import os
import tempfile
import yaml
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional

from app.models.build_models import BuildRequest, BuildResponse, BuildStatus, BuildListItem
from app.core.config import settings
from app.utils.container_utils import validate_container_runtime
from app.utils.file_utils import cleanup_temp_file


class BuildService:
    """Service for managing container builds"""
    
    def __init__(self):
        # Enhanced storage for builds - keeps completed builds for configured time
        self.running_builds: Dict[str, dict] = {}
        self.completed_builds: Dict[str, dict] = {}
    
    def cleanup_old_builds(self):
        """Remove completed builds older than configured hours"""
        cutoff_time = datetime.now() - timedelta(hours=settings.BUILD_CLEANUP_HOURS)
        
        builds_to_remove = []
        for build_id, build_info in self.completed_builds.items():
            if build_info.get("end_time") and build_info["end_time"] < cutoff_time:
                builds_to_remove.append(build_id)
        
        for build_id in builds_to_remove:
            print(f"🧹 Cleaning up old build: {build_id}")
            del self.completed_builds[build_id]
    
    def get_build_info(self, build_id: str) -> Optional[dict]:
        """Get build info from either running or completed builds"""
        if build_id in self.running_builds:
            return self.running_builds[build_id]
        
        if build_id in self.completed_builds:
            return self.completed_builds[build_id]
        
        return None
    
    def move_to_completed(self, build_id: str):
        """Move a build from running to completed storage"""
        if build_id in self.running_builds:
            build_info = self.running_builds[build_id]
            build_info["end_time"] = datetime.now()
            self.completed_builds[build_id] = build_info
            del self.running_builds[build_id]
            print(f"✅ Moved build {build_id} to completed builds")
            print(f"📊 Running builds: {len(self.running_builds)}, Completed: {len(self.completed_builds)}")
        else:
            print(f"⚠️ Attempted to move non-existent build {build_id}")
    
    async def start_build(self, build_request: BuildRequest) -> BuildResponse:
        """Start building selected environments using ansible-playbook"""
        selected_environments = build_request.environments
        container_runtime = build_request.container_runtime or settings.CONTAINER_RUNTIME
        
        if not selected_environments:
            raise ValueError("No environments specified")
        
        # Validate environments exist
        environments_dir = Path(settings.ENVIRONMENTS_DIR)
        if not environments_dir.exists():
            raise FileNotFoundError("Environments directory not found")
        
        # Validate each environment
        for env in selected_environments:
            env_path = environments_dir / env
            if not env_path.exists():
                raise FileNotFoundError(f"Environment '{env}' not found")
            
            ee_file = env_path / "execution-environment.yml"
            if not ee_file.exists():
                raise FileNotFoundError(f"execution-environment.yml not found in '{env}'")
        
        # Validate container runtime
        await validate_container_runtime()
        
        # Check for concurrent build limit
        if len(self.running_builds) >= settings.MAX_CONCURRENT_BUILDS:
            raise RuntimeError(f"Maximum concurrent builds ({settings.MAX_CONCURRENT_BUILDS}) reached")
        
        # Create temporary variables file
        variables = {
            "selected_environments": selected_environments,
            "container_runtime": container_runtime
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.yml', delete=False) as temp_file:
            yaml.dump(variables, temp_file, default_flow_style=False)
            temp_vars_file = temp_file.name
        
        # Prepare ansible-playbook command
        cmd = [
            "ansible-playbook",
            settings.PLAYBOOK_PATH,
            "-e", f"@{temp_vars_file}",
            "-v"
        ]
        
        # Start build process
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=os.getcwd()
        )
        
        # Generate unique build ID
        build_id = str(uuid.uuid4())
        
        print(f"🚀 Created build ID: {build_id}")
        
        # Store process info for monitoring
        self.running_builds[build_id] = {
            "process": process,
            "environments": selected_environments,
            "container_runtime": container_runtime,
            "temp_vars_file": temp_vars_file,
            "status": "running",
            "start_time": datetime.now(),
            "end_time": None,
            "return_code": None,
            "logs": [
                f"🚀 Build started at {datetime.now().strftime('%H:%M:%S')}",
                f"📦 Building environments: {', '.join(selected_environments)}",
                f"🔧 Container runtime: {container_runtime}",
                f"📋 Command: {' '.join(cmd[:3])} [...]",
                "⏳ Starting ansible-playbook..."
            ],
            "successful_builds": [],
            "failed_builds": [],
            "created_at": time.time()
        }
        
        print(f"✅ Stored build {build_id}. Total running builds: {len(self.running_builds)}")
        
        # Start background task to capture output
        asyncio.create_task(self._capture_build_output(build_id))
        
        # Cleanup old builds
        self.cleanup_old_builds()
        
        print(f"🎯 Started build {build_id} for environments: {selected_environments}")
        
        return BuildResponse(
            build_id=build_id,
            status="started",
            environments=selected_environments,
            message=f"Started building {len(selected_environments)} environments"
        )
    
    async def get_build_status(self, build_id: str) -> BuildStatus:
        """Get build status, logs, and results"""
        print(f"🔍 Looking for build: {build_id}")
        
        build_info = self.get_build_info(build_id)
        if not build_info:
            print(f"❌ Build {build_id} not found!")
            raise ValueError(f"Build {build_id} not found")
        
        print(f"✅ Found build {build_id} with status: {build_info.get('status')}")
        
        process = build_info.get("process")
        
        # Determine status
        if build_id in self.running_builds:
            if process and process.returncode is None:
                status = "running"
                end_time = None
            else:
                status = "completed" if build_info.get("return_code") == 0 else "failed"
                end_time = build_info.get("end_time")
                
                # Move to completed if not already moved
                if build_id in self.running_builds:
                    self.move_to_completed(build_id)
        else:
            status = "completed" if build_info.get("return_code") == 0 else "failed"
            end_time = build_info.get("end_time")
        
        # Update status in build_info
        build_info["status"] = status
        
        return BuildStatus(
            build_id=build_id,
            status=status,
            environments=build_info["environments"],
            start_time=build_info["start_time"],
            end_time=end_time,
            return_code=build_info.get("return_code"),
            logs=build_info.get("logs", []),
            successful_builds=build_info.get("successful_builds", []),
            failed_builds=build_info.get("failed_builds", [])
        )
    
    async def cancel_build(self, build_id: str) -> dict:
        """Cancel a running build"""
        build_info = self.get_build_info(build_id)
        if not build_info:
            raise ValueError("Build not found")
        
        process = build_info.get("process")
        
        if build_id in self.running_builds and process and process.returncode is None:
            try:
                process.terminate()
                await asyncio.sleep(2)
                if process.returncode is None:
                    process.kill()
                
                build_info["status"] = "cancelled"
                build_info["logs"].append(f"❌ Build cancelled at {datetime.now().strftime('%H:%M:%S')}")
                
                self.move_to_completed(build_id)
                
                return {"message": "Build cancelled successfully"}
            except Exception as e:
                raise RuntimeError(f"Failed to cancel build: {str(e)}")
        else:
            raise ValueError("Build is not running")
    
    def list_builds(self) -> List[BuildListItem]:
        """List all builds (running and completed)"""
        builds = []
        
        # Add running builds
        for build_id, build_info in self.running_builds.items():
            process = build_info.get("process")
            if process and process.returncode is None:
                status = "running"
            elif build_info.get("return_code") == 0:
                status = "completed"
            else:
                status = "failed"
            
            builds.append(BuildListItem(
                build_id=build_id,
                status=status,
                environments=build_info["environments"],
                start_time=build_info["start_time"],
                environment_count=len(build_info["environments"])
            ))
        
        # Add completed builds
        for build_id, build_info in self.completed_builds.items():
            status = "completed" if build_info.get("return_code") == 0 else "failed"
            
            builds.append(BuildListItem(
                build_id=build_id,
                status=status,
                environments=build_info["environments"],
                start_time=build_info["start_time"],
                end_time=build_info.get("end_time"),
                environment_count=len(build_info["environments"])
            ))
        
        return builds
    
    async def _capture_build_output(self, build_id: str):
        """Background task to capture real-time output from ansible-playbook"""
        if build_id not in self.running_builds:
            print(f"❌ Build {build_id} not found when trying to capture output")
            return
        
        build_info = self.running_builds[build_id]
        process = build_info["process"]
        
        try:
            print(f"📡 Starting output capture for build {build_id}")
            line_count = 0
            
            # Read output line by line
            while True:
                try:
                    line = await asyncio.wait_for(process.stdout.readline(), timeout=1.0)
                except asyncio.TimeoutError:
                    if process.returncode is not None:
                        break
                    continue
                
                if not line:
                    break
                
                line_text = line.decode('utf-8').strip()
                if line_text:
                    build_info["logs"].append(line_text)
                    line_count += 1
                    
                    if line_count % 10 == 0:
                        print(f"📊 Build {build_id}: captured {line_count} lines")
                    
                    # Parse for successful/failed builds
                    self._parse_build_results(line_text, build_info)
            
            # Wait for process to complete
            await process.wait()
            
            print(f"🏁 Build {build_id} completed with return code: {process.returncode}")
            
            # Update final status
            build_info["return_code"] = process.returncode
            
            if process.returncode == 0:
                build_info["status"] = "completed"
                build_info["logs"].append(f"✅ Build completed successfully at {datetime.now().strftime('%H:%M:%S')}")
                if not build_info["successful_builds"] and not build_info["failed_builds"]:
                    build_info["successful_builds"] = build_info["environments"].copy()
            else:
                build_info["status"] = "failed"
                build_info["logs"].append(f"❌ Build failed at {datetime.now().strftime('%H:%M:%S')} with return code {process.returncode}")
                if not build_info["failed_builds"] and not build_info["successful_builds"]:
                    build_info["failed_builds"] = build_info["environments"].copy()
            
            # Clean up temporary file
            cleanup_temp_file(build_info.get("temp_vars_file"))
            
            # Move to completed builds
            self.move_to_completed(build_id)
            
        except Exception as e:
            print(f"❌ Error capturing output for build {build_id}: {e}")
            build_info["logs"].append(f"Error capturing output: {str(e)}")
            build_info["status"] = "failed"
            build_info["return_code"] = -1
            
            cleanup_temp_file(build_info.get("temp_vars_file"))
            self.move_to_completed(build_id)
    
    def _parse_build_results(self, line_text: str, build_info: dict):
        """Parse output line for build success/failure indicators"""
        if "✅ Successfully built" in line_text or "Complete!" in line_text:
            for env in build_info["environments"]:
                if env in line_text and env not in build_info["successful_builds"]:
                    build_info["successful_builds"].append(env)
        
        elif "❌ Failed to build" in line_text or "Error:" in line_text:
            for env in build_info["environments"]:
                if env in line_text and env not in build_info["failed_builds"]:
                    build_info["failed_builds"].append(env)


# Create global service instance
build_service = BuildService()
