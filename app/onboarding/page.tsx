/**
 * app/call/[roomId]/page.tsx
 *
 * URL params:
 *   role — "caller" | "callee"
 *   lang — language code e.g. "en", "yo"
 *
 * When someone opens /call/[roomId] with NO params
 * (i.e. they got a share link) → redirect to onboarding
 * so they can pick their language first.
 */

"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useVoxaCall, type CallStatus } from "@/hooks/useVoxaCall";

/* ─── Language map ─── */
const LANG: Record<string, { name: string; flag: string }> = {
  yo: { name: "Yoruba",  flag: "🇳🇬" },
  ha: { name: "Hausa",   flag: "🇳🇬" },
  ig: { name: "Igbo",    flag: "🇳🇬" },
  pc: { name: "Pidgin",  flag: "🇳🇬" },
  en: { name: "English", flag: "🇬🇧" },
  fr: { name: "French",  flag: "🇫🇷" },
  ar: { name: "Arabic",  flag: "🇸🇦" },
  sw: { name: "Swahili", flag: "🇰🇪" },
};

/* ─── Waveform ─── */
function Waveform({ active, color, bars = 8 }: { active: boolean; color: string; bars?: number }) {
  return (
    <div className="flex items-end gap-[3px] h-10">
      {Array.from({ length: bars }).map((_, i) => (
        <div key={i} className="rounded-full transition-all"
          style={{
            width: "4px",
            background: color,
            height: active ? `${28 + Math.abs(Math.sin(i * 0.9)) * 70}%` : "14%",
            opacity: active ? 1 : 0.2,
            animation: active
              ? `waveBar ${0.7 + (i % 3) * 0.2}s ease-in-out ${i * 0.09}s infinite alternate`
              : "none",
          }}
        />
      ))}
    </div>
  );
}

/* ─── Avatar ─── */
function Avatar({ label, gradient, speaking }: { label: string; gradient: string; speaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {speaking && (
        <>
          <div className="absolute rounded-full" style={{ inset: "-10px", background: gradient, opacity: 0.12, animation: "pulseRing 1.4s ease-out infinite" }} />
          <div className="absolute rounded-full" style={{ inset: "-5px",  background: gradient, opacity: 0.08, animation: "pulseRing 1.4s ease-out 0.35s infinite" }} />
        </>
      )}
      <div className="w-20 h-20 rounded-full flex items-center justify-center font-display font-bold text-white text-lg" style={{ background: gradient }}>
        {label}
      </div>
    </div>
  );
}

