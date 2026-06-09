"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ─── Types ─── */
type Step = "role" | "language" | "ready";
type Role = "create" | "join";

/* ─── Language data ─── */
const LANGUAGES = [
  { code: "yo", name: "Yoruba",  flag: "🇳🇬", region: "West Africa" },
  { code: "ha", name: "Hausa",   flag: "🇳🇬", region: "West Africa" },
  { code: "ig", name: "Igbo",    flag: "🇳🇬", region: "West Africa" },
  { code: "pc", name: "Pidgin",  flag: "🇳🇬", region: "West Africa" },
  { code: "en", name: "English", flag: "🇬🇧", region: "Global"      },
  { code: "fr", name: "French",  flag: "🇫🇷", region: "Global"      },
  { code: "ar", name: "Arabic",  flag: "🇸🇦", region: "Middle East" },
  { code: "sw", name: "Swahili", flag: "🇰🇪", region: "East Africa" },
];

/* ─── fake link generator ─── */
function generateLink() {
  const id = Math.random().toString(36).slice(2, 9);
  return `https://voxa.app/call/${id}`;
}

/* ─── Waveform animation ─── */
function Waveform({ active, color }: { active: boolean; color: string }) {
  return (
    <span className="inline-flex items-end gap-[3px] h-4">
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="w-[3px] rounded-full transition-all"
          style={{
            background: color,
            height: active ? `${35 + Math.sin(i * 1.3) * 40}%` : "20%",
            opacity: active ? 1 : 0.3,
            animation: active
              ? `waveBar 0.9s ease-in-out ${i * 0.13}s infinite alternate`
              : "none",
          }}
        />
      ))}
    </span>
  );
}

