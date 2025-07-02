// types/Environment.ts
export interface Environment {
  name: string;
  description: string;
  type: string; // ee, de, devtools, template
  os_version: string;
  variant: string;
  base_image: string;
  status: string;
  python_deps: string[];
  ansible_collections: string[];
  system_deps: string[];
  build_args: any;
  file_size_mb?: number;
  template_type: string; // "1-file" or "4-file"
}

export interface EnvironmentDetails {
  environment: Environment;
  execution_environment_yml: any;
  requirements_txt: string[];
  requirements_yml: any;
  bindep_txt: string[];
  files_info: any;
}

export interface BaseImage {
  name: string;
  description: string;
  type: string;
  os: string;
}

export interface PackageTemplates {
  python_packages: Record<string, string[]>;
  system_packages: Record<string, string[]>;
  ansible_collections: Record<string, string[]>;
}

export interface CustomEEForm {
  name: string;
  description: string;
  base_image: string;
  custom_base_image: string;
  use_custom_base_image: boolean;
  python_packages: string[];
  system_packages: string[];
  ansible_collections: string[];
  additional_build_steps: string;
  import_mode: 'wizard' | 'yaml' | '';
  yaml_content: string;
}

