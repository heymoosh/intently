# Intently

Intently turns recurring life operations — daily triage, morning briefing, weekly review, meal planning, monthly review — into an agent-native mobile experience. Scheduled managed agents do the work; the app reflects state, triggers runs, and renders output.

See [`CLAUDE.md`](./CLAUDE.md) for the working context, [`docs/product/vision.md`](./docs/product/vision.md) for the product vision, and [`docs/Claude Code Repo-Ready Blueprint.md`](./docs/Claude%20Code%20Repo-Ready%20Blueprint.md) for the operating manual.

## Dev setup

One-time per clone:

```bash
# 1. Install gitleaks (local secret-scan; CI also runs it on every push)
brew install gitleaks

# 2. Enable the pre-commit hook in this clone
chmod +x .githooks/pre-commit
git config core.hooksPath .githooks
```

The pre-commit hook blocks any `.env*` file (except `.env.example`) and runs `gitleaks protect` on the staged diff. CI re-runs gitleaks on every push and nightly — see [`.github/workflows/security.yml`](./.github/workflows/security.yml).

**Hard rule:** secrets live in Bitwarden Secrets Manager only. No `.env` commits, no hardcoded keys, no exceptions. See [`docs/security/privacy-policy-for-builders.md`](./docs/security/privacy-policy-for-builders.md).

## Stack

TBD — decided in the Thursday Apr 23 managed-agents session. See [`docs/decisions/0003-v1-technology-stack.md`](./docs/decisions/0003-v1-technology-stack.md).
