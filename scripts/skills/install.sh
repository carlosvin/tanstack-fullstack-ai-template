#!/usr/bin/env bash

# TanStack Fullstack Pattern Skill Installer
# Downloads both published skills into Cursor, Windsurf, and Claude Code global dirs.

set -e

SKILLS=(
	"tanstack-promptable-fullstack-app-template"
	"observability-and-env"
)
REPO="carlosvin/tanstack-fullstack-ai-template"
BASE_RAW_URL="https://raw.githubusercontent.com/${REPO}/main/.agents/skills"

echo "Installing TanStack fullstack skills (${SKILLS[*]})..."

if command -v curl >/dev/null 2>&1; then
	DOWNLOAD_CMD="curl -sL"
elif command -v wget >/dev/null 2>&1; then
	DOWNLOAD_CMD="wget -qO-"
else
	echo "Error: curl or wget is required to download skills."
	exit 1
fi

TARGET_DIRS=(
	"$HOME/.codeium/windsurf/skills"
	"$HOME/.cursor/skills"
	"$HOME/.claude/skills"
)

INSTALLED=0

for SKILL_NAME in "${SKILLS[@]}"; do
	SKILL_RAW_URL="${BASE_RAW_URL}/${SKILL_NAME}/SKILL.md"
	TEMP_FILE=$(mktemp)
	echo "Downloading ${SKILL_NAME} from ${SKILL_RAW_URL}..."
	$DOWNLOAD_CMD "$SKILL_RAW_URL" > "$TEMP_FILE"

	for PARENT_DIR in "${TARGET_DIRS[@]}"; do
		TARGET_DIR="${PARENT_DIR}/${SKILL_NAME}"
		if [ -d "$PARENT_DIR" ] || [ "$1" == "--force" ]; then
			echo "Installing ${SKILL_NAME} to ${TARGET_DIR}..."
			mkdir -p "$TARGET_DIR"
			cp "$TEMP_FILE" "$TARGET_DIR/SKILL.md"
			INSTALLED=1
		fi
	done

	rm "$TEMP_FILE"
done

if [ $INSTALLED -eq 1 ]; then
	echo "Successfully installed: ${SKILLS[*]}."
	echo "List skills with: npx skills add ${REPO} --list"
else
	echo "Could not find default skill directories for Windsurf, Cursor, or Claude Code."
	echo "To force installation into these directories anyway, pass --force to the script."
fi
