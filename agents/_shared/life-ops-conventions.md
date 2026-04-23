# Life Ops Conventions — Agent-Facing Reference

**Prepend to every managed-agent skill prompt.** Distilled for token economy. Authoritative sources: `docs/architecture/data-model.md` (file shapes) and `docs/product/requirements/life-ops-plugin-spec.md` (behaviors). If a rule here conflicts with a source, fix the source and re-distill.

## File index

| File | Purpose |
|---|---|
| `life-ops-config.md` | Config — schedule, paths, projects list, integration flags |
| `Goals.md` | Long-term goals (single category — all goals take time) |
| `Monthly Goals.md` | This month's 3–5 priorities |
| `Ops Plan.md` | Operational dashboard — active projects, status, next actions |
| `Weekly Goals.md` | Current week's full operating context |
| `Daily Log.md` | Current week only — plans and done summaries |
| `<Reflection>.md` | Personal journal (filename from config) |
| `Master Backlog.md` | Ideas, someday/maybe, parked |
| `Past/[Year] Archive.md` | Archived weeks |
| `Projects/[Name]/Tracker.md` | Per-project live state |
| `Projects/[Name]/Strategy.md` | Per-project why |

## Cascade

```
Goals  →  Monthly Goals  →  Weekly Goals  →  Daily Log
```

Each layer reads only its immediate parent.

## Global rules

- **Dates:** `YYYY-MM-DD` everywhere.
- **Paths:** resolve relative to `notes_folder_path` in `life-ops-config.md`. Never hardcode.
- **Journal filename:** always dereference `reflection_filename` in config. Never assume `Journal.md`.
- **Status:** 🔴 Blocked · 🟡 In Progress · 🟢 Healthy · ⚪ Not Started. These four only.
- **Priority tiers:** P1 primary · P2 secondary · P3 maintenance. Tiers map to the user's energy pattern via `day_structure` in config — never hardcode tiers to time-of-day.

## Stable IDs

All durable objects carry one, shared across file frontmatter and Supabase rows:

- `project.<slug>`, `task.<project-slug>.<seq>`, `dec.<project-slug>.<seq>`
- `log.<project-slug>.<date><letter>`, `user.<slug>`, `topic.<date>-<slug>`

## First-run handling

Check `first_run_complete` in config. If `false`: thin-context mode — acknowledge sparseness rather than infer patterns from absent data.

## Rules that apply to every skill

- **User's own words.** When capturing prose (goals, reflections, strategy notes), use the user's words. Light spelling/grammar edits only. Never paraphrase or reframe.
- **Surface, don't infer.** When something didn't happen or a pattern looks off, ask the user — never reason unilaterally about why.
- **No silent writes.** Every automated file change is announced. If uncertain about a write, ask.
