import React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Alert,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Grid,
  GridItem,
  Card,
  CardTitle,
  CardBody,
  Text,
  Title,
  Split,
  SplitItem,
  Checkbox,
  Label,
  Spinner,
  ExpandableSection,
  Badge,
  Tabs,
  Tab,
  TabTitleText,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription
} from '@patternfly/react-core';

import {
  CheckCircleIcon,
  CodeIcon
} from '@patternfly/react-icons';

interface CustomEEWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  customEEStep: number;
  customEEForm: any; // TODO: Type this properly from your types
  availableBaseImages: any; // TODO: Type this properly
  packageTemplates: any; // TODO: Type this properly
  rhAuthStatus: string;
  onSetIsRHAuthModalOpen: (open: boolean) => void;
  onCreateCustomEE: () => void;
  getStepTitle: (step: number) => string;
  canProceedToNextStep: (step: number, rhAuthStatus: string) => boolean;
  nextStep: () => void;
  previousStep: () => void;
  updateFormField: (field: any, value: any) => void;
  addPackageFromTemplate: (type: 'python_packages' | 'system_packages' | 'ansible_collections', template: string) => void;
  addCustomPackage: (type: 'python_packages' | 'system_packages' | 'ansible_collections', packageName: string) => void;
  removePackage: (type: 'python_packages' | 'system_packages' | 'ansible_collections', packageName: string) => void;
  extractBaseImageFromYAML: (yaml: string) => string;
  generateYAMLPreview: () => any;
  generateRequirementsTxt: () => string;
  generateRequirementsYml: () => any;
  generateBindepTxt: () => string;
}

