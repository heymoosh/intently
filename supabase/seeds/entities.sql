-- entities.sql — demo seed for the new goals/projects/entries tables.
--
-- Persona: Sam (matches app/fixtures/daily-brief-seed.ts and the live demo).
-- Do NOT introduce a different persona here without coordinating with the
-- fixture and the demo flow — agent output would diverge from UI copy.
--
-- Picks the first user in auth.users as owner (V1 is single-user, Muxin
-- dogfoods). Same caveat as supabase/seeds/reminders.sql: in a multi-user env
-- this attaches everything to the first profile created.
--
-- Today (frame of reference): 2026-04-24 (Friday). Entries span the prior
-- week so renderDailyBriefContext has yesterday's review/journal to surface.
--
-- Idempotency: each insert guards with NOT EXISTS keyed off a stable column
-- (title for goals/projects, body_markdown for entries). UUID PKs mean
-- ON CONFLICT DO NOTHING wouldn't help — natural keys are what we have.
--
-- Apply with:
--   supabase db reset
--   psql "$DB_URL" -f supabase/seeds/entities.sql

-- 1. Goals --------------------------------------------------------------------

insert into public.goals (user_id, title, monthly_slice, glyph, palette, position)
select u.id, v.title, v.monthly_slice, v.glyph, v.palette::text[], v.position
  from auth.users u,
       (values
         ('Ship Intently V1',
          'Land the three demo flows by 4/26 and submit clean.',
          'plane',
          '{"#1f2d3d","#3b5b7a","#9bb4cf","#e8eef5"}',
          0),
         ('Build a tighter daily practice',
          'Wake by 6:30 and protect the first 90 minutes for one P1 block.',
          'leaf',
          '{"#2d3a1f","#5a7a3b","#b4cf9b","#eef5e8"}',
          1),
         ('Be less reactive in code review',
          'Sit with a PR 10 minutes before commenting; lead with a question.',
          'handshake',
          '{"#3d2d1f","#7a5b3b","#cfb49b","#f5eee8"}',
          2)
       ) as v(title, monthly_slice, glyph, palette, position)
 where u.id = (select id from auth.users order by created_at asc limit 1)
   and not exists (
     select 1 from public.goals g
      where g.user_id = u.id and g.title = v.title
   );

-- 2. Projects -----------------------------------------------------------------
-- Admin first (no goal_id); then three active projects rolled up to goals.

-- Admin project: catch-all bucket for un-rolled-up todos.
insert into public.projects (user_id, goal_id, title, body_markdown, todos, status, is_admin)
select u.id,
       null,
       'Admin & Errands',
       'Catch-all for un-rolled-up tasks. Bills, appointments, life ops.',
       '[
         {"id":"a1","text":"Pay April rent","done":true,"created_at":"2026-04-19T09:00:00-04:00"},
         {"id":"a2","text":"Refill prescription","done":false,"created_at":"2026-04-21T11:00:00-04:00"},
         {"id":"a3","text":"Renew passport (expires June)","done":false,"created_at":"2026-04-22T08:30:00-04:00"},
         {"id":"a4","text":"Costco run","done":false,"created_at":"2026-04-23T14:00:00-04:00"}
       ]'::jsonb,
       'active',
       true
  from auth.users u
 where u.id = (select id from auth.users order by created_at asc limit 1)
   and not exists (
     select 1 from public.projects p
      where p.user_id = u.id and p.is_admin = true
   );

-- Project: Intently V1 → Ship Intently V1
insert into public.projects (user_id, goal_id, title, body_markdown, todos, status, is_admin)
select u.id,
       (select id from public.goals where user_id = u.id and title = 'Ship Intently V1'),
       'Intently V1',
       'Hackathon submission. Three demo flows: daily-brief, daily-review, weekly-review.',
       '[
         {"id":"i1","text":"Skill loader (PR #2)","done":true,"created_at":"2026-04-21T08:00:00-04:00"},
         {"id":"i2","text":"Tool scaffolds — read_calendar / read_emails","done":true,"created_at":"2026-04-22T09:00:00-04:00"},
         {"id":"i3","text":"Schema migration + render functions","done":false,"created_at":"2026-04-24T07:00:00-04:00"},
         {"id":"i4","text":"Wire daily-brief agent to live context","done":false,"created_at":"2026-04-24T07:00:00-04:00"},
         {"id":"i5","text":"Tokens compile — font-family translation","done":false,"created_at":"2026-04-23T16:00:00-04:00"},
         {"id":"i6","text":"Demo recording + submission","done":false,"created_at":"2026-04-24T07:00:00-04:00"}
       ]'::jsonb,
       'active',
       false
  from auth.users u
 where u.id = (select id from auth.users order by created_at asc limit 1)
   and not exists (
     select 1 from public.projects p
      where p.user_id = u.id and p.title = 'Intently V1'
   );

-- Project: Morning Reset → Build a tighter daily practice
insert into public.projects (user_id, goal_id, title, body_markdown, todos, status, is_admin)
select u.id,
       (select id from public.goals where user_id = u.id and title = 'Build a tighter daily practice'),
       'Morning Reset',
       'Restructure the first 90 minutes after waking so a P1 block lands before any reactive work.',
       '[
         {"id":"m1","text":"Move alarm out of bedroom","done":true,"created_at":"2026-04-18T07:00:00-04:00"},
         {"id":"m2","text":"Set up coffee the night before","done":true,"created_at":"2026-04-19T22:00:00-04:00"},
         {"id":"m3","text":"Pre-write tomorrow''s P1 block in the journal","done":false,"created_at":"2026-04-20T22:00:00-04:00"},
         {"id":"m4","text":"No-phone-until-9 trial — week 1","done":false,"created_at":"2026-04-22T07:00:00-04:00"}
       ]'::jsonb,
       'active',
       false
  from auth.users u
 where u.id = (select id from auth.users order by created_at asc limit 1)
   and not exists (
     select 1 from public.projects p
      where p.user_id = u.id and p.title = 'Morning Reset'
   );

