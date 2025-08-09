export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*"); // evt. bytt * til din frontend-URL
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) return res.status(400).json({ error: "messages must be an array" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-5",
        temperature: 0.3,
        messages: [
          { role: "system",
            content: "Du er en norsk digital eiendomsmegler-ekspert. Gi datadrevne, tydelige råd til både kjøpere og selgere: tilstand/TG, oppussing, ROI, leie, prisstrategi, risiko, lovverk og beste praksis. Vær presis og konkret."
          },
          ...messages
        ]
      })
    });

    if (!r.ok) return res.status(500).json({ error: "OpenAI error", detail: await r.text() });
    const data = await r.json();
    return res.status(200).json({ content: data?.choices?.[0]?.message?.content || "Beklager, jeg fant ikke et svar." });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
}