const CustomEEWizardModal: React.FC<CustomEEWizardModalProps> = ({
  isOpen,
  onClose,
  customEEStep,
  customEEForm,
  availableBaseImages,
  packageTemplates,
  rhAuthStatus,
  onSetIsRHAuthModalOpen,
  onCreateCustomEE,
  getStepTitle,
  canProceedToNextStep,
  nextStep,
  previousStep,
  updateFormField,
  addPackageFromTemplate,
  addCustomPackage,
  removePackage,
  extractBaseImageFromYAML,
  generateYAMLPreview,
  generateRequirementsTxt,
  generateRequirementsYml,
  generateBindepTxt
}) => {
  return (
    <Modal
      variant={customEEStep === (customEEForm.import_mode === 'yaml' ? 1 : 4) ? ModalVariant.large : ModalVariant.medium}
      title={`Create Custom EE - Step ${customEEStep + 1}/${customEEForm.import_mode === 'yaml' ? '2' : '5'}: ${getStepTitle(customEEStep)}`}
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        ...(customEEStep < (customEEForm.import_mode === 'yaml' ? 1 : 4) ? [
          <Button 
            key="next" 
            variant="primary" 
            onClick={nextStep}
            isDisabled={!canProceedToNextStep(customEEStep, rhAuthStatus)}
          >
            Next
          </Button>
        ] : [
          <Button 
            key="create" 
            variant="primary" 
            onClick={onCreateCustomEE}
            isDisabled={!canProceedToNextStep(customEEStep, rhAuthStatus)}
          >
            Create & Build Environment
          </Button>
        ]),
        ...(customEEStep > 0 ? [
          <Button key="back" variant="secondary" onClick={previousStep}>
            Back
          </Button>
        ] : []),
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      ]}
    >
      <div style={{ minHeight: '600px', maxHeight: '80vh', overflow: 'hidden' }}>
        <Grid hasGutter>
          {/* Main Content */}
          <GridItem span={customEEStep === (customEEForm.import_mode === 'yaml' ? 1 : 4) ? 12 : 7}>
            <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
              
              {/* Step 0: Mode Selection or Basic Information */}
              {customEEStep === 0 && (
                <>
                  {/* Mode Selection - show when no mode selected */}
                  {!customEEForm.import_mode && (
                    <div style={{ marginBottom: '24px' }}>
                      <Alert variant="info" title="Choose Your Creation Method" isInline style={{ marginBottom: '20px' }}>
                        Create a custom Execution Environment using our guided wizard or import an existing YAML configuration.
                      </Alert>
                      
                      <Card>
                        <CardBody>
                          <div style={{ display: 'grid', gap: '16px' }}>
                            <div 
                              style={{ 
                                padding: '16px', 
                                border: '1px solid #d2d2d2',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: 'white'
                              }}
                              onClick={() => updateFormField('import_mode', 'wizard')}
                            >
                              <Split>
                                <SplitItem>
                                  <input 
                                    type="radio" 
                                    checked={false} 
                                    onChange={() => updateFormField('import_mode', 'wizard')}
                                    style={{ marginRight: '12px' }}
                                  />
                                  <strong>🧭 Guided Wizard</strong>
                                </SplitItem>
                              </Split>
                              <Text style={{ marginTop: '8px', marginLeft: '24px' }}>
                                Step-by-step configuration with templates and validation. Best for users new to Execution Environments.
                              </Text>
                            </div>
                            
                            <div 
                              style={{ 
                                padding: '16px', 
                                border: '1px solid #d2d2d2',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                backgroundColor: 'white'
                              }}
                              onClick={() => updateFormField('import_mode', 'yaml')}
                            >
                              <Split>
                                <SplitItem>
                                  <input 
                                    type="radio" 
                                    checked={false} 
                                    onChange={() => updateFormField('import_mode', 'yaml')}
                                    style={{ marginRight: '12px' }}
                                  />
                                  <strong>📄 Import YAML</strong>
                                </SplitItem>
                              </Split>
                              <Text style={{ marginTop: '8px', marginLeft: '24px' }}>
                                Paste an existing execution-environment.yml file content. The YAML will be used exactly as provided with no modifications.
                              </Text>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  )}
                  
                  {/* YAML Import Mode Content */}
                  {customEEForm.import_mode === 'yaml' && (
                    <div>
                      <Alert variant="info" title="Import Execution Environment YAML" isInline style={{ marginBottom: '20px' }}>
                        Paste your execution-environment.yml content below. The YAML will be written exactly as provided - no processing or modification will be done.
                      </Alert>
                      
                      <Form>
                        <FormGroup label="Environment Name" isRequired fieldId="ee-name">
                          <TextInput
                            id="ee-name"
                            type="text"
                            value={customEEForm.name}
                            onChange={(event, value) => updateFormField('name', value)}
                            placeholder="my-custom-ee"
                            validated={customEEForm.name && customEEForm.name !== customEEForm.name.toLowerCase() ? 'error' : 'default'}
                          />
                          <Text component="small" style={{ color: '#6a6e73' }}>
                            Use only lowercase letters, numbers, hyphens, and underscores. This will be the folder name in environments/
                          </Text>
                          {customEEForm.name && customEEForm.name !== customEEForm.name.toLowerCase() && (
                            <Text component="small" style={{ color: '#c9190b' }}>
                              ⚠️ Environment name must be lowercase (required by container registries)
                            </Text>
                          )}
                        </FormGroup>
                        
                        <FormGroup label="execution-environment.yml Content" isRequired fieldId="yaml-content">
                          <TextArea
                            id="yaml-content"
                            value={customEEForm.yaml_content}
                            onChange={(event, value) => updateFormField('yaml_content', value)}
                            placeholder={`version: 3

images:
  base_image:
    name: registry.fedoraproject.org/fedora:42

dependencies:
  python_interpreter:
    package_system: python3
  ansible_core:
    package_pip: ansible-core
  ansible_runner:
    package_pip: ansible-runner
  system:
    - openssh-clients
    - sshpass
  galaxy:
    collections:
      - name: community.postgresql`}
                            rows={15}
                            style={{ fontFamily: 'monospace', fontSize: '12px' }}
                          />
                          <Text component="small" style={{ color: '#6a6e73' }}>
                            Paste your complete execution-environment.yml content here
                          </Text>
                          {/* Show extracted base image for debugging */}
                          {customEEForm.yaml_content && (
                            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
                              <Text component="small" style={{ fontWeight: 'bold' }}>
                                Detected Base Image: 
                              </Text>
                              <Text component="small" style={{ fontFamily: 'monospace', marginLeft: '8px' }}>
                                {extractBaseImageFromYAML(customEEForm.yaml_content) || 'None detected'}
                              </Text>
                            </div>
                          )}
                        </FormGroup>
                      </Form>
                    </div>
                  )}

                  {/* Wizard Mode Content - Basic Information */}
                  {customEEForm.import_mode === 'wizard' && (
                    <div>
                      <Alert variant="info" title="Create Your Custom Execution Environment" isInline style={{ marginBottom: '20px' }}>
                        This wizard will help you create a custom Execution Environment with your specific dependencies and tools.
                      </Alert>
                  
                      <Form>
                        <FormGroup label="Environment Name" isRequired fieldId="ee-name">
                          <TextInput
                            id="ee-name"
                            type="text"
                            value={customEEForm.name}
                            onChange={(event, value) => updateFormField('name', value)}
                            placeholder="my-custom-ee"
                            validated={customEEForm.name && customEEForm.name !== customEEForm.name.toLowerCase() ? 'error' : 'default'}
                          />
                          <Text component="small" style={{ color: '#6a6e73' }}>
                            Use only lowercase letters, numbers, hyphens, and underscores
                          </Text>
                          {customEEForm.name && customEEForm.name !== customEEForm.name.toLowerCase() && (
                            <Text component="small" style={{ color: '#c9190b' }}>
                              ⚠️ Environment name must be lowercase (required by container registries)
                            </Text>
                          )}
                        </FormGroup>
                        
                        <FormGroup label="Description" fieldId="ee-description">
                          <TextArea
                            id="ee-description"
                            value={customEEForm.description}
                            onChange={(event, value) => updateFormField('description', value)}
                            placeholder="Describe what this execution environment will be used for..."
                            rows={3}
                          />
                        </FormGroup>
                        
                        <FormGroup label="Base Image" isRequired fieldId="base-image">
                          {/* Option to use custom base image */}
                          <Checkbox
                            id="use-custom-base"
                            label="Use custom base image"
                            isChecked={customEEForm.use_custom_base_image}
                            onChange={(event, checked) => {
                              updateFormField('use_custom_base_image', checked);
                              if (checked) {
                                updateFormField('base_image', '');
                              } else {
                                updateFormField('custom_base_image', '');
                              }
                            }}
                            style={{ marginBottom: '12px' }}
                          />
                          
                          {customEEForm.use_custom_base_image ? (
                            <>
                              <TextInput
                                id="custom-base-image"
                                type="text"
                                value={customEEForm.custom_base_image}
                                onChange={(event, value) => updateFormField('custom_base_image', value)}
                                placeholder="registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel9:latest"
                              />
                              {customEEForm.custom_base_image?.includes('registry.redhat.io') && rhAuthStatus !== 'authenticated' && (
                                <Alert variant="warning" title="Red Hat Registry Authentication Required" isInline style={{ marginTop: '8px' }}>
                                  This base image requires Red Hat registry authentication. 
                                  <Button 
                                    variant="link" 
                                    isInline 
                                    onClick={() => onSetIsRHAuthModalOpen(true)}
                                    style={{ marginLeft: '8px', padding: '0' }}
                                  >
                                    Login now
                                  </Button>
                                </Alert>
                              )}
                            </>
                          ) : (
                            <div style={{ 
                              display: 'grid', 
                              gap: '12px', 
                              marginTop: '8px',
                              maxHeight: '300px',
                              overflowY: 'auto',
                              border: '1px solid #d2d2d2',
                              borderRadius: '4px',
                              padding: '12px'
                            }}>
                              {Object.keys(availableBaseImages).length > 0 ? (
                                Object.entries(availableBaseImages).map(([key, image]: [string, any]) => (
                                  <Card 
                                    key={key} 
                                    isSelectable 
                                    isSelected={customEEForm.base_image === image.name}
                                    onClick={() => updateFormField('base_image', image.name)}
                                    style={{ cursor: 'pointer', margin: '0' }}
                                    isCompact
                                  >
                                    <CardBody>
                                      <Split>
                                        <SplitItem>
                                          <Title headingLevel="h4" size="md">{key}</Title>
                                          <Text component="small" style={{ display: 'block', marginBottom: '4px' }}>
                                            {image.description}
                                          </Text>
                                          <div>
                                            <Label color="blue">{image.type}</Label>
                                            <Label color="purple" style={{ marginLeft: '8px' }}>{image.os}</Label>
                                          </div>
                                        </SplitItem>
                                        <SplitItem isFilled />
                                        {customEEForm.base_image === image.name && (
                                          <SplitItem>
                                            <CheckCircleIcon style={{ color: '#3e8635' }} />
                                          </SplitItem>
                                        )}
                                      </Split>
                                    </CardBody>
                                  </Card>
                                ))
                              ) : (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                  <Spinner size="md" />
                                  <Text style={{ marginTop: '8px' }}>Loading base images...</Text>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Show Red Hat auth warning for selected predefined images */}
                          {!customEEForm.use_custom_base_image && customEEForm.base_image?.includes('registry.redhat.io') && rhAuthStatus !== 'authenticated' && (
                            <Alert variant="warning" title="Red Hat Registry Authentication Required" isInline style={{ marginTop: '12px' }}>
                              The selected base image requires Red Hat registry authentication. 
                              <Button 
                                variant="link" 
                                isInline 
                                onClick={() => onSetIsRHAuthModalOpen(true)}
                                style={{ marginLeft: '8px', padding: '0' }}
                              >
                                Login now
                              </Button>
                            </Alert>
                          )}
                        </FormGroup>
                      </Form>
                    </div>
                  )}
                </>
              )}

              {/* Step 1: Python Packages */}
              {customEEStep === 1 && customEEForm.import_mode === 'wizard' && (
                <div>
                  <Text style={{ marginBottom: '16px' }}>
                    Add Python packages that your execution environment needs. You can use templates for common use cases or add custom packages.
                  </Text>
                  
                  <Alert variant="info" title="Package Templates" isInline style={{ marginBottom: '16px' }}>
                    Templates provide common package combinations used in production environments. 
                    Some packages may require additional system dependencies or specific base image configurations.
                  </Alert>
                  
                  {packageTemplates ? (
                    <div style={{ marginBottom: '20px' }}>
                      <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>Quick Templates</Title>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        {Object.entries(packageTemplates.python_packages).map(([template, packages]: [string, any]) => (
                          <Button
                            key={template}
                            variant="secondary"
                            size="sm"
                            onClick={() => addPackageFromTemplate('python_packages', template)}
                          >
                            {template.replace('_', ' ')} ({packages.length})
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                      <Spinner size="sm" />
                      <Text component="small" style={{ marginLeft: '8px' }}>Loading package templates...</Text>
                    </div>
                  )}
                  
                  <FormGroup label="Add Custom Package" fieldId="custom-python">
                    <Split hasGutter>
                      <SplitItem isFilled>
                        <TextInput
                          id="custom-python"
                          type="text"
                          placeholder="package-name>=1.0.0"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addCustomPackage('python_packages', (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </SplitItem>
                      <SplitItem>
                        <Button
                          variant="primary"
                          onClick={() => {
                            const input = document.getElementById('custom-python') as HTMLInputElement;
                            addCustomPackage('python_packages', input.value);
                            input.value = '';
                          }}
                        >
                          Add
                        </Button>
                      </SplitItem>
                    </Split>
                  </FormGroup>
                  
                  <div style={{ marginTop: '20px' }}>
                    <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>
                      Selected Packages ({customEEForm.python_packages.length})
                    </Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {customEEForm.python_packages.map((pkg: string, index: number) => (
                        <Label 
                          key={index} 
                          color="blue" 
                          onClose={() => removePackage('python_packages', pkg)}
                        >
                          {pkg}
                        </Label>
                      ))}
                      {customEEForm.python_packages.length === 0 && (
                        <Text component="small" style={{ color: '#6a6e73' }}>No Python packages selected</Text>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: System Packages */}
              {customEEForm.import_mode === 'wizard' && customEEStep === 2 && (
                <div>
                  <Text style={{ marginBottom: '16px' }}>
                    Add system packages (RPMs) that your execution environment needs. These are installed using microdnf/dnf.
                  </Text>
                  
                  <Alert variant="info" title="System Dependencies" isInline style={{ marginBottom: '16px' }}>
                    System packages provide libraries and tools required by Python packages and Ansible collections. 
                    Development packages (gcc, python3-devel, etc.) are often needed for packages that compile native extensions.
                    <br/><strong>Note:</strong> openssh-clients and sshpass are included by default for Ansible connectivity.
                  </Alert>
                  
                  {packageTemplates ? (
                    <div style={{ marginBottom: '20px' }}>
                      <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>Quick Templates</Title>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        {Object.entries(packageTemplates.system_packages).map(([template, packages]: [string, any]) => (
                          <Button
                            key={template}
                            variant="secondary"
                            size="sm"
                            onClick={() => addPackageFromTemplate('system_packages', template)}
                          >
                            {template.replace('_', ' ')} ({packages.length})
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                      <Spinner size="sm" />
                      <Text component="small" style={{ marginLeft: '8px' }}>Loading package templates...</Text>
                    </div>
                  )}
                  
                  <FormGroup label="Add Custom Package" fieldId="custom-system">
                    <Split hasGutter>
                      <SplitItem isFilled>
                        <TextInput
                          id="custom-system"
                          type="text"
                          placeholder="package-name"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addCustomPackage('system_packages', (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </SplitItem>
                      <SplitItem>
                        <Button
                          variant="primary"
                          onClick={() => {
                            const input = document.getElementById('custom-system') as HTMLInputElement;
                            addCustomPackage('system_packages', input.value);
                            input.value = '';
                          }}
                        >
                          Add
                        </Button>
                      </SplitItem>
                    </Split>
                  </FormGroup>
                  
                  <div style={{ marginTop: '20px' }}>
                    <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>
                      Selected Packages ({customEEForm.system_packages.length})
                    </Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {customEEForm.system_packages.map((pkg: string, index: number) => (
                        <Label 
                          key={index} 
                          color="orange" 
                          onClose={() => removePackage('system_packages', pkg)}
                        >
                          {pkg}
                        </Label>
                      ))}
                      {customEEForm.system_packages.length === 0 && (
                        <Text component="small" style={{ color: '#6a6e73' }}>No system packages selected</Text>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Ansible Collections */}
              {customEEForm.import_mode === 'wizard' && customEEStep === 3 && (
                <div>
                  <Text style={{ marginBottom: '16px' }}>
                    Add Ansible collections that your execution environment needs. Collections provide modules, plugins, and roles.
                  </Text>
                  
                  {packageTemplates ? (
                    <div style={{ marginBottom: '20px' }}>
                      <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>Quick Templates</Title>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                        {Object.entries(packageTemplates.ansible_collections).map(([template, collections]: [string, any]) => (
                          <Button
                            key={template}
                            variant="secondary"
                            size="sm"
                            onClick={() => addPackageFromTemplate('ansible_collections', template)}
                          >
                            {template.replace('_', ' ')} ({collections.length})
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                      <Spinner size="sm" />
                      <Text component="small" style={{ marginLeft: '8px' }}>Loading collection templates...</Text>
                    </div>
                  )}
                  
                  <FormGroup label="Add Custom Collection" fieldId="custom-collection">
                    <Split hasGutter>
                      <SplitItem isFilled>
                        <TextInput
                          id="custom-collection"
                          type="text"
                          placeholder="namespace.collection:>=1.0.0"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addCustomPackage('ansible_collections', (e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                      </SplitItem>
                      <SplitItem>
                        <Button
                          variant="primary"
                          onClick={() => {
                            const input = document.getElementById('custom-collection') as HTMLInputElement;
                            addCustomPackage('ansible_collections', input.value);
                            input.value = '';
                          }}
                        >
                          Add
                        </Button>
                      </SplitItem>
                    </Split>
                  </FormGroup>
                  
                  <div style={{ marginTop: '20px' }}>
                    <Title headingLevel="h4" size="md" style={{ marginBottom: '12px' }}>
                      Selected Collections ({customEEForm.ansible_collections.length})
                    </Title>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {customEEForm.ansible_collections.map((col: string, index: number) => (
                        <Label 
                          key={index} 
                          color="purple" 
                          onClose={() => removePackage('ansible_collections', col)}
                        >
                          {col}
                        </Label>
                      ))}
                      {customEEForm.ansible_collections.length === 0 && (
                        <Text component="small" style={{ color: '#6a6e73' }}>No Ansible collections selected</Text>
                      )}
                    </div>
                  </div>
                  
                  {/* Advanced Options - Optional */}
                  <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #d2d2d2' }}>
                    <ExpandableSection toggleText="🔧 Advanced Options (Optional)">
                      <FormGroup label="Additional Build Steps" fieldId="build-steps" style={{ marginTop: '12px' }}>
                        <TextArea
                          id="build-steps"
                          value={customEEForm.additional_build_steps}
                          onChange={(event, value) => updateFormField('additional_build_steps', value)}
                          placeholder={`RUN microdnf install -y curl
RUN pip install --upgrade pip
USER 1001`}
                          rows={4}
                        />
                        <Text component="small" style={{ color: '#6a6e73' }}>
                          Add custom RUN, COPY, or other Dockerfile commands. These will be executed at the end of the build process.
                        </Text>
                      </FormGroup>
                    </ExpandableSection>
                  </div>
                </div>
              )}

              {/* Review Step - Step 4 for wizard mode, Step 1 for YAML mode */}
              {((customEEForm.import_mode === 'wizard' && customEEStep === 4) || 
                (customEEForm.import_mode === 'yaml' && customEEStep === 1)) && (
                <div>
                  <Alert variant="success" title="Review Your Custom Execution Environment" isInline style={{ marginBottom: '20px' }}>
                    Please review the configuration and generated files below before creating your execution environment.
                  </Alert>
                  
                  {/* Red Hat Registry Authentication Check */}
                  {(() => {
                    let finalBaseImage = '';
                    
                    if (customEEForm.import_mode === 'yaml') {
                      // Extract base image from YAML content using the helper function
                      finalBaseImage = extractBaseImageFromYAML(customEEForm.yaml_content);
                    } else {
                      finalBaseImage = customEEForm.use_custom_base_image ? 
                        customEEForm.custom_base_image : 
                        customEEForm.base_image;
                    }
                    
                    const isRedHatRegistry = finalBaseImage?.includes('registry.redhat.io');
                    
                    if (isRedHatRegistry && rhAuthStatus !== 'authenticated') {
                      return (
                        <Alert variant="warning" title="Red Hat Registry Authentication Required" isInline style={{ marginBottom: '20px' }}>
                          Your configuration requires authentication with registry.redhat.io. 
                          <Button 
                            variant="link" 
                            isInline 
                            onClick={() => onSetIsRHAuthModalOpen(true)}
                            style={{ marginLeft: '8px', padding: '0' }}
                          >
                            Please login now
                          </Button>
                        </Alert>
                      );
                    }
                    return null;
                  })()}
                  
                  <Grid hasGutter>
                    <GridItem span={6}>
                      <Card>
                        <CardTitle>Environment Summary</CardTitle>
                        <CardBody>
                          <DescriptionList>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Name</DescriptionListTerm>
                              <DescriptionListDescription style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                {customEEForm.name || 'Not specified'}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            
                            {customEEForm.import_mode === 'wizard' && (
                              <>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>Description</DescriptionListTerm>
                                  <DescriptionListDescription>{customEEForm.description || 'No description'}</DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>Base Image</DescriptionListTerm>
                                  <DescriptionListDescription style={{ fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>
                                    {customEEForm.use_custom_base_image ? 
                                      customEEForm.custom_base_image || 'Not specified' : 
                                      customEEForm.base_image || 'Not selected'}
                                    {(() => {
                                      const finalBaseImage = customEEForm.use_custom_base_image ? 
                                        customEEForm.custom_base_image : 
                                        customEEForm.base_image;
                                      const isRedHatRegistry = finalBaseImage?.includes('registry.redhat.io');
                                      
                                      if (isRedHatRegistry) {
                                        return (
                                          <div style={{ marginTop: '4px' }}>
                                            <Label color={rhAuthStatus === 'authenticated' ? 'green' : 'orange'}>
                                              {rhAuthStatus === 'authenticated' ? '✓ RH Authenticated' : '⚠ RH Auth Required'}
                                            </Label>
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                                <DescriptionListGroup>
                                  <DescriptionListTerm>Dependencies</DescriptionListTerm>
                                  <DescriptionListDescription>
                                    <div>
                                      <Label color="blue">{customEEForm.python_packages.length} Python</Label>
                                      <Label color="orange" style={{ marginLeft: '4px' }}>{customEEForm.system_packages.length + 2} System</Label>
                                      <Label color="purple" style={{ marginLeft: '4px' }}>{customEEForm.ansible_collections.length} Collections</Label>
                                      <Label color="green" style={{ marginLeft: '4px' }}>Core Ansible</Label>
                                    </div>
                                  </DescriptionListDescription>
                                </DescriptionListGroup>
                              </>
                            )}
                            
                            {customEEForm.import_mode === 'yaml' && (
                              <DescriptionListGroup>
                                <DescriptionListTerm>Configuration</DescriptionListTerm>
                                <DescriptionListDescription>
                                  <Label color="blue">YAML Import (Exact Copy)</Label>
                                  <Label color="green" style={{ marginLeft: '4px' }}>
                                    {customEEForm.yaml_content.split('\n').length} lines
                                  </Label>
                                  <div style={{ marginTop: '4px' }}>
                                    <Text component="small" style={{ color: '#6a6e73' }}>
                                      Your YAML content will be written exactly to execution-environment.yml
                                    </Text>
                                  </div>
                                </DescriptionListDescription>
                              </DescriptionListGroup>
                            )}
                            
                            <DescriptionListGroup>
                              <DescriptionListTerm>Build Options</DescriptionListTerm>
                              <DescriptionListDescription>
                                <div>
                                  <Label color="green">Build Immediately</Label>
                                  {customEEForm.additional_build_steps && (
                                    <Label color="cyan" style={{ marginLeft: '4px' }}>Custom Build Steps</Label>
                                  )}
                                </div>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </CardBody>
                      </Card>
                    </GridItem>
                    
                    <GridItem span={6}>
                      <Card>
                        <CardTitle>
                          {customEEForm.import_mode === 'yaml' ? 'YAML Content (will be written exactly as shown)' : 'Files to be Created'}
                        </CardTitle>
                        <CardBody>
                          <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                            {customEEForm.import_mode === 'yaml' ? (
                              <>
                                <Alert variant="info" title="Direct YAML Import" isInline style={{ marginBottom: '12px' }}>
                                  The YAML content below will be written exactly as provided to execution-environment.yml
                                </Alert>
                                <TextArea
                                  value={customEEForm.yaml_content}
                                  rows={12}
                                  readOnly
                                  style={{ fontFamily: 'monospace', fontSize: '10px', backgroundColor: '#f8f9fa' }}
                                />
                              </>
                            ) : (
                              <>
                                <ExpandableSection toggleText="📄 execution-environment.yml" isExpanded>
                                  <TextArea
                                    value={JSON.stringify(generateYAMLPreview(), null, 2).replace(/"/g, '')}
                                    rows={8}
                                    readOnly
                                    style={{ fontFamily: 'monospace', fontSize: '10px', backgroundColor: '#f8f9fa' }}
                                  />
                                </ExpandableSection>
                                
                                {customEEForm.python_packages.length > 0 && (
                                  <ExpandableSection toggleText="📄 requirements.txt" style={{ marginTop: '8px' }}>
                                    <TextArea
                                      value={generateRequirementsTxt()}
                                      rows={4}
                                      readOnly
                                      style={{ fontFamily: 'monospace', fontSize: '10px', backgroundColor: '#f8f9fa' }}
                                    />
                                  </ExpandableSection>
                                )}
                                
                                {customEEForm.ansible_collections.length > 0 && (
                                  <ExpandableSection toggleText="📄 requirements.yml" style={{ marginTop: '8px' }}>
                                    <TextArea
                                      value={JSON.stringify(generateRequirementsYml(), null, 2).replace(/"/g, '')}
                                      rows={4}
                                      readOnly
                                      style={{ fontFamily: 'monospace', fontSize: '10px', backgroundColor: '#f8f9fa' }}
                                    />
                                  </ExpandableSection>
                                )}
                                
                                {customEEForm.system_packages.length > 0 && (
                                  <ExpandableSection toggleText="📄 bindep.txt" style={{ marginTop: '8px' }}>
                                    <TextArea
                                      value={generateBindepTxt()}
                                      rows={4}
                                      readOnly
                                      style={{ fontFamily: 'monospace', fontSize: '10px', backgroundColor: '#f8f9fa' }}
                                    />
                                  </ExpandableSection>
                                )}
                                
                                {customEEForm.additional_build_steps && (
                                  <ExpandableSection toggleText="🔧 Additional Build Steps" style={{ marginTop: '8px' }}>
                                    <TextArea
                                      value={customEEForm.additional_build_steps}
                                      rows={4}
                                      readOnly
                                      style={{ fontFamily: 'monospace', fontSize: '10px', backgroundColor: '#f8f9fa' }}
                                    />
                                  </ExpandableSection>
                                )}
                              </>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </GridItem>
                  </Grid>
                  
                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
                    <Text component="small">
                      <strong>🚀 Ready to create:</strong> The environment folder <code>environments/{customEEForm.name}</code> will be created with{' '}
                      {customEEForm.import_mode === 'yaml' ? 
                        'your exact YAML content written to execution-environment.yml.' : 
                        'all the files shown above.'
                      } The build process will start immediately after creation.
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </GridItem>
          
          {/* YAML Preview Sidebar - only show on wizard mode steps 0-3 */}
          {customEEForm.import_mode === 'wizard' && customEEStep < 4 && (
            <GridItem span={5}>
              <div style={{ position: 'sticky', top: '0' }}>
                <Card>
                  <CardTitle>
                    <Split>
                      <SplitItem>
                        <CodeIcon style={{ marginRight: '8px' }} />
                        Live Preview
                      </SplitItem>
                      <SplitItem isFilled />
                      <SplitItem>
                        <Badge>{customEEForm.name || 'unnamed-ee'}</Badge>
                      </SplitItem>
                    </Split>
                  </CardTitle>
                  <CardBody>
                    <Tabs defaultActiveKey={0} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                      <Tab eventKey={0} title={<TabTitleText>execution-environment.yml</TabTitleText>}>
                        <TextArea
                          value={`# Generated execution-environment.yml\n${JSON.stringify(generateYAMLPreview(), null, 2).replace(/"/g, '')}`}
                          rows={15}
                          readOnly
                          style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '11px',
                            backgroundColor: '#f8f9fa',
                            border: 'none'
                          }}
                        />
                      </Tab>
                      
                      {customEEForm.python_packages.length > 0 && (
                        <Tab eventKey={1} title={<TabTitleText>requirements.txt</TabTitleText>}>
                          <TextArea
                            value={`# Python dependencies\n${generateRequirementsTxt()}`}
                            rows={10}
                            readOnly
                            style={{ 
                              fontFamily: 'monospace', 
                              fontSize: '11px',
                              backgroundColor: '#f8f9fa',
                              border: 'none'
                            }}
                          />
                        </Tab>
                      )}
                      
                      {customEEForm.ansible_collections.length > 0 && (
                        <Tab eventKey={2} title={<TabTitleText>requirements.yml</TabTitleText>}>
                          <TextArea
                            value={`# Ansible collections\n${JSON.stringify(generateRequirementsYml(), null, 2).replace(/"/g, '')}`}
                            rows={10}
                            readOnly
                            style={{ 
                              fontFamily: 'monospace', 
                              fontSize: '11px',
                              backgroundColor: '#f8f9fa',
                              border: 'none'
                            }}
                          />
                        </Tab>
                      )}
                      
                      {customEEForm.system_packages.length > 0 && (
                        <Tab eventKey={3} title={<TabTitleText>bindep.txt</TabTitleText>}>
                          <TextArea
                            value={`# System dependencies\n${generateBindepTxt()}`}
                            rows={10}
                            readOnly
                            style={{ 
                              fontFamily: 'monospace', 
                              fontSize: '11px',
                              backgroundColor: '#f8f9fa',
                              border: 'none'
                            }}
                          />
                        </Tab>
                      )}
                    </Tabs>
                    
                    <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
                      <Text component="small">
                        <strong>📁 Files to be created:</strong><br/>
                        • execution-environment.yml<br/>
                        {customEEForm.python_packages.length > 0 && '• requirements.txt\n'}
                        {customEEForm.ansible_collections.length > 0 && '• requirements.yml\n'}
                        {customEEForm.system_packages.length > 0 && '• bindep.txt\n'}
                      </Text>
                    </div>
                  </CardBody>
                </Card>
              </div>
            </GridItem>
          )}
        </Grid>
      </div>
    </Modal>
  );
};

export default CustomEEWizardModal;
