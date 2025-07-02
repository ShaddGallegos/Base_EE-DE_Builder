import React from 'react';
import {
  Modal,
  ModalVariant,
  Tabs,
  Tab,
  TabTitleText,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  ExpandableSection,
  TextArea,
  Label
} from '@patternfly/react-core';

import { EnvironmentDetails } from '../../types';

interface EnvironmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEnvDetails: EnvironmentDetails | null;
  activeTab: string | number;
  onTabSelect: (event: React.MouseEvent<any> | React.KeyboardEvent | MouseEvent, tabIndex: string | number) => void;
  getTypeColor: (type: string) => "blue" | "cyan" | "green" | "orange" | "purple" | "red" | "grey" | "gold";
}

const EnvironmentDetailsModal: React.FC<EnvironmentDetailsModalProps> = ({
  isOpen,
  onClose,
  selectedEnvDetails,
  activeTab,
  onTabSelect,
  getTypeColor
}) => {
  return (
    <Modal
      variant={ModalVariant.large}
      title={selectedEnvDetails ? `Environment Details: ${selectedEnvDetails.environment.name}` : "Environment Details"}
      isOpen={isOpen}
      onClose={onClose}
    >
      {selectedEnvDetails && (
        <Tabs activeKey={activeTab} onSelect={onTabSelect}>
          <Tab eventKey={0} title={<TabTitleText>Overview</TabTitleText>}>
            <div style={{ padding: '16px' }}>
              <DescriptionList>
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>{selectedEnvDetails.environment.name}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Description</DescriptionListTerm>
                  <DescriptionListDescription>{selectedEnvDetails.environment.description}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Type</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Label color={getTypeColor(selectedEnvDetails.environment.type)}>
                      {selectedEnvDetails.environment.type.toUpperCase()}
                    </Label>
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Template Type</DescriptionListTerm>
                  <DescriptionListDescription>{selectedEnvDetails.environment.template_type}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Base Image</DescriptionListTerm>
                  <DescriptionListDescription style={{ fontFamily: 'monospace' }}>
                    {selectedEnvDetails.environment.base_image}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </div>
          </Tab>
          <Tab eventKey={1} title={<TabTitleText>Configuration Files</TabTitleText>}>
            <div style={{ padding: '16px' }}>
              <ExpandableSection toggleText="execution-environment.yml" isExpanded>
                <TextArea
                  value={JSON.stringify(selectedEnvDetails.execution_environment_yml, null, 2)}
                  rows={10}
                  readOnly
                  style={{ fontFamily: 'monospace', fontSize: '12px' }}
                />
              </ExpandableSection>
            </div>
          </Tab>
        </Tabs>
      )}
    </Modal>
  );
};

export default EnvironmentDetailsModal;
