// hooks/useCustomEE.ts
import { useState, useCallback } from 'react';
import { BaseImage, PackageTemplates, CustomEEForm } from '../types';

export const useCustomEE = () => {
  // State extracted from App.tsx
  const [isCustomEEWizardOpen, setIsCustomEEWizardOpen] = useState(false);
  const [customEEStep, setCustomEEStep] = useState(0);
  const [availableBaseImages, setAvailableBaseImages] = useState<Record<string, BaseImage>>({});
  const [packageTemplates, setPackageTemplates] = useState<PackageTemplates | null>(null);
  const [customEEForm, setCustomEEForm] = useState<CustomEEForm>({
    name: '',
    description: '',
    base_image: '',
    custom_base_image: '',
    use_custom_base_image: false,
    python_packages: [],
    system_packages: [],
    ansible_collections: [],
    additional_build_steps: '',
    import_mode: '',
    yaml_content: ''
  });

  // API call function (will be replaced with shared service later)
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

      return await response.json();
    } catch (error: any) {
      console.error(`API call failed for ${url}:`, error);
      throw error;
    }
  };

  const loadCustomEEData = useCallback(async () => {
    try {
      const [baseImagesResponse, templatesResponse] = await Promise.all([
        apiCall('/api/custom-ee/base-images'),
        apiCall('/api/custom-ee/templates')
      ]);
      
      setAvailableBaseImages(baseImagesResponse.base_images);
      
      // Use safe, tested templates if backend doesn't provide them
      const safeTemplates = templatesResponse || {
        python_packages: {
          "basic_automation": ["pyyaml", "jinja2", "python-dateutil"],
          "web_requests": ["requests", "urllib3"],
          "data_processing": ["pandas", "numpy"],
          "web_scraping": ["requests", "beautifulsoup4", "lxml"],
          "system_monitoring": ["psutil", "systemd-python"]
        },
        system_packages: {
          "basic_tools": ["git", "curl", "wget"],
          "development_tools": ["gcc", "make", "python3-devel"],
          "openshift_tools": ["openshift-clients"],
          "kubernetes_tools": ["kubectl"]
        },
        ansible_collections: {
          "core_collections": ["ansible.posix", "community.general"],
          "cloud_providers": ["amazon.aws", "azure.azcollection"],
          "kubernetes_automation": ["kubernetes.core", "redhat.openshift"]
        }
      };
      
      setPackageTemplates(safeTemplates);
    } catch (err) {
      console.error('Failed to load custom EE data:', err);
      
      // Fallback to safe templates on error
      setPackageTemplates({
        python_packages: {
          "basic_automation": ["pyyaml", "jinja2", "python-dateutil"],
          "web_requests": ["requests", "urllib3"],
          "data_processing": ["pandas", "numpy"]
        },
        system_packages: {
          "basic_tools": ["git", "curl", "wget"],
          "development_tools": ["gcc", "make", "python3-devel"]
        },
        ansible_collections: {
          "core_collections": ["ansible.posix", "community.general"]
        }
      });
    }
  }, []);

  const addPackageFromTemplate = useCallback((type: 'python_packages' | 'system_packages' | 'ansible_collections', template: string) => {
    if (!packageTemplates) return;
    
    const packages = packageTemplates[type][template] || [];
    setCustomEEForm(prev => ({
      ...prev,
      [type]: Array.from(new Set([...prev[type], ...packages])) // Remove duplicates
    }));
  }, [packageTemplates]);

  const addCustomPackage = useCallback((type: 'python_packages' | 'system_packages' | 'ansible_collections', packageName: string) => {
    if (!packageName.trim()) return;
    
    setCustomEEForm(prev => ({
      ...prev,
      [type]: Array.from(new Set([...prev[type], packageName.trim()]))
    }));
  }, []);

  const removePackage = useCallback((type: 'python_packages' | 'system_packages' | 'ansible_collections', packageName: string) => {
    setCustomEEForm(prev => ({
      ...prev,
      [type]: prev[type].filter(pkg => pkg !== packageName)
    }));
  }, []);

  const getStepTitle = useCallback((step: number) => {
    if (customEEForm.import_mode === 'yaml') {
      switch (step) {
        case 0: return 'Import YAML Configuration';
        case 1: return 'Review & Create';
        default: return 'Custom EE Import';
      }
    } else {
      switch (step) {
        case 0: return 'Basic Information';
        case 1: return 'Python Packages';
        case 2: return 'System Packages';
        case 3: return 'Ansible Collections';
        case 4: return 'Review & Create';
        default: return 'Custom EE Wizard';
      }
    }
  }, [customEEForm.import_mode]);

  const resetCustomEEForm = useCallback(() => {
    setCustomEEForm({
      name: '',
      description: '',
      base_image: '',
      custom_base_image: '',
      use_custom_base_image: false,
      python_packages: [],
      system_packages: [],
      ansible_collections: [],
      additional_build_steps: '',
      import_mode: '', // This ensures we go back to mode selection
      yaml_content: ''
    });
    setCustomEEStep(0); // Reset to first step
  }, []);

  const extractBaseImageFromYAML = useCallback((yamlContent: string): string => {
    try {
      const lines = yamlContent.split('\n');
      let inImagesSection = false;
      let inBaseImageSection = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Check if we're entering the images section
        if (trimmedLine === 'images:') {
          inImagesSection = true;
          continue;
        }
        
        // Check if we're entering the base_image section within images
        if (inImagesSection && trimmedLine === 'base_image:') {
          inBaseImageSection = true;
          continue;
        }
        
        // Look for the name field within base_image
        if (inBaseImageSection && trimmedLine.startsWith('name:')) {
          const imageNameMatch = trimmedLine.match(/name:\s*(.+)$/);
          if (imageNameMatch) {
            return imageNameMatch[1].trim();
          }
        }
        
        // Reset flags if we encounter a new top-level section
        if (trimmedLine.endsWith(':') && !trimmedLine.startsWith(' ') && !trimmedLine.startsWith('\t')) {
          if (trimmedLine !== 'images:') {
            inImagesSection = false;
          }
          inBaseImageSection = false;
        }
      }
    } catch (e) {
      console.error('Error parsing YAML:', e);
    }
    return '';
  }, []);

  const canProceedToNextStep = useCallback((step: number, rhAuthStatus: string): boolean => {
    if (customEEForm.import_mode === 'yaml') {
      switch (step) {
        case 0: 
          // YAML mode: name must be lowercase and not empty, YAML content required
          const nameValid = customEEForm.name.trim() !== '' && customEEForm.name === customEEForm.name.toLowerCase();
          const yamlValid = customEEForm.yaml_content.trim() !== '';
          return nameValid && yamlValid;
        case 1: 
          // Final step for YAML mode: check Red Hat registry authentication if needed
          const finalBaseImage = extractBaseImageFromYAML(customEEForm.yaml_content);
          const isRedHatRegistry = finalBaseImage?.includes('registry.redhat.io');
          if (isRedHatRegistry && rhAuthStatus !== 'authenticated') {
            return false;
          }
          return true;
        default: return false;
      }
    } else if (customEEForm.import_mode === 'wizard') {
      // Wizard mode logic
      switch (step) {
        case 0: 
          // Basic info: name must be lowercase and not empty, base image must be selected
          const nameValid = customEEForm.name.trim() !== '' && customEEForm.name === customEEForm.name.toLowerCase();
          const baseImageValid = customEEForm.use_custom_base_image ? 
            customEEForm.custom_base_image.trim() !== '' : 
            customEEForm.base_image !== '';
          return nameValid && baseImageValid;
        case 1: case 2: case 3: return true; // Optional steps
        case 4: 
          // Final step: check Red Hat registry authentication if needed
          const finalBaseImage = customEEForm.use_custom_base_image ? 
            customEEForm.custom_base_image : 
            customEEForm.base_image;
          
          // Check if using Red Hat registry
          const isRedHatRegistry = finalBaseImage?.includes('registry.redhat.io');
          if (isRedHatRegistry && rhAuthStatus !== 'authenticated') {
            return false; // Block if RH registry but not authenticated
          }
          return true;
        default: return false;
      }
    } else {
      // No mode selected yet - can't proceed until mode is selected
      return false;
    }
  }, [customEEForm, extractBaseImageFromYAML]);

  // Generate YAML preview based on current form state
  const generateYAMLPreview = useCallback(() => {
    const finalBaseImage = customEEForm.use_custom_base_image ? 
      customEEForm.custom_base_image : 
      customEEForm.base_image || 'registry.redhat.io/ansible-automation-platform-25/ee-minimal-rhel9:latest';
      
    const yaml: any = {
      version: 3,
      images: {
        base_image: {
          name: finalBaseImage
        }
      },
      dependencies: {
        python_interpreter: {
          package_system: "python3"
        },
        ansible_core: {
          package_pip: "ansible-core"
        },
        ansible_runner: {
          package_pip: "ansible-runner"
        }
      }
    };

    // Add system packages (always include openssh-clients, sshpass as basics)
    const systemPackages = ['openssh-clients', 'sshpass', ...customEEForm.system_packages];
    if (systemPackages.length > 0) {
      yaml.dependencies.system = Array.from(new Set(systemPackages)); // Remove duplicates
    }

    // Add Python packages
    if (customEEForm.python_packages.length > 0) {
      yaml.dependencies.python = 'requirements.txt';
    }

    // Add Ansible collections
    if (customEEForm.ansible_collections.length > 0) {
      yaml.dependencies.galaxy = 'requirements.yml';
    }

    if (customEEForm.additional_build_steps.trim()) {
      yaml.additional_build_steps = customEEForm.additional_build_steps.trim();
    }

    return yaml;
  }, [customEEForm]);

  const generateRequirementsTxt = useCallback(() => {
    return customEEForm.python_packages.join('\n');
  }, [customEEForm.python_packages]);

  const generateRequirementsYml = useCallback(() => {
    if (customEEForm.ansible_collections.length === 0) return '';
    
    const collections = customEEForm.ansible_collections.map(col => {
      if (col.includes(':')) {
        const [name, version] = col.split(':');
        return { name: name.trim(), version: version.trim() };
      }
      return { name: col.trim() };
    });

    return {
      collections: collections
    };
  }, [customEEForm.ansible_collections]);

  const generateBindepTxt = useCallback(() => {
    return customEEForm.system_packages.join('\n');
  }, [customEEForm.system_packages]);

  const createCustomEE = useCallback(async (
    rhAuthStatus: string,
    startCustomEEBuild: (name: string, buildId: string) => void,
    loadEnvironments: () => Promise<void>
  ) => {
    // For YAML mode, we just need the name and raw YAML content
    if (customEEForm.import_mode === 'yaml') {
      // Check Red Hat registry authentication if needed (for the validation logic)
      const extractedBaseImage = extractBaseImageFromYAML(customEEForm.yaml_content);
      if (extractedBaseImage?.includes('registry.redhat.io') && rhAuthStatus !== 'authenticated') {
        throw new Error('Red Hat registry authentication required. Please login first.');
      }

      // For YAML mode, send the name and raw YAML content
      const yamlImportData = {
        name: customEEForm.name,
        import_mode: 'yaml',
        yaml_content: customEEForm.yaml_content,
        build_immediately: true
      };

      try {
        const response = await apiCall('/api/custom-ee/create', {
          method: 'POST',
          body: JSON.stringify(yamlImportData)
        });

        if (response.success) {
          // Reload environments to show the new one
          await loadEnvironments();
          
          // Since we always build, start polling if build_id provided
          if (response.build_id) {
            startCustomEEBuild(customEEForm.name, response.build_id);
          }

          return {
            success: true,
            message: `✅ ${response.message}${response.build_id ? ` Build started: ${response.build_id}` : ''}`,
            build_id: response.build_id
          };
        } else {
          throw new Error(response.message);
        }
      } catch (err: any) {
        throw new Error(`Failed to create custom EE: ${err.message}`);
      }
    }

    // For wizard mode, check Red Hat registry authentication before proceeding
    const finalBaseImage = customEEForm.use_custom_base_image ? 
      customEEForm.custom_base_image : 
      customEEForm.base_image;
    
    if (finalBaseImage?.includes('registry.redhat.io') && rhAuthStatus !== 'authenticated') {
      throw new Error('Red Hat registry authentication required. Please login first.');
    }

    try {
      const response = await apiCall('/api/custom-ee/create', {
        method: 'POST',
        body: JSON.stringify({
          ...customEEForm,
          build_immediately: true // Always build when using the wizard
        })
      });

      if (response.success) {
        // Reload environments to show the new one
        await loadEnvironments();
        
        // Since we always build, start polling if build_id provided
        if (response.build_id) {
          startCustomEEBuild(customEEForm.name, response.build_id);
        }

        return {
          success: true,
          message: `✅ ${response.message}${response.build_id ? ` Build started: ${response.build_id}` : ''}`,
          build_id: response.build_id
        };
      } else {
        const errorMessage = response.message.includes('dependencies') ? 
          `${response.message} - Try adding required system packages or removing problematic Python packages.` : 
          response.message;
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message.includes('metadata-generation-failed') || err.message.includes('package') ?
        `Failed to create custom EE: ${err.message} - This may be due to missing system dependencies. Try adding development packages like 'gcc', 'python3-dev' in Step 2.` :
        `Failed to create custom EE: ${err.message}`;
      throw new Error(errorMessage);
    }
  }, [customEEForm, extractBaseImageFromYAML, apiCall]);

  const openWizard = useCallback(() => {
    resetCustomEEForm();
    setIsCustomEEWizardOpen(true);
  }, [resetCustomEEForm]);

  const closeWizard = useCallback(() => {
    setIsCustomEEWizardOpen(false);
    resetCustomEEForm();
  }, [resetCustomEEForm]);

  const nextStep = useCallback(() => {
    setCustomEEStep(prev => prev + 1);
  }, []);

  const previousStep = useCallback(() => {
    setCustomEEStep(prev => prev - 1);
  }, []);

  const updateFormField = useCallback((field: keyof CustomEEForm, value: any) => {
    setCustomEEForm(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  return {
    // State
    isCustomEEWizardOpen,
    customEEStep,
    availableBaseImages,
    packageTemplates,
    customEEForm,
    
    // Functions
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
    updateFormField,
    
    // State setters (for advanced use)
    setCustomEEForm,
    setCustomEEStep
  };
};
