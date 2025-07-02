# backend/app/services/custom_ee_service.py - Custom EE Wizard Service

import yaml
from datetime import datetime
from pathlib import Path
from typing import Dict, List

from app.models.custom_ee_models import CustomEERequest, CustomEEResponse, EETemplates
from app.models.build_models import BuildRequest
from app.core.config import settings
from app.utils.file_utils import ensure_directory_exists, write_yaml_file, write_text_file
from app.services.build_service import build_service


class CustomEEService:
    """Service for creating custom execution environments"""
    
    async def create_custom_ee(self, custom_ee: CustomEERequest) -> CustomEEResponse:
        """Create a custom execution environment with wizard inputs or YAML import"""
        # Validate name
        if not custom_ee.name or not custom_ee.name.replace('-', '').replace('_', '').isalnum():
            raise ValueError("Environment name must contain only letters, numbers, hyphens, and underscores")
        
        # Check if environment already exists
        environments_dir = Path(settings.ENVIRONMENTS_DIR)
        env_path = environments_dir / custom_ee.name
        
        if env_path.exists():
            raise FileExistsError(f"Environment '{custom_ee.name}' already exists")
        
        # Create environment directory
        ensure_directory_exists(str(env_path))
        
        # Handle YAML import mode vs wizard mode
        if custom_ee.import_mode == "yaml":
            await self._create_from_yaml(custom_ee, env_path)
        else:
            await self._create_from_wizard(custom_ee, env_path)
        
        print(f"✅ Created custom environment: {custom_ee.name} at {env_path}")
        
        # Optionally start build immediately
        build_id = None
        if custom_ee.build_immediately:
            try:
                build_request = BuildRequest(
                    environments=[custom_ee.name],
                    container_runtime=settings.CONTAINER_RUNTIME
                )
                build_response = await build_service.start_build(build_request)
                build_id = build_response.build_id
                print(f"🚀 Started immediate build for {custom_ee.name}: {build_id}")
            except Exception as e:
                print(f"⚠️ Failed to start immediate build: {e}")
        
        return CustomEEResponse(
            success=True,
            message=f"Successfully created custom environment '{custom_ee.name}'" + 
                   (f" using {custom_ee.import_mode} mode" if custom_ee.import_mode else ""),
            environment_path=str(env_path),
            build_id=build_id
        )
    
    async def _create_from_yaml(self, custom_ee: CustomEERequest, env_path: Path):
        """Create environment from YAML import"""
        if not custom_ee.yaml_content or not custom_ee.yaml_content.strip():
            raise ValueError("YAML content is required for import mode")
        
        # Validate YAML syntax
        try:
            yaml.safe_load(custom_ee.yaml_content)
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML syntax: {str(e)}")
        
        # Write the YAML content
        write_text_file(env_path / "execution-environment.yml", custom_ee.yaml_content)
        
        # Create README for YAML imports
        readme_content = f"""# {custom_ee.name}

**Created:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Import Mode:** YAML Import

## Description
This execution environment was created by importing an existing execution-environment.yml file.

## Build Command
```bash
ansible-builder build -t {custom_ee.name}:latest -f environments/{custom_ee.name}/execution-environment.yml
```

## Content
The execution-environment.yml file contains the exact YAML content that was imported.
"""
        
        write_text_file(env_path / "README.md", readme_content)
    
    async def _create_from_wizard(self, custom_ee: CustomEERequest, env_path: Path):
        """Create environment from wizard inputs"""
        # Generate execution-environment.yml
        execution_env_config = {
            "version": 3,
            "images": {
                "base_image": {
                    "name": custom_ee.base_image,
                    "options": {
                        "pull_policy": "missing",
                        "tls_verify": False
                    }
                }
            },
            "dependencies": {
                "ansible_core": {
                    "package_pip": "ansible-core>=2.15,<2.17"
                },
                "ansible_runner": {
                    "package_pip": "ansible-runner>=2.0.0"
                }
            },
            "options": {
                "package_manager_path": "/usr/bin/microdnf"
            }
        }
        
        # Add file dependencies
        if custom_ee.python_packages:
            execution_env_config["dependencies"]["python"] = "requirements.txt"
        
        if custom_ee.system_packages:
            execution_env_config["dependencies"]["system"] = "bindep.txt"
            
        if custom_ee.ansible_collections:
            execution_env_config["dependencies"]["galaxy"] = "requirements.yml"
        
        # Add additional build steps
        if custom_ee.additional_build_steps:
            execution_env_config["additional_build_steps"] = {
                "append_final": custom_ee.additional_build_steps
            }
        
        # Write execution-environment.yml
        write_yaml_file(env_path / "execution-environment.yml", execution_env_config)
        
        # Generate requirements.txt (Python packages)
        if custom_ee.python_packages:
            python_reqs = "\n".join(pkg.strip() for pkg in custom_ee.python_packages)
            write_text_file(env_path / "requirements.txt", python_reqs + "\n")
        
        # Generate bindep.txt (System packages)
        if custom_ee.system_packages:
            system_reqs = "\n".join(f"{pkg.strip()} [platform:rpm]" for pkg in custom_ee.system_packages)
            write_text_file(env_path / "bindep.txt", system_reqs + "\n")
        
        # Generate requirements.yml (Ansible collections)
        if custom_ee.ansible_collections:
            collections_config = {"collections": []}
            
            for collection in custom_ee.ansible_collections:
                if ':' in collection:
                    name, version = collection.split(':', 1)
                    collections_config["collections"].append({
                        "name": name.strip(),
                        "version": version.strip()
                    })
                else:
                    collections_config["collections"].append({
                        "name": collection.strip()
                    })
            
            write_yaml_file(env_path / "requirements.yml", collections_config)
        
        # Create README
        readme_content = f"""# {custom_ee.name}

**Description:** {custom_ee.description}

**Base Image:** {custom_ee.base_image}

**Created:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Components

### Python Packages
{chr(10).join(f"- {pkg}" for pkg in custom_ee.python_packages) if custom_ee.python_packages else "None"}

### System Packages  
{chr(10).join(f"- {pkg}" for pkg in custom_ee.system_packages) if custom_ee.system_packages else "None"}

### Ansible Collections
{chr(10).join(f"- {col}" for col in custom_ee.ansible_collections) if custom_ee.ansible_collections else "None"}

## Build Command
```bash
ansible-builder build -t {custom_ee.name}:latest -f environments/{custom_ee.name}/execution-environment.yml
```
"""
        
        write_text_file(env_path / "README.md", readme_content)
    
    def get_ee_templates(self) -> EETemplates:
        """Get common templates/examples for custom EE creation"""
        return EETemplates(
            python_packages={
                "web_automation": ["requests", "beautifulsoup4", "selenium", "urllib3"],
                "data_science": ["pandas", "numpy", "matplotlib", "jupyter"],
                "cloud_aws": ["boto3", "botocore", "awscli"],
                "cloud_azure": ["azure-cli", "azure-identity", "azure-mgmt-compute"],
                "kubernetes": ["kubernetes", "openshift", "pyyaml"],
                "network_automation": ["netmiko", "napalm", "paramiko", "textfsm"],
                "windows": ["pywinrm", "requests-ntlm", "requests-kerberos"],
                "monitoring": ["prometheus-client", "grafana-api", "influxdb-client"]
            },
            system_packages={
                "development": ["gcc", "python3-devel", "make", "git"],
                "kerberos": ["krb5-devel", "krb5-libs", "krb5-workstation"],
                "ssl_crypto": ["openssl-devel", "libffi-devel"],
                "databases": ["postgresql-devel", "mysql-devel", "sqlite-devel"],
                "network": ["openssh-clients", "telnet", "nmap"],
                "containers": ["podman", "buildah", "skopeo"]
            },
            ansible_collections={
                "cloud_aws": ["amazon.aws", "community.aws"],
                "cloud_azure": ["azure.azcollection", "community.azure"],
                "cloud_gcp": ["google.cloud", "community.google"],
                "kubernetes": ["kubernetes.core", "community.kubernetes"],
                "network": ["cisco.ios", "juniper.junos", "arista.eos"],
                "windows": ["ansible.windows", "community.windows"],
                "linux": ["community.general", "ansible.posix"],
                "monitoring": ["community.grafana", "community.zabbix"],
                "security": ["community.crypto", "community.hashi_vault"]
            }
        )


# Create global service instance
custom_ee_service = CustomEEService()
