# scripts/

Operational scripts for Intently. Run from the repo root unless noted.

## What's here

- `intently-track.sh` — track scheduling helper.
- `session-precheck.sh` — drift check invoked by the `SessionStart` hook.
- `create-ma-agents.sh` — original bash provisioner for Managed Agents (POSTs `agents/<skill>/ma-agent-config.json` to `/v1/agents`). Kept for reference.
- `provision-ma-agents.ts` — TypeScript replacement. Idempotent: lists existing agents and skips by name.

## Provisioning MA agents

The script lives at the repo root but the Anthropic SDK is installed in `app/`, so invoke it from there:

```bash
# Dry-run all four MVP skills (matches the AC literal):
(cd app && tsx ../scripts/provision-ma-agents.ts --dry-run --all)

# Create only daily-review:
(cd app && tsx ../scripts/provision-ma-agents.ts --skill daily-review)

# Create everything missing and write IDs into Supabase secrets:
(cd app && tsx ../scripts/provision-ma-agents.ts --all --write-secrets)
```

Required env: `ANTHROPIC_API_KEY` (loaded from `.env.local` at repo root automatically, or pass `--env-file <path>`). For `--write-secrets`, the `supabase` CLI must be installed and authenticated for the right project (`supabase login` + `supabase link`). Verify with `supabase secrets list`.

After `--write-secrets`, redeploy the proxy so it picks them up:

```bash
supabase functions deploy ma-proxy
```

## Idempotency

Re-running is safe. The script lists existing agents once at start and skips any whose `name` already matches the config's `name`. Secret writes also follow the skip — if the agent already exists, its existing ID is what gets written (so re-running with `--write-secrets` is a way to refresh stale secrets).

## Tests

Tests live alongside the script (`provision-ma-agents.test.ts`) and are picked up by the `app` workspace's `npm run test:unit` (which is what CI runs). The SDK is fully mocked.
