import React from 'react';
import {
  PageSection,
  Title,
  Button,
  Text,
  Split,
  SplitItem,
  Flex,
  FlexItem
} from '@patternfly/react-core';

import {
  BuilderImageIcon,
  PlusCircleIcon,
  SyncIcon
} from '@patternfly/react-icons';

import DashboardStats from '../dashboard/DashboardStats';
import { DashboardStats as DashboardStatsType } from '../../types';

interface AppHeaderProps {
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  loading: boolean;
  dashboardStats: DashboardStatsType | null;
  onRetryConnection: () => void;
  onOpenWizard: () => void;
  onReloadEnvironments: () => void;
  onShowBuildIssues: () => void;
  onShowLargeImages: () => void;
  onShowRecentUpdates: () => void;
  getConnectionStatusIcon: () => React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  connectionStatus,
  loading,
  dashboardStats,
  onRetryConnection,
  onOpenWizard,
  onReloadEnvironments,
  onShowBuildIssues,
  onShowLargeImages,
  onShowRecentUpdates,
  getConnectionStatusIcon
}) => {
  return (
    <PageSection variant="light">
      <Split hasGutter>
        <SplitItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <BuilderImageIcon style={{ color: '#0066cc', fontSize: '2rem' }} />
            </FlexItem>
            <FlexItem>
              <Title headingLevel="h1" size="2xl">
                EE Builder
              </Title>
            </FlexItem>
          </Flex>
        </SplitItem>
        <SplitItem isFilled />
        <SplitItem>
          <Flex alignItems={{ default: 'alignItemsCenter' }}>
            {/* Connection Status Indicator */}
            <FlexItem>
              <div style={{ marginRight: '16px', display: 'flex', alignItems: 'center' }}>
                {getConnectionStatusIcon()}
                <Text style={{ marginLeft: '8px', fontSize: '14px' }}>
                  {connectionStatus === 'connected' && 'Connected'}
                  {connectionStatus === 'disconnected' && 'Disconnected'}
                  {connectionStatus === 'checking' && 'Connecting...'}
                </Text>
                {connectionStatus === 'disconnected' && (
                  <Button 
                    variant="link" 
                    isInline 
                    onClick={onRetryConnection}
                    style={{ marginLeft: '8px', padding: '0' }}
                  >
                    Retry
                  </Button>
                )}
              </div>
            </FlexItem>
            <FlexItem>
              <Button
                variant="secondary"
                icon={<PlusCircleIcon />}
                onClick={onOpenWizard}
                style={{ marginRight: '8px' }}
                isDisabled={connectionStatus !== 'connected'}
              >
                Create Custom EE
              </Button>
            </FlexItem>
            <FlexItem>
              <Button
                variant="secondary"
                icon={<SyncIcon />}
                onClick={onReloadEnvironments}
                isLoading={loading}
                isDisabled={connectionStatus !== 'connected'}
              >
                Reload Environments
              </Button>
            </FlexItem>
          </Flex>
        </SplitItem>
      </Split>
      <Text component="p" style={{ marginTop: '8px' }}>
        Build and manage Ansible Execution Environments with ease
      </Text>
      
      {/* Enhanced Environment Health Dashboard */}
      <DashboardStats
        dashboardStats={dashboardStats}
        onShowBuildIssues={onShowBuildIssues}
        onShowLargeImages={onShowLargeImages}
        onShowRecentUpdates={onShowRecentUpdates}
      />
    </PageSection>
  );
};

export default AppHeader;
