# Handoff — MA agents complete + editing-workflow revision

**Slug:** `ma-agents-complete` · **Tracked by:** `TRACKER.md` § Follow-ups (resolved entries)
**Started:** 2026-04-25 · **Last updated:** 2026-04-25
**Status:** shipped (kept for pattern review — workflow-rule arc + BWS-list leak lesson)

## Original intent

Audit the `agents/` folder, confirm the live MA console matches what we have authored, and make it visually obvious in `agents/<skill>/SKILL.md` that the deployed prompt comes from `ma-agent-config.json` — so future SKILL.md edits don't silently fail to ship. Mid-stream the user pulled `setup` and `update-tracker` out of the deferred bucket and asked them to be provisioned alongside.

## Goals

- Banner all 6 agent SKILL.md files as superseded by `ma-agent-config.json`.
- Provision the last 2 missing MA agents (`intently-setup`, `intently-update-tracker`).
- Replace the prior "branch-first" editing rule with a situation-aware version that matches how Muxin actually works (worktree only when there's parallelism risk).
- Sync BWS + Supabase + Anthropic console after the rotation forced by an in-session leak.

## Decisions made

- **Editing rule = situation-aware.** Single-session live-approved edits → commit on `main`; parallel agents / background / stacked → worktree (`git worktree add <wt-root>/<slug> -b chat/<slug>`); never `git checkout` in primary checkout. Lives in CLAUDE.md (rule) + CONTRIBUTING.md § Editing workflow (full text). — *Original "branch-first" rule conflated cleanliness (don't leave dirty `main`) with PR ceremony; for solo live-approved work, branch ceremony is friction with no benefit. Worktrees only address the silent-overwrite failure mode that exists when sessions run concurrently.*
- **All 6 MA agents now live.** Setup and update-tracker out of deferred; `MA_AGENT_ID_*` written to Supabase for both; ma-proxy redeployed. — *Demo + dogfood now have full coverage with no manual fallbacks.*
- **Anthropic key consolidated to one + rotated twice.** Old "daily brief" + "review agents" keys deleted in console; consolidated to one key labeled "Anthropic API Key" in BWS. Second rotation forced by the leak. — *Single key simplifies provisioning, eliminates "which key for what" confusion.*
- **`bws secret list` is forbidden raw.** Always pipe through `jq` to strip `.value`. Saved as `feedback-bws-never-list-raw.md` in auto-memory. — *Raw `bws secret list` echoes credential values; forced an emergency rotation mid-session.*
- **Bunk BWS cleanup is no-stakes.** ma-proxy reads agent IDs from Supabase, not BWS. The 3 stale agent-ID entries in BWS read by nothing → optional hygiene, no functional impact. Deferred to user via web UI (CLI access token lacks delete permission).

## Decision log (tried / rejected)

- **Worktree-first as universal default.** Tried in PR #109's first commit (`431ae6e`). Rejected after Muxin pushed back: too strict, adds friction for chat-driven solo edits where there's no parallelism to protect against. Replaced with situation-aware rule in commit `93e6827` before merge.
- **Listing BWS via raw `bws secret list` to find bunk-entry IDs.** Tried; leaked the API key value. Replaced with `bws secret list | jq '.[] | select(.key==...) | {id, key, note}'` for metadata-only enumeration.
- **Renaming the BWS entry via CLI.** Considered; deferred — Muxin handled it via vault.bitwarden.com. CLI access token has read/write but not full management.

## State as of 2026-04-25

**Shipped:**
- PR [#109](https://github.com/heymoosh/intently/pull/109) — supersedes banner across all 6 SKILL.md + situation-aware editing rule (CLAUDE.md + CONTRIBUTING.md § Editing workflow).
- Direct-to-main commits: `e5ee672` (TRACKER: setup + update-tracker resolved), `e0a1e60` (TRACKER: rotation + BWS cleanup reworded), `28ac025` (TRACKER: second rotation + narrowed BWS cleanup).

**Live agents** (all 6, daily-brief workspace):
| Skill | Agent ID | Model |
|---|---|---|
| daily-brief | `agent_011CaNxuATigtyixKPxypG6S` | opus-4-7 |
| daily-review | `agent_011CaPB6vL9wQdcZdyEBSZB3` | opus-4-7 |
| weekly-review | `agent_011CaPB79LyomVmRk87B1U2N` | opus-4-7 |
| monthly-review | (in Supabase secret) | opus-4-7 |
| setup | `agent_011CaQoLWQ5FeWdv6aKtfLLA` | sonnet-4-6 |
| update-tracker | `agent_011CaQoLk4MMuPvqh8RGRS11` | sonnet-4-6 |

**Secret state:** Anthropic API key digest `af4a5420…2b5a796e` in BWS (id `ccd03099-fa03-457e-a7a0-b4360119e12e`, labeled "Anthropic API Key") + Supabase. ma-proxy redeployed against this digest.

**Memory:** `feedback-bws-never-list-raw.md` saved.

**Files of interest:**
- `agents/<skill>/SKILL.md` (banner at top of all 6)
- `agents/<skill>/ma-agent-config.json` (deployed prompt source-of-truth)
- `scripts/provision-ma-agents.ts` (idempotent — re-running rebuilds Supabase secrets from Anthropic API state)
- `CLAUDE.md` line 15–21 (editing rule)
- `CONTRIBUTING.md` § Editing workflow (full text)

## Next steps

1. **(Optional, no-stakes)** Delete 3 bunk BWS entries via vault.bitwarden.com — `daily-review` (`1855bb28-d920-48fd-acea-b43601859e0f`), `weekly-review` (`2a7ce2a6-1fb0-41ea-a91c-b4360185c389`), `monthly-review` (`94687829-48ce-4e38-a87b-b4360185dc20`). Pure hygiene.
2. **First live runs of new agents.** `intently-setup` and `intently-update-tracker` haven't been smoke-tested via ma-proxy yet. Wire UI surfaces or trigger via direct API call to confirm they respond.

## Open questions

- Does ma-proxy need a routing change to surface `setup` and `update-tracker` to the UI, or does its current skill→agent_id resolver already handle any `MA_AGENT_ID_*` it finds? (Read `supabase/functions/ma-proxy/index.ts` to confirm before assuming.)

## Patterns worth lifting (for future review)

- **Disaster-recovery property of provision-ma-agents.ts.** Agent IDs are derivable state — if every Supabase `MA_AGENT_ID_*` got nuked, one `--all --write-secrets` run rebuilds them all from Anthropic API state. Worth advertising in the script's header comment.
- **The pattern "write the rule, dogfood the rule in the same PR" surfaced design flaws fast.** Forcing the supersedes-banner work onto a worktree exposed how heavyweight worktree-first felt for an 8-file single-conceptual-fix; we revised the rule mid-PR rather than after. Generalizable: any new workflow rule should land alongside a small task that exercises it.
- **The leak → rotation → memory loop.** A single-instance rule violation got recorded as a durable behavioral fix (memory) inside the same session, before the next session could repeat it.
