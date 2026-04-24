-- reminders.sql — demo seed rows for the reminders table.
--
-- Picks the first user in auth.users as owner (V1 is single-user, Muxin
-- dogfoods). If you run this in a multi-user environment it will attach
-- every reminder to whoever created their profile first — fine for the
-- hackathon, fix before anyone else signs up.
--
-- Dates are intentionally staged around today (2026-04-24) so a daily-brief
-- run on demo day surfaces 1-2 items:
--   - "Send thank-you note to Zane" → due today (surfaces today)
--   - "Follow up with Dr. Ramesh"  → due 2026-04-26 (surfaces Sat / Sun)
--   - "Schedule dentist appointment" → due 2026-04-29 (future, stays pending)
--
-- Apply with either:
--   supabase db reset        (runs migrations + this seed, if wired via config.toml)
--   psql "$DB_URL" -f supabase/seeds/reminders.sql
--
-- Idempotent-ish via NOT EXISTS — re-running won't duplicate the same text.

insert into public.reminders (user_id, text, remind_on, status)
select u.id, v.text, v.remind_on::date, 'pending'
  from auth.users u,
       (values
         ('Send thank-you note to Zane for the intro',      '2026-04-24'),
         ('Follow up with Dr. Ramesh about bloodwork',      '2026-04-26'),
         ('Schedule dentist appointment',                   '2026-04-29')
       ) as v(text, remind_on)
 where u.id = (select id from auth.users order by created_at asc limit 1)
   and not exists (
     select 1 from public.reminders r
      where r.user_id = u.id and r.text = v.text
   );
