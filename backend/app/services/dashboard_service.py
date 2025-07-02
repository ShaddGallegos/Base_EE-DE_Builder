# backend/app/services/dashboard_service.py - Dashboard Analytics Service

from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

from app.models.dashboard_models import DashboardStats, SuccessRate, BuildIssue, LargeImage, RecentUpdate, CurrentBuild
from app.core.config import settings
from app.services.environment_service import EnvironmentService
from app.services.build_service import build_service


class DashboardService:
    """Service for dashboard analytics and statistics"""
    
    def __init__(self):
        self.environment_service = EnvironmentService()
    
    def get_dashboard_stats(self) -> DashboardStats:
        """Get comprehensive dashboard statistics"""
        try:
            environments_dir = Path(settings.ENVIRONMENTS_DIR)
            if not environments_dir.exists():
                return self._empty_stats()
            
            # Initialize counters
            ready_to_build = 0
            build_issues = []
            large_images = []
            recently_updated = []
            current_builds = []
            
            # Analyze each environment
            for env_dir in environments_dir.iterdir():
                if not env_dir.is_dir() or env_dir.name.startswith('.'):
                    continue
                
                env_name = env_dir.name
                
                # Check if ready to build
                env_health = self.environment_service.analyze_environment_health(env_dir)
                if env_health.ready:
                    ready_to_build += 1
                
                # Collect build issues
                if env_health.issues:
                    build_issues.extend([
                        BuildIssue(
                            environment=env_name,
                            issue=issue,
                            severity=env_health.severity
                        ) for issue in env_health.issues
                    ])
                
                # Check for large images
                estimated_size = self.environment_service.estimate_image_size(env_dir)
                if estimated_size > 500:  # MB
                    large_images.append(LargeImage(
                        environment=env_name,
                        estimated_size_mb=estimated_size
                    ))
                
                # Check for recently updated environments
                ee_file = env_dir / "execution-environment.yml"
                if ee_file.exists():
                    modified_time = datetime.fromtimestamp(ee_file.stat().st_mtime)
                    if modified_time > datetime.now() - timedelta(days=7):
                        recently_updated.append(RecentUpdate(
                            environment=env_name,
                            modified=modified_time.isoformat(),
                            days_ago=(datetime.now() - modified_time).days
                        ))
            
            # Get currently building environments
            for build_id, build_info in build_service.running_builds.items():
                process = build_info.get("process")
                if process and process.returncode is None:
                    current_builds.append(CurrentBuild(
                        build_id=build_id,
                        environments=build_info["environments"],
                        started=build_info["start_time"].isoformat(),
                        duration_minutes=int((datetime.now() - build_info["start_time"]).total_seconds() / 60)
                    ))
            
            # Calculate success rate
            success_rate = self._calculate_build_success_rate()
            
            return DashboardStats(
                ready_to_build=ready_to_build,
                build_issues={
                    "count": len(build_issues),
                    "details": build_issues[:5]  # Top 5 issues
                },
                large_images={
                    "count": len(large_images),
                    "details": large_images[:3]  # Top 3 largest
                },
                recently_updated={
                    "count": len(recently_updated),
                    "details": sorted(recently_updated, key=lambda x: x.modified, reverse=True)[:5]
                },
                currently_building={
                    "count": len(current_builds),
                    "details": current_builds
                },
                success_rate=success_rate,
                last_updated=datetime.now().isoformat()
            )
            
        except Exception as e:
            print(f"❌ Error getting dashboard stats: {e}")
            return self._empty_stats()
    
    def _calculate_build_success_rate(self) -> SuccessRate:
        """Calculate build success rate from recent builds"""
        try:
            cutoff_date = datetime.now() - timedelta(days=30)
            
            total_builds = 0
            successful_builds = 0
            
            # Check completed builds
            for build_id, build_info in build_service.completed_builds.items():
                if build_info.get("start_time") and build_info["start_time"] > cutoff_date:
                    total_builds += 1
                    if build_info.get("return_code") == 0:
                        successful_builds += 1
            
            # Check running builds (count as in-progress)
            for build_id, build_info in build_service.running_builds.items():
                if build_info.get("start_time") and build_info["start_time"] > cutoff_date:
                    total_builds += 1
            
            percentage = 100 if total_builds == 0 else round((successful_builds / total_builds) * 100)
            
            return SuccessRate(
                percentage=percentage,
                successful_builds=successful_builds,
                total_builds=total_builds,
                period_days=30
            )
            
        except Exception as e:
            print(f"❌ Error calculating success rate: {e}")
            return SuccessRate(percentage=0, successful_builds=0, total_builds=0, period_days=30)
    
    def _empty_stats(self) -> DashboardStats:
        """Return empty dashboard stats for error cases"""
        return DashboardStats(
            ready_to_build=0,
            build_issues={"count": 0, "details": []},
            large_images={"count": 0, "details": []},
            recently_updated={"count": 0, "details": []},
            currently_building={"count": 0, "details": []},
            success_rate=SuccessRate(percentage=0, successful_builds=0, total_builds=0, period_days=30),
            last_updated=datetime.now().isoformat()
        )


# Create global service instance
dashboard_service = DashboardService()
