# backend/app/services/auth_service.py - Authentication Service

import subprocess
from app.models.auth_models import RHAuthRequest, RHAuthResponse, AuthStatus, LogoutResponse
from app.core.config import settings


class AuthService:
    """Service for Red Hat registry authentication"""
    
    async def login_redhat_registry(self, auth_request: RHAuthRequest) -> RHAuthResponse:
        """Authenticate with Red Hat registry using podman/docker login"""
        try:
            if not auth_request.username or not auth_request.password:
                return RHAuthResponse(
                    success=False,
                    message="Username and password are required"
                )
            
            print(f"🔐 Attempting Red Hat registry login for user: {auth_request.username}")
            
            cmd = [
                settings.CONTAINER_RUNTIME,
                "login",
                settings.RH_REGISTRY_URL,
                "--username", auth_request.username,
                "--password-stdin"
            ]
            
            process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate(input=auth_request.password)
            
            if process.returncode == 0:
                print(f"✅ Successfully authenticated with Red Hat registry for user: {auth_request.username}")
                return RHAuthResponse(
                    success=True,
                    message="Successfully authenticated with Red Hat registry"
                )
            else:
                error_msg = self._parse_auth_error(stderr)
                return RHAuthResponse(success=False, message=error_msg)
                
        except FileNotFoundError:
            return RHAuthResponse(
                success=False,
                message=f"{settings.CONTAINER_RUNTIME} not found. Please install {settings.CONTAINER_RUNTIME}."
            )
        except Exception as e:
            print(f"❌ Red Hat authentication error: {str(e)}")
            return RHAuthResponse(
                success=False,
                message="Authentication failed due to system error"
            )
    
    async def get_auth_status(self) -> AuthStatus:
        """Check if already authenticated with Red Hat registry"""
        try:
            result = subprocess.run(
                [settings.CONTAINER_RUNTIME, "login", "--get-login", settings.RH_REGISTRY_URL],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0 and result.stdout.strip():
                return AuthStatus(
                    authenticated=True,
                    username=result.stdout.strip(),
                    message="Already authenticated with Red Hat registry"
                )
            else:
                return AuthStatus(
                    authenticated=False,
                    username=None,
                    message="Not authenticated with Red Hat registry"
                )
                
        except subprocess.TimeoutExpired:
            return AuthStatus(
                authenticated=False,
                username=None,
                message="Timeout checking authentication status"
            )
        except FileNotFoundError:
            return AuthStatus(
                authenticated=False,
                username=None,
                message=f"{settings.CONTAINER_RUNTIME} not found"
            )
        except Exception as e:
            print(f"❌ Error checking RH auth status: {e}")
            return AuthStatus(
                authenticated=False,
                username=None,
                message="Error checking authentication status"
            )
    
    async def logout_redhat_registry(self) -> LogoutResponse:
        """Logout from Red Hat registry"""
        try:
            result = subprocess.run(
                [settings.CONTAINER_RUNTIME, "logout", settings.RH_REGISTRY_URL],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            return LogoutResponse(
                success=result.returncode == 0,
                message="Logged out from Red Hat registry" if result.returncode == 0 else "Logout failed"
            )
            
        except Exception as e:
            print(f"❌ RH logout error: {e}")
            return LogoutResponse(
                success=False,
                message="Logout failed due to system error"
            )
    
    def _parse_auth_error(self, stderr: str) -> str:
        """Parse authentication error message"""
        if "unauthorized" in stderr.lower():
            return "Invalid username or password"
        elif "network" in stderr.lower() or "connection" in stderr.lower():
            return "Network error - please check your internet connection"
        else:
            return "Authentication failed. Please check your credentials."


# Create global service instance
auth_service = AuthService()
