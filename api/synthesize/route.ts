/**
 * POST /api/synthesize
 * Body: { text: string, lang: string }
 * Returns: audio/mpeg blob
 *
 * Converts translated text to speech via ElevenLabs.
 */

import { NextRequest, NextResponse } from "next/server";

/* Map Voxa lang codes to ElevenLabs voice IDs.
   Add/swap voices per language as needed.
   Browse voices at: https://elevenlabs.io/voice-library */
const VOICE_MAP: Record<string, string> = {
  en: process.env.ELEVENLABS_VOICE_EN ?? "21m00Tcm4TlvDq8ikWAM", // Rachel (English)
  fr: process.env.ELEVENLABS_VOICE_FR ?? "MF3mGyEYCl7XYWbV9V6O", // Elli  (French)
  ar: process.env.ELEVENLABS_VOICE_AR ?? "AZnzlk1XvdvUeBnXmlld", // Domi  (Arabic)
  yo: process.env.ELEVENLABS_VOICE_YO ?? "21m00Tcm4TlvDq8ikWAM", // fallback
  ha: process.env.ELEVENLABS_VOICE_HA ?? "21m00Tcm4TlvDq8ikWAM", // fallback
  ig: process.env.ELEVENLABS_VOICE_IG ?? "21m00Tcm4TlvDq8ikWAM", // fallback
  pc: process.env.ELEVENLABS_VOICE_PC ?? "21m00Tcm4TlvDq8ikWAM", // fallback
  sw: process.env.ELEVENLABS_VOICE_SW ?? "21m00Tcm4TlvDq8ikWAM", // fallback
};

export async function POST(req: NextRequest) {
  try {
    const { text, lang } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "ELEVENLABS_API_KEY not set" }, { status: 500 });
    }

    const voiceId = VOICE_MAP[lang] ?? VOICE_MAP.en;

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5", // fastest, lowest latency
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
          },
          output_format: "mp3_44100_128",
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("[/api/synthesize] ElevenLabs error:", err);
      return NextResponse.json({ error: "Synthesis failed" }, { status: 502 });
    }

    /* Stream the audio back to the client */
    const audioBuffer = await res.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[/api/synthesize]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}