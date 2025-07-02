import React from 'react';
import { useEnvironments } from './hooks/useEnvironments';
import { useBuilds } from './hooks/useBuilds';
import { useAuth } from './hooks/useAuth';
import { useCustomEE } from './hooks/useCustomEE';
import DashboardStats from './components/dashboard/DashboardStats';
import RHAuthModal from './components/modals/RHAuthModal';
import EnvironmentDetailsModal from './components/modals/EnvironmentDetailsModal';
import CustomEEWizardModal from './components/modals/CustomEEWizardModal';
import BuildProgressModal from './components/modals/BuildProgressModal';
import EnvironmentList from './components/environments/EnvironmentList';
import AppHeader from './components/layout/AppHeader';
import BuildControl from './components/builds/BuildControl';
import AlertMessages from './components/alerts/AlertMessages';

import {
  Page,
  PageSection,
  Grid,
  GridItem,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  ActionGroup,
  Alert,
  Checkbox,
  Progress,
  ProgressSize,
  Spinner,
  Tabs,
  Tab,
  TabTitleText,
  ExpandableSection,
  Badge,
  TextArea,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription
} from '@patternfly/react-core';

import { 
  CubesIcon,
  InfoCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TimesCircleIcon,
  ClockIcon,
  CodeIcon,
  PficonTemplateIcon,
  ExclamationCircleIcon,
  DisconnectedIcon,
  KeyIcon
} from '@patternfly/react-icons';

import {
  Environment,
  EnvironmentDetails,
  Build,
  DashboardStats as DashboardStatsType
} from './types';

