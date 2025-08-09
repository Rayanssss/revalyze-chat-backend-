# Revalyze Chat Backend (Vercel-ready)

En minimal, trygg serverless backend for AI-chatten. Nøkkelen lagres **trygt på server**, ikke i nettleseren.

## Slik deployer du (superenkelt)
1. Lag en konto på **Vercel** (gratis): https://vercel.com
2. Klikk **Add New → Project → Import Git Repository**.
   - Hvis du ikke har GitHub: Klikk **"Create a New Repository"** i Vercel og lim inn disse filene der (Vercel UI lar deg opprette repo automatisk).
3. Under **Settings → Environment Variables**, legg til:
   - `OPENAI_API_KEY` = din nye nøkkel
4. Deploy. Du får en URL som: `https://dittprosjekt.vercel.app/api/chat`

## API
- Endpoint: `POST /api/chat`
- Body:
  ```json
  {"messages":[{"role":"user","content":"Hei"}]}
  ```
- Response:
  ```json
  {"content":"Hei, hvordan kan jeg hjelpe?"}
  ```

## Cloudflare Workers (alternativ – enklest å lime inn manuelt)
1. Lag en **Worker** i Cloudflare.
2. Sett **Environment Variable** `OPENAI_API_KEY`.
3. Lim inn denne koden som Worker (JavaScript):

```js
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    try {
      const body = await request.json();
      const messages = Array.isArray(body?.messages) ? body.messages : [];
      if (!messages.length) return new Response(JSON.stringify({ error: 'messages must be an array' }), { status: 400 });

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
        body: JSON.stringify({
          model: 'gpt-5',
          temperature: 0.3,
          messages: [
            { role: 'system', content: 'Du er en norsk digital eiendomsmegler-ekspert. Gi datadrevne, tydelige råd til både kjøpere og selgere.' },
            ...messages
          ]
        })
      });
      if (!r.ok) return new Response(JSON.stringify({ error: 'OpenAI error', detail: await r.text() }), { status: 500 });

      const data = await r.json();
      const content = data?.choices?.[0]?.message?.content || 'Beklager, jeg fant ikke et svar.';
      return new Response(JSON.stringify({ content }), { headers: { 'Content-Type': 'application/json' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
    }
  }
}
```
