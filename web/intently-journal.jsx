// intently-journal.jsx — Past, zoomable art-journal.
// Four zoom levels: Year · Month · Week · Day. Same data, different real-estate.

// ─── sample data: one year of daily marks + entries ─────────────
// Agent-picked glyph per day; ~75% density; entries grouped by date.
const JOURNAL_DATA = (() => {
  const start = new Date(2026, 0, 1);          // Jan 1
  const today = new Date(2026, 3, 23);         // Apr 23 ("today")
  const days = [];
  const glyphs = GLYPH_NAMES;
  const tints = ['#8CB39A', '#CFC9EB', '#F1DE8A', '#F0B98C', '#B8D9C0', '#E8C8D0'];
  // deterministic PRNG (mulberry32)
  let s = 0x9e3779b9;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = 0; i < 365; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    if (d > today) { days.push({ d, future: true }); continue; }
    const has = rnd() < 0.78;                  // ~78% density
    days.push({
      d,
      glyph: has ? glyphs[Math.floor(rnd() * glyphs.length)] : null,
      tint: has ? tints[Math.floor(rnd() * tints.length)] : null,
      big: has && rnd() < 0.12,                // resonant entry
    });
  }
  return days;
})();

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// eslint-disable-next-line no-unused-vars -- kept alongside MONTH_SHORT for future "April 2026" headers
const MONTH_FULL  = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW         = ['S','M','T','W','T','F','S'];
const DOW_FULL    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
const TODAY = new Date(2026, 3, 23);

// ─── top chrome: zoom segmented ─────────────────────────────────
// (Search bar removed in wiring-audit Gap #8 — was a `<span>` masquerading
// as an `<input>`. Restore as a real `<input>` once search is implemented.)
function JournalHeader({ zoom, onZoom, title, subtitle }) {
  return (
    <div style={{ padding: '18px 20px 10px', background: T.color.PrimarySurface }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', color: T.color.SupportingText }}>{subtitle}</div>
          <div style={{ fontFamily: T.font.Display, fontSize: 28, lineHeight: '32px', fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.5, color: T.color.PrimaryText, marginTop: 2 }}>{title}</div>
        </div>
      </div>
      <div style={{ display: 'inline-flex', background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`, borderRadius: 999, padding: 3 }}>
        {['Year','Month','Week','Day'].map(z => {
          const on = z === zoom;
          return (
            <button key={z} onClick={() => onZoom && onZoom(z)} style={{
              minHeight: 32, padding: '0 14px', borderRadius: 999, border: 'none',
              background: on ? T.color.PrimaryText : 'transparent',
              color: on ? T.color.InverseText : T.color.SupportingText,
              fontFamily: T.font.UI, fontSize: 12, fontWeight: 600, letterSpacing: 0.2,
              cursor: 'pointer',
            }}>{z}</button>
          );
        })}
      </div>
    </div>
  );
}

// ─── YEAR view ─── 12-month mosaic of mini glyphs ──────────────
function YearView({ onPickMonth, onPickDay }) {
  // Lay out 12 months in a 2-col grid. Each month is a mini calendar.
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 140px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {Array.from({ length: 12 }, (_, m) => (
          <MiniMonth key={m} monthIdx={m} onOpen={() => onPickMonth && onPickMonth(m)} />
        ))}
      </div>
      <div style={{ marginTop: 22, padding: '14px 18px', background: T.color.TintButter, borderRadius: 16, color: T.color.TintMoss, fontFamily: T.font.Reading, fontSize: 13, lineHeight: '18px', fontStyle: 'italic' }}>
        Each mark is a day you showed up. Tap a month to open it.
      </div>
    </div>
  );
}
function MiniMonth({ monthIdx, onOpen }) {
  const days = JOURNAL_DATA.filter(x => x.d.getMonth() === monthIdx);
  const firstDow = days[0].d.getDay();
  const cells = Array(firstDow).fill(null).concat(days);
  const filled = days.filter(d => d.glyph).length;
  return (
    <button onClick={onOpen} style={{
      background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`,
      borderRadius: 12, padding: 10, cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: T.font.Display, fontSize: 14, fontStyle: 'italic', fontWeight: 500, color: T.color.PrimaryText }}>{MONTH_SHORT[monthIdx]}</span>
        <span style={{ fontFamily: T.font.UI, fontSize: 9, color: T.color.SubtleText, letterSpacing: 0.4, fontWeight: 600 }}>{filled}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} style={{ height: 16 }} />;
          const isToday = sameDay(c.d, TODAY);
          return (
            <div key={i} style={{
              height: 16, width: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 4, border: isToday ? `1px solid ${T.color.TintClay}` : 'none',
              opacity: c.future ? 0.3 : 1,
            }}>
              {c.glyph
                ? <Glyph name={c.glyph} size={11} color={T.color.PrimaryText} stroke={1.6} />
                : <span style={{ width: 2, height: 2, borderRadius: 999, background: T.color.SubtleText, opacity: 0.4 }} />}
            </div>
          );
        })}
      </div>
    </button>
  );
}

