// Web Speech API wrapper. Ported from app/lib/voice.ts.
// Differences:
//   - React hooks pulled from window.React (Babel-standalone pattern)
//   - TypeScript types stripped
//   - Exports attached to window for cross-script access

const { useCallback, useEffect, useRef, useState } = React;

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function useVoiceInput() {
  const Ctor = getRecognitionCtor();
  const [state, setState] = useState(
    Ctor ? { kind: 'idle' } : { kind: 'unsupported' },
  );
  const recRef = useRef(null);
  const finalRef = useRef('');
  const interimRef = useRef('');

  useEffect(() => {
    return () => {
      if (recRef.current) recRef.current.abort();
    };
  }, []);

  const start = useCallback(() => {
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    finalRef.current = '';
    interimRef.current = '';

    rec.onresult = (e) => {
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalRef.current += r[0].transcript;
        else interim += r[0].transcript;
      }
      interimRef.current = interim;
      setState({ kind: 'listening', interim: finalRef.current + interim });
    };
    rec.onerror = (e) => {
      setState({ kind: 'error', message: `Speech error: ${e.error}` });
    };
    rec.onend = () => {
      const transcript = (finalRef.current + interimRef.current).trim();
      if (transcript.length > 0) {
        setState({ kind: 'stopped', transcript });
      } else {
        setState({ kind: 'idle' });
      }
    };

    try {
      rec.start();
      recRef.current = rec;
      setState({ kind: 'listening', interim: '' });
    } catch (err) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'failed to start recognition',
      });
    }
  }, [Ctor]);

  const stop = useCallback(() => {
    if (recRef.current) recRef.current.stop();
  }, []);

  const reset = useCallback(() => {
    if (recRef.current) recRef.current.abort();
    finalRef.current = '';
    interimRef.current = '';
    setState(Ctor ? { kind: 'idle' } : { kind: 'unsupported' });
  }, [Ctor]);

  const submitManual = useCallback((transcript) => {
    if (transcript.trim().length === 0) return;
    setState({ kind: 'stopped', transcript: transcript.trim() });
  }, []);

  return { state, start, stop, reset, submitManual };
}

// POST transcript to the reminders classify-and-store endpoint.
async function classifyTranscript(transcript, supabaseUrl) {
  const url = supabaseUrl || (window.INTENTLY_CONFIG && window.INTENTLY_CONFIG.supabaseUrl);
  if (!url) throw new Error('classifyTranscript: supabaseUrl missing (pass arg or set window.INTENTLY_CONFIG.supabaseUrl)');
  const endpoint = `${url.replace(/\/+$/, '')}/functions/v1/reminders/classify-and-store`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`classify-and-store ${res.status}: ${body.slice(0, 200)}`);
  }
  return await res.json();
}

Object.assign(window, { useVoiceInput, classifyTranscript });
