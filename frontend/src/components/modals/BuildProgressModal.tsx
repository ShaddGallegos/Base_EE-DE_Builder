import React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Alert,
  Card,
  CardTitle,
  CardBody,
  Text,
  Grid,
  GridItem,
  Progress,
  ProgressSize,
  Spinner,
  ExpandableSection,
  TextArea,
  Flex,
  FlexItem
} from '@patternfly/react-core';

import {
  StopIcon
} from '@patternfly/react-icons';

import { Build } from '../../types';

interface BuildProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: boolean;
  currentBuild: Build | null;
  buildDebugInfo: string | null;
  selectedEnvs: string[];
  onCancelBuild: () => void;
  getProgressValue: () => number;
  getBuildStatusIcon: (status: string) => React.ReactNode;
}

const BuildProgressModal: React.FC<BuildProgressModalProps> = ({
  isOpen,
  onClose,
  building,
  currentBuild,
  buildDebugInfo,
  selectedEnvs,
  onCancelBuild,
  getProgressValue,
  getBuildStatusIcon
}) => {
  return (
    <Modal
      variant={ModalVariant.large}
      title={
        <Flex alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>{currentBuild && getBuildStatusIcon(currentBuild.status)}</FlexItem>
          <FlexItem>
            Build Progress {currentBuild && currentBuild.id !== 'initializing' && `(${currentBuild.id})`}
          </FlexItem>
        </Flex>
      }
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        ...(building && currentBuild?.status === 'running' ? [
          <Button key="cancel" variant="secondary" onClick={onCancelBuild} icon={<StopIcon />}>
            Cancel Build
          </Button>
        ] : []),
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      <div style={{ minHeight: '400px' }}>
        {/* Build Info */}
        <Card style={{ marginBottom: '1rem' }}>
          <CardBody>
            <Grid hasGutter>
              <GridItem span={6}>
                <Text><strong>Environments:</strong> {selectedEnvs.join(', ')}</Text>
                <Text><strong>Container Runtime:</strong> podman</Text>
              </GridItem>
              <GridItem span={6}>
                {currentBuild && (
                  <>
                    <Text><strong>Status:</strong> {currentBuild.status}</Text>
                    <Text><strong>Started:</strong> {new Date(currentBuild.started_at).toLocaleTimeString()}</Text>
                    {currentBuild.build_time_seconds && (
                      <Text><strong>Duration:</strong> {currentBuild.build_time_seconds}s</Text>
                    )}
                  </>
                )}
              </GridItem>
            </Grid>
          </CardBody>
        </Card>

        {/* Progress Bar */}
        <Progress
          value={getProgressValue()}
          title="Build Progress"
          size={ProgressSize.lg}
          style={{ marginBottom: '1rem' }}
        />

        {/* Status Alert */}
        {currentBuild && (
          <Alert
            variant={currentBuild.status === 'completed' ? 'success' : 
                    currentBuild.status === 'failed' ? 'danger' : 
                    currentBuild.status === 'lost' ? 'warning' : 'info'}
            title={`Build ${currentBuild.status}`}
            isInline
            style={{ marginBottom: '1rem' }}
          >
            {currentBuild.status === 'completed' && 
              `Successfully built ${currentBuild.images.length} environments`}
            {currentBuild.status === 'failed' && 
              'Build failed - check logs below for details'}
            {currentBuild.status === 'lost' && 
              'Build connection lost due to server restart - process may have continued'}
            {(currentBuild.status === 'running' || currentBuild.status === 'starting') && 
              'Build in progress - real-time logs below'}
          </Alert>
        )}

        {/* Build Logs */}
        {currentBuild?.logs && (
          <Card>
            <CardTitle>Real-time Build Logs</CardTitle>
            <CardBody>
              <div 
                style={{ 
                  backgroundColor: '#1e1e1e', 
                  color: '#ffffff', 
                  padding: '1rem', 
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  maxHeight: '400px',
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {currentBuild.logs.map((log, index) => (
                  <div key={index} style={{ marginBottom: '0.25rem' }}>
                    {log}
                  </div>
                ))}
                {building && (
                  <div style={{ marginTop: '0.5rem', opacity: 0.7 }}>
                    <Spinner size="sm" /> Waiting for more output...
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Debug Info */}
        {buildDebugInfo && (
          <ExpandableSection toggleText="Debug Info (for troubleshooting)" style={{ marginTop: '1rem' }}>
            <TextArea
              value={buildDebugInfo}
              rows={10}
              readOnly
              style={{ fontFamily: 'monospace', fontSize: '11px' }}
            />
          </ExpandableSection>
        )}
      </div>
    </Modal>
  );
};

export default BuildProgressModal;