/* ─── Progress dots ─── */
function ProgressDots({ step }: { step: Step }) {
  const steps: Step[] = ["role", "language", "ready"];
  const idx = steps.indexOf(step);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className="transition-all duration-500 rounded-full"
            style={{
              width: i === idx ? "24px" : "8px",
              height: "8px",
              background:
                i < idx
                  ? "#7c3aed"
                  : i === idx
                  ? "linear-gradient(90deg,#7c3aed,#06b6d4)"
                  : "rgba(255,255,255,0.15)",
            }}
          />
          {i < steps.length - 1 && (
            <div
              className="w-6 h-px transition-all duration-500"
              style={{ background: i < idx ? "#7c3aed" : "rgba(255,255,255,0.1)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════ */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [selectedLang, setSelectedLang] = useState<string | null>(null);
  const [callLink, setCallLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCallLink(generateLink());
  }, []);

  function handleRoleSelect(r: Role) {
    setRole(r);
    setTimeout(() => setStep("language"), 300);
  }

  function handleLangSelect(code: string) {
    setSelectedLang(code);
    setTimeout(() => setStep("ready"), 300);
  }

  function handleBack() {
    if (step === "language") setStep("role");
    if (step === "ready") setStep("language");
  }

  function handleCopy() {
    navigator.clipboard.writeText(callLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function handleEnterCall() {
    router.push("/call");
  }

  const selectedLangObj = LANGUAGES.find((l) => l.code === selectedLang);

  return (
    <>
      <style>{`
        @keyframes waveBar {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1);   }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1);    }
        }
        .font-display { font-family: var(--font-syne), sans-serif; }
        .animate-fade-up  { animation: fadeUp  0.45s cubic-bezier(.22,1,.36,1) both; }
        .animate-scale-in { animation: scaleIn 0.35s cubic-bezier(.22,1,.36,1) both; }
        .lang-card:hover  { transform: translateY(-2px); }
      `}</style>

      <div className="min-h-screen bg-[#05050A] flex flex-col">

        {/* ── Top bar ── */}
        <header className="flex items-center justify-between px-6 md:px-10 py-5 border-b border-white/[0.06]">
          <a href="/" className="font-display font-bold text-xl tracking-tight">
            <span className="text-violet-400">V</span>oxa
          </a>
          <ProgressDots step={step} />
          {step !== "role" && (
            <button
              onClick={handleBack}
              className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          {step === "role" && <div className="w-14" />}
        </header>

        {/* ── Main content ── */}
        <main className="flex-1 flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-lg">

            {/* ════════ STEP 1 — ROLE ════════ */}
            {step === "role" && (
              <div className="animate-fade-up" key="role">
                {/* ambient glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <div className="w-[500px] h-[400px] rounded-full bg-violet-700/15 blur-[100px]" />
                </div>

                <p className="text-violet-400 text-sm font-medium uppercase tracking-widest mb-3 text-center">
                  Get started
                </p>
                <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight text-center mb-3 leading-tight">
                  What would you like to do?
                </h1>
                <p className="text-white/40 text-center mb-10 text-sm">
                  No account needed — just pick and go.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Create */}
                  <button
                    onClick={() => handleRoleSelect("create")}
                    className="group relative p-6 rounded-2xl border border-violet-500/25 bg-violet-600/10 hover:bg-violet-600/20 hover:border-violet-400/40 transition-all duration-200 text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200">
                      🔗
                    </div>
                    <h2 className="font-display font-bold text-lg mb-1 text-white">
                      Start a call
                    </h2>
                    <p className="text-white/45 text-sm leading-relaxed">
                      Create a link and share it with whoever you want to speak with.
                    </p>
                    <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </button>

                  {/* Join */}
                  <button
                    onClick={() => handleRoleSelect("join")}
                    className="group relative p-6 rounded-2xl border border-cyan-500/25 bg-cyan-600/10 hover:bg-cyan-600/20 hover:border-cyan-400/40 transition-all duration-200 text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-600/20 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform duration-200">
                      🎙️
                    </div>
                    <h2 className="font-display font-bold text-lg mb-1 text-white">
                      Join a call
                    </h2>
                    <p className="text-white/45 text-sm leading-relaxed">
                      Someone sent you a Voxa link. Join and set your language.
                    </p>
                    <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* ════════ STEP 2 — LANGUAGE ════════ */}
            {step === "language" && (
              <div className="animate-fade-up" key="language">
                <p className="text-cyan-400 text-sm font-medium uppercase tracking-widest mb-3 text-center">
                  Your language
                </p>
                <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-center mb-2">
                  Which language do you speak?
                </h1>
                <p className="text-white/40 text-center text-sm mb-8">
                  Voxa will translate everything you say into the other person's language.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {LANGUAGES.map((lang, i) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLangSelect(lang.code)}
                      className="lang-card group flex flex-col items-center gap-2 p-4 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.08] hover:border-violet-500/40 transition-all duration-200"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <span className="text-3xl">{lang.flag}</span>
                      <span className="text-sm font-semibold text-white">{lang.name}</span>
                      <span className="text-[10px] text-white/30">{lang.region}</span>
                    </button>
                  ))}
                </div>

                <p className="text-center text-white/25 text-xs mt-6">
                  More languages coming soon — Twi, Zulu, Amharic & more
                </p>
              </div>
            )}

            {/* ════════ STEP 3 — READY ════════ */}
            {step === "ready" && mounted && (
              <div className="animate-scale-in" key="ready">
                {/* glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                  <div className="w-[400px] h-[400px] rounded-full bg-emerald-700/10 blur-[100px]" />
                </div>

                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-3xl mb-5">
                    ✅
                  </div>
                  <p className="text-emerald-400 text-sm font-medium uppercase tracking-widest mb-2">
                    You're set
                  </p>
                  <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2">
                    {role === "create" ? "Your call is ready" : "Ready to join"}
                  </h1>
                  <p className="text-white/45 text-sm">
                    Speaking in{" "}
                    <span className="text-white font-medium">
                      {selectedLangObj?.flag} {selectedLangObj?.name}
                    </span>
                    {" "}— Voxa handles the rest.
                  </p>
                </div>

                {/* Voice preview */}
                <div className="flex items-center justify-center gap-4 mb-8 p-4 rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-bold">
                      You
                    </div>
                    <div>
                      <p className="text-xs text-white/40 mb-1">You speak</p>
                      <p className="text-sm font-semibold">{selectedLangObj?.flag} {selectedLangObj?.name}</p>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center gap-1 px-4">
                    <Waveform active color="#a78bfa" />
                    <div className="w-8 h-px bg-gradient-to-r from-violet-400 to-cyan-400 mx-1" />
                    <Waveform active color="#67e8f9" />
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-white/40 mb-1 text-right">They hear</p>
                      <p className="text-sm font-semibold text-right">Their language</p>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-sky-600 flex items-center justify-center text-sm font-bold">
                      AI
                    </div>
                  </div>
                </div>

                {/* Link box — only for creator */}
                {role === "create" && (
                  <div className="mb-5 p-4 rounded-2xl border border-white/10 bg-white/[0.04]">
                    <p className="text-xs text-white/40 mb-2 font-medium uppercase tracking-wider">Share this link</p>
                    <div className="flex items-center gap-3">
                      <p className="flex-1 text-sm text-white/70 font-mono truncate">{callLink}</p>
                      <button
                        onClick={handleCopy}
                        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/15 transition-colors text-xs font-medium text-white/70 hover:text-white"
                      >
                        {copied ? (
                          <>
                            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-white/25 mt-2">
                      Send this to the person you want to speak with — they'll join directly.
                    </p>
                  </div>
                )}

                <button
                  onClick={handleEnterCall}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 active:scale-[0.98] transition-all duration-150 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-violet-900/40 hover:shadow-violet-700/50 text-base"
                >
                  {role === "create" ? "Open my call room" : "Join the call"}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </button>

                <p className="text-center text-white/20 text-xs mt-4">
                  You can change your language inside the call at any time.
                </p>
              </div>
            )}

          </div>
        </main>

        {/* ── Footer note ── */}
        <footer className="text-center pb-6 text-white/20 text-xs">
          No account needed · No data stored after the call
        </footer>
      </div>
    </>
  );
}