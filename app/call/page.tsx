"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";

/* ─── Types ─── */
type CallState = "waiting" | "connected" | "ended";
type Speaker = "you" | "them" | null;

/* ─── Language map ─── */
const LANGUAGES: Record<string, { name: string; flag: string }> = {
  yo: { name: "Yoruba",  flag: "🇳🇬" },
  ha: { name: "Hausa",   flag: "🇳🇬" },
  ig: { name: "Igbo",    flag: "🇳🇬" },
  pc: { name: "Pidgin",  flag: "🇳🇬" },
  en: { name: "English", flag: "🇬🇧" },
  fr: { name: "French",  flag: "🇫🇷" },
  ar: { name: "Arabic",  flag: "🇸🇦" },
  sw: { name: "Swahili", flag: "🇰🇪" },
};

/* ─── Mock translated captions ─── */
const MOCK_CAPTIONS = [
  { from: "them", original: "E kaaro, bawo ni e se wa?",       translated: "Good morning, how are you?" },
  { from: "you",  original: "I'm good, thanks! Can you hear me clearly?", translated: "Mo wa daadaa, e dupe! Nje e le gbo mi daradara?" },
  { from: "them", original: "Beeni, mo le gbo e daadara.",     translated: "Yes, I can hear you clearly." },
  { from: "you",  original: "Great! Let's talk about the project.", translated: "O dara! Jeki a soro nipa iṣẹ naa." },
  { from: "them", original: "Iṣẹ naa n lo daradara.",          translated: "The project is going well." },
];

