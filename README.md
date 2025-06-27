# Base_EE-DE_Builder

## Project Overview

Base_EE-DE_Builder provides a toolkit and reference implementation for creating custom Ansible Execution Environments (EE) and Development Environments (DE) specifically designed for use with Ansible Automation Platform (AAP). This project streamlines the workflow of building, publishing, and utilizing containerized environments in your AAP infrastructure.

## Purpose & Workflow

This project serves as a guide and reference implementation for:

1. **Building** custom EE/DE containers with specific dependencies and tools
2. **Publishing** these environments to your Automation Hub
3. **Deploying** them to your AAP Controller
4. **Utilizing** them in your automation workflows

## Key Components

- **Environment Definitions**: Reference implementations demonstrating how to define EE/DE containers
- **Build Scripts**: Utilities to streamline container creation
- **Documentation**: Guidance on integrating with AAP infrastructure
- **Examples**: Working configurations for common use cases

## Pre-defined Environments

The project includes ready-to-build definitions for:

- **RHEL 8 Environments**:
  - `rhel-8-ee-minimal`: Minimal execution environment
  - `rhel-8-ee-supported`: Full-featured execution environment
  - `rhel-8-de-minimal`: Minimal development environment
  - `rhel-8-de-supported`: Full-featured development environment
  - `rhel-8-devtools`: Enhanced development environment with Chrome browser

- **RHEL 9 Environments**:
  - `rhel-9-ee-minimal`: Minimal execution environment
  - `rhel-9-ee-supported`: Full-featured execution environment
  - `rhel-9-de-minimal`: Minimal development environment
  - `rhel-9-de-supported`: Full-featured development environment

## Environment Definition Templates

The project provides two approaches to defining environments:

### 1. Single-File Definition (`base_environment_definition_1-file`)
- All configuration in a single YAML file
- Simpler for straightforward environments
- Easier management for basic needs

### 2. Multi-File Definition (`base_environment_definition_4-file`)
- Configuration split across multiple specialized files:
  - execution-environment.yml: Main configuration
  - requirements.txt: Python dependencies
  - `bindep.txt`: System dependencies  
  - requirements.yml: Ansible Collections
- Better for complex environments
- More maintainable for larger teams

## Directory Structure & Naming Convention

Environments follow a standardized directory structure:
```
environments/
└── OS_Type/
    └── major_version/
        └── EE_or_DE/
            └── minimal_or_supported/
                └── optional_vendor/
```

Example:
```
environments/
└── rhel/
    ├── 8/
    │   ├── ee/
    │   │   ├── minimal/
    │   │   └── supported/
    │   └── de/
    │       ├── minimal/
    │       ├── supported/
    │       └── devtools/
    └── 9/
        ├── ee/
        │   ├── minimal/
        │   └── supported/
        └── de/
            ├── minimal/
            └── supported/
```

## Getting Started

### Prerequisites

- Ansible 2.9 or newer
- ansible-builder package
- podman or docker
- Access to container registries:
  ```bash
  podman login registry.redhat.io
  ```

### Quick Start

1. Clone this repository:
   ```bash
   git clone https://github.com/ShaddGallegos/Base_EE-DE_Builder.git
   cd Base_EE-DE_Builder
   ```

2. Build all pre-defined environments:
   ```bash
   ansible-playbook -i localhost, build_environments.yml -K
   ```

3. Push to your Automation Hub:
   ```bash
   podman push your-environment-name your-automation-hub.example.com/your-environment-name
   ```

## Building Specific Environments

To build only specific environments (e.g., just RHEL 9 EE Minimal):

1. Remove or rename other environment directories:
   ```bash
   # Keep only the environment you want to build
   mv environments/rhel-9-ee-minimal environments-keep
   rm -rf environments/*
   mv environments-keep environments/rhel-9-ee-minimal
   ```

2. Run the build playbook:
   ```bash
   ansible-playbook -i localhost, build_environments.yml -K
   ```

## Creating Custom Vendor-Specific Environments

1. Copy an existing environment as a template:
   ```bash
   cp -r environments/rhel-9-ee-minimal environments/rhel-9-ee-minimal-vmware
   ```

2. Customize the environment files:
   - Add vendor-specific collections to requirements.yml
   - Add Python dependencies to requirements.txt
   - Add system packages to `bindep.txt`
   - Modify execution-environment.yml if needed

### Adding Custom Files or RPMs

1. To include local files in your environment, place them in:
   ```
   Base_EE-DE_Builder/files/
   ```

2. Reference these files in your configuration, or use remote resources:
   ```yaml
   # Example in execution-environment.yml
   additional_build_steps:
     prepend:
       - COPY files/custom.rpm /tmp/
       - RUN rpm -i /tmp/custom.rpm
   ```

## Use with Ansible Automation Platform

This project is specifically designed to work with the Ansible Automation Platform ecosystem:

- **Automation Hub Integration**: Push custom environments to your private Automation Hub
- **Controller Compatibility**: Environments are built to be fully compatible with AAP Controller
- **Execution Node Ready**: Optimized for deployment on AAP execution nodes
- **Automation Mesh Support**: Works with distributed execution via Automation Mesh

## Examples

### Chrome-Enabled Development Environment

The `rhel-8-devtools` environment includes Google Chrome for web browser automation:

```yaml
# Example from rhel-8-devtools/execution-environment.yml
additional_build_steps:
  prepend:
    - RUN dnf install -y wget
    - RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
    - RUN dnf localinstall -y google-chrome-stable_current_x86_64.rpm
```

### VMware-Specific Environment

To create a VMware-specific environment:

```bash
cp -r environments/rhel-9-ee-minimal environments/rhel-9-ee-minimal-vmware
```

Then add to requirements.yml:
```yaml
collections:
  - name: community.vmware
  - name: vmware.vmware_rest
```

## Learn More

For detailed instructions and examples, visit the [official repository](https://github.com/ShaddGallegos/Base_EE-DE_Builder) and review the environment definition examples in the environments directory.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
```
