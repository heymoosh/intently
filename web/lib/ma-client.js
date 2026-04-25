// Web client for the ma-proxy Supabase Edge Function. The Edge Function holds
// the Anthropic API key server-side; this wrapper just POSTs JSON and surfaces
// the response. See supabase/functions/ma-proxy/README.md.
//
// Ported from app/lib/ma-client.ts. Differences:
//   - process.env.EXPO_PUBLIC_SUPABASE_URL → window.INTENTLY_CONFIG.supabaseUrl
//   - TypeScript types stripped
//   - Exports attached to window for cross-script access

class MaProxyError extends Error {
  constructor(status, detail, message) {
    super(message);
    this.name = 'MaProxyError';
    this.status = status;
    this.detail = detail;
  }
}

async function callMaProxy(req) {
  const supabaseUrl = window.INTENTLY_CONFIG && window.INTENTLY_CONFIG.supabaseUrl;
  if (!supabaseUrl) {
    throw new MaProxyError(
      0,
      null,
      'INTENTLY_CONFIG.supabaseUrl missing — cannot reach ma-proxy.',
    );
  }

  const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/ma-proxy`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const message = (body && body.error && body.error.message) || `ma-proxy responded ${res.status}`;
    const detail = (body && body.error && body.error.detail) || null;
    throw new MaProxyError(res.status, detail, message);
  }

  return await res.json();
}

// Wrap the proxy's finalText payload as an AgentOutput ready for AgentOutputCard.
function toAgentOutput(finalText, meta) {
  return {
    kind: meta.kind,
    title: meta.title,
    inputTraces: meta.inputTraces,
    body: finalText,
    generatedAt: new Date().toISOString(),
  };
}

Object.assign(window, { callMaProxy, toAgentOutput, MaProxyError });