// ─── MONTH view ─── one calendar, full-size glyphs ─────────────
function MonthView({ monthIdx = 3, onPickWeek, onPickDay }) {
  const days = JOURNAL_DATA.filter(x => x.d.getMonth() === monthIdx);
  const firstDow = days[0].d.getDay();
  const cells = Array(firstDow).fill(null).concat(days);
  while (cells.length % 7 !== 0) cells.push(null);
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 140px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, padding: '0 2px 8px' }}>
        {DOW.map((d, i) => <div key={i} style={{ textAlign: 'center', fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 0.8, color: T.color.SubtleText }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((c, i) => {
          if (!c) return <div key={i} style={{ aspectRatio: '1', borderRadius: 10 }} />;
          const isToday = sameDay(c.d, TODAY);
          return (
            <button key={i} onClick={() => onPickDay && onPickDay(c.d)} style={{
              aspectRatio: '1', borderRadius: 10, position: 'relative',
              background: c.tint ? `${c.tint}55` : 'transparent',
              border: isToday ? `1.5px solid ${T.color.TintClay}` : (c.glyph ? `1px solid ${T.color.EdgeLine}` : 'none'),
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              opacity: c.future ? 0.25 : 1, cursor: 'pointer', padding: 0,
            }}>
              <span style={{ position: 'absolute', top: 3, left: 5, fontFamily: T.font.UI, fontSize: 9, fontWeight: 600, color: T.color.SupportingText, opacity: 0.75 }}>{c.d.getDate()}</span>
              {c.glyph && <Glyph name={c.glyph} size={22} color={T.color.PrimaryText} stroke={1.75} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── WEEK view ─── weekly review surface ───────────────────────
function WeekView({ onPickDay, onStartWeeklyReview }) {
  // Fake "this week" — Mon Apr 20 → Sun Apr 26
  const weekStart = new Date(2026, 3, 20);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    return JOURNAL_DATA.find(x => sameDay(x.d, d)) || { d, future: true };
  });
  const outcomes = [
    { t: 'Data slide shipped in pitch deck',  status: 'done' },
    { t: 'Anya call list reviewed + 3 intros', status: 'doing' },
    { t: 'Ops role reframe — written v2',     status: 'todo' },
    { t: 'Walk 4 nights this week',           status: 'doing' },
  ];
  const moments = [
    { g: 'pen', t: 'Rewrote the pitch in one sitting.' },
    { g: 'footprints', t: 'Named the cofounder thing on Sunday walk.' },
    { g: 'message', t: '1:1 with Anya — she proposed Friday 10.' },
    { g: 'moon', t: 'First full night of sleep in a week.' },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 140px' }}>
      <div style={{
        background: T.color.TintButter, borderRadius: 18, padding: 18, color: T.color.TintMoss,
        position: 'relative', overflow: 'hidden', marginBottom: 14,
      }}>
        <div className="intently-grain" style={{ opacity: 0.25 }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.75 }}>Week 17 · so far</div>
          <div style={{ fontFamily: T.font.Display, fontSize: 22, lineHeight: '28px', fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.3, marginTop: 4 }}>Pitch moving. Ops role still unformed. Watch: investor-call crunch on Thursday.</div>
        </div>
      </div>

      {/* 7-day strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 16 }}>
        {weekDays.map((c, i) => {
          const isToday = sameDay(c.d, TODAY);
          return (
            <button key={i} onClick={() => onPickDay && onPickDay(c.d)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 0', borderRadius: 12, cursor: 'pointer',
              background: c.tint ? `${c.tint}55` : T.color.SecondarySurface,
              border: isToday ? `1.5px solid ${T.color.TintClay}` : `1px solid ${T.color.EdgeLine}`,
              opacity: c.future ? 0.35 : 1,
            }}>
              <span style={{ fontFamily: T.font.UI, fontSize: 9, fontWeight: 700, letterSpacing: 0.6, color: T.color.SubtleText, textTransform: 'uppercase' }}>{DOW_FULL[c.d.getDay()]}</span>
              <span style={{ fontFamily: T.font.Display, fontSize: 14, fontWeight: 600, color: T.color.PrimaryText }}>{c.d.getDate()}</span>
              {c.glyph
                ? <Glyph name={c.glyph} size={18} color={T.color.PrimaryText} stroke={1.75} />
                : <span style={{ width: 4, height: 4, borderRadius: 999, background: T.color.SubtleText, opacity: 0.4 }} />}
            </button>
          );
        })}
      </div>

      {/* Outcome-directions */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 8 }}>This week's outcomes</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {outcomes.map((o, i) => {
            const dot = { done: T.color.TintSageDeep, doing: T.color.TintDusk, todo: T.color.SubtleText }[o.status];
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`, borderRadius: 12,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: dot, flexShrink: 0 }} />
                <span style={{ flex: 1, fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px', color: T.color.PrimaryText, textDecoration: o.status === 'done' ? 'line-through' : 'none', opacity: o.status === 'done' ? 0.65 : 1 }}>{o.t}</span>
                <span style={{ fontFamily: T.font.UI, fontSize: 9, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.color.SubtleText }}>{o.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key moments */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 8 }}>Key moments</div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {moments.map((m, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: T.color.SecondarySurface, border: `1px solid ${T.color.EdgeLine}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Glyph name={m.g} size={16} color={T.color.PrimaryText} stroke={1.75} />
              </span>
              <span style={{ flex: 1, fontFamily: T.font.Reading, fontSize: 15, lineHeight: '22px', color: T.color.PrimaryText, paddingTop: 3 }}>{m.t}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Weekly-review CTA. Surfaces on the user's configured weekly review day
          (Profile → Preferences → Weekly review day, default Sunday). Always
          visible in dev mode so the flow can be tested any day. */}
      {onStartWeeklyReview && (() => {
        const dev = typeof window !== 'undefined' && !!window.INTENTLY_DEV;
        const preferred = (typeof window !== 'undefined' && window.getPref) ? window.getPref('weeklyReviewDay', 'Sunday') : 'Sunday';
        const _DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = _DAYS[new Date().getDay()];
        const inWindow = dev || todayName === preferred;
        return inWindow;
      })() && (
        <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <button onClick={onStartWeeklyReview} style={{
            padding: '12px 22px',
            background: 'linear-gradient(135deg, #2A2348 0%, #3D3565 55%, #5A4E7E 100%)',
            color: '#FBF6EA', border: 'none', borderRadius: 999, cursor: 'pointer',
            fontFamily: T.font.UI, fontSize: 13, fontWeight: 600, letterSpacing: 0.4,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 4px 16px rgba(42,35,72,0.30)',
          }}>
            <Icon.Moon size={14} color="#FBF6EA" />
            Start weekly review
          </button>
        </div>
      )}
    </div>
  );
}

// ─── DAY view ─── one day's entries chronologically + archive ─────
// `date` (Date | undefined) — the day to render. Defaults to "now" so the
// existing "open Day directly" path keeps working. MonthView/WeekView pass
// the picked day through so DayView shows that day, not always-today
// (wiring-audit Gap #9).
function DayView({ onBack, onPickEntry, date }) {
  const dayDate = date || new Date();
  // Fallback used while DB load is pending OR when the user has no entries
  // for the picked day — keeps the screen looking real instead of empty.
  const FALLBACK_ENTRIES = [
    { id: 'brief-7-14', time: '7:14', kind: 'brief', title: 'Daily brief', body: 'A quieter one than yesterday. Morning for deep work.' },
    { id: 'journal-10-32', time: '10:32', kind: 'journal', title: 'On the data slide', body: 'Rewrote the opening — it was too defensive. The new frame is: here is what we learned; here is what it implies; here is what we are doing about it. Three beats. Anya will push back on beat two.' },
    { id: 'chat-14-50', time: '14:50', kind: 'chat', title: 'Chat — walk timing', body: 'Moved walk to after dinner per your note.' },
    { id: 'review-21-06', time: '21:06', kind: 'review', title: 'End-of-day review', body: 'Shipped the slide. Declined Raj. Walked. Good day.' },
  ];

  const [entries, setEntries] = React.useState(FALLBACK_ENTRIES);
  const [archive, setArchive] = React.useState([
    { id: 'archive-mar-2', date: 'Mar 2', t: "Named the thing about the ops hire.", glyph: 'footprints' },
    { id: 'archive-feb-14', date: 'Feb 14', t: 'First pitch rewrite — still too defensive.', glyph: 'pen' },
  ]);

  // Hydrate today's entries from Supabase. Falls back to FALLBACK_ENTRIES if
  // the user has no entries today, so the demo never looks empty.
  React.useEffect(() => {
    if (!window.getSupabaseClient || !window.getCurrentUserId) return;
    let cancelled = false;
    (async () => {
      try {
        const sb = window.getSupabaseClient();
        const userId = await window.getCurrentUserId();
        const day = dayDate;
        const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).toISOString();
        const endOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1).toISOString();
        const sevenDaysAgo = new Date(day.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const [todayEntries, olderEntries] = await Promise.all([
          sb.from('entries').select('*')
            .eq('user_id', userId)
            .gte('at', startOfDay).lt('at', endOfDay)
            .order('at', { ascending: true })
            .then((r) => r.data || []),
          sb.from('entries').select('*')
            .eq('user_id', userId)
            .lt('at', startOfDay).gte('at', sevenDaysAgo)
            .eq('kind', 'journal')
            .order('at', { ascending: false })
            .limit(2)
            .then((r) => r.data || []),
        ]);
        if (cancelled) return;

        if (todayEntries.length > 0) {
          setEntries(todayEntries.map((e) => {
            const at = new Date(e.at);
            const hh = at.getHours();
            const mm = at.getMinutes();
            const time = `${hh}:${String(mm).padStart(2, '0')}`;
            // Title: first sentence or first 60 chars of body.
            const body = e.body_markdown || '';
            const sentenceMatch = body.match(/^[^.!?]+[.!?]/);
            const title = (sentenceMatch ? sentenceMatch[0] : body).trim().slice(0, 80);
            const kindTitle = { brief: 'Daily brief', review: 'End-of-day review', chat: 'Chat', journal: title }[e.kind] || title;
            return {
              id: e.id,
              time,
              kind: e.kind,
              title: kindTitle,
              body: body.replace(/```json[\s\S]*$/, '').trim() || '—',
            };
          }));
        }

        if (olderEntries.length > 0) {
          setArchive(olderEntries.map((e) => {
            const at = new Date(e.at);
            const date = at.toLocaleString('en-US', { month: 'short', day: 'numeric' });
            const body = e.body_markdown || '';
            const t = body.split('\n')[0].slice(0, 80);
            return { id: e.id, date, t, glyph: e.glyph || 'pen' };
          }));
        }
      } catch (err) {
        console.warn('[DayView] hydrate failed:', err && err.message);
      }
    })();
    return () => { cancelled = true; };
    // Re-hydrate when the picked day changes (Gap #9). Compare by Y/M/D so
    // identical-day Date instances don't re-fire.
  }, [dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate()]);
  const kindMeta = {
    brief:   { tint: T.color.TintSage,   label: 'Brief',   glyph: 'sunrise' },
    journal: { tint: T.color.TintLilac,  label: 'Journal', glyph: 'pen' },
    chat:    { tint: T.color.TintMint,   label: 'Chat',    glyph: 'message' },
    review:  { tint: T.color.TintPeachSoft, label: 'Review', glyph: 'moon' },
  };
  // Hero tap target: prefer the first DB-backed journal entry (UUID) so the
  // edit button appears in ReadingMode. Falls back to the fixture key only
  // when today has no DB journal entries (e.g. FALLBACK_ENTRIES in play).
  // Fixture-keyed entries (ids like 'journal-10-32') have no DB row → onEdit
  // is undefined → edit button intentionally hidden (no row to update).
  const heroEntryId = (() => {
    const dbJournal = entries.find(
      (e) => e.kind === 'journal' && e.id && !e.id.startsWith('journal-') && !e.id.startsWith('brief-') && !e.id.startsWith('chat-') && !e.id.startsWith('review-') && !e.id.startsWith('archive-')
    );
    return dbJournal ? dbJournal.id : 'journal-10-32';
  })();
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 140px' }}>
      {/* Hero — the day's marquee journal entry, presented like a reading-mode
          preview. Banner image, italic title, tap to open the full reader.
          Uses the first DB-backed journal UUID when available so ReadingMode
          shows the edit button; falls back to the 'journal-10-32' fixture key
          (edit button hidden — fixture entries have no DB row to update). */}
      <button
        onClick={() => onPickEntry && onPickEntry(heroEntryId)}
        style={{
          all: 'unset', display: 'block', width: '100%',
          borderRadius: 18, overflow: 'hidden',
          boxShadow: T.shadow.Raised, marginBottom: 22,
          cursor: 'pointer', position: 'relative',
        }}
      >
        <div style={{ position: 'relative', height: 180 }}>
          <LandscapePanel mood="dusk" style={{ position: 'absolute', inset: 0 }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(43,33,24,0.05) 0%, rgba(43,33,24,0) 35%, rgba(43,33,24,0.45) 100%)',
          }} />
          <div style={{
            position: 'absolute', left: 18, right: 18, bottom: 14,
            display: 'flex', alignItems: 'flex-end', gap: 12,
          }}>
            <div style={{
              fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
              textTransform: 'uppercase', color: '#FBF6EA', opacity: 0.92,
              position: 'absolute', top: -156, left: 0,
            }}>Thursday · April 23</div>
            <div style={{
              flex: 1, fontFamily: T.font.Display, fontSize: 26, lineHeight: '32px',
              fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.4,
              color: '#FBF6EA', textWrap: 'pretty',
            }}>On the data slide.</div>
            <span style={{
              width: 36, height: 36, borderRadius: 999,
              background: 'rgba(251,246,234,0.92)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.color.PrimaryText} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </span>
          </div>
        </div>
        <div style={{
          padding: '14px 18px 16px',
          background: T.color.SecondarySurface,
          borderTop: `1px solid ${T.color.EdgeLine}`,
        }}>
          <div style={{
            fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
            textTransform: 'uppercase', color: T.color.TintClay, marginBottom: 4,
          }}>Journal · 10:32 · 2 min read</div>
          <div style={{
            fontFamily: T.font.Reading, fontSize: 14, lineHeight: '22px',
            color: T.color.PrimaryText, fontStyle: 'italic', opacity: 0.84,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>"Rewrote the opening — it was too defensive. The new frame is: here is what we learned; here is what it implies…"</div>
        </div>
      </button>

      {/* Chronological entries, text wrapping around kind glyph */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {entries.map((e, i) => {
          const k = kindMeta[e.kind];
          // Tappable kinds are exactly the ones index.html's `dbEntry`
          // resolver knows how to render (journal / chat / review).
          // Briefs are intentionally non-tappable in the journal list —
          // see `.claude/handoffs/new-user-ux-and-auth.md` (kind='brief'
          // resolver AC bullet: gate, don't add a BriefReader for now).
          const tappable = e.kind === 'chat' || e.kind === 'review' || e.kind === 'journal';
          const Tag = tappable ? 'button' : 'article';
          return (
            <Tag
              key={i}
              onClick={tappable ? () => onPickEntry && onPickEntry(e.id) : undefined}
              style={{
                all: tappable ? 'unset' : undefined,
                display: 'block', width: '100%',
                position: 'relative',
                cursor: tappable ? 'pointer' : 'default',
                padding: tappable ? '4px 4px 6px' : 0,
                borderRadius: tappable ? 10 : 0,
                textAlign: 'left',
              }}
            >
              <div style={{
                float: 'left', width: 56, height: 56, borderRadius: 14, background: k.tint,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginRight: 14, marginBottom: 4,
              }}>
                <Glyph name={k.glyph} size={24} color={T.color.TintMoss} stroke={1.75} />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: T.font.UI, fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: T.color.TintClay }}>{k.label}</span>
                <span style={{ fontFamily: T.font.Mono, fontSize: 11, color: T.color.SubtleText }}>{e.time}</span>
                {tappable && (
                  <span style={{
                    marginLeft: 'auto', fontFamily: T.font.UI, fontSize: 10, fontWeight: 700,
                    letterSpacing: 0.8, textTransform: 'uppercase', color: T.color.SubtleText,
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}>
                    Read
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={T.color.SubtleText} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                  </span>
                )}
              </div>
              <div style={{ fontFamily: T.font.Display, fontSize: 20, lineHeight: '26px', fontStyle: 'italic', fontWeight: 500, letterSpacing: -0.2, color: T.color.PrimaryText, marginBottom: 6 }}>{e.title}</div>
              <div style={{ fontFamily: T.font.Reading, fontSize: 16, lineHeight: '26px', color: T.color.PrimaryText }}>{e.body}</div>
              <div style={{ clear: 'both' }} />
            </Tag>
          );
        })}
      </div>

      {/* From your archive — resonant older entries */}
      <div style={{ marginTop: 26, padding: 16, background: T.color.SecondarySurface, borderRadius: 14, border: `1px dashed ${T.color.EdgeLine}` }}>
        <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: T.color.SupportingText, marginBottom: 10 }}>From your archive</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {archive.map((a, i) => (
            <button
              key={a.id || i}
              onClick={() => onPickEntry && onPickEntry(a.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                background: 'transparent', border: 'none', borderRadius: 10, cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ width: 32, height: 32, borderRadius: 10, background: T.color.PrimarySurface, border: `1px solid ${T.color.EdgeLine}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Glyph name={a.glyph} size={16} color={T.color.PrimaryText} stroke={1.75} />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: T.font.UI, fontSize: 10, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: T.color.SubtleText }}>{a.date}</div>
                <div style={{ fontFamily: T.font.Reading, fontSize: 14, lineHeight: '20px', color: T.color.PrimaryText, fontStyle: 'italic' }}>"{a.t}"</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAST SHELL — zoomable journal ──────────────────────────────
function PastJournal({ initialZoom = 'Week', onStartWeeklyReview }) {
  const [zoom, setZoom] = React.useState(initialZoom);
  // Picked day from Year/Month/Week views — DayView reads this so day-cell
  // taps actually navigate to that day, not always-today (Gap #9).
  const [pickedDate, setPickedDate] = React.useState(null);
  const pickDay = (d) => { if (d) setPickedDate(d); setZoom('Day'); };
  const dayForSubtitle = pickedDate || new Date();
  const daySubtitle = dayForSubtitle.toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  });
  const subtitle = { Year: '2026', Month: 'April 2026', Week: 'Week 17 · Apr 20–26', Day: daySubtitle }[zoom];
  const title = { Year: 'The year, at a glance.', Month: 'This month.', Week: 'What this week is for.', Day: 'Today, in your words.' }[zoom];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: T.color.PrimarySurface }}>
      <JournalHeader zoom={zoom} onZoom={setZoom} title={title} subtitle={subtitle} />
      {zoom === 'Year'  && <YearView  onPickMonth={() => setZoom('Month')} onPickDay={pickDay} />}
      {zoom === 'Month' && <MonthView onPickDay={pickDay} />}
      {zoom === 'Week'  && <WeekView  onPickDay={pickDay} onStartWeeklyReview={onStartWeeklyReview} />}
      {zoom === 'Day'   && <DayView   onBack={() => setZoom('Week')} date={pickedDate} />}
    </div>
  );
}

// ─── BOTTOM TENSE NAV ───────────────────────────────────────────
// Three-dot tense indicator. Tap to jump; dots also act as a position indicator.
// On mobile, swipe is the primary nav. On desktop (≥ 900px viewport), arrow buttons appear too.
function TenseNav({ index = 1, onIndex, dim = false }) {
  // Dots-only inside the phone frame. Desktop step-arrows live OUTSIDE the
  // device frame as prototype chrome (rendered separately by the app shell)
  // so the mobile screen stays clean of dev affordances.
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      padding: '10px 20px 22px', display: 'flex', justifyContent: 'center', pointerEvents: 'auto',
      opacity: dim ? 0.2 : 1, transition: `opacity 200ms ${T.motion.Standard}`, zIndex: 30,
    }}>
      <div style={{
        display: 'inline-flex', alignItems: 'center', padding: '8px 14px',
        background: 'rgba(251,246,234,0.88)', backdropFilter: 'blur(12px)',
        border: `1px solid ${T.color.EdgeLine}`, borderRadius: 999,
        boxShadow: '0 8px 24px rgba(31,27,21,0.1)',
      }}>
        <div style={{ display: 'inline-flex', gap: 8, padding: '0 6px' }}>
          {[0, 1, 2].map(i => {
            const on = i === index;
            return (
              <button key={i} onClick={() => onIndex && onIndex(i)} aria-label={['Past','Present','Future'][i]} style={{
                width: on ? 22 : 7, height: 7, borderRadius: 999,
                background: on ? T.color.PrimaryText : T.color.SubtleText,
                opacity: on ? 1 : 0.45, border: 'none', padding: 0, cursor: 'pointer',
                transition: `width 220ms ${T.motion.Standard}`,
              }} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Desktop-only step arrows that live OUTSIDE the phone frame as prototype
// chrome (alongside the dev panel). On narrow screens (<900px) it renders
// nothing — touch users swipe between tenses.
function TenseNavArrows({ index = 1, onIndex }) {
  const [wide, setWide] = React.useState(typeof window !== 'undefined' && window.innerWidth >= 900);
  React.useEffect(() => {
    const onR = () => setWide(window.innerWidth >= 900);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);
  if (!wide) return null;
  const go = (dir) => {
    const next = Math.max(0, Math.min(2, index + dir));
    if (next !== index && onIndex) onIndex(next);
  };
  const Arrow = ({ dir, disabled }) => (
    <button onClick={() => !disabled && go(dir)} disabled={disabled} aria-label={dir < 0 ? 'Previous tense' : 'Next tense'} style={{
      width: 44, height: 44, borderRadius: 999, border: `1px solid ${T.color.EdgeLine}`,
      background: T.color.SecondarySurface,
      cursor: disabled ? 'default' : 'pointer', display: 'inline-flex',
      alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.25 : 0.85,
      color: T.color.PrimaryText, padding: 0,
      boxShadow: '0 2px 6px rgba(31,27,21,0.06)',
    }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dir < 0 ? 'none' : 'scaleX(-1)' }}>
        <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
      </svg>
    </button>
  );
  return (
    <div className="tense-nav-arrows" style={{ display: 'inline-flex', gap: 8 }}>
      <Arrow dir={-1} disabled={index === 0} />
      <Arrow dir={+1} disabled={index === 2} />
    </div>
  );
}

Object.assign(window, { PastJournal, YearView, MonthView, WeekView, DayView, JournalHeader, TenseNav, TenseNavArrows });
