#!/bin/bash
# User-configurable variables - modify as needed
USER="${USER}"
USER_EMAIL="${USER}@${COMPANY_DOMAIN:-example.com}"
COMPANY_NAME="${COMPANY_NAME:-Your Company}"
COMPANY_DOMAIN="${COMPANY_DOMAIN:-example.com}"

# Prebuild script for rhel-8-devtools environment
# This script performs necessary setup before building

# Create or ensure pip.conf exists with correct settings
cat > pip.conf << 'EOF'
[global]
break-system-packages = true
ignore-installed = botocore boto3 s3transfer systemd-python packaging PyYAML jmespath python-dateutil six
no-cache-dir = true
disable-pip-version-check = true

[install]
no-deps = boto3 botocore s3transfer
EOF

# Create constraints file to prevent pip from trying to install or upgrade certain packages
cat > constraints.txt << 'EOF'
# Exclude problematic packages that are installed by RPM
# These constraints ensure pip won't attempt to install or upgrade these packages
systemd-python==0
packaging==0
botocore==0
boto3==0
s3transfer==0
jmespath==0
python-dateutil==0
PyYAML==0
six==0
EOF

# Filter requirements.txt if it exists to remove problematic packages
if [ -f "requirements.txt" ]; then
  echo "# Original requirements file filtered to remove problematic packages" > requirements.txt.new
  echo "# The following packages are excluded: boto3, botocore, s3transfer" >> requirements.txt.new
  echo "# These packages are already installed via RPM in the base image" >> requirements.txt.new
  echo "" >> requirements.txt.new
  grep -v -E 'boto3|botocore|s3transfer' requirements.txt >> requirements.txt.new
  cp requirements.txt requirements.txt.original
  mv requirements.txt.new requirements.txt
fi

# Verify execution-environment.yml includes references to pip.conf
if [ -f "execution-environment.yml" ]; then
  if ! grep -q "pip.conf" execution-environment.yml; then
    echo "Adding pip.conf reference to execution-environment.yml"
    # Find file section and add pip.conf reference
    sed -i '/src: ".*constraints.txt"/a \  - src: "./pip.conf"\n    dest: pip.conf' execution-environment.yml
  fi
fi

echo "Prebuild setup for rhel-8-devtools completed successfully"
