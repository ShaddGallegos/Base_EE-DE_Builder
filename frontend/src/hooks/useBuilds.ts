// hooks/useBuilds.ts
import { useState, useCallback, useRef } from 'react';
import { Build } from '../types';

export const useBuilds = () => {
  // State extracted from App.tsx
  const [building, setBuilding] = useState(false);
  const [currentBuild, setCurrentBuild] = useState<Build | null>(null);
  const [buildDebugInfo, setBuildDebugInfo] = useState<string>('');
  
  // Ref for cleanup
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // API call function (will be replaced with shared service later)
  const apiCall = async (url: string, options?: RequestInit): Promise<any> => {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  const startBuild = useCallback(async (selectedEnvs: string[]) => {
    setBuilding(true);
    setBuildDebugInfo('Starting build...');
    setCurrentBuild({
      id: 'initializing',
      status: 'starting',
      environments: selectedEnvs,
      started_at: new Date().toISOString(),
      logs: ['🚀 Initializing build...', `📦 Environments: ${selectedEnvs.join(', ')}`],
      images: [],
      errors: []
    });

    try {
      setBuildDebugInfo('Sending request to backend...');
      const result = await apiCall('/api/builds/start', {
        method: 'POST',
        body: JSON.stringify({
          environments: selectedEnvs,
          container_runtime: 'podman'
        })
      });

      setBuildDebugInfo(`Response received: ${JSON.stringify(result, null, 2)}`);
      
      setCurrentBuild(prev => prev ? { 
        ...prev, 
        id: result.build_id, 
        status: 'running',
        logs: [...prev.logs, `✅ Build started with ID: ${result.build_id}`, '🔄 Waiting for ansible-playbook output...']
      } : null);
      
      pollBuildStatus(result.build_id);
      return result;
      
    } catch (err: any) {
      setBuildDebugInfo(`Error: ${err.message}`);
      setBuilding(false);
      throw err;
    }
  }, []);

  const pollBuildStatus = useCallback(async (buildId: string) => {
    let pollAttempts = 0;
    const maxPollAttempts = 3;
    
    const poll = async () => {
      try {
        setBuildDebugInfo(prev => prev + `\nPolling status for build: ${buildId} (attempt ${pollAttempts + 1})`);
        
        const buildStatus = await apiCall(`/api/builds/${buildId}/status`);
        
        setBuildDebugInfo(prev => prev + `\nStatus: ${buildStatus.status}, Logs: ${buildStatus.logs?.length || 0} lines`);
        
        // Reset poll attempts on successful response
        pollAttempts = 0;
        
        const build: Build = {
          id: buildStatus.build_id,
          status: buildStatus.status,
          environments: buildStatus.environments,
          started_at: buildStatus.start_time,
          completed_at: buildStatus.end_time,
          logs: buildStatus.logs || ['No logs available yet...'],
          images: buildStatus.successful_builds?.map((env: string) => `${env}:latest`) || [],
          errors: buildStatus.failed_builds || [],
          build_time_seconds: buildStatus.end_time ? 
            Math.round((new Date(buildStatus.end_time).getTime() - new Date(buildStatus.start_time).getTime()) / 1000) : 
            undefined
        };
        
        setCurrentBuild(build);

        if (build.status === 'running') {
          pollTimeoutRef.current = setTimeout(poll, 2000);
        } else {
          setBuilding(false);
          return build; // Return final build status
        }
      } catch (err: any) {
        pollAttempts++;
        setBuildDebugInfo(prev => prev + `\nPolling error (attempt ${pollAttempts}): ${err.message}`);
        
        if (err.message.includes('404')) {
          // Build not found - likely server restarted
          setBuilding(false);
          throw new Error('Build status lost - server may have restarted. Build process may have continued.');
        }
        
        if (pollAttempts >= maxPollAttempts) {
          setBuilding(false);
          throw new Error(`Lost connection to build after ${maxPollAttempts} attempts. Build may still be running.`);
        }
        
        // Retry with exponential backoff
        pollTimeoutRef.current = setTimeout(poll, Math.pow(2, pollAttempts) * 1000);
      }
    };
    
    poll();
  }, []);

  const cancelBuild = useCallback(async () => {
    if (!currentBuild?.id || currentBuild.id === 'initializing') return;

    try {
      await apiCall(`/api/builds/${currentBuild.id}`, {
        method: 'DELETE'
      });

      setBuilding(false);
      setCurrentBuild(prev => prev ? { ...prev, status: 'cancelled' } : null);
      
      // Clear any ongoing polling
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
      
      return { success: true, message: 'Build cancelled' };
    } catch (error: any) {
      console.error('Error cancelling build:', error);
      throw new Error(`Failed to cancel build: ${error.message}`);
    }
  }, [currentBuild?.id]);

  const getProgressValue = useCallback(() => {
    if (!currentBuild) return 0;
    switch (currentBuild.status) {
      case 'starting': return 10;
      case 'running': return 50;
      case 'completed': return 100;
      case 'failed': case 'lost': return 100;
      default: return 0;
    }
  }, [currentBuild]);

  // Helper function for starting a build after custom EE creation
  const startCustomEEBuild = useCallback((customEEName: string, buildId: string) => {
    setBuilding(true);
    setCurrentBuild({
      id: buildId,
      status: 'starting',
      environments: [customEEName],
      started_at: new Date().toISOString(),
      logs: [`✅ Custom EE '${customEEName}' created successfully!`, '🔄 Starting build...'],
      images: [],
      errors: []
    });
    pollBuildStatus(buildId);
  }, [pollBuildStatus]);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
  }, []);

  return {
    // State
    building,
    currentBuild,
    buildDebugInfo,
    
    // State setters (for special cases like Custom EE)
    setBuilding,
    setCurrentBuild,
    
    // Functions
    startBuild,
    cancelBuild,
    getProgressValue,
    cleanup,
    
    // Special functions
    startCustomEEBuild,
    pollBuildStatus
  };
};
