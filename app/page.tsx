"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ─── tiny hook: fade-in on scroll ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("opacity-100", "translate-y-0");
          el.classList.remove("opacity-0", "translate-y-8");
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── animated waveform bars ─── */
function Waveform({ color = "#7C3AED", bars = 7 }: { color?: string; bars?: number }) {
  return (
    <span className="inline-flex items-end gap-[3px] h-5 align-middle">
      {Array.from({ length: bars }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full"
          style={{
            background: color,
            height: `${40 + Math.sin(i * 1.2) * 30}%`,
            animation: `wave 1.1s ease-in-out ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}
    </span>
  );
}

/* ─── language pill badge ─── */
function LangPill({ flag, lang, delay = 0 }: { flag: string; lang: string; delay?: number }) {
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/80 backdrop-blur-sm"
      style={{ animation: `floatBadge 3s ease-in-out ${delay}s infinite alternate` }}
    >
      <span>{flag}</span>
      {lang}
    </span>
  );
}

/* ─── feature card ─── */
function FeatureCard({
  icon,
  title,
  body,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  accent: string;
}) {
  const ref = useFadeIn();
  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-8 transition-all duration-700 ease-out p-6 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 group"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-xl"
        style={{ background: `${accent}22`, color: accent }}
      >
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-2 font-display tracking-tight">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

/* ─── step row ─── */
function Step({
  num,
  title,
  body,
  delay,
}: {
  num: string;
  title: string;
  body: string;
  delay: number;
}) {
  const ref = useFadeIn();
  return (
    <div
      ref={ref}
      className="opacity-0 translate-y-8 transition-all duration-700 ease-out flex gap-5"
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-display font-bold text-sm">
        {num}
      </div>
      <div className="pt-1">
        <p className="font-semibold text-white mb-1">{title}</p>
        <p className="text-white/50 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function Home() {
  const [copied, setCopied] = useState(false);
  const heroRef = useFadeIn();
  const badgesRef = useFadeIn();

  function handleCopy() {
    navigator.clipboard.writeText("https://voxa.app/call/demo-xyz");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* ── global keyframes injected inline ── */}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); opacity: 0.6; }
          to   { transform: scaleY(1);   opacity: 1;   }
        }
        @keyframes floatBadge {
          from { transform: translateY(0px);  }
          to   { transform: translateY(-6px); }
        }
        @keyframes pulseRing {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0;   }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .font-display { font-family: var(--font-syne), sans-serif; }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 30%, #a78bfa 50%, #fff 70%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div className="min-h-screen bg-[#05050A] overflow-x-hidden">

        {/* ══ NAV ══ */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 backdrop-blur-md border-b border-white/[0.06]">
          <span className="font-display font-bold text-xl tracking-tight">
            <span className="text-violet-400">V</span>oxa
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/call"
              className="text-sm text-white/60 hover:text-white transition-colors px-4 py-2"
            >
              How it works
            </Link>
            <Link
              href="/call"
              className="text-sm bg-violet-600 hover:bg-violet-500 transition-colors px-4 py-2 rounded-full font-medium"
            >
              Start a Call
            </Link>
          </div>
        </nav>

        {/* ══ HERO ══ */}
        <section className="relative pt-36 pb-24 px-6 md:px-12 flex flex-col items-center text-center overflow-hidden">

          {/* radial glow blobs */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-violet-700/20 blur-[120px] pointer-events-none" />
          <div className="absolute top-32 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-600/10 blur-[80px] pointer-events-none" />

          {/* eyebrow */}
          <div
            ref={badgesRef as React.RefObject<HTMLDivElement>}
            className="opacity-0 translate-y-8 transition-all duration-700 mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium tracking-wide uppercase"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            Real-time AI Voice Translation
          </div>

          {/* headline */}
          <div
            ref={heroRef as React.RefObject<HTMLDivElement>}
            className="opacity-0 translate-y-8 transition-all duration-700 delay-100"
          >
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] max-w-3xl mb-6">
              Speak your language.{" "}
              <span className="shimmer-text">Be understood</span>{" "}
              in theirs.
            </h1>
            <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10">
              Voxa translates your voice live during a call — no typing, no delays, no interpreter needed.
            </p>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
              <Link
                href="/call"
                className="group relative inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-7 py-3.5 rounded-full transition-all duration-200 shadow-lg shadow-violet-900/40 hover:shadow-violet-700/50 hover:scale-105 active:scale-100"
              >
                <span>Start a free call</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/15 hover:border-white/30 text-white/70 hover:text-white text-sm font-medium transition-all duration-200"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Link copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 015.656 0l4-4a4 4 0 01-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Share a demo link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Live demo card ── */}
          <div className="relative w-full max-w-lg mx-auto rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-6 shadow-2xl shadow-violet-950/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Live call preview</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Speaker A */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-violet-600/10 border border-violet-500/20">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-lg font-bold">A</div>
                  <span className="absolute -bottom-1 -right-1 text-base">🇳🇬</span>
                </div>
                <Waveform color="#a78bfa" />
                <span className="text-xs text-violet-300 font-medium">Speaking Yoruba</span>
              </div>
              {/* Speaker B */}
              <div className="flex flex-col items-center gap-3 p-4 rounded-xl bg-cyan-600/10 border border-cyan-500/20">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-lg font-bold">B</div>
                  <span className="absolute -bottom-1 -right-1 text-base">🇬🇧</span>
                </div>
                <Waveform color="#67e8f9" />
                <span className="text-xs text-cyan-300 font-medium">Hearing English</span>
              </div>
            </div>
            {/* translation ticker */}
            <div className="mt-4 px-3 py-2.5 rounded-lg bg-black/30 border border-white/[0.06] flex items-center gap-2">
              <span className="text-xs text-white/30">Translated:</span>
              <span className="text-xs text-white/70 italic truncate">"Hello, can you hear me clearly?"</span>
              <span className="ml-auto text-[10px] text-violet-400 whitespace-nowrap">~1.2s</span>
            </div>
          </div>

          {/* floating language badges */}
          <div className="flex flex-wrap justify-center gap-2 mt-10">
            {[
              { flag: "🇳🇬", lang: "Yoruba", delay: 0 },
              { flag: "🇳🇬", lang: "Hausa", delay: 0.4 },
              { flag: "🇬🇧", lang: "English", delay: 0.8 },
              { flag: "🇳🇬", lang: "Igbo", delay: 1.2 },
              { flag: "🇳🇬", lang: "Pidgin", delay: 1.6 },
              { flag: "🇫🇷", lang: "French", delay: 2.0 },
            ].map((l) => (
              <LangPill key={l.lang} {...l} />
            ))}
          </div>
        </section>

        {/* ══ HOW IT WORKS ══ */}
        <section className="px-6 md:px-12 py-20 max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3">The flow</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              A call in 4 steps
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Step num="01" title="Create a call link" body="One click generates a unique link. No account, no downloads, no friction." delay={0} />
            <Step num="02" title="Share & join" body="Send the link to anyone. They open it, pick their language, and they're in." delay={100} />
            <Step num="03" title="Speak naturally" body="Talk exactly as you would on a normal call. Voxa listens in the background." delay={200} />
            <Step num="04" title="Hear the translation" body="The other person hears your voice translated into their language within ~1–2 seconds." delay={300} />
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section className="px-6 md:px-12 py-20 max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-cyan-400 text-sm font-medium uppercase tracking-widest mb-3">Why Voxa</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
              Built for real conversations
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <FeatureCard
              icon="⚡"
              title="~1 second delay"
              body="Streaming AI keeps the gap tight enough that conversation still feels natural."
              accent="#a78bfa"
            />
            <FeatureCard
              icon="🔗"
              title="Link-based joins"
              body="Share a URL like Google Meet. No signup required for the person you call."
              accent="#67e8f9"
            />
            <FeatureCard
              icon="🌍"
              title="African-language first"
              body="Yoruba, Hausa, Igbo, and Pidgin are first-class — not afterthoughts."
              accent="#34d399"
            />
            <FeatureCard
              icon="🎙️"
              title="Voice only"
              body="No chat box, no typing. Just your voice and the other person's voice."
              accent="#fb923c"
            />
            <FeatureCard
              icon="🔒"
              title="Private by design"
              body="Calls are end-to-end routed. Nothing is stored after the call ends."
              accent="#f472b6"
            />
            <FeatureCard
              icon="📶"
              title="Works on slow networks"
              body="Compressed audio streaming keeps quality up even on 3G connections."
              accent="#facc15"
            />
          </div>
        </section>

        {/* ══ CTA BANNER ══ */}
        <section className="px-6 md:px-12 py-24 flex justify-center">
          <div className="relative w-full max-w-3xl rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-[#0d0820] to-cyan-950/40 p-10 text-center overflow-hidden">
            {/* decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[400px] h-[400px] rounded-full border border-violet-500/10" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[250px] h-[250px] rounded-full border border-violet-500/15" />
            </div>

            <p className="text-violet-300 text-sm font-medium uppercase tracking-widest mb-4">Ready?</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Start talking across languages
            </h2>
            <p className="text-white/50 mb-8 max-w-sm mx-auto">
              No sign-up. No install. Just a link and a conversation.
            </p>
            <Link
              href="/call"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-8 py-4 rounded-full transition-all duration-200 shadow-lg shadow-violet-900/40 hover:shadow-violet-700/50 hover:scale-105 active:scale-100 text-lg"
            >
              Start a free call
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="border-t border-white/[0.06] px-6 md:px-12 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-sm">
          <span className="font-display font-bold text-white/50">
            <span className="text-violet-400">V</span>oxa
          </span>
          <span>© {new Date().getFullYear()} Voxa. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="#" className="hover:text-white/60 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-white/60 transition-colors">Terms</Link>
          </div>
        </footer>
      </div>
    </>
  );
}