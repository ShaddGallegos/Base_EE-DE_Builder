// src/components/BuildManager.tsx
import React, { useState, useEffect } from 'react';
import {
  Button,
  Modal,
  ModalVariant,
  Alert,
  Progress,
  ProgressMeasureLocation,
  Card,
  CardBody,
  CardTitle,
  Text,
  TextContent,
  TextVariants,
  List,
  ListItem,
  Spinner,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import { PlayIcon, StopIcon, CheckCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons';

interface BuildManagerProps {
  selectedEnvironments: string[];
  onBuildComplete: () => void;
}

interface BuildStatus {
  build_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  environments: string[];
  start_time: string;
  end_time?: string;
  return_code?: number;
  logs: string[];
  successful_builds: string[];
  failed_builds: string[];
}

export const BuildManager: React.FC<BuildManagerProps> = ({
  selectedEnvironments,
  onBuildComplete
}) => {
  const [isBuilding, setIsBuilding] = useState(false);
  const [buildStatus, setBuildStatus] = useState<BuildStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string>('');
  const [containerRuntime, setContainerRuntime] = useState('podman');

  // Poll build status every 2 seconds when building
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (isBuilding && buildStatus?.build_id) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/builds/${buildStatus.build_id}/status`);
          if (response.ok) {
            const status: BuildStatus = await response.json();
            setBuildStatus(status);
            
            if (status.status === 'completed' || status.status === 'failed') {
              setIsBuilding(false);
              if (status.status === 'completed') {
                onBuildComplete();
              }
            }
          }
        } catch (error) {
          console.error('Error polling build status:', error);
          setError('Error checking build status');
          setIsBuilding(false);
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isBuilding, buildStatus?.build_id, onBuildComplete]);

  const startBuild = async () => {
    if (selectedEnvironments.length === 0) {
      setError('Please select at least one environment to build');
      return;
    }

    setIsBuilding(true);
    setIsModalOpen(true);
    setError('');
    setBuildStatus(null);

    try {
      const response = await fetch('/api/builds/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          environments: selectedEnvironments,
          container_runtime: containerRuntime
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start build');
      }

      const result = await response.json();
      setBuildStatus({
        build_id: result.build_id,
        status: 'running',
        environments: result.environments,
        start_time: new Date().toISOString(),
        logs: ['Build started...'],
        successful_builds: [],
        failed_builds: []
      });
      
    } catch (error: any) {
      setError(`Build failed to start: ${error.message}`);
      setIsBuilding(false);
    }
  };

  const cancelBuild = async () => {
    if (!buildStatus?.build_id) return;

    try {
      const response = await fetch(`/api/builds/${buildStatus.build_id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setIsBuilding(false);
        setBuildStatus(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (error) {
      console.error('Error cancelling build:', error);
    }
  };

  const getStatusIcon = () => {
    if (!buildStatus) return null;
    
    switch (buildStatus.status) {
      case 'running':
        return <Spinner size="sm" />;
      case 'completed':
        return <CheckCircleIcon color="green" />;
      case 'failed':
        return <ExclamationCircleIcon color="red" />;
      default:
        return null;
    }
  };

  const getStatusVariant = () => {
    if (!buildStatus) return 'info';
    
    switch (buildStatus.status) {
      case 'running':
        return 'info';
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      default:
        return 'info';
    }
  };

  const formatDuration = () => {
    if (!buildStatus?.start_time) return '';
    
    const start = new Date(buildStatus.start_time);
    const end = buildStatus.end_time ? new Date(buildStatus.end_time) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    return `${duration}s`;
  };

  return (
    <>
      <Flex>
        <FlexItem>
          <Button
            variant="primary"
            icon={<PlayIcon />}
            onClick={startBuild}
            isDisabled={isBuilding || selectedEnvironments.length === 0}
            size="lg"
          >
            {isBuilding ? 'Building...' : `Build Selected (${selectedEnvironments.length})`}
          </Button>
        </FlexItem>
        {selectedEnvironments.length === 0 && (
          <FlexItem>
            <Text component={TextVariants.small} style={{ color: 'var(--pf-global--palette--orange-300)' }}>
              Select environments to enable build
            </Text>
          </FlexItem>
        )}
      </Flex>

      <Modal
        variant={ModalVariant.large}
        title={
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>{getStatusIcon()}</FlexItem>
            <FlexItem>
              Build Progress {buildStatus && `(${formatDuration()})`}
            </FlexItem>
          </Flex>
        }
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        actions={[
          ...(isBuilding ? [
            <Button key="cancel" variant="secondary" onClick={cancelBuild} icon={<StopIcon />}>
              Cancel Build
            </Button>
          ] : []),
          <Button key="close" variant="primary" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        ]}
      >
        <div style={{ minHeight: '400px' }}>
          {/* Build Info Card */}
          <Card style={{ marginBottom: '1rem' }}>
            <CardTitle>Build Information</CardTitle>
            <CardBody>
              <TextContent>
                <Text><strong>Environments:</strong> {selectedEnvironments.join(', ')}</Text>
                <Text><strong>Container Runtime:</strong> {containerRuntime}</Text>
                {buildStatus && (
                  <>
                    <Text><strong>Build ID:</strong> {buildStatus.build_id}</Text>
                    <Text><strong>Status:</strong> {buildStatus.status}</Text>
                    {buildStatus.return_code !== undefined && (
                      <Text><strong>Return Code:</strong> {buildStatus.return_code}</Text>
                    )}
                  </>
                )}
              </TextContent>
            </CardBody>
          </Card>

          {/* Progress Indicator */}
          {isBuilding && (
            <div style={{ marginBottom: '1rem' }}>
              <Progress
                value={undefined}
                measureLocation={ProgressMeasureLocation.none}
                aria-label="Build progress"
                title="Building environments..."
              />
            </div>
          )}

          {/* Status Alert */}
          {buildStatus && (
            <Alert
              variant={getStatusVariant()}
              title={`Build ${buildStatus.status}`}
              isInline
              style={{ marginBottom: '1rem' }}
            >
              {buildStatus.status === 'completed' && 
                `Successfully built ${buildStatus.environments.length} environments`}
              {buildStatus.status === 'failed' && 
                `Build failed with return code ${buildStatus.return_code}`}
              {buildStatus.status === 'running' && 
                'Build in progress...'}
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert
              variant="danger"
              title="Error"
              isInline
              style={{ marginBottom: '1rem' }}
            >
              {error}
            </Alert>
          )}

          {/* Build Logs */}
          {buildStatus?.logs && buildStatus.logs.length > 0 && (
            <Card>
              <CardTitle>Build Logs</CardTitle>
              <CardBody>
                <div 
                  style={{ 
                    backgroundColor: '#1e1e1e', 
                    color: '#ffffff', 
                    padding: '1rem', 
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}
                >
                  {buildStatus.logs.map((log, index) => (
                    <div key={index} style={{ marginBottom: '0.25rem' }}>
                      {log}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </Modal>
    </>
  );
};
