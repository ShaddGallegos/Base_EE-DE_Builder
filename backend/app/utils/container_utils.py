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

# backend/app/utils/container_utils.py - Container runtime utilities

import asyncio
import subprocess
from typing import List, Optional

from app.core.config import settings


async def validate_container_runtime():
    """Validate that the configured container runtime is available"""
    try:
        process = await asyncio.create_subprocess_exec(
            settings.CONTAINER_RUNTIME, "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
        
        if process.returncode != 0:
            raise RuntimeError(f"{settings.CONTAINER_RUNTIME} not working properly")
            
    except FileNotFoundError:
        raise RuntimeError(f"{settings.CONTAINER_RUNTIME} not installed or not in PATH")


async def validate_ansible_playbook():
    """Validate that ansible-playbook is available"""
    try:
        process = await asyncio.create_subprocess_exec(
            "ansible-playbook", "--version",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
        
        if process.returncode != 0:
            raise RuntimeError("ansible-playbook not working properly")
            
    except FileNotFoundError:
        raise RuntimeError("ansible-playbook not installed")


def get_container_registry_status(registry_url: str) -> dict:
    """Check authentication status for a container registry"""
    try:
        result = subprocess.run(
            [settings.CONTAINER_RUNTIME, "login", "--get-login", registry_url],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout.strip():
            return {
                "authenticated": True,
                "username": result.stdout.strip(),
                "registry": registry_url
            }
        else:
            return {
                "authenticated": False,
                "username": None,
                "registry": registry_url
            }
            
    except Exception as e:
        return {
            "authenticated": False,
            "username": None,
            "registry": registry_url,
            "error": str(e)
        }


def list_container_images(filter_name: Optional[str] = None) -> List[dict]:
    """List container images, optionally filtered by name"""
    try:
        cmd = [settings.CONTAINER_RUNTIME, "images", "--format", "json"]
        if filter_name:
            cmd.extend(["--filter", f"reference={filter_name}"])
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            images = []
            for line in result.stdout.strip().split('\n'):
                if line:
                    try:
                        import json
                        image_data = json.loads(line)
                        images.append(image_data)
                    except json.JSONDecodeError:
                        continue
            return images
        else:
            print(f"⚠️ Error listing images: {result.stderr}")
            return []
            
    except Exception as e:
        print(f"❌ Error listing container images: {e}")
        return []


def remove_container_image(image_name: str) -> bool:
    """Remove a container image"""
    try:
        result = subprocess.run(
            [settings.CONTAINER_RUNTIME, "rmi", image_name],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            print(f"🗑️ Removed image: {image_name}")
            return True
        else:
            print(f"⚠️ Failed to remove image {image_name}: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error removing image {image_name}: {e}")
        return False


async def build_container_image(
    context_path: str,
    dockerfile_path: str,
    tag: str,
    build_args: Optional[dict] = None
) -> tuple[bool, List[str]]:
    """Build a container image and return success status and logs"""
    cmd = [
        settings.CONTAINER_RUNTIME,
        "build",
        "-f", dockerfile_path,
        "-t", tag,
        context_path
    ]
    
    # Add build arguments if provided
    if build_args:
        for key, value in build_args.items():
            cmd.extend(["--build-arg", f"{key}={value}"])
    
    logs = []
    
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT
        )
        
        # Capture output line by line
        while True:
            line = await process.stdout.readline()
            if not line:
                break
            
            line_text = line.decode('utf-8').strip()
            if line_text:
                logs.append(line_text)
        
        await process.wait()
        
        success = process.returncode == 0
        if success:
            logs.append(f"✅ Successfully built image: {tag}")
        else:
            logs.append(f"❌ Failed to build image: {tag}")
        
        return success, logs
        
    except Exception as e:
        error_msg = f"❌ Error building image {tag}: {str(e)}"
        logs.append(error_msg)
        print(error_msg)
        return False, logs