-- Project: Code Review Practice → Be less reactive in code review
insert into public.projects (user_id, goal_id, title, body_markdown, todos, status, is_admin)
select u.id,
       (select id from public.goals where user_id = u.id and title = 'Be less reactive in code review'),
       'Code Review Practice',
       'Slow the loop between reading a PR and replying. Lead with a question, not a verdict.',
       '[
         {"id":"c1","text":"Read Effective Code Reviews chapter 3","done":true,"created_at":"2026-04-19T20:00:00-04:00"},
         {"id":"c2","text":"Draft 3-question opener template","done":true,"created_at":"2026-04-21T15:00:00-04:00"},
         {"id":"c3","text":"Apply on next 5 PRs and journal what shifted","done":false,"created_at":"2026-04-22T15:00:00-04:00"},
         {"id":"c4","text":"Pair with Anya on a review next week","done":false,"created_at":"2026-04-23T11:00:00-04:00"}
       ]'::jsonb,
       'active',
       false
  from auth.users u
 where u.id = (select id from auth.users order by created_at asc limit 1)
   and not exists (
     select 1 from public.projects p
      where p.user_id = u.id and p.title = 'Code Review Practice'
   );

-- 3. Entries ------------------------------------------------------------------
-- ~12 entries spanning 2026-04-17 → 2026-04-23 (yesterday). Mix of kinds:
-- daily-brief outputs, journal jots, and one weekly-review summary. Keys
-- referenced by renderDailyBriefContext: most-recent brief/review yesterday
-- + most-recent journal yesterday → seed has both for 2026-04-23.

insert into public.entries (user_id, at, kind, title, body_markdown, glyph, mood, source, links)
select u.id, v.at::timestamptz, v.kind, v.title, v.body_markdown, v.glyph, v.mood, v.source, v.links::jsonb
  from auth.users u,
       (values
         ('2026-04-17T07:30:00-04:00', 'brief',
          'Friday brief',
          'Pacing: balanced. Calendar light. P1 — finish skill-loader skeleton; this serves Ship Intently V1.',
          'plane', 'morning', 'agent', '{}'),
         ('2026-04-17T21:00:00-04:00', 'journal',
          'Friday journal',
          'Hit the P1 block clean. Loader works against one fixture. The shape is right.',
          'leaf', 'dusk', 'text', '{}'),
         ('2026-04-19T09:00:00-04:00', 'review',
          'Weekly review — week of 4/13',
          'Wins: skill-loader pattern locked, journal habit held 5/7. Misses: tokens compile slipped twice, code-review reactivity flared on Tuesday. Next week: protect mornings, sit with PRs.',
          'handshake', 'morning', 'agent', '{}'),
         ('2026-04-20T07:30:00-04:00', 'brief',
          'Monday brief',
          'Pacing: sprint OK after weekend rest. P1 — tool scaffolds for daily-brief. Watch the read_calendar mock surface area.',
          'plane', 'morning', 'agent', '{}'),
         ('2026-04-20T22:15:00-04:00', 'journal',
          'Monday journal',
          'Tool scaffolds harder than expected — the typed wrapper tripped me twice. Tomorrow start with the test, not the impl.',
          'leaf', 'night', 'text', '{}'),
         ('2026-04-21T07:30:00-04:00', 'brief',
          'Tuesday brief',
          'Pacing: balanced. P1 — read_calendar mock + tests. P2 — review Anya''s PR; sit with it for 10 min before replying.',
          'plane', 'morning', 'agent', '{}'),
         ('2026-04-21T19:45:00-04:00', 'journal',
          'Tuesday journal',
          'Reactivity flared on Anya''s PR. Caught it on second read. The 10-min sit helps but isn''t automatic yet.',
          'rain', 'dusk', 'text', '{}'),
         ('2026-04-22T07:30:00-04:00', 'brief',
          'Wednesday brief',
          'Pacing: recovery. Two intense days. P1 — finish read_emails wrapper, stop there. No new threads.',
          'plane', 'morning', 'agent', '{}'),
         ('2026-04-22T22:30:00-04:00', 'journal',
          'Wednesday journal',
          'Leaned hard today. Body talking. Need to wrap clean.',
          'leaf', 'night', 'text', '{}'),
         ('2026-04-23T07:30:00-04:00', 'brief',
          'Thursday brief',
          'Pacing: ease off — body said so last night. P1 — merge skill loader (PR #2). P2 — start tool scaffolds. Hard stop 21:00.',
          'plane', 'morning', 'agent', '{}'),
         ('2026-04-23T13:10:00-04:00', 'chat',
          'Mid-day check-in',
          'Loader merged. Tool scaffolds 50%. read_calendar mocked, read_emails deferred.',
          null, 'midday', 'text', '{}'),
         ('2026-04-23T22:00:00-04:00', 'journal',
          'Thursday journal',
          'Hard stop held. Tomorrow is the wiring day — daily-brief end-to-end against seed context.',
          'leaf', 'night', 'text', '{}')
       ) as v(at, kind, title, body_markdown, glyph, mood, source, links)
 where u.id = (select id from auth.users order by created_at asc limit 1)
   and not exists (
     select 1 from public.entries e
      where e.user_id = u.id and e.body_markdown = v.body_markdown
   );
