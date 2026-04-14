// ElevenLabs TTS — Voice: Rachel (cinematic, feminine, gothic)
// Next.js 14 Pages Router compatible

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel

// Required for binary audio response in Next.js Pages Router
export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text || typeof text !== 'string') return res.status(400).json({ error: 'Text required' });

  const safeText = text.slice(0, 5000);

  try {
    const elevenRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
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
            stability: 0.45,
            similarity_boost: 0.85,
            style: 0.35,
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

    const buffer = Buffer.from(await elevenRes.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).end(buffer);

  } catch (err) {
    console.error('TTS error:', err);
    res.status(500).json({ error: 'Voice generation failed' });
  }
}