const App: React.FC = () => {
  const [isCustomEEModalOpen, setIsCustomEEModalOpen] = React.useState(false);
  const [isBuildModalOpen, setIsBuildModalOpen] = React.useState(false);
  const [isRHAuthModalOpen, setIsRHAuthModalOpen] = React.useState(false);
  const [dashboardStats, setDashboardStats] = React.useState<DashboardStatsType | null>(null);
  const [buildResult, setBuildResult] = React.useState<{type: 'success' | 'danger' | 'warning' | 'info', message: string} | null>(null);
  const [activeTab, setActiveTab] = React.useState<string | number>(0);
  const [connectionStatus, setConnectionStatus] = React.useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [retryCount, setRetryCount] = React.useState<number>(0);

  const {
    environments,
    selectedEnvs,
    loading,
    filterType,
    filterOS,
    filterTemplateType,
    filteredEnvironments,
    selectedEnvDetails,
    isDetailsModalOpen,
    setSelectedEnvs,
    setFilterType,
    setFilterOS,
    setFilterTemplateType,
    loadEnvironments,
    loadEnvironmentDetails,
    handleEnvToggle,
    handleLoadEnvironmentDetails,
    closeDetailsModal
  } = useEnvironments();

  const {
    building,
    currentBuild,
    buildDebugInfo,
    setBuilding,
    setCurrentBuild,
    startBuild,
    cancelBuild,
    getProgressValue,
    cleanup: cleanupBuilds,
    startCustomEEBuild,
    pollBuildStatus
  } = useBuilds();

  const {
    rhAuthStatus,
    rhUsername,
    rhCredentials,
    isLoggingIn,
    checkRHAuthStatus,
    loginToRH,
    logoutFromRH,
    updateCredentials,
    clearCredentials,
    isAuthRequired,
    getAuthStatusMessage,
    getAuthStatusColor
  } = useAuth();

  const {
    isCustomEEWizardOpen,
    customEEStep,
    availableBaseImages,
    packageTemplates,
    customEEForm,
    loadCustomEEData,
    addPackageFromTemplate,
    addCustomPackage,
    removePackage,
    getStepTitle,
    resetCustomEEForm,
    extractBaseImageFromYAML,
    canProceedToNextStep,
    generateYAMLPreview,
    generateRequirementsTxt,
    generateRequirementsYml,
    generateBindepTxt,
    createCustomEE,
    openWizard,
    closeWizard,
    nextStep,
    previousStep,
    updateFormField
  } = useCustomEE();
 
  // Enhanced API call with better error handling                               
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
                                                                                
      const data = await response.json();                                       
      setConnectionStatus('connected');                                         
      setRetryCount(0);                                                         
      return data;                                                              
    } catch (error: any) {                                                      
      console.error(`API call failed for ${url}:`, error);                      
                                                                                
      if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
        setConnectionStatus('disconnected');                                    
      }                                                                         
                                                                                
      throw error;                                                              
    }                                                                           
  }; 

  // Custom EE creation handler
  const handleCreateCustomEE = async () => {
    try {
      const result = await createCustomEE(rhAuthStatus, startCustomEEBuild, loadEnvironments);
      setBuildResult({ type: 'success', message: result.message });
      closeWizard();
      if (result.build_id) {
        setIsBuildModalOpen(true);
      }
    } catch (err: any) {
      if (err.message.includes('Red Hat registry authentication required')) {
        setBuildResult({ 
          type: 'warning', 
          message: 'Selected environments require Red Hat registry authentication. Please login first.' 
        });
        setIsRHAuthModalOpen(true);
      } else {
        setBuildResult({ type: 'danger', message: `❌ ${err.message}` });
      }
    }
  };

  const authenticateWithRH = async () => {
    if (!rhCredentials.username || !rhCredentials.password) {
      setBuildResult({ type: 'danger', message: 'Please enter both username and password' });
      return;
    }
  
    try {
      const result = await loginToRH(rhCredentials);
      setBuildResult({ type: 'success', message: result.message });
      setIsRHAuthModalOpen(false);
    } catch (err: any) {
      setBuildResult({ type: 'danger', message: err.message });
    }
  };

  const loadDashboardStats = async () => {
    try {
      const data = await apiCall('/api/dashboard/stats');
      setDashboardStats(data);
    } catch (err: any) {
      console.error('Failed to fetch dashboard stats:', err);
      // Don't show error for dashboard stats as it's not critical
    }
  };

  const reloadEnvironments = async () => {
    await loadEnvironments();
    await loadDashboardStats();
    await checkRHAuthStatus();
    setBuildResult({ type: 'success', message: 'Environments reloaded!' });
  };

  const handleStartBuild = async () => {
    if (selectedEnvs.length === 0) {
      setBuildResult({ type: 'danger', message: 'Please select at least one environment' });
      return;
    }
  
    // Check if we need RH authentication
    const needsRHAuth = isAuthRequired(selectedEnvs);

    if (needsRHAuth && rhAuthStatus !== 'authenticated') {
      setBuildResult({ 
        type: 'warning', 
        message: 'Selected environments require Red Hat registry authentication. Please login first.' 
      });
      setIsRHAuthModalOpen(true);
      return;
    }
  
    try {
      setBuildResult(null);
      setIsBuildModalOpen(true);
      const result = await startBuild(selectedEnvs); // This now comes from the hook
      setBuildResult({ type: 'success', message: `Build started: ${result.build_id}` });
    } catch (err: any) {
      setBuildResult({ type: 'danger', message: `Failed to start build: ${err.message}` });
      setIsBuildModalOpen(false);
    }
  };

  // Connection retry logic
  const retryConnection = async () => {
    setRetryCount(prev => prev + 1);
    setBuildResult({ type: 'info', message: `Attempting to reconnect... (attempt ${retryCount + 1})` });
    
    try {
      await loadEnvironments();
      await loadDashboardStats();
      await checkRHAuthStatus();
      setBuildResult({ type: 'success', message: 'Connection restored!' });
    } catch (err) {
      setBuildResult({ type: 'danger', message: 'Still unable to connect. Check if backend is running.' });
    }
  };

  // Dashboard card click handlers
  const showBuildIssues = () => {
    if (dashboardStats?.build_issues.details.length) {
      const issueText = dashboardStats.build_issues.details
        .map(issue => `${issue.environment}: ${issue.issue}`)
        .join('\n');
      
      setBuildResult({ 
        type: 'warning', 
        message: `Build Issues Found:\n${issueText}` 
      });
    }
  };

  const showLargeImages = () => {
    if (dashboardStats?.large_images.details.length) {
      const imageText = dashboardStats.large_images.details
        .map(img => `${img.environment}: ~${img.estimated_size_mb}MB`)
        .join('\n');
      
      setBuildResult({ 
        type: 'info', 
        message: `Large Images:\n${imageText}` 
      });
    }
  };

  const showRecentUpdates = () => {
    if (dashboardStats?.recently_updated.details.length) {
      const updateText = dashboardStats.recently_updated.details
        .map(env => `${env.environment}: ${env.days_ago} days ago`)
        .join('\n');
      
      setBuildResult({ 
        type: 'info', 
        message: `Recently Updated:\n${updateText}` 
      });
    }
  };

  // Update your useEffect to load custom EE data:
  React.useEffect(() => {
    loadEnvironments();
    loadDashboardStats();
    checkRHAuthStatus();
    loadCustomEEData(); // Add this line
  }, []);

  // Refresh dashboard stats every 30 seconds, but only if connected
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (connectionStatus === 'connected') {
        loadDashboardStats();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [connectionStatus]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircleIcon style={{ color: '#3e8635' }} />;
      case 'yaml_error': return <ExclamationTriangleIcon style={{ color: '#f0ab00' }} />;
      case 'yaml_warning': return <InfoCircleIcon style={{ color: '#f0ab00' }} />;
      default: return <InfoCircleIcon style={{ color: '#2b9af3' }} />;
    }
  };

  const getBuildStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon style={{ color: '#3e8635' }} />;
      case 'failed': return <TimesCircleIcon style={{ color: '#c9190b' }} />;
      case 'lost': return <ExclamationCircleIcon style={{ color: '#f0ab00' }} />;
      case 'running': case 'starting': return <Spinner size="sm" />;
      default: return <ClockIcon style={{ color: '#6a6e73' }} />;
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <CheckCircleIcon style={{ color: '#3e8635' }} />;
      case 'disconnected': return <DisconnectedIcon style={{ color: '#c9190b' }} />;
      case 'checking': return <Spinner size="sm" />;
    }
  };

  const getRHAuthStatusIcon = () => {
    switch (rhAuthStatus) {
      case 'authenticated': return <CheckCircleIcon style={{ color: '#3e8635' }} />;
      case 'failed': return <TimesCircleIcon style={{ color: '#c9190b' }} />;
      case 'none': return <KeyIcon style={{ color: '#f0ab00' }} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ee': return 'blue';
      case 'de': return 'purple';
      case 'devtools': return 'orange';
      case 'template': return 'cyan';
      default: return 'grey';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'template': return <PficonTemplateIcon />;
      case 'devtools': return <CodeIcon />;
      default: return <CubesIcon />;
    }
  };

  return (
    <Page>
      {/* Header Section */}
      <AppHeader
        connectionStatus={connectionStatus}
        loading={loading}
        dashboardStats={dashboardStats}
        onRetryConnection={retryConnection}
        onOpenWizard={openWizard}
        onReloadEnvironments={reloadEnvironments}
        onShowBuildIssues={showBuildIssues}
        onShowLargeImages={showLargeImages}
        onShowRecentUpdates={showRecentUpdates}
        getConnectionStatusIcon={getConnectionStatusIcon}
      />

      {/* Alert Messages */}
      <AlertMessages
        buildResult={buildResult}
        connectionStatus={connectionStatus}
        onCloseBuildResult={() => setBuildResult(null)}
        onCloseConnectionAlert={() => setConnectionStatus('checking')}
      />

      {/* Main Content */}
      <PageSection>
        <Grid hasGutter>
          <GridItem lg={8} md={12}>
            <EnvironmentList
              loading={loading}
              connectionStatus={connectionStatus}
              filteredEnvironments={filteredEnvironments}
              selectedEnvs={selectedEnvs}
              filterType={filterType}
              filterOS={filterOS}
              filterTemplateType={filterTemplateType}
              onFilterTypeChange={setFilterType}
              onFilterOSChange={setFilterOS}
              onFilterTemplateTypeChange={setFilterTemplateType}
              onEnvToggle={handleEnvToggle}
              onLoadEnvironmentDetails={handleLoadEnvironmentDetails}
              onRetryConnection={retryConnection}
              getStatusIcon={getStatusIcon}
              getTypeIcon={getTypeIcon}
              getTypeColor={getTypeColor}
            />
          </GridItem>

          <GridItem lg={4} md={12}>
            <BuildControl
              selectedEnvs={selectedEnvs}
              rhAuthStatus={rhAuthStatus}
              rhUsername={rhUsername}
              connectionStatus={connectionStatus}
              building={building}
              environmentsCount={environments.length}
              onStartBuild={handleStartBuild}
              onLogoutFromRH={logoutFromRH}
              onOpenRHAuthModal={() => setIsRHAuthModalOpen(true)}
              getConnectionStatusIcon={getConnectionStatusIcon}
            />
          </GridItem>
        </Grid>
      </PageSection>

      {/* Build Progress Modal */}
      <BuildProgressModal
        isOpen={isBuildModalOpen}
        onClose={closeDetailsModal}
        building={building}
        currentBuild={currentBuild}
        buildDebugInfo={buildDebugInfo}
        selectedEnvs={selectedEnvs}
        onCancelBuild={cancelBuild}
        getProgressValue={getProgressValue}
        getBuildStatusIcon={getBuildStatusIcon}
      />

      {/* Red Hat Authentication Modal */}
      <RHAuthModal
        isOpen={isRHAuthModalOpen}
        onClose={() => setIsRHAuthModalOpen(false)}
        onLogin={authenticateWithRH}
        isLoggingIn={isLoggingIn}
        credentials={rhCredentials}
        onUpdateCredentials={updateCredentials}
      />

      {/* Environment Details Modal */}
      <EnvironmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        selectedEnvDetails={selectedEnvDetails}
        activeTab={activeTab}
        onTabSelect={(event, tabIndex) => setActiveTab(tabIndex)}
        getTypeColor={getTypeColor}
      />

      {/* Custom EE Wizard Modal */}
      <CustomEEWizardModal
        isOpen={isCustomEEWizardOpen}
        onClose={closeWizard}
        customEEStep={customEEStep}
        customEEForm={customEEForm}
        availableBaseImages={availableBaseImages}
        packageTemplates={packageTemplates}
        rhAuthStatus={rhAuthStatus}
        onSetIsRHAuthModalOpen={setIsRHAuthModalOpen}
        onCreateCustomEE={handleCreateCustomEE}
        getStepTitle={getStepTitle}
        canProceedToNextStep={canProceedToNextStep}
        nextStep={nextStep}
        previousStep={previousStep}
        updateFormField={updateFormField}
        addPackageFromTemplate={addPackageFromTemplate}
        addCustomPackage={addCustomPackage}
        removePackage={removePackage}
        extractBaseImageFromYAML={extractBaseImageFromYAML}
        generateYAMLPreview={generateYAMLPreview}
        generateRequirementsTxt={generateRequirementsTxt}
        generateRequirementsYml={generateRequirementsYml}
        generateBindepTxt={generateBindepTxt}
      />
    </Page>
  );
};

export default App;
