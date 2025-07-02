// types/Build.ts
export interface Build {
  id: string;
  status: string;
  environments: string[];
  started_at: string;
  completed_at?: string;
  logs: string[];
  images: string[];
  errors: string[];
  build_time_seconds?: number;
}

export type BuildStatus = 'starting' | 'running' | 'completed' | 'failed' | 'lost' | 'cancelled';

export interface BuildRequest {
  environments: string[];
  container_runtime: string;
}