/* ─── Control button ─── */
function CtrlBtn({ icon, label, active, danger, onClick }: {
  icon: React.ReactNode; label: string;
  active?: boolean; danger?: boolean; onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
        danger ? "bg-red-600 hover:bg-red-500 shadow-lg shadow-red-900/40"
        : active ? "bg-violet-600/30 border border-violet-400/40 hover:bg-violet-600/50"
        : "bg-white/[0.07] border border-white/10 hover:bg-white/[0.14]"
      }`}>
        {icon}
      </div>
      <span className="text-[11px] text-white/40 group-hover:text-white/70 transition-colors">{label}</span>
    </button>
  );
}

/* ════════════════════════════════════════
   INNER CALL ROOM
════════════════════════════════════════ */
function CallRoomInner() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();

  const roomId = params.roomId as string;
  const role   = (searchParams.get("role") ?? "") as "caller" | "callee";
  const lang   = searchParams.get("lang") ?? "en";

  /* If no role/lang — this is someone opening the share link directly.
     Redirect to onboarding so they can pick their language. */
  useEffect(() => {
    if (!role || !lang) {
      router.replace(`/onboarding?roomId=${roomId}&role=callee`);
    }
  }, [role, lang, roomId, router]);

  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [duration,     setDuration]     = useState(0);
  const [copied,       setCopied]       = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [activeLang,   setActiveLang]   = useState(lang);

  /* ── WebRTC hook ── */
  const call = useVoxaCall({
    roomId,
    role,
    onRemoteStream: (stream) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(console.error);
      }
    },
  });

  /* ── Start call on mount ── */
  useEffect(() => {
    if (!role || !lang) return;
    if (role === "caller") call.start();
    else                   call.join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  /* ── Duration timer ── */
  useEffect(() => {
    if (call.status !== "connected") return;
    const t = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, [call.status]);

  const fmt = useCallback((s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    return `${m}:${(s % 60).toString().padStart(2, "0")}`;
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.origin + `/call/${roomId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleEndCall() {
    setShowEndModal(false);
    await call.hangup();
  }

  const myLang = LANG[activeLang] ?? LANG.en;
  const isConnected = call.status === "connected";
  const isWaiting   = call.status === "waiting" || call.status === "connecting" || call.status === "requesting-mic";

  /* ── Ended screen ── */
  if (call.status === "ended") {
    return (
      <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-4xl mx-auto mb-6">📞</div>
        <h1 className="font-display text-3xl font-bold mb-2">Call ended</h1>
        <p className="text-white/40 text-sm mb-8">Duration · {fmt(duration)}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <a href="/onboarding" className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3.5 rounded-2xl transition-all">
            Start a new call
          </a>
          <a href="/" className="w-full flex items-center justify-center border border-white/10 hover:border-white/20 text-white/60 hover:text-white py-3.5 rounded-2xl transition-all text-sm">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  /* ── Error screen ── */
  if (call.status === "error") {
    return (
      <div className="min-h-screen bg-[#05050A] flex flex-col items-center justify-center px-6 text-center">
        <div className="text-4xl mb-4">🎙️</div>
        <h1 className="font-display text-2xl font-bold mb-2">Mic access needed</h1>
        <p className="text-white/40 text-sm mb-6 max-w-xs">{call.error}</p>
        <button onClick={() => window.location.reload()} className="bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-full transition-all">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col">
      {/* hidden audio element for remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <span className="font-display font-bold text-lg"><span className="text-violet-400">V</span>oxa</span>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] text-xs">
          {isWaiting ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /><span className="text-amber-300">Waiting for other person…</span></>
          ) : isConnected ? (
            <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span className="text-emerald-300">Live · {fmt(duration)}</span></>
          ) : (
            <><span className="w-1.5 h-1.5 rounded-full bg-white/30" /><span className="text-white/40">Connecting…</span></>
          )}
        </div>

        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 transition-colors">
          {copied ? (
            <><svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-emerald-400">Copied</span></>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>Share link</>
          )}
        </button>
      </header>

      {/* ── Speakers ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">

          {isWaiting ? (
            /* waiting state */
            <div className="text-center animate-fade-up">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center font-display font-bold text-xl">You</div>
              <h2 className="font-display text-xl font-bold mb-2">Waiting for someone to join…</h2>
              <p className="text-white/40 text-sm mb-6">Share the link above — they'll appear here.</p>
              <div className="flex items-center justify-center gap-2">
                {[0,1,2].map((i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-violet-400"
                    style={{ animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite` }}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* connected — two speakers */
            <div className="grid grid-cols-2 gap-4">
              {/* YOU */}
              <div className={`flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all duration-500 ${
                call.isMuted ? "border-white/[0.07] bg-white/[0.03] opacity-60"
                : "border-violet-500/30 bg-violet-600/10"
              }`}>
                <Avatar label="You" gradient="linear-gradient(135deg,#7c3aed,#c026d3)" speaking={!call.isMuted} />
                <Waveform active={!call.isMuted} color="#a78bfa" />
                <div className="text-center">
                  <p className="text-xs text-white/40 mb-0.5">Speaking</p>
                  <p className="text-sm font-semibold">{myLang.flag} {myLang.name}</p>
                </div>
                {call.isMuted && <span className="text-xs text-red-400">Muted</span>}
              </div>

              {/* THEM */}
              <div className={`flex flex-col items-center gap-4 p-6 rounded-3xl border transition-all duration-500 ${
                call.remoteStream ? "border-cyan-500/30 bg-cyan-600/10" : "border-white/[0.07] bg-white/[0.03] opacity-50"
              }`}>
                <Avatar label="Them" gradient="linear-gradient(135deg,#0891b2,#0e7490)" speaking={!!call.remoteStream} />
                <Waveform active={!!call.remoteStream} color="#67e8f9" />
                <div className="text-center">
                  <p className="text-xs text-white/40 mb-0.5">{call.remoteStream ? "Connected" : "Waiting…"}</p>
                  <p className="text-sm font-semibold">{call.remoteStream ? "Their language" : "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* translation badge */}
          {isConnected && (
            <div className="mt-5 flex items-center justify-center gap-2 py-2 px-4 rounded-full border border-white/[0.07] bg-white/[0.03] text-xs text-white/40 mx-auto w-fit animate-fade-up">
              <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              AI translating in real time · ~1s delay
            </div>
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="border-t border-white/[0.06] px-6 py-5 flex items-center justify-center gap-8 md:gap-12">

        {/* Mute */}
        <CtrlBtn
          active={call.isMuted}
          onClick={call.toggleMute}
          label={call.isMuted ? "Unmute" : "Mute"}
          icon={call.isMuted ? (
            <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5v14a1 1 0 01-1.707.707L5.586 15z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )}
        />

        {/* Language switcher */}
        <div className="relative">
          <CtrlBtn
            onClick={() => setLangMenuOpen((o) => !o)}
            label="Language"
            icon={<span className="text-xl">{myLang.flag}</span>}
          />
          {langMenuOpen && (
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-44 rounded-2xl border border-white/10 bg-[#0f0f1a] shadow-2xl overflow-hidden z-50 animate-scale-in">
              <p className="text-[10px] text-white/30 uppercase tracking-widest px-3 pt-3 pb-1">Switch language</p>
              {Object.entries(LANG).map(([code, { name, flag }]) => (
                <button key={code}
                  onClick={() => { setActiveLang(code); setLangMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-white/[0.07] transition-colors text-left ${code === activeLang ? "text-violet-300" : "text-white/70"}`}
                >
                  <span>{flag}</span><span>{name}</span>
                  {code === activeLang && (
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
        <CtrlBtn danger onClick={() => setShowEndModal(true)} label="End call"
          icon={
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          }
        />
      </div>

      {/* ── End modal ── */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-5">
          <div className="w-full max-w-sm bg-[#0f0f1a] border border-white/10 rounded-3xl p-7 text-center animate-scale-in">
            <div className="w-14 h-14 rounded-full bg-red-600/15 border border-red-500/20 flex items-center justify-center text-2xl mx-auto mb-4">📵</div>
            <h2 className="font-display font-bold text-xl mb-2">End this call?</h2>
            <p className="text-white/40 text-sm mb-6">The other person will be disconnected.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowEndModal(false)}
                className="flex-1 py-3 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all text-sm font-medium">
                Keep talking
              </button>
              <button onClick={handleEndCall}
                className="flex-1 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-all">
                End call
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   PAGE EXPORT
════════════════════════════════════════ */
export default function CallPage() {
  return (
    <>
      <style>{`
        @keyframes waveBar  { from{transform:scaleY(0.3);opacity:0.5} to{transform:scaleY(1);opacity:1} }
        @keyframes pulseRing{ 0%{transform:scale(0.95);opacity:0.5} 100%{transform:scale(1.45);opacity:0} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn  { from{opacity:0;transform:scale(0.94)} to{opacity:1;transform:scale(1)} }
        @keyframes dotBounce{ 0%,100%{transform:translateY(0);opacity:0.35} 50%{transform:translateY(-7px);opacity:1} }
        .font-display     { font-family: var(--font-syne), sans-serif; }
        .animate-fade-up  { animation: fadeUp  0.5s cubic-bezier(.22,1,.36,1) both; }
        .animate-scale-in { animation: scaleIn 0.35s cubic-bezier(.22,1,.36,1) both; }
      `}</style>
      <Suspense fallback={
        <div className="min-h-screen bg-[#05050A] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
        </div>
      }>
        <CallRoomInner />
      </Suspense>
    </>
  );
}