#!/usr/bin/env bash
# create-ma-agents — provision Intently's MA agent resources via API.
#
# Why this exists: the Anthropic console UI for creating agents has been
# finicky. The API (`POST /v1/agents`) takes the same JSON we keep checked
# in at `agents/<skill>/ma-agent-config.json`, so we can avoid the UI
# entirely. After creation, agent IDs are set as Supabase secrets so
# `ma-proxy` can resolve `skill` → `agent_id`.
#
# Usage:
#   ANTHROPIC_API_KEY=sk-ant-... bash scripts/create-ma-agents.sh
#
# Optional: pass specific skills as args to create only those. Defaults
# to daily-review + weekly-review (the two not yet provisioned).
#
#   bash scripts/create-ma-agents.sh daily-review weekly-review
#   bash scripts/create-ma-agents.sh update-tracker
#
# Safety: the API key is never echoed. The script does not persist the
# key anywhere. Uses `set -u` so a missing key fails fast.

set -euo pipefail

: "${ANTHROPIC_API_KEY:?ANTHROPIC_API_KEY not set — export it before running}"

# Default to the two skills that weren't created Friday. daily-brief is
# already provisioned; update-tracker and setup are demo-secondary.
SKILLS=("${@:-daily-review weekly-review}")
# shellcheck disable=SC2206
SKILLS=(${SKILLS[@]})

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

command -v jq >/dev/null || { echo "jq required (brew install jq)" >&2; exit 1; }
command -v curl >/dev/null || { echo "curl required" >&2; exit 1; }
command -v supabase >/dev/null || { echo "supabase CLI required — see supabase.com/docs/guides/cli" >&2; exit 1; }

API_BASE="https://api.anthropic.com"
BETA_HEADER="managed-agents-2026-04-01"

create_agent() {
  local skill="$1"
  local config="$REPO_ROOT/agents/$skill/ma-agent-config.json"

  if [ ! -f "$config" ]; then
    echo "✗ $skill: no config at $config" >&2
    return 1
  fi

  echo "→ creating $skill agent..." >&2

  # POST the config JSON exactly as stored. Anthropic's API reads:
  #   name, description, model, system, mcp_servers, tools, skills.
  # All of those are in our checked-in config files. If the API shape
  # has drifted since this was written, the response body will say so —
  # paste it back to Claude to iterate.
  local tmp
  tmp=$(mktemp)
  local http_code
  http_code=$(curl -sS -o "$tmp" -w '%{http_code}' \
    -X POST "$API_BASE/v1/agents" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "anthropic-beta: $BETA_HEADER" \
    -H "Content-Type: application/json" \
    --data @"$config")

  if [ "$http_code" != "200" ] && [ "$http_code" != "201" ]; then
    echo "✗ $skill: HTTP $http_code" >&2
    echo "--- response body ---" >&2
    cat "$tmp" >&2
    echo >&2
    rm -f "$tmp"
    return 1
  fi

  local agent_id
  agent_id=$(jq -r '.id // empty' "$tmp")
  rm -f "$tmp"

  if [ -z "$agent_id" ]; then
    echo "✗ $skill: response missing .id field — check the response above" >&2
    return 1
  fi

  # Map skill → secret name: daily-review → MA_AGENT_ID_DAILY_REVIEW
  local env_suffix
  env_suffix=$(echo "$skill" | tr '[:lower:]-' '[:upper:]_')
  local secret_name="MA_AGENT_ID_${env_suffix}"

  echo "✓ $skill: $agent_id" >&2
  echo "→ setting $secret_name in Supabase..." >&2
  supabase secrets set "$secret_name=$agent_id" >/dev/null
  echo "✓ $skill: secret set" >&2
  echo
}

fail=0
for skill in "${SKILLS[@]}"; do
  create_agent "$skill" || fail=1
done

if [ "$fail" -eq 0 ]; then
  echo "Done. Redeploy ma-proxy so it picks up the new secrets:"
  echo "  supabase functions deploy ma-proxy"
else
  echo "One or more skills failed to create — see messages above." >&2
  exit 1
fi