/* ─── Animated waveform ─── */
function Waveform({
  active,
  color,
  bars = 9,
  size = "md",
}: {
  active: boolean;
  color: string;
  bars?: number;
  size?: "sm" | "md" | "lg";
}) {
  const heights = { sm: "h-5", md: "h-8", lg: "h-14" };
  return (
    <div className={`flex items-end gap-[3px] ${heights[size]}`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all"
          style={{
            width: size === "lg" ? "5px" : size === "md" ? "4px" : "3px",
            background: color,
            height: active ? `${30 + Math.abs(Math.sin(i * 0.9)) * 70}%` : "15%",
            opacity: active ? 1 : 0.2,
            animation: active
              ? `waveBar ${0.7 + (i % 3) * 0.2}s ease-in-out ${i * 0.08}s infinite alternate`
              : "none",
            transition: "height 0.3s ease, opacity 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Avatar circle ─── */
function Avatar({
  label,
  gradient,
  speaking,
  size = "lg",
}: {
  label: string;
  gradient: string;
  speaking: boolean;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "w-24 h-24 text-2xl" : "w-14 h-14 text-base";
  return (
    <div className="relative flex items-center justify-center">
      {/* pulse ring */}
      {speaking && (
        <>
          <div
            className="absolute rounded-full"
            style={{
              inset: "-10px",
              background: gradient,
              opacity: 0.15,
              animation: "pulseRing 1.4s ease-out infinite",
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              inset: "-5px",
              background: gradient,
              opacity: 0.1,
              animation: "pulseRing 1.4s ease-out 0.35s infinite",
            }}
          />
        </>
      )}
      <div
        className={`relative rounded-full flex items-center justify-center font-display font-bold text-white ${dim}`}
        style={{ background: gradient }}
      >
        {label}
      </div>
    </div>
  );
}

/* ─── Caption bubble ─── */
function CaptionBubble({
  text,
  translated,
  isYou,
  delay,
}: {
  text: string;
  translated: string;
  isYou: boolean;
  delay: number;
}) {
  return (
    <div
      className={`flex flex-col ${isYou ? "items-end" : "items-start"} gap-1`}
      style={{ animation: `fadeUp 0.4s ${delay}ms both cubic-bezier(.22,1,.36,1)` }}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
          isYou
            ? "bg-violet-600/30 border border-violet-500/30 text-white rounded-br-sm"
            : "bg-white/[0.07] border border-white/10 text-white/80 rounded-bl-sm"
        }`}
      >
        {text}
      </div>
      <div className={`text-[11px] text-white/30 px-1 flex items-center gap-1.5`}>
        <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
        </svg>
        {translated}
      </div>
    </div>
  );
}

/* ─── Control button ─── */
function CtrlBtn({
  icon,
  label,
  active,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 group transition-all duration-200`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
          danger
            ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/40"
            : active
            ? "bg-violet-600/30 border border-violet-400/40 hover:bg-violet-600/50"
            : "bg-white/[0.07] border border-white/10 hover:bg-white/[0.14]"
        }`}
      >
        {icon}
      </div>
      <span className="text-[11px] text-white/40 group-hover:text-white/60 transition-colors">{label}</span>
    </button>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function CallPage() {
  const [callState, setCallState] = useState<CallState>("waiting");
  const [speaking, setSpeaking] = useState<Speaker>(null);
  const [muted, setMuted] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [captions, setCaptions] = useState<typeof MOCK_CAPTIONS>([]);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [myLang, setMyLang] = useState("en");
  const [showEndModal, setShowEndModal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const captionIdx = useRef(0);
  const captionsEndRef = useRef<HTMLDivElement>(null);

  /* simulate the other person joining after 3s */
  useEffect(() => {
    const t = setTimeout(() => setCallState("connected"), 3000);
    return () => clearTimeout(t);
  }, []);

  /* duration timer */
  useEffect(() => {
    if (callState === "connected") {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  /* simulate speaking + captions */
  useEffect(() => {
    if (callState !== "connected") return;
    const cycle = () => {
      const cap = MOCK_CAPTIONS[captionIdx.current % MOCK_CAPTIONS.length];
      setSpeaking(cap.from === "you" ? "you" : "them");
      if (captionsOn) {
        setCaptions((prev) => [...prev.slice(-6), cap]);
      }
      captionIdx.current += 1;
      setTimeout(() => setSpeaking(null), 2200);
    };
    cycle();
    captionRef.current = setInterval(cycle, 4000);
    return () => { if (captionRef.current) clearInterval(captionRef.current); };
  }, [callState, captionsOn]);

  /* scroll captions to bottom */
  useEffect(() => {
    captionsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [captions]);

  const formatDuration = useCallback((s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEndCall() {
    setShowEndModal(false);
    setCallState("ended");
    if (timerRef.current) clearInterval(timerRef.current);
    if (captionRef.current) clearInterval(captionRef.current);
    setSpeaking(null);
  }

  const myLangObj = LANGUAGES[myLang];

  /* ── ENDED screen ── */
  if (callState === "ended") {
    return (
      <>
        <style>{keyframes}</style>
        <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center px-6 font-display">
          <div className="text-center animate-scale-in max-w-sm">
            <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl mx-auto mb-6">
              📞
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Call ended</h1>
            <p className="text-white/40 text-sm mb-1">Duration · {formatDuration(duration)}</p>
            <p className="text-white/25 text-xs mb-10">
              {captions.length} translated exchanges
            </p>
            <div className="flex flex-col gap-3 w-full">
              <Link
                href="/onboarding"
                className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3.5 rounded-2xl transition-all"
              >
                Start a new call
              </Link>
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 text-white/60 hover:text-white py-3.5 rounded-2xl transition-all text-sm"
              >
                Back to home
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{keyframes}</style>
      <div className="min-h-screen bg-[#05050A] flex flex-col overflow-hidden">

        {/* ── Top bar ── */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <span className="font-display font-bold text-lg tracking-tight">
            <span className="text-violet-400">V</span>oxa
          </span>

          {/* status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-xs">
            {callState === "waiting" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300">Waiting for other person…</span>
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300">Live · {formatDuration(duration)}</span>
              </>
            )}
          </div>

          {/* share link */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            {copied ? (
              <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400">Copied</span></>
            ) : (
              <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>Share link</>
            )}
          </button>
        </header>

        {/* ── Main call area ── */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">

          {/* ── Speakers panel ── */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8 relative">

            {/* ambient glow */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] rounded-full blur-[120px] transition-all duration-1000"
                style={{
                  background:
                    speaking === "you"
                      ? "radial-gradient(ellipse, rgba(124,58,237,0.2) 0%, transparent 70%)"
                      : speaking === "them"
                      ? "radial-gradient(ellipse, rgba(6,182,212,0.15) 0%, transparent 70%)"
                      : "radial-gradient(ellipse, rgba(255,255,255,0.03) 0%, transparent 70%)",
                }}
              />
            </div>

            {callState === "waiting" ? (
              /* Waiting state */
              <div className="text-center animate-fade-up">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-2xl font-bold font-display">
                    You
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-2 border-[#05050A] bg-white/10 flex items-center justify-center">
                    <span className="text-sm">{myLangObj.flag}</span>
                  </div>
                </div>
                <h2 className="font-display text-xl font-bold mb-2">Waiting for someone to join…</h2>
                <p className="text-white/40 text-sm mb-6">Share the link above — they'll appear here once connected.</p>
                <div className="flex items-center justify-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-violet-400"
                      style={{ animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* Connected — two speakers */
              <div className="w-full max-w-xl flex flex-col gap-6">

                {/* Speaker cards */}
                <div className="grid grid-cols-2 gap-4">
                  {/* YOU */}
                  <div className={`flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all duration-500 ${
                    speaking === "you"
                      ? "border-violet-500/40 bg-violet-600/10"
                      : "border-white/[0.07] bg-white/[0.03]"
                  }`}>
                    <Avatar
                      label="You"
                      gradient="linear-gradient(135deg,#7c3aed,#c026d3)"
                      speaking={speaking === "you"}
                    />
                    <Waveform active={speaking === "you" && !muted} color="#a78bfa" size="md" />
                    <div className="text-center">
                      <p className="text-xs text-white/40 mb-0.5">Speaking</p>
                      <p className="text-sm font-semibold">{myLangObj.flag} {myLangObj.name}</p>
                    </div>
                    {muted && (
                      <span className="text-[11px] text-red-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                        Muted
                      </span>
                    )}
                  </div>

                  {/* THEM */}
                  <div className={`flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all duration-500 ${
                    speaking === "them"
                      ? "border-cyan-500/40 bg-cyan-600/10"
                      : "border-white/[0.07] bg-white/[0.03]"
                  }`}>
                    <Avatar
                      label="Ade"
                      gradient="linear-gradient(135deg,#0891b2,#0e7490)"
                      speaking={speaking === "them"}
                    />
                    <Waveform active={speaking === "them"} color="#67e8f9" size="md" />
                    <div className="text-center">
                      <p className="text-xs text-white/40 mb-0.5">Speaking</p>
                      <p className="text-sm font-semibold">🇳🇬 Yoruba</p>
                    </div>
                  </div>
                </div>

                {/* Translation indicator */}
                {speaking && (
                  <div
                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-full border border-white/[0.07] bg-white/[0.03] text-xs text-white/40 mx-auto"
                    style={{ animation: "fadeUp 0.3s both" }}
                  >
                    <svg className="w-3.5 h-3.5 text-violet-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Translating {speaking === "you" ? myLangObj.name : "Yoruba"} → {speaking === "you" ? "Yoruba" : myLangObj.name}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Captions panel ── */}
          {captionsOn && callState === "connected" && (
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-white/[0.06] flex flex-col">
              <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Live captions</span>
                <span className="text-[10px] text-white/20">Auto-translated</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 max-h-72 lg:max-h-none">
                {captions.length === 0 && (
                  <p className="text-white/20 text-xs text-center mt-8">Captions will appear here as people speak…</p>
                )}
                {captions.map((cap, i) => (
                  <CaptionBubble
                    key={i}
                    text={cap.original}
                    translated={cap.translated}
                    isYou={cap.from === "you"}
                    delay={0}
                  />
                ))}
                <div ref={captionsEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* ── Controls bar ── */}
        <div className="border-t border-white/[0.06] px-6 py-5 flex items-center justify-center gap-6 md:gap-10">

          {/* Mute */}
          <CtrlBtn
            active={muted}
            onClick={() => setMuted((m) => !m)}
            label={muted ? "Unmute" : "Mute"}
            icon={
              muted ? (
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              )
            }
          />

          {/* Captions toggle */}
          <CtrlBtn
            active={captionsOn}
            onClick={() => setCaptionsOn((c) => !c)}
            label="Captions"
            icon={
              <svg className={`w-6 h-6 ${captionsOn ? "text-violet-300" : "text-white/70"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
            }
          />

          {/* Language switcher */}
          <div className="relative">
            <CtrlBtn
              onClick={() => setLangMenuOpen((o) => !o)}
              label="Language"
              icon={
                <span className="text-xl">{myLangObj.flag}</span>
              }
            />
            {langMenuOpen && (
              <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-44 rounded-2xl border border-white/10 bg-[#0f0f1a] shadow-2xl overflow-hidden z-50 animate-scale-in">
                <p className="text-[10px] text-white/30 uppercase tracking-widest px-3 pt-3 pb-1">Switch language</p>
                {Object.entries(LANGUAGES).map(([code, { name, flag }]) => (
                  <button
                    key={code}
                    onClick={() => { setMyLang(code); setLangMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/[0.07] transition-colors text-left ${code === myLang ? "text-violet-300" : "text-white/70"}`}
                  >
                    <span>{flag}</span>
                    <span>{name}</span>
                    {code === myLang && (
                      <svg className="w-3.5 h-3.5 ml-auto text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* End call */}
          <CtrlBtn
            danger
            onClick={() => setShowEndModal(true)}
            label="End call"
            icon={
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
              </svg>
            }
          />
        </div>

        {/* ── End call modal ── */}
        {showEndModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5">
            <div className="w-full max-w-sm bg-[#0f0f1a] border border-white/10 rounded-3xl p-7 text-center animate-scale-in">
              <div className="w-14 h-14 rounded-full bg-red-600/15 border border-red-500/20 flex items-center justify-center text-2xl mx-auto mb-4">📵</div>
              <h2 className="font-display font-bold text-xl mb-2">End this call?</h2>
              <p className="text-white/40 text-sm mb-6">The other person will be disconnected and captions won't be saved.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEndModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm font-medium"
                >
                  Keep talking
                </button>
                <button
                  onClick={handleEndCall}
                  className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all"
                >
                  End call
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Keyframes ─── */
const keyframes = `
  @keyframes waveBar {
    from { transform: scaleY(0.3); opacity: 0.5; }
    to   { transform: scaleY(1);   opacity: 1;   }
  }
  @keyframes pulseRing {
    0%   { transform: scale(0.95); opacity: 0.5; }
    100% { transform: scale(1.4);  opacity: 0;   }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.94); }
    to   { opacity: 1; transform: scale(1);    }
  }
  @keyframes dotBounce {
    0%, 100% { transform: translateY(0);    opacity: 0.4; }
    50%       { transform: translateY(-6px); opacity: 1;   }
  }
  .font-display { font-family: var(--font-syne), sans-serif; }
  .animate-fade-up  { animation: fadeUp  0.5s cubic-bezier(.22,1,.36,1) both; }
  .animate-scale-in { animation: scaleIn 0.35s cubic-bezier(.22,1,.36,1) both; }
`;