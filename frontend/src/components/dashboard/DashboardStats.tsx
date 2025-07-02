import React from 'react';
import {
  Grid,
  GridItem,
  Card,
  CardBody,
  Text,
  Title,
  Split,
  SplitItem,
  Spinner
} from '@patternfly/react-core';

import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CubesIcon,
  ClockIcon,
  PlayIcon,
  TimesCircleIcon
} from '@patternfly/react-icons';

import { DashboardStats as DashboardStatsType } from '../../types';

interface DashboardStatsProps {
  dashboardStats: DashboardStatsType | null;
  onShowBuildIssues: () => void;
  onShowLargeImages: () => void;
  onShowRecentUpdates: () => void;
}

const DashboardStats: React.FC<DashboardStatsProps> = ({
  dashboardStats,
  onShowBuildIssues,
  onShowLargeImages,
  onShowRecentUpdates
}) => {
  if (!dashboardStats || dashboardStats.error) {
    return null;
  }

  return (
    <Grid hasGutter style={{ marginTop: '16px' }}>
      <GridItem lg={2} md={4} sm={6}>
        <Card isCompact isClickable>
          <CardBody>
            <Split>
              <SplitItem>
                <Text component="small">Ready to Build</Text>
                <Title headingLevel="h3" size="xl" style={{ color: '#3e8635' }}>
                  {dashboardStats.ready_to_build}
                </Title>
                <Text component="small" style={{ color: '#6a6e73' }}>
                  environments
                </Text>
              </SplitItem>
              <SplitItem isFilled />
              <SplitItem>
                <CheckCircleIcon style={{ fontSize: '1.5rem', color: '#3e8635' }} />
              </SplitItem>
            </Split>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem lg={2} md={4} sm={6}>
        <Card isCompact isClickable onClick={onShowBuildIssues}>
          <CardBody>
            <Split>
              <SplitItem>
                <Text component="small">Build Issues</Text>
                <Title 
                  headingLevel="h3" 
                  size="xl" 
                  style={{ color: dashboardStats.build_issues.count > 0 ? '#f0ab00' : '#3e8635' }}
                >
                  {dashboardStats.build_issues.count}
                </Title>
                <Text component="small" style={{ color: '#6a6e73' }}>
                  {dashboardStats.build_issues.count === 1 ? 'issue' : 'issues'}
                </Text>
              </SplitItem>
              <SplitItem isFilled />
              <SplitItem>
                {dashboardStats.build_issues.count > 0 ? (
                  <ExclamationTriangleIcon style={{ fontSize: '1.5rem', color: '#f0ab00' }} />
                ) : (
                  <CheckCircleIcon style={{ fontSize: '1.5rem', color: '#3e8635' }} />
                )}
              </SplitItem>
            </Split>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem lg={2} md={4} sm={6}>
        <Card isCompact isClickable onClick={onShowLargeImages}>
          <CardBody>
            <Split>
              <SplitItem>
                <Text component="small">Large Images</Text>
                <Title 
                  headingLevel="h3" 
                  size="xl" 
                  style={{ color: dashboardStats.large_images.count > 0 ? '#f0ab00' : '#6a6e73' }}
                >
                  {dashboardStats.large_images.count}
                </Title>
                <Text component="small" style={{ color: '#6a6e73' }}>
                  over 500MB
                </Text>
              </SplitItem>
              <SplitItem isFilled />
              <SplitItem>
                <CubesIcon style={{ fontSize: '1.5rem', color: dashboardStats.large_images.count > 0 ? '#f0ab00' : '#6a6e73' }} />
              </SplitItem>
            </Split>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem lg={2} md={4} sm={6}>
        <Card isCompact isClickable onClick={onShowRecentUpdates}>
          <CardBody>
            <Split>
              <SplitItem>
                <Text component="small">Recently Updated</Text>
                <Title headingLevel="h3" size="xl" style={{ color: '#0066cc' }}>
                  {dashboardStats.recently_updated.count}
                </Title>
                <Text component="small" style={{ color: '#6a6e73' }}>
                  last 7 days
                </Text>
              </SplitItem>
              <SplitItem isFilled />
              <SplitItem>
                <ClockIcon style={{ fontSize: '1.5rem', color: '#0066cc' }} />
              </SplitItem>
            </Split>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem lg={2} md={4} sm={6}>
        <Card isCompact isClickable>
          <CardBody>
            <Split>
              <SplitItem>
                <Text component="small">Currently Building</Text>
                <Title 
                  headingLevel="h3" 
                  size="xl" 
                  style={{ color: dashboardStats.currently_building.count > 0 ? '#2b9af3' : '#6a6e73' }}
                >
                  {dashboardStats.currently_building.count}
                </Title>
                <Text component="small" style={{ color: '#6a6e73' }}>
                  {dashboardStats.currently_building.count === 1 ? 'build' : 'builds'}
                </Text>
              </SplitItem>
              <SplitItem isFilled />
              <SplitItem>
                {dashboardStats.currently_building.count > 0 ? (
                  <Spinner size="md" />
                ) : (
                  <PlayIcon style={{ fontSize: '1.5rem', color: '#6a6e73' }} />
                )}
              </SplitItem>
            </Split>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem lg={2} md={4} sm={6}>
        <Card isCompact isClickable>
          <CardBody>
            <Split>
              <SplitItem>
                <Text component="small">Success Rate</Text>
                <Title 
                  headingLevel="h3" 
                  size="xl" 
                  style={{ 
                    color: dashboardStats.success_rate.percentage >= 90 ? '#3e8635' : 
                           dashboardStats.success_rate.percentage >= 70 ? '#f0ab00' : '#c9190b' 
                  }}
                >
                  {dashboardStats.success_rate.percentage}%
                </Title>
                <Text component="small" style={{ color: '#6a6e73' }}>
                  last 30 days
                </Text>
              </SplitItem>
              <SplitItem isFilled />
              <SplitItem>
                {dashboardStats.success_rate.percentage >= 90 ? (
                  <CheckCircleIcon style={{ fontSize: '1.5rem', color: '#3e8635' }} />
                ) : dashboardStats.success_rate.percentage >= 70 ? (
                  <ExclamationTriangleIcon style={{ fontSize: '1.5rem', color: '#f0ab00' }} />
                ) : (
                  <TimesCircleIcon style={{ fontSize: '1.5rem', color: '#c9190b' }} />
                )}
              </SplitItem>
            </Split>
          </CardBody>
        </Card>
      </GridItem>
    </Grid>
  );
};

export default DashboardStats;
