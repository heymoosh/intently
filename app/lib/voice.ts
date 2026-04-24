// Web Speech API wrapper. Browser-native SpeechRecognition isn't in the RN
// types and isn't available on every target — this module hides the detection
// behind a small hook and a clean fallback so callers don't have to.

import { useCallback, useEffect, useRef, useState } from 'react';

type WebSpeechRecognitionCtor = new () => WebSpeechRecognition;

// Minimal shape we actually touch. Full spec is larger; not worth importing.
type WebSpeechRecognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: { isFinal: boolean; 0: { transcript: string } }[] & { length: number } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): WebSpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: WebSpeechRecognitionCtor;
    webkitSpeechRecognition?: WebSpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type VoiceState =
  | { kind: 'unsupported' }
  | { kind: 'idle' }
  | { kind: 'listening'; interim: string }
  | { kind: 'stopped'; transcript: string }
  | { kind: 'error'; message: string };

export function useVoiceInput() {
  const Ctor = getRecognitionCtor();
  const [state, setState] = useState<VoiceState>(
    Ctor ? { kind: 'idle' } : { kind: 'unsupported' },
  );
  const recRef = useRef<WebSpeechRecognition | null>(null);
  const finalRef = useRef<string>('');
  const interimRef = useRef<string>('');

  useEffect(() => {
    return () => {
      recRef.current?.abort();
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
    recRef.current?.stop();
  }, []);

  const reset = useCallback(() => {
    recRef.current?.abort();
    finalRef.current = '';
    interimRef.current = '';
    setState(Ctor ? { kind: 'idle' } : { kind: 'unsupported' });
  }, [Ctor]);

  // Manual override for environments without SR — caller can push a typed
  // transcript through the same state machine so downstream handlers see
  // uniform shape.
  const submitManual = useCallback((transcript: string) => {
    if (transcript.trim().length === 0) return;
    setState({ kind: 'stopped', transcript: transcript.trim() });
  }, []);

  return { state, start, stop, reset, submitManual };
}

// POST transcript to the reminders classify-and-store endpoint. Returns
// whatever the backend says, or throws on network/HTTP failure.
export type ClassifyResult =
  | { classified: true; reminder: { id: string; text: string; remind_on: string } }
  | { classified: false; reason: string };

export async function classifyTranscript(
  transcript: string,
  supabaseUrl: string,
): Promise<ClassifyResult> {
  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/reminders/classify-and-store`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`classify-and-store ${res.status}: ${body.slice(0, 200)}`);
  }
  return (await res.json()) as ClassifyResult;
}
