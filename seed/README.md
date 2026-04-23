# Intently V1 Demo Seed Data

This directory contains synthetic life-ops files for the Intently V1 demo. It is not real user data.

## What this is

A complete set of markdown files representing one user's life-ops state at the point a demo should open. The three core flows — daily brief, daily review, weekly review — have real content to operate on during recording. Generic inputs produce generic agent output; this seed is specific enough that the output reads like something a real person would find useful.

## Synthetic-user premise

The user is **Sam**: a knowledge worker building an AI productivity app during a 6-day hackathon. Demo day is Thursday (day 4 of 6). Projects: **Intently** (the app he's building), **Design System Port** (a parallel UI task), **Health Routine** (a maintenance project he tracks to prevent sprint-induced neglect).

Sam is not Muxin. The content is representative of the kind of work and life context the system is designed for, but the names, projects, and timelines are fictional.

## File inventory

| File | Purpose |
|---|---|
| `life-ops-config.md` | Plugin config — schedules, paths, project list |
| `Goals.md` | Sam's long-term goal areas |
| `Monthly Goals.md` | April 2026 priorities and deliberate non-priorities |
| `Ops Plan.md` | Active project dashboard (P1/P2/P3 + time-sensitive) |
| `Weekly Goals.md` | Week of Apr 19 — last week's review + this week's plan |
| `Daily Log.md` | Mon–Thu of hackathon week (Thu is AM-plan only) |
| `Journal.md` | 7 entries from the past two weeks |
| `Projects/Intently/` | Tracker + Strategy for the main project |
| `Projects/Design System Port/` | Tracker + Strategy for the UI work |
| `Projects/Health Routine/` | Tracker + Strategy for the wellness habit |

## How to load

**V1 — local dev:** Point `notes_folder_path` in `life-ops-config.md` at this directory (or set the path in your environment). Agent skills running locally will read from here.

**Supabase (future):** Copy files into the user's `markdown_files` table via a migration. A loading script will live in `supabase/migrations/` once that wiring exists — stub for now.

## What this is NOT

This seed is for demo and development use only. It is not a template for real users, and it will not follow a real user's config path. Real installs resolve their own `notes_folder_path` during setup.
