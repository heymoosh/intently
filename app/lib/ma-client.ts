// Web client for the ma-proxy Supabase Edge Function. The Edge Function holds
// the Anthropic API key server-side; this wrapper just POSTs JSON and surfaces
// a typed response. See supabase/functions/ma-proxy/README.md.

import type { AgentOutput } from './agent-output';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;

export type MaSkill =
  | 'daily-brief'
  | 'daily-review'
  | 'weekly-review'
  | 'monthly-review'
  | 'update-tracker'
  | 'setup';

export type MaProxyRequest = {
  skill: MaSkill;
  input: string | Record<string, unknown>;
  sessionId?: string;
};

export type MaProxyResponse = {
  sessionId: string;
  finalText: string;
  status: 'idle' | 'error' | 'terminated';
};

export class MaProxyError extends Error {
  constructor(
    public status: number,
    public detail: unknown,
    message: string,
  ) {
    super(message);
    this.name = 'MaProxyError';
  }
}

export async function callMaProxy(req: MaProxyRequest): Promise<MaProxyResponse> {
  if (!SUPABASE_URL) {
    throw new MaProxyError(
      0,
      null,
      'EXPO_PUBLIC_SUPABASE_URL missing — cannot reach ma-proxy.',
    );
  }

  const endpoint = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/ma-proxy`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as
      | { error?: { message?: string; detail?: unknown } }
      | null;
    const message = body?.error?.message ?? `ma-proxy responded ${res.status}`;
    throw new MaProxyError(res.status, body?.error?.detail ?? null, message);
  }

  return (await res.json()) as MaProxyResponse;
}

// Wrap the proxy's finalText payload as an AgentOutput ready for AgentOutputCard.
// The proxy only returns body text; kind / title / traces come from the caller.
export function toAgentOutput(
  finalText: string,
  meta: Pick<AgentOutput, 'kind' | 'title' | 'inputTraces'>,
): AgentOutput {
  return {
    kind: meta.kind,
    title: meta.title,
    inputTraces: meta.inputTraces,
    body: finalText,
    generatedAt: new Date().toISOString(),
  };
}
