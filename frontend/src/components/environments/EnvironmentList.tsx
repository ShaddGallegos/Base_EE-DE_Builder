import React from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  Text,
  Grid,
  GridItem,
  Label,
  Checkbox,
  Button,
  Spinner,
  Split,
  SplitItem,
  Flex,
  FlexItem,
  Title
} from '@patternfly/react-core';

import {
  CubesIcon,
  InfoCircleIcon,
  DisconnectedIcon
} from '@patternfly/react-icons';

import { Environment } from '../../types';

interface EnvironmentListProps {
  loading: boolean;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  filteredEnvironments: Environment[];
  selectedEnvs: string[];
  filterType: string;
  filterOS: string;
  filterTemplateType: string;
  onFilterTypeChange: (value: string) => void;
  onFilterOSChange: (value: string) => void;
  onFilterTemplateTypeChange: (value: string) => void;
  onEnvToggle: (envName: string, checked: boolean) => void;
  onLoadEnvironmentDetails: (envName: string) => void;
  onRetryConnection: () => void;
  getStatusIcon: (status: string) => React.ReactNode;
  getTypeIcon: (type: string) => React.ReactNode;
  getTypeColor: (type: string) => "blue" | "cyan" | "green" | "orange" | "purple" | "red" | "grey" | "gold";
}

const EnvironmentList: React.FC<EnvironmentListProps> = ({
  loading,
  connectionStatus,
  filteredEnvironments,
  selectedEnvs,
  filterType,
  filterOS,
  filterTemplateType,
  onFilterTypeChange,
  onFilterOSChange,
  onFilterTemplateTypeChange,
  onEnvToggle,
  onLoadEnvironmentDetails,
  onRetryConnection,
  getStatusIcon,
  getTypeIcon,
  getTypeColor
}) => {
  return (
    <Card>
      <CardTitle>
        <Split>
          <SplitItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <CubesIcon />
              </FlexItem>
              <FlexItem>
                Available Environments ({filteredEnvironments.length})
              </FlexItem>
            </Flex>
          </SplitItem>
          <SplitItem isFilled />
          <SplitItem>
            <Flex>
              <FlexItem>
                <select 
                  value={filterType} 
                  onChange={(e) => onFilterTypeChange(e.target.value)}
                  style={{ marginRight: '8px', padding: '4px' }}
                >
                  <option value="all">All Types</option>
                  <option value="ee">EE Only</option>
                  <option value="de">DE Only</option>
                  <option value="devtools">DevTools Only</option>
                  <option value="template">Templates Only</option>
                </select>
              </FlexItem>
              <FlexItem>
                <select 
                  value={filterOS} 
                  onChange={(e) => onFilterOSChange(e.target.value)}
                  style={{ marginRight: '8px', padding: '4px' }}
                >
                  <option value="all">All OS</option>
                  <option value="8">RHEL 8</option>
                  <option value="9">RHEL 9</option>
                </select>
              </FlexItem>
              <FlexItem>
                <select 
                  value={filterTemplateType} 
                  onChange={(e) => onFilterTemplateTypeChange(e.target.value)}
                  style={{ padding: '4px' }}
                >
                  <option value="all">All Templates</option>
                  <option value="1-file">1-File</option>
                  <option value="4-file">4-File</option>
                </select>
              </FlexItem>
            </Flex>
          </SplitItem>
        </Split>
      </CardTitle>
      <CardBody>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spinner size="lg" />
            <Text style={{ marginTop: '16px' }}>Loading environments...</Text>
          </div>
        ) : connectionStatus === 'disconnected' ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <DisconnectedIcon style={{ fontSize: '3rem', color: '#c9190b', marginBottom: '16px' }} />
            <Text style={{ marginBottom: '16px' }}>Cannot load environments - backend disconnected</Text>
            <Button variant="primary" onClick={onRetryConnection}>
              Retry Connection
            </Button>
          </div>
        ) : (
          <div>
            {filteredEnvironments.map((env) => (
              <div key={env.name} style={{ marginBottom: '16px', padding: '16px', border: '1px solid #d2d2d2', borderRadius: '8px' }}>
                <Grid hasGutter>
                  <GridItem span={1}>
                    <Checkbox
                      id={env.name}
                      name={env.name}
                      isChecked={selectedEnvs.includes(env.name)}
                      onChange={(event, checked) => onEnvToggle(env.name, checked)}
                      isDisabled={connectionStatus !== 'connected'}
                    />
                  </GridItem>
                  <GridItem span={11}>
                    <Split>
                      <SplitItem>
                        <div>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} style={{ marginBottom: '8px' }}>
                            <FlexItem>
                              {getStatusIcon(env.status)}
                            </FlexItem>
                            <FlexItem>
                              {getTypeIcon(env.type)}
                            </FlexItem>
                            <FlexItem>
                              <Title headingLevel="h4" size="md">
                                {env.name}
                              </Title>
                            </FlexItem>
                          </Flex>
                          <Text component="small" style={{ display: 'block', marginBottom: '8px' }}>
                            {env.description}
                          </Text>
                          <div style={{ marginBottom: '8px' }}>
                            <Label color={getTypeColor(env.type)}>{env.type.toUpperCase()}</Label>
                            <Label color="purple" style={{ marginLeft: '8px' }}>
                              {env.os_version.toUpperCase()}
                            </Label>
                            <Label color="cyan" style={{ marginLeft: '8px' }}>
                              {env.variant.toUpperCase()}
                            </Label>
                            <Label color="grey" style={{ marginLeft: '8px' }}>
                              {env.template_type}
                            </Label>
                          </div>
                          <Text component="small" style={{ fontFamily: 'monospace', fontSize: '11px', color: '#666' }}>
                            {env.base_image}
                          </Text>
                        </div>
                      </SplitItem>
                      <SplitItem isFilled />
                      <SplitItem>
                        <Button
                          variant="link"
                          icon={<InfoCircleIcon />}
                          onClick={() => onLoadEnvironmentDetails(env.name)}
                          isDisabled={connectionStatus !== 'connected'}
                        >
                          Details
                        </Button>
                      </SplitItem>
                    </Split>
                  </GridItem>
                </Grid>
              </div>
            ))}
            
            {filteredEnvironments.length === 0 && (
              <Text>No environments found matching the current filters.</Text>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default EnvironmentList;
