#!/bin/bash
# Test script to validate the build_environments.yml structure with dummy credentials

cd /home/sgallego/Downloads/GIT/Base_EE-DE_Builder

# Create a test env.conf file with dummy credentials for validation
mkdir -p ~/.ansible/conf
cat > ~/.ansible/conf/env.conf << 'EOF'
RH_CREDENTIALS_TOKEN=dummy_token_for_testing
REDHAT_CDN_USERNAME=test_user
REDHAT_CDN_PASSWORD=test_pass
EOF

echo "Testing playbook structure with dummy credentials..."

# Run ansible-playbook with --check and --diff to validate without making changes
ansible-playbook build_environments.yml --check --diff --extra-vars "skip_registration=true"

echo "Structure test complete. Note: Use real credentials for actual execution."
