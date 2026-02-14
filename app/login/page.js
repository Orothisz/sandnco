"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Turnstile from "react-turnstile";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  AlertTriangle, Lock, Loader, CheckCircle, ChevronLeft, Key, Mail, 
  ShieldCheck, User, Phone, Eye, Fingerprint, ShieldAlert, Cpu
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

// ============================================================================
// HW-ACCELERATED BACKGROUND COMPONENTS
// ============================================================================
const NoiseOverlay = () => <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.12] mix-blend-overlay hw-accel bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />;
const Scanlines = () => <div className="fixed inset-0 pointer-events-none z-[6] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] hw-accel" />;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020205] flex items-center justify-center text-red-500 font-mono text-xs animate-pulse">ESTABLISHING ENCRYPTED TUNNEL...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const redirectTarget = searchParams.get('next') || '/';

  const [mode, setMode] = useState("login"); 
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [message, setMessage] = useState(null); 
  const [safeMode, setSafeMode] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const checkPasswordStrength = (pwd) => {
    if (pwd.length < 8) return "WEAK KEY: 8 CHARS MIN.";
    if (!/[A-Z]/.test(pwd)) return "WEAK KEY: NEED UPPERCASE.";
    if (!/[0-9]/.test(pwd)) return "WEAK KEY: NEED DIGIT.";
    return null; 
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!turnstileToken) return setMessage({ type: "error", text: "BOT DETECTED. VERIFY CAPTCHA." });
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setMessage({ type: "error", text: error.message.toUpperCase() }); setLoading(false); }
    else { window.location.href = redirectTarget; }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!turnstileToken) return setMessage({ type: "error", text: "BOT DETECTED." });
    const passwordError = checkPasswordStrength(password);
    if (passwordError) return setMessage({ type: "error", text: passwordError });
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username, phone_number: phone }, emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) { setMessage({ type: "error", text: error.message.toUpperCase() }); setLoading(false); }
    else { setMode("verify_signup"); setMessage({ type: "success", text: "8-DIGIT CODE DISPATCHED." }); setLoading(false); }
  };

  // Re-usable header logic
  const header = {
    login: { title: "Clearance", sub: "Identify yourself, Agent.", icon: <Lock className="w-8 h-8 text-white" /> },
    signup: { title: "Recruitment", sub: "Enter the Syndicate.", icon: <Fingerprint className="w-8 h-8 text-red-500" /> },
    verify_signup: { title: "Validation", sub: "Decipher 8-digit token.", icon: <ShieldCheck className="w-8 h-8 text-green-500" /> },
    forgot_password: { title: "Recovery", sub: "Resetting secure key.", icon: <ShieldAlert className="w-8 h-8 text-yellow-500" /> },
  }[mode] || { title: "Terminal", sub: "Standard Procedure.", icon: <Cpu className="w-8 h-8" /> };

  if (safeMode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white text-black font-serif p-8 overflow-auto">
        <div className="max-w-4xl mx-auto flex items-center gap-4 border-b pb-4 mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/1200px-Wikipedia-logo-v2.svg.png" className="w-12 h-12" alt="wiki"/>
          <h1 className="text-3xl">Cat</h1>
        </div>
        <p>The <b>cat</b> is a domestic species of small carnivorous mammal.</p>
        <button onClick={() => setSafeMode(false)} className="mt-8 text-blue-600 underline">(Restore Session)</button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#020205] text-gray-200 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden hw-main">
      <NoiseOverlay />
      <Scanlines />

      {/* Decorative HUD Brackets */}
      <div className="absolute top-10 left-10 w-20 h-20 border-t-2 border-l-2 border-white/10 pointer-events-none hidden md:block" />
      <div className="absolute bottom-10 right-10 w-20 h-20 border-b-2 border-r-2 border-white/10 pointer-events-none hidden md:block" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="relative z-10 w-full max-w-md"
      >
        <Link href="/">
          <button className="flex items-center gap-2 text-[10px] font-black text-gray-500 hover:text-red-500 mb-8 transition-colors uppercase tracking-[0.3em] active:scale-95">
            <ChevronLeft className="w-4 h-4" /> Abort Command
          </button>
        </Link>

        <div className="bg-black/60 border border-white/10 shadow-[0_0_80px_rgba(220,38,38,0.1)] rounded-3xl overflow-hidden backdrop-blur-2xl hw-accel">
          {/* Header Bar */}
          <div className="bg-white/[0.03] px-6 py-4 border-b border-white/5 flex justify-between items-center">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
            </div>
            <div className="text-[9px] font-black text-gray-600 uppercase tracking-[0.4em]">Auth_Node_02</div>
          </div>

          <div className="p-8 md:p-10">
            <div className="text-center mb-10">
              <motion.div 
                key={mode}
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                className="inline-block p-4 rounded-2xl bg-white/[0.02] border border-white/10 mb-6 shadow-inner"
              >
                {header.icon}
              </motion.div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 italic underline decoration-red-600/50 decoration-4 underline-offset-4">{header.title}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{header.sub}</p>
            </div>

            <AnimatePresence mode="wait">
              {message && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0 }} 
                  className={`mb-8 p-4 text-[10px] font-black border-l-4 flex items-center gap-4 uppercase tracking-widest ${message.type === 'error' ? 'bg-red-950/20 border-red-600 text-red-500' : 'bg-green-950/20 border-green-600 text-green-500'}`}
                >
                  {message.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <AnimatePresence mode="wait">
                <motion.div 
                  key={mode} 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ type: "tween", duration: 0.2 }}
                  className="space-y-5"
                >
                  {mode === 'signup' && (
                    <>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase text-gray-600 tracking-widest ml-1 font-black">Codename</label>
                        <div className="relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-red-500 transition-colors" />
                          <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-red-600/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-800" placeholder="AGENT_NAME" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase text-gray-600 tracking-widest ml-1 font-black">Secure Line</label>
                        <div className="relative group">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-red-500 transition-colors" />
                          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-red-600/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-800" placeholder="+91..." />
                        </div>
                      </div>
                    </>
                  )}
                  
                  {!['verify_signup', 'verify_recovery', 'update_password'].includes(mode) && (
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase text-gray-600 tracking-widest ml-1 font-black">Alias (Email)</label>
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-red-500 transition-colors" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-red-600/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-800" placeholder="EMAIL@DOMAIN.LOL" />
                      </div>
                    </div>
                  )}

                  {['login', 'signup', 'update_password'].includes(mode) && (
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase text-gray-600 tracking-widest ml-1 font-black">Keyphrase</label>
                      <div className="relative group">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-700 group-focus-within:text-red-500 transition-colors" />
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-red-600/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-800" placeholder="••••••••" />
                      </div>
                    </div>
                  )}

                  {['verify_signup', 'verify_recovery'].includes(mode) && (
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase text-gray-600 tracking-widest ml-1 font-black text-center block">Transmission Token</label>
                      <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-white/[0.02] border border-white/10 rounded-xl py-6 text-2xl text-green-500 focus:outline-none focus:border-green-500/50 transition-all font-black tracking-[0.5em] text-center" placeholder="00000000" maxLength={8} />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {['login', 'signup'].includes(mode) && (
                <div className="flex justify-center hw-accel">
                  <Turnstile sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} theme="dark" onVerify={(token) => setTurnstileToken(token)} />
                </div>
              )}

              <button 
                onClick={(e) => {
                  if (mode === 'login') handleLogin(e);
                  else if (mode === 'signup') handleSignup(e);
                  else if (mode === 'verify_signup') handleVerifySignup(e);
                  else if (mode === 'forgot_password') handleForgotPassword(e);
                  else if (mode === 'verify_recovery') handleVerifyRecovery(e);
                  else if (mode === 'update_password') handleUpdatePassword(e);
                }} 
                disabled={loading} 
                className="w-full bg-white text-black font-black uppercase py-5 rounded-2xl tracking-[0.2em] transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(255,255,255,0.1)] text-xs"
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4 fill-current" /> EXECUTE_AUTH</>}
              </button>
            </form>

            <div className="mt-8 flex flex-col gap-4 text-center">
              {mode === 'login' ? (
                <>
                  <button onClick={() => setMode('signup')} className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-black tracking-widest">No Clearance? <span className="text-red-500 underline">Request Enrollment</span></button>
                  <button onClick={() => setMode('forgot_password')} className="text-[9px] text-gray-700 hover:text-red-800 transition-colors uppercase font-black">Lost Credentials?</button>
                </>
              ) : (
                <button onClick={() => setMode('login')} className="text-[10px] text-gray-500 hover:text-white transition-colors uppercase font-black tracking-widest">← Back to Identity Verification</button>
              )}
            </div>
          </div>
          
          <div className="bg-white/[0.02] px-6 py-4 border-t border-white/5 text-[9px] text-gray-700 font-bold text-center uppercase tracking-[0.3em]">
            Encryption_Standard: AES-256-GCM
          </div>
        </div>
      </motion.div>
      
      <button onClick={() => setSafeMode(true)} className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-red-600 rounded-full border-4 border-red-900 flex items-center justify-center text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:scale-110 active:scale-90 transition-transform hw-accel" title="PANIC">
        <Eye className="w-5 h-5" />
      </button>

      <style jsx global>{`
        .hw-accel { transform: translate3d(0,0,0); backface-visibility: hidden; will-change: transform; }
        .hw-main { transform: translateZ(0); }
        @keyframes scan { 0% { top: -10%; } 100% { top: 110%; } }
        .animate-glitch-1-3d { animation: glitch1 0.2s infinite; }
        .animate-glitch-2-3d { animation: glitch2 0.25s infinite; }
        @keyframes glitch1 { 0% { transform: translate3d(0,0,0); } 20% { transform: translate3d(-2px,2px,0); } 40% { transform: translate3d(-2px,-2px,0); } 60% { transform: translate3d(2px,2px,0); } 80% { transform: translate3d(2px,-2px,0); } 100% { transform: translate3d(0,0,0); } }
        @keyframes glitch2 { 0% { transform: translate3d(0,0,0); } 20% { transform: translate3d(2px,-2px,0); } 40% { transform: translate3d(2px,2px,0); } 60% { transform: translate3d(-2px,-2px,0); } 80% { transform: translate3d(-2px,2px,0); } 100% { transform: translate3d(0,0,0); } }
      `}</style>
    </div>
  );
}
