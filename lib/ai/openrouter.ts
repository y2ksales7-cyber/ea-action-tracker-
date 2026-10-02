import 'server-only';
export function aiConfigured() { return !!process.env.OPENROUTER_API_KEY; }
export async function complete(system: string, input: string, json = false) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('AI is not enabled yet. Ask the app administrator to add the OpenRouter key in Vercel. Manual action entry still works.');
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', signal: AbortSignal.timeout(45000), cache: 'no-store',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://ea-action-tracker.vercel.app', 'X-Title': 'EA Action Tracker' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'openrouter/free', temperature: 0.2, max_tokens: 3000,
      messages: [{role:'system', content:system},{role:'user',content:input}], ...(json ? {response_format:{type:'json_object'}} : {}) }),
  }).catch(() => { throw new Error('The AI provider timed out. Your meeting and actions have not changed. Retry in a moment.'); });
  if (!response.ok) throw new Error(response.status === 402 ? 'The OpenRouter account needs credits or an available free model.' : response.status === 429 ? 'The AI provider is busy. Retry shortly.' : 'OpenRouter could not complete this request. Check the key and selected model in Vercel.');
  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim() || content.length > 30000) throw new Error('The AI returned an invalid response. Retry or enter actions manually.');
  return content.trim();
}
