#!/bin/bash
# User-configurable variables - modify as needed
USER="${USER}"
USER_EMAIL="${USER}@${COMPANY_DOMAIN:-example.com}"
COMPANY_NAME="${COMPANY_NAME:-Your Company}"
COMPANY_DOMAIN="${COMPANY_DOMAIN:-example.com}"

# Script to find and remove unused scripts

# Create a temporary file to store referenced scripts
REFERENCED_SCRIPTS=$(mktemp)

# Find all script references in build_environments.yml and ee-de-builder files
echo "Finding referenced scripts..."

# Search for script references in build_environments.yml
if [ -f "build_environments.yml" ]; then
    grep -oE "scripts/[^'\"[:space:]]*\.sh" build_environments.yml >> "$REFERENCED_SCRIPTS" 2>/dev/null || true
    grep -oE "\{\{ playbook_dir \}\}/scripts/[^'\"[:space:]]*\.sh" build_environments.yml | sed 's|{{ playbook_dir }}/||g' >> "$REFERENCED_SCRIPTS" 2>/dev/null || true
fi

# Search for script references in ee-de-builder
if [ -f "ee-de-builder" ]; then
    grep -oE "[^/]*\.sh" ee-de-builder >> "$REFERENCED_SCRIPTS" 2>/dev/null || true
    # Add the main script that ee-de-builder calls
    echo "ee-de-builder.sh" >> "$REFERENCED_SCRIPTS"
fi

# Remove duplicates and sort
sort "$REFERENCED_SCRIPTS" | uniq > "${REFERENCED_SCRIPTS}.clean"
mv "${REFERENCED_SCRIPTS}.clean" "$REFERENCED_SCRIPTS"

echo "Referenced scripts found:"
cat "$REFERENCED_SCRIPTS"

# Find all existing scripts
ALL_SCRIPTS=$(mktemp)
find scripts/ -name "*.sh" -type f | sed 's|scripts/||g' | sed 's|scripts/sh/||g' > "$ALL_SCRIPTS"

echo -e "\nAll existing scripts:"
cat "$ALL_SCRIPTS"

# Find unused scripts
UNUSED_SCRIPTS=$(mktemp)
comm -23 <(sort "$ALL_SCRIPTS") <(sort "$REFERENCED_SCRIPTS") > "$UNUSED_SCRIPTS"

echo -e "\nUnused scripts to be removed:"
cat "$UNUSED_SCRIPTS"

# Ask for confirmation before removing
if [ -s "$UNUSED_SCRIPTS" ]; then
    echo -e "\nDo you want to remove these unused scripts? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        while IFS= read -r script; do
            # Try different possible locations
            for dir in "scripts/" "scripts/sh/"; do
                if [ -f "${dir}${script}" ]; then
                    echo "Removing ${dir}${script}"
                    rm -f "${dir}${script}"
                    break
                fi
            done
        done < "$UNUSED_SCRIPTS"
        echo "Unused scripts removed."
    else
        echo "No scripts removed."
    fi
else
    echo "No unused scripts found."
fi

# Cleanup
rm -f "$REFERENCED_SCRIPTS" "$ALL_SCRIPTS" "$UNUSED_SCRIPTS"