// hooks/useEnvironments.ts - CORRECTED VERSION
import { useState, useCallback } from 'react';
import { Environment, EnvironmentDetails } from '../types';

export const useEnvironments = () => {
  // State extracted from App.tsx
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvs, setSelectedEnvs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOS, setFilterOS] = useState<string>('all');
  const [filterTemplateType, setFilterTemplateType] = useState<string>('all');
  const [selectedEnvDetails, setSelectedEnvDetails] = useState<EnvironmentDetails | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Simple API call function (will be replaced with shared service later)
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

  const loadEnvironments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiCall('/api/environments');
      
      const environments = data.environments || [];
      
      const formattedEnvironments = environments.map((env: any) => ({
        name: env.name,
        description: env.path || 'Execution Environment',
        type: 'ee',
        os_version: env.name.includes('rhel-8') ? 'rhel-8' : env.name.includes('rhel-9') ? 'rhel-9' : 'unknown',
        variant: env.name.includes('minimal') ? 'minimal' : env.name.includes('supported') ? 'supported' : 'custom',
        base_image: 'registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel9:latest',
        status: env.has_execution_environment ? 'available' : 'yaml_error',
        python_deps: [],
        ansible_collections: [],
        system_deps: [],
        build_args: {},
        template_type: '4-file'
      }));
      
      setEnvironments(formattedEnvironments);
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch environments:', err);
      setLoading(false);
      throw new Error(`Failed to load environments: ${err.message}. Make sure the backend is running on localhost:8000.`);
    }
  }, []);

  const loadEnvironmentDetails = useCallback(async (envName: string): Promise<EnvironmentDetails | null> => {
    const env = environments.find(e => e.name === envName);
    if (env) {
      const mockDetails: EnvironmentDetails = {
        environment: env,
        execution_environment_yml: {
          version: 1,
          build_arg_defaults: {
            ANSIBLE_GALAXY_CLI_COLLECTION_OPTS: "--ignore-certs"
          },
          ansible_galaxy: {
            requirements: "requirements.yml"
          },
          python: {
            requirements: "requirements.txt"
          },
          system: {
            bindep: "bindep.txt"
          }
        },
        requirements_txt: ['requests', 'pyyaml'],
        requirements_yml: {
          collections: [
            { name: 'community.general' },
            { name: 'ansible.posix' }
          ]
        },
        bindep_txt: ['git'],
        files_info: {}
      };
      
      return mockDetails;
    } else {
      throw new Error(`Environment ${envName} not found`);
    }
  }, [environments]);

  const handleLoadEnvironmentDetails = useCallback(async (envName: string) => {
    try {
      const details = await loadEnvironmentDetails(envName);
      if (details) {
        setSelectedEnvDetails(details);
        setIsDetailsModalOpen(true);
      }
    } catch (err: any) {
      throw new Error(`Failed to load details: ${err.message}`);
    }
  }, [loadEnvironmentDetails]);
  
  const closeDetailsModal = useCallback(() => {
    setIsDetailsModalOpen(false);
    setSelectedEnvDetails(null);
  }, []);

  const handleEnvToggle = useCallback((envName: string, checked: boolean) => {
    if (checked) {
      setSelectedEnvs(prev => [...prev, envName]);
    } else {
      setSelectedEnvs(prev => prev.filter(name => name !== envName));
    }
  }, []);

  // Computed filtered environments
  const filteredEnvironments = environments.filter(env => {
    if (filterType !== 'all' && env.type !== filterType) return false;
    if (filterOS !== 'all' && !env.os_version.includes(filterOS)) return false;
    if (filterTemplateType !== 'all' && env.template_type !== filterTemplateType) return false;
    return true;
  });

  return {
    // State
    environments,
    selectedEnvs,
    loading,
    filterType,
    filterOS,
    filterTemplateType,
    filteredEnvironments,
    selectedEnvDetails,
    isDetailsModalOpen,
    
    // Setters
    setSelectedEnvs,
    setFilterType,
    setFilterOS,
    setFilterTemplateType,
    
    // Functions
    loadEnvironments,
    loadEnvironmentDetails,
    handleLoadEnvironmentDetails,
    closeDetailsModal,
    handleEnvToggle
  };
};
