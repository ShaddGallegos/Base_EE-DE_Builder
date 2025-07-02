// types/DashboardStats.ts
export interface DashboardStats {
  ready_to_build: number;
  build_issues: {
    count: number;
    details: Array<{
      environment: string;
      issue: string;
      severity: string;
    }>;
  };
  large_images: {
    count: number;
    details: Array<{
      environment: string;
      estimated_size_mb: number;
    }>;
  };
  recently_updated: {
    count: number;
    details: Array<{
      environment: string;
      modified: string;
      days_ago: number;
    }>;
  };
  currently_building: {
    count: number;
    details: Array<{
      build_id: string;
      environments: string[];
      started: string;
      duration_minutes: number;
    }>;
  };
  success_rate: {
    percentage: number;
    successful_builds: number;
    total_builds: number;
    period_days: number;
  };
  last_updated: string;
  error?: string;
}
