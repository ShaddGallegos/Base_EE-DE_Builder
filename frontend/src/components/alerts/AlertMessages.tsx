import React from 'react';
import {
  PageSection,
  Alert,
  AlertActionCloseButton
} from '@patternfly/react-core';

interface AlertMessagesProps {
  buildResult: {
    type: 'success' | 'danger' | 'warning' | 'info';
    message: string;
  } | null;
  connectionStatus: 'connected' | 'disconnected' | 'checking';
  onCloseBuildResult: () => void;
  onCloseConnectionAlert: () => void;
}

const AlertMessages: React.FC<AlertMessagesProps> = ({
  buildResult,
  connectionStatus,
  onCloseBuildResult,
  onCloseConnectionAlert
}) => {
  return (
    <>
      {/* Alert Messages */}
      {buildResult && (
        <PageSection>
          <Alert 
            variant={buildResult.type} 
            title={buildResult.message} 
            actionClose={
              <AlertActionCloseButton 
                aria-label="Close alert" 
                onClose={onCloseBuildResult} 
              />
            } 
          />
        </PageSection>
      )}

      {/* Connection Warning */}
      {connectionStatus === 'disconnected' && (
        <PageSection>
          <Alert 
            variant="danger" 
            title="Backend Connection Lost" 
            actionClose={
              <AlertActionCloseButton 
                aria-label="Close alert" 
                onClose={onCloseConnectionAlert} 
              />
            }
          >
            Unable to connect to the backend server. Make sure it's running on localhost:8000.
          </Alert>
        </PageSection>
      )}
    </>
  );
};

export default AlertMessages;
