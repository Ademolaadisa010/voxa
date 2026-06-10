/**
 * useVoxaTranslation — AI translation pipeline
 *
 * Flow:
 *   Mic audio → Whisper (STT) → DeepL (translate) → ElevenLabs (TTS) → speaker
 *
 * Set these env vars in .env.local:
 *   OPENAI_API_KEY          — for Whisper STT
 *   DEEPL_API_KEY           — for DeepL translation
 *   ELEVENLABS_API_KEY      — for ElevenLabs TTS
 *   ELEVENLABS_VOICE_ID     — voice to use (default: "21m00Tcm4TlvDq8ikWAM")
 *
 * All API calls go through Next.js API routes (/api/*)
 * so your keys never reach the browser.
 */

"use client";

import { useCallback, useRef, useState } from "react";

/* ─── Types ─── */
export interface TranslationSegment {
  id: string;
  original: string;
  translated: string;
  fromLang: string;
  toLang: string;
  latencyMs: number;
  timestamp: number;
}

export interface UseVoxaTranslationOptions {
  fromLang: string;  // e.g. "yo" (Yoruba)
  toLang: string;    // e.g. "en" (English)
  onSegment?: (seg: TranslationSegment) => void;
  silenceThresholdMs?: number; // default 900ms — flush buffer after silence
}

export interface UseVoxaTranslationReturn {
  isListening: boolean;
  segments: TranslationSegment[];
  startListening: (stream: MediaStream) => void;
  stopListening: () => void;
  clearSegments: () => void;
}

/* ─── Language code map (Voxa → Whisper/DeepL) ─── */
const LANG_MAP: Record<string, { whisper: string; deepl: string; label: string }> = {
  yo: { whisper: "yo", deepl: "YO", label: "Yoruba"  },
  ha: { whisper: "ha", deepl: "HA", label: "Hausa"   },
  ig: { whisper: "ig", deepl: "IG", label: "Igbo"    },
  pc: { whisper: "en", deepl: "EN", label: "Pidgin"  }, // Pidgin → use EN as closest
  en: { whisper: "en", deepl: "EN", label: "English" },
  fr: { whisper: "fr", deepl: "FR", label: "French"  },
  ar: { whisper: "ar", deepl: "AR", label: "Arabic"  },
  sw: { whisper: "sw", deepl: "SW", label: "Swahili" },
};

/* ─── Silence detection via AudioWorklet ─── */
const SILENCE_PROCESSOR = `
class SilenceDetector extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._lastSound = currentTime;
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;
    const rms = Math.sqrt(input.reduce((s,v)=>s+v*v,0)/input.length);
    if (rms > 0.01) this._lastSound = currentTime;
    if (currentTime - this._lastSound > 0.9) {
      this.port.postMessage({ silence: true });
      this._lastSound = currentTime;
    }
    return true;
  }
}
registerProcessor('silence-detector', SilenceDetector);
`;

/* ════════════════════════════════════════
   HOOK
════════════════════════════════════════ */
export function useVoxaTranslation({
  fromLang,
  toLang,
  onSegment,
  silenceThresholdMs = 900,
}: UseVoxaTranslationOptions): UseVoxaTranslationReturn {
  const [isListening, setIsListening] = useState(false);
  const [segments, setSegments] = useState<TranslationSegment[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Flush buffer → STT → translate → TTS ── */
  const flushBuffer = useCallback(async () => {
    if (chunksRef.current.length === 0) return;

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    chunksRef.current = [];

    const t0 = Date.now();

    try {
      /* 1. STT via Whisper */
      const transcript = await transcribeAudio(blob, fromLang);
      if (!transcript.trim()) return;

      /* 2. Translate */
      const translated = await translateText(transcript, fromLang, toLang);

      /* 3. TTS */
      const audioUrl = await synthesizeSpeech(translated, toLang);

      const latencyMs = Date.now() - t0;

      const seg: TranslationSegment = {
        id: crypto.randomUUID(),
        original: transcript,
        translated,
        fromLang,
        toLang,
        latencyMs,
        timestamp: Date.now(),
      };

      setSegments((prev) => [...prev.slice(-20), seg]);
      onSegment?.(seg);

      /* play translated audio */
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audio.play().catch(console.error);
      }
    } catch (err) {
      console.error("[Voxa] Translation pipeline error:", err);
    }
  }, [fromLang, toLang, onSegment]);

  /* ── Start listening ── */
  const startListening = useCallback(
    (stream: MediaStream) => {
      if (isListening) return;

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      /* collect chunks every 200ms */
      recorder.start(200);
      mediaRecorderRef.current = recorder;

      /* silence detection — flush after quiet period */
      const setupSilence = async () => {
        try {
          const ctx = new AudioContext();
          audioCtxRef.current = ctx;

          const blob = new Blob([SILENCE_PROCESSOR], { type: "application/javascript" });
          const url = URL.createObjectURL(blob);
          await ctx.audioWorklet.addModule(url);
          URL.revokeObjectURL(url);

          const source = ctx.createMediaStreamSource(stream);
          const detector = new AudioWorkletNode(ctx, "silence-detector");

          detector.port.onmessage = () => {
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = setTimeout(flushBuffer, silenceThresholdMs);
          };

          source.connect(detector);
        } catch {
          /* fallback: flush on fixed interval if worklet unavailable */
          silenceTimerRef.current = setInterval(flushBuffer, 3000) as unknown as ReturnType<typeof setTimeout>;
        }
      };

      setupSilence();
      setIsListening(true);
    },
    [isListening, flushBuffer, silenceThresholdMs]
  );

  /* ── Stop listening ── */
  const stopListening = useCallback(() => {
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    audioCtxRef.current?.close();
    audioCtxRef.current = null;

    flushBuffer(); // flush remaining audio
    setIsListening(false);
  }, [flushBuffer]);

  const clearSegments = useCallback(() => setSegments([]), []);

  return { isListening, segments, startListening, stopListening, clearSegments };
}

/* ════════════════════════════════════════
   API HELPERS  (call Next.js API routes)
════════════════════════════════════════ */

/** 1. Speech → Text via Whisper */
async function transcribeAudio(audio: Blob, langCode: string): Promise<string> {
  const whisperLang = LANG_MAP[langCode]?.whisper ?? "en";
  const form = new FormData();
  form.append("file", audio, "audio.webm");
  form.append("language", whisperLang);

  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Transcription failed: ${res.status}`);
  const { text } = await res.json();
  return text ?? "";
}

/** 2. Text → Text via DeepL */
async function translateText(text: string, from: string, to: string): Promise<string> {
  const sourceLang = LANG_MAP[from]?.deepl ?? "EN";
  const targetLang = LANG_MAP[to]?.deepl ?? "EN";

  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });
  if (!res.ok) throw new Error(`Translation failed: ${res.status}`);
  const { translated } = await res.json();
  return translated ?? text;
}

/** 3. Text → Speech via ElevenLabs */
async function synthesizeSpeech(text: string, langCode: string): Promise<string | null> {
  const res = await fetch("/api/synthesize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang: langCode }),
  });
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}