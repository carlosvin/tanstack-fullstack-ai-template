#!/usr/bin/env bash

# TanStack Fullstack Pattern Skill Installer
# This script downloads the standard SKILL.md into the preferred global 
# skill directories for Cursor, Windsurf, and Claude Code.

set -e

SKILL_NAME="tanstack-fullstack-pattern"
SKILL_RAW_URL="https://raw.githubusercontent.com/carlosvin/tanstack-fullstack-ai-template/main/.agents/skills/tanstack-fullstack-pattern/SKILL.md"

echo "Installing $SKILL_NAME skill..."

# Determine download tool
if command -v curl >/dev/null 2>&1; then
    DOWNLOAD_CMD="curl -sL"
elif command -v wget >/dev/null 2>&1; then
    DOWNLOAD_CMD="wget -qO-"
else
    echo "Error: curl or wget is required to download the skill."
    exit 1
fi

# Download the SKILL.md content directly
DOWNLOAD_CMD="curl -sL"
TEMP_FILE=$(mktemp)
echo "Downloading SKILL.md from $SKILL_RAW_URL..."
$DOWNLOAD_CMD "$SKILL_RAW_URL" > "$TEMP_FILE"

# Define target directories
TARGET_DIRS=(
    "$HOME/.codeium/windsurf/skills/$SKILL_NAME"
    "$HOME/.cursor/skills/$SKILL_NAME"
    "$HOME/.claude/skills/$SKILL_NAME"
)

INSTALLED=0

for TARGET_DIR in "${TARGET_DIRS[@]}"; do
    PARENT_DIR=$(dirname "$TARGET_DIR")
    # Install if the tool directory exists, or if --force is passed
    if [ -d "$PARENT_DIR" ] || [ "$1" == "--force" ]; then
        echo "Installing to $TARGET_DIR..."
        mkdir -p "$TARGET_DIR"
        cp "$TEMP_FILE" "$TARGET_DIR/SKILL.md"
        INSTALLED=1
    fi
done

rm "$TEMP_FILE"

if [ $INSTALLED -eq 1 ]; then
    echo "Successfully installed $SKILL_NAME."
else
    echo "Could not find default skill directories for Windsurf, Cursor, or Claude Code."
    echo "To force installation into these directories anyway, pass --force to the script."
fi