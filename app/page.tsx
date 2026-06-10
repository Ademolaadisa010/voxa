"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add("opacity-100", "translate-y-0");
        el.classList.remove("opacity-0", "translate-y-8");
        obs.disconnect();
      }
    }, { threshold: 0.12 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Waveform({ color = "#7C3AED", bars = 7 }: { color?: string; bars?: number }) {
  return (
    <span className="inline-flex items-end gap-[3px] h-5 align-middle">
      {Array.from({ length: bars }).map((_, i) => (
        <span key={i} className="w-[3px] rounded-full"
          style={{
            background: color,
            height: `${40 + Math.sin(i * 1.2) * 30}%`,
            animation: `waveBar 1.1s ease-in-out ${i * 0.12}s infinite alternate`,
          }}
        />
      ))}
    </span>
  );
}

function LangPill({ flag, lang, delay = 0 }: { flag: string; lang: string; delay?: number }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/70"
      style={{ animation: `floatBadge 3s ease-in-out ${delay}s infinite alternate` }}>
      <span>{flag}</span>{lang}
    </span>
  );
}

function FeatureCard({ icon, title, body, accent }: { icon: string; title: string; body: string; accent: string }) {
  const ref = useFadeIn();
  return (
    <div ref={ref} className="opacity-0 translate-y-8 transition-all duration-700 ease-out p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 text-xl" style={{ background: `${accent}22`, color: accent }}>{icon}</div>
      <h3 className="font-display font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/50 text-sm leading-relaxed">{body}</p>
    </div>
  );
}

