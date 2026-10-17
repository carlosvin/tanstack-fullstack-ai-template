#!/usr/bin/env bash
# Create and configure the agentic Netlify site for this repo.
# Requires: NETLIFY_AUTH_TOKEN or an active `netlify login` session.
set -euo pipefail

SITE_NAME="${NETLIFY_SITE_NAME:-fullstack-promptable-agentic}"
REPO="${NETLIFY_GIT_REPO:-carlosvin/tanstack-fullstack-ai-template}"

if ! npx netlify sites:list --json >/dev/null 2>&1; then
	echo "Not logged in. Run: netlify login" >&2
	echo "Or set NETLIFY_AUTH_TOKEN from https://app.netlify.com/user/applications" >&2
	exit 1
fi

echo "Creating site: ${SITE_NAME}"
CREATE_JSON="$(npx netlify sites:create --name "${SITE_NAME}" --disable-linking --json)"
SITE_ID="$(node -e "const j=JSON.parse(process.argv[1]); console.log(j.id||j.site_id||j.site?.id||'')" "${CREATE_JSON}")"
SITE_URL="$(node -e "const j=JSON.parse(process.argv[1]); console.log(j.url||j.ssl_url||j.site?.url||'')" "${CREATE_JSON}")"

if [[ -z "${SITE_ID}" ]]; then
	echo "Could not parse site id from create response:" >&2
	echo "${CREATE_JSON}" >&2
	exit 1
fi

echo "Site id: ${SITE_ID}"
echo "Default URL: ${SITE_URL}"

echo "Setting build env (production + deploy-preview)..."
npx netlify env:set PROMPT_CONCEPT agentic --site "${SITE_ID}" --context production deploy-preview
npx netlify env:set DISPLAY_NAME "TaskHub Agentic" --site "${SITE_ID}" --context production deploy-preview
npx netlify env:set REPOSITORY_TYPE seed --site "${SITE_ID}" --context production deploy-preview

echo ""
echo "Next: connect Git in the Netlify UI (required for continuous deploy from GitHub):"
echo "  1. https://app.netlify.com/sites/${SITE_NAME}/configuration/deploys#link-repository"
echo "  2. Link repository: ${REPO}, production branch: main"
echo "  3. Build command: pnpm build, publish directory: dist (from netlify.toml)"
echo "  4. Deploy Previews: on. Branch deploys: off."
echo "  5. Copy AI keys (OPENAI_API_KEY, etc.) from the side demo site env."
echo ""
echo "Pull request checks and preview cleanup use the NETLIFY_AUTH_TOKEN GitHub Actions secret."
echo "In the Netlify team, set Notifications → Commit status webhooks → Multiple webhooks per repo."
