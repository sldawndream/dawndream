// ElevenLabs Text-to-Speech API route
// Voice: Rachel — cinematic, feminine, perfect for gothic narration
// Docs: https://api.elevenlabs.io/docs

// Rachel's voice ID on ElevenLabs
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

// ElevenLabs free tier: 10,000 chars/month
// Chronicles are typically 500–2000 chars — plenty of headroom

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Text required' });

  // Hard cap to protect against abuse — 5000 chars per request
  const safeText = text.slice(0, 5000);

  try {
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: safeText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.45,        // some variation — feels more alive, less robotic
            similarity_boost: 0.85, // stays true to Rachel's voice character
            style: 0.35,            // expressive, dramatic delivery
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenRes.ok) {
      const errText = await elevenRes.text();
      console.error('ElevenLabs error:', elevenRes.status, errText);
      return res.status(502).json({ error: 'Voice generation failed' });
    }

    // Stream the audio directly to the client
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');

    const buffer = await elevenRes.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'Voice generation failed' });
  }
}