function Step({ num, title, body, delay }: { num: string; title: string; body: string; delay: number }) {
  const ref = useFadeIn();
  return (
    <div ref={ref} className="opacity-0 translate-y-8 transition-all duration-700 ease-out flex gap-4" style={{ transitionDelay: `${delay}ms` }}>
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-display font-bold text-xs">{num}</div>
      <div className="pt-1">
        <p className="font-semibold text-white mb-1 text-sm sm:text-base">{title}</p>
        <p className="text-white/50 text-sm leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const heroRef   = useFadeIn();
  const eyebrowRef = useFadeIn();

  return (
    <>
      <style>{`
        @keyframes waveBar    { from{transform:scaleY(0.4);opacity:0.6} to{transform:scaleY(1);opacity:1} }
        @keyframes floatBadge { from{transform:translateY(0px)} to{transform:translateY(-6px)} }
        @keyframes shimmer    { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .font-display { font-family: var(--font-syne), sans-serif; }
        .shimmer-text {
          background: linear-gradient(90deg,#fff 25%,#a78bfa 45%,#67e8f9 55%,#fff 75%);
          background-size: 200% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; animation: shimmer 4s linear infinite;
        }
      `}</style>

      <div className="min-h-screen bg-[#05050A] overflow-x-hidden text-white">

        {/* NAV */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-10 py-4 backdrop-blur-md border-b border-white/[0.06]">
          <span className="font-display font-bold text-xl"><span className="text-violet-400">V</span>oxa</span>
          <div className="hidden sm:flex items-center gap-3">
            <a href="#how" className="text-sm text-white/50 hover:text-white transition-colors px-3 py-2">How it works</a>
            <Link href="/onboarding" className="text-sm bg-violet-600 hover:bg-violet-500 transition-colors px-5 py-2 rounded-full font-medium">Start a Call</Link>
          </div>
          <button className="sm:hidden p-2 text-white/60" onClick={() => setMenuOpen(o => !o)}>
            {menuOpen
              ? <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
            }
          </button>
          {menuOpen && (
            <div className="absolute top-full left-0 right-0 bg-[#0a0a12] border-b border-white/[0.06] px-5 py-4 flex flex-col gap-3 sm:hidden">
              <a href="#how" className="text-white/60 py-2 text-sm" onClick={() => setMenuOpen(false)}>How it works</a>
              <Link href="/onboarding" className="bg-violet-600 text-white font-medium py-3 rounded-full text-sm text-center" onClick={() => setMenuOpen(false)}>Start a Call</Link>
            </div>
          )}
        </nav>

        {/* HERO */}
        <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-5 sm:px-10 flex flex-col items-center text-center overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] rounded-full bg-violet-700/20 blur-[120px] pointer-events-none" />
          <div className="absolute top-32 left-1/4 w-[250px] h-[250px] rounded-full bg-cyan-600/10 blur-[80px] pointer-events-none" />

          {/* eyebrow */}
          <div ref={eyebrowRef as React.RefObject<HTMLDivElement>}
            className="opacity-0 translate-y-8 transition-all duration-700 mb-5 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium tracking-wide uppercase">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
            </span>
            Real-time AI Voice Translation
          </div>

          {/* headline + CTAs */}
          <div ref={heroRef as React.RefObject<HTMLDivElement>}
            className="opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.08] max-w-3xl mb-5">
              Speak your language.{" "}
              <span className="shimmer-text">Be understood</span>{" "}
              in theirs.
            </h1>
            <p className="text-white/50 text-base sm:text-lg max-w-md mx-auto leading-relaxed mb-8">
              Voxa translates your voice live during a call — no typing, no delays, no interpreter needed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
              <Link href="/onboarding"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-100 transition-all text-white font-semibold px-7 py-3.5 rounded-full shadow-lg shadow-violet-900/40">
                Start a free call
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
              </Link>
              <a href="#how"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/15 hover:border-white/30 text-white/70 hover:text-white px-7 py-3.5 rounded-full text-sm font-medium transition-all">
                See how it works
              </a>
            </div>
          </div>

          {/* Live demo card */}
          <div className="w-full max-w-sm sm:max-w-lg mx-auto rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-white/40 font-mono uppercase tracking-widest">Live call preview</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-violet-600/10 border border-violet-500/20">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center font-bold">A</div>
                  <span className="absolute -bottom-1 -right-1 text-sm">🇳🇬</span>
                </div>
                <Waveform color="#a78bfa" bars={5} />
                <span className="text-[11px] text-violet-300 font-medium">Speaking Yoruba</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl bg-cyan-600/10 border border-cyan-500/20">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center font-bold">B</div>
                  <span className="absolute -bottom-1 -right-1 text-sm">🇬🇧</span>
                </div>
                <Waveform color="#67e8f9" bars={5} />
                <span className="text-[11px] text-cyan-300 font-medium">Hearing English</span>
              </div>
            </div>
            <div className="mt-3 px-3 py-2.5 rounded-lg bg-black/30 border border-white/[0.06] flex items-center gap-2">
              <span className="text-xs text-white/30 flex-shrink-0">Translated:</span>
              <span className="text-xs text-white/70 italic truncate">"Hello, can you hear me clearly?"</span>
              <span className="ml-auto text-[10px] text-violet-400 whitespace-nowrap">~1.2s</span>
            </div>
          </div>

          {/* language pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8 px-2">
            {[
              {flag:"🇳🇬",lang:"Yoruba",delay:0},
              {flag:"🇳🇬",lang:"Hausa",delay:0.4},
              {flag:"🇬🇧",lang:"English",delay:0.8},
              {flag:"🇳🇬",lang:"Igbo",delay:1.2},
              {flag:"🇳🇬",lang:"Pidgin",delay:1.6},
              {flag:"🇫🇷",lang:"French",delay:2.0},
            ].map(l => <LangPill key={l.lang} {...l} />)}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how" className="px-5 sm:px-10 py-16 sm:py-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-violet-400 text-xs font-medium uppercase tracking-widest mb-3">The flow</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">A call in 4 steps</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            <Step num="01" title="Start a call" body="Click 'Start a free call' — Voxa instantly creates a unique call room for you." delay={0} />
            <Step num="02" title="Share your link" body="Copy your call link and send it to whoever you want to speak with." delay={100} />
            <Step num="03" title="Each person picks a language" body="You pick yours, they pick theirs. No overlap needed — Voxa handles the gap." delay={200} />
            <Step num="04" title="Talk naturally" body="Speak as you normally would. The other person hears your voice in their language within ~1–2 seconds." delay={300} />
          </div>
        </section>

        {/* FEATURES */}
        <section className="px-5 sm:px-10 py-16 sm:py-20 max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-cyan-400 text-xs font-medium uppercase tracking-widest mb-3">Why Voxa</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Built for real conversations</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <FeatureCard icon="⚡" title="~1 second delay"        body="Streaming AI keeps translation tight enough that the conversation flows naturally."     accent="#a78bfa" />
            <FeatureCard icon="🔗" title="Link-based joins"       body="Share a URL — no app download, no account required for either person."                 accent="#67e8f9" />
            <FeatureCard icon="🌍" title="African-language first" body="Yoruba, Hausa, Igbo, and Pidgin are first-class — not afterthoughts."                  accent="#34d399" />
            <FeatureCard icon="🎙️" title="Voice only"             body="No chat box, no typing. Just speak and listen like a normal phone call."               accent="#fb923c" />
            <FeatureCard icon="🔒" title="Private by design"      body="Calls are peer-to-peer. Nothing is stored or recorded after the call ends."            accent="#f472b6" />
            <FeatureCard icon="📶" title="Works on slow networks" body="Compressed audio streaming keeps quality high even on 3G."                             accent="#facc15" />
          </div>
        </section>

        {/* CTA BANNER */}
        <section className="px-5 sm:px-10 py-16 sm:py-24 flex justify-center">
          <div className="relative w-full max-w-3xl rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/60 via-[#0d0820] to-cyan-950/40 p-8 sm:p-12 text-center overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[380px] h-[380px] rounded-full border border-violet-500/10" />
            </div>
            <p className="text-violet-300 text-xs font-medium uppercase tracking-widest mb-3">Ready?</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Start talking across languages
            </h2>
            <p className="text-white/50 mb-7 max-w-xs mx-auto text-sm sm:text-base">No sign-up. No install. Just a link and a conversation.</p>
            <Link href="/onboarding"
              className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 hover:scale-105 active:scale-100 transition-all text-white font-semibold px-8 py-4 rounded-full text-base sm:text-lg shadow-lg shadow-violet-900/40">
              Start a free call
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
            </Link>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-white/[0.06] px-5 sm:px-10 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-white/30 text-sm">
          <span className="font-display font-bold text-white/50"><span className="text-violet-400">V</span>oxa</span>
          <span className="text-xs">© {new Date().getFullYear()} Voxa. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
          </div>
        </footer>
      </div>
    </>
  );
}