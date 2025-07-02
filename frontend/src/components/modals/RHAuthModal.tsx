import React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Alert,
  Form,
  FormGroup,
  TextInput,
  Text
} from '@patternfly/react-core';

interface RHAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  isLoggingIn: boolean;
  credentials: {
    username: string;
    password: string;
  };
  onUpdateCredentials: (field: 'username' | 'password', value: string) => void;
}

const RHAuthModal: React.FC<RHAuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  isLoggingIn,
  credentials,
  onUpdateCredentials
}) => {
  return (
    <Modal
      variant={ModalVariant.small}
      title="Red Hat Registry Authentication"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button 
          key="login" 
          variant="primary" 
          onClick={onLogin}
          isLoading={isLoggingIn}
          isDisabled={!credentials.username || !credentials.password}
        >
          {isLoggingIn ? 'Authenticating...' : 'Login'}
        </Button>,
        <Button key="cancel" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      ]}
    >
      <div style={{ padding: '16px' }}>
        <Alert 
          variant="info" 
          title="Red Hat Registry Login Required" 
          isInline 
          style={{ marginBottom: '16px' }}
        >
          Selected environments require images from registry.redhat.io. Please provide your Red Hat Customer Portal credentials.
        </Alert>
        
        <Form>
          <FormGroup label="Red Hat Username" isRequired fieldId="rh-username">
            <TextInput
              id="rh-username"
              type="text"
              value={credentials.username}
              onChange={(event, value) => onUpdateCredentials('username', value)}
              placeholder="your-redhat-username"
              autoComplete="username"
            />
          </FormGroup>
          
          <FormGroup label="Red Hat Password" isRequired fieldId="rh-password">
            <TextInput
              id="rh-password"
              type="password"
              value={credentials.password}
              onChange={(event, value) => onUpdateCredentials('password', value)}
              placeholder="your-redhat-password"
              autoComplete="current-password"
            />
          </FormGroup>
        </Form>
        
        <Text component="small" style={{ color: '#6a6e73', marginTop: '8px' }}>
          Your credentials are used only to authenticate with registry.redhat.io and are not stored.
        </Text>
      </div>
    </Modal>
  );
};

export default RHAuthModal;
