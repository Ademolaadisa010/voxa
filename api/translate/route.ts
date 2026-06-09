/**
 * POST /api/translate
 * Body: { text: string, sourceLang: string, targetLang: string }
 * Returns: { translated: string }
 *
 * Translates text via DeepL API.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLang, targetLang } = await req.json();

    if (!text || !targetLang) {
      return NextResponse.json({ error: "Missing text or targetLang" }, { status: 400 });
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "DEEPL_API_KEY not set" }, { status: 500 });
    }

    /* DeepL free tier uses api-free.deepl.com; paid uses api.deepl.com */
    const baseUrl = apiKey.endsWith(":fx")
      ? "https://api-free.deepl.com"
      : "https://api.deepl.com";

    const body = new URLSearchParams({
      text,
      target_lang: targetLang.toUpperCase(),
      ...(sourceLang ? { source_lang: sourceLang.toUpperCase() } : {}),
    });

    const res = await fetch(`${baseUrl}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[/api/translate] DeepL error:", err);
      return NextResponse.json({ error: "Translation failed" }, { status: 502 });
    }

    const data = await res.json();
    const translated = data.translations?.[0]?.text ?? text;
    return NextResponse.json({ translated });
  } catch (err) {
    console.error("[/api/translate]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}