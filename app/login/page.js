"use client";

import { useState, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Turnstile from "react-turnstile";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  AlertTriangle, Lock, Loader, CheckCircle, ChevronLeft, Key, Mail, User, Phone, Eye, 
  Zap, Shield, Terminal, AlertCircle, XCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-cyan-500 font-mono text-sm animate-pulse flex items-center gap-3">
          <Loader className="w-5 h-5 animate-spin" />
          INITIALIZING SECURE PROTOCOL...
        </div>
      </div>
    }>
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
  const [glitchEffect, setGlitchEffect] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  // Glitch effect on errors
  useEffect(() => {
    if (message?.type === 'error') {
      setGlitchEffect(true);
      setTimeout(() => setGlitchEffect(false), 500);
    }
  }, [message]);

  const checkPasswordStrength = (pwd) => {
    if (pwd.length < 8) return "WEAK_CIPHER: MINIMUM_8_CHARS_REQUIRED";
    if (!/[A-Z]/.test(pwd)) return "WEAK_CIPHER: UPPERCASE_LETTER_MISSING";
    if (!/[a-z]/.test(pwd)) return "WEAK_CIPHER: LOWERCASE_LETTER_MISSING";
    if (!/[0-9]/.test(pwd)) return "WEAK_CIPHER: NUMERIC_DIGIT_MISSING";
    return null; 
  };

  const executeRedirect = () => {
    window.location.href = redirectTarget;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setMessage({ type: "error", text: "SECURITY_BREACH: CAPTCHA_VERIFICATION_FAILED" });
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });
    
    if (error) {
      setMessage({ 
        type: "error", 
        text: error.message.includes("Invalid") 
          ? "ACCESS_DENIED: INVALID_CREDENTIALS" 
          : `AUTH_ERROR: ${error.message.toUpperCase().replace(/\s+/g, '_')}`
      });
      setLoading(false);
    } else {
      setMessage({ type: "success", text: "ACCESS_GRANTED: ESTABLISHING_SECURE_CONNECTION..." });
      setTimeout(executeRedirect, 1000);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!turnstileToken) {
      setMessage({ type: "error", text: "SECURITY_BREACH: CAPTCHA_VERIFICATION_FAILED" });
      return;
    }
    if (username.length < 3) {
      setMessage({ type: "error", text: "REGISTRATION_ERROR: ALIAS_TOO_SHORT_[MIN_3_CHARS]" });
      return;
    }

    const passwordError = checkPasswordStrength(password);
    if (passwordError) {
      setMessage({ type: "error", text: passwordError });
      return;
    }

    setLoading(true);

    try {
      // Check if username exists
      const { data: existingUser, error: checkError } = await supabase
        .from("profiles")
        .select("username")
        .eq("username", username)
        .maybeSingle();

      if (checkError) {
        console.error("Username check error:", checkError);
        setMessage({ 
          type: "error", 
          text: "DATABASE_ERROR: USERNAME_VALIDATION_FAILED" 
        });
        setLoading(false);
        return;
      }

      if (existingUser) {
        setMessage({ 
          type: "error", 
          text: `REGISTRATION_FAILED: USERNAME_[${username.toUpperCase()}]_ALREADY_EXISTS` 
        });
        setLoading(false);
        return;
      }

      // Proceed with signup
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { 
          data: { username, phone_number: phone },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        // Check if it's a username conflict error from the database trigger
        if (error.message.includes('duplicate') || 
            error.message.includes('unique') || 
            error.message.includes('username') ||
            error.message.includes('profiles_username_key')) {
          setMessage({ 
            type: "error", 
            text: `REGISTRATION_FAILED: USERNAME_[${username.toUpperCase()}]_ALREADY_EXISTS_CHOOSE_ANOTHER`
          });
        } else {
          setMessage({ 
            type: "error", 
            text: `REGISTRATION_ERROR: ${error.message.toUpperCase().replace(/\s+/g, '_')}`
          });
        }
        setLoading(false);
        return;
      }

      if (data?.user?.identities?.length === 0) {
        setMessage({ 
          type: "error", 
          text: `EMAIL_CONFLICT: ADDRESS_[${email}]_ALREADY_REGISTERED` 
        });
        setLoading(false);
        return;
      }

      if (data?.user && !data?.session) {
        setMessage({ 
          type: "success", 
          text: "AGENT_CREATED: VERIFICATION_EMAIL_DISPATCHED" 
        });
        setLoading(false);
        return;
      }

      if (data?.session) {
        setMessage({ 
          type: "success", 
          text: "REGISTRATION_COMPLETE: INITIALIZING_SECURE_SESSION..." 
        });
        setTimeout(executeRedirect, 1000);
      } else {
        setMessage({ type: "success", text: "AGENT_CREATED: ATTEMPTING_AUTO_LOGIN..." });
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        
        if (loginError) {
          setMessage({ 
            type: "error", 
            text: "AUTO_LOGIN_FAILED: MANUAL_AUTHENTICATION_REQUIRED" 
          });
          setMode("login");
          setLoading(false);
        } else {
          setMessage({ type: "success", text: "ACCESS_GRANTED: CONNECTION_ESTABLISHED..." });
          setTimeout(executeRedirect, 1000);
        }
      }
    } catch (err) {
      console.error("Signup error:", err);
      setMessage({ 
        type: "error", 
        text: "CRITICAL_ERROR: REGISTRATION_SYSTEM_FAILURE" 
      });
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    
    if (error) {
      setMessage({ 
        type: "error", 
        text: `RECOVERY_ERROR: ${error.message.toUpperCase().replace(/\s+/g, '_')}`
      });
      setLoading(false);
    } else {
      setMessage({ 
        type: "success", 
        text: "RECOVERY_INITIATED: CHECK_SECURE_CHANNEL_[EMAIL]" 
      });
      setLoading(false);
    }
  };

  const renderHeader = () => {
    switch(mode) {
      case 'login': return { title: "AUTHENTICATION", sub: "SECURE ACCESS PORTAL" };
      case 'signup': return { title: "REGISTRATION", sub: "NEW AGENT INITIALIZATION" };
      case 'forgot_password': return { title: "RECOVERY", sub: "CREDENTIAL RESET PROTOCOL" };
      default: return { title: "SYSTEM", sub: "ERROR" };
    }
  };

  if (safeMode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white text-black font-serif p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="border-b pb-4 mb-4 flex items-center gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/1200px-Wikipedia-logo-v2.svg.png" className="w-12 h-12" alt="wiki"/>
            <h1 className="text-3xl font-serif">Cat</h1>
          </div>
          <p className="mb-4">The <b>cat</b> (<i>Felis catus</i>) is a domestic species of small carnivorous mammal.</p>
          <button onClick={() => setSafeMode(false)} className="mt-8 text-blue-600 hover:underline text-xs">(Restore Session)</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-cyan-400 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Cyberpunk Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
        
        {/* Scanning Line */}
        <motion.div 
          className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent shadow-[0_0_20px_rgba(0,255,255,0.8)]"
          animate={{ 
            top: ['-5%', '105%'],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Corner Brackets */}
        <div className="absolute top-8 left-8 w-20 h-20 border-l-2 border-t-2 border-cyan-500/30" />
        <div className="absolute top-8 right-8 w-20 h-20 border-r-2 border-t-2 border-cyan-500/30" />
        <div className="absolute bottom-8 left-8 w-20 h-20 border-l-2 border-b-2 border-cyan-500/30" />
        <div className="absolute bottom-8 right-8 w-20 h-20 border-r-2 border-b-2 border-cyan-500/30" />
        
        {/* Glitch overlay */}
        <AnimatePresence>
          {glitchEffect && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0, 0.3, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-red-500 mix-blend-screen"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* Back Button */}
        <Link href="/">
          <motion.button 
            whileHover={{ x: -5 }}
            className="flex items-center gap-2 text-xs text-cyan-600 hover:text-cyan-400 mb-8 transition-colors uppercase tracking-widest group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:animate-pulse" /> 
            <span className="border-b border-cyan-600/30 group-hover:border-cyan-400/50">ABORT_MISSION</span>
          </motion.button>
        </Link>

        {/* Main Terminal */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`bg-black/80 backdrop-blur-sm border-2 ${glitchEffect ? 'border-red-500' : 'border-cyan-500/50'} shadow-[0_0_40px_rgba(0,255,255,0.2)] overflow-hidden relative transition-all duration-200`}
        >
          
          {/* Header Bar */}
          <div className="bg-cyan-950/30 px-4 py-3 border-b border-cyan-500/30 flex justify-between items-center">
            <div className="flex gap-2">
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-red-500" 
              />
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                className="w-2 h-2 rounded-full bg-yellow-500" 
              />
              <motion.div 
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                className="w-2 h-2 rounded-full bg-green-500" 
              />
            </div>
            <div className="text-[9px] text-cyan-600 uppercase tracking-[0.3em] flex items-center gap-2">
              <Terminal className="w-3 h-3" />
              SECURE_TERMINAL_v4.2
            </div>
          </div>

          <div className="p-8">
            
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="inline-block p-4 rounded-lg bg-cyan-500/10 mb-4 border border-cyan-500/30 relative"
              >
                <Shield className="w-10 h-10 text-cyan-400" />
                <motion.div
                  className="absolute inset-0 rounded-lg border-2 border-cyan-500"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              
              <h1 className="text-2xl font-black text-cyan-400 uppercase tracking-wider mb-2 [text-shadow:0_0_10px_rgba(0,255,255,0.5)]">
                {renderHeader().title}
              </h1>
              <p className="text-[10px] text-cyan-600 uppercase tracking-[0.3em]">
                {renderHeader().sub}
              </p>
            </div>

            {/* Messages */}
            <AnimatePresence mode="wait">
              {message && (
                <motion.div 
                  key={message.text}
                  initial={{ opacity: 0, x: -20, height: 0 }} 
                  animate={{ opacity: 1, x: 0, height: "auto" }} 
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className={`mb-6 p-4 text-[10px] border-l-4 flex items-start gap-3 ${
                    message.type === 'error' 
                      ? 'bg-red-950/50 border-red-500 text-red-400' 
                      : 'bg-green-950/50 border-green-500 text-green-400'
                  }`}
                >
                  {message.type === 'error' ? (
                    <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 font-bold uppercase tracking-wider leading-relaxed break-words">
                    {message.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-cyan-600 tracking-[0.2em] flex items-center gap-2">
                      <User className="w-3 h-3" /> AGENT_ALIAS
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      className="w-full bg-black/50 border border-cyan-500/30 p-3 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500 focus:bg-black transition-all placeholder:text-cyan-900 font-mono" 
                      placeholder="ENTER_CODENAME"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase text-cyan-600 tracking-[0.2em] flex items-center gap-2">
                      <Phone className="w-3 h-3" /> SECURE_LINE [OPTIONAL]
                    </label>
                    <input 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      className="w-full bg-black/50 border border-cyan-500/30 p-3 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500 focus:bg-black transition-all placeholder:text-cyan-900 font-mono" 
                      placeholder="+91_XXXXXXXXXX"
                    />
                  </div>
                </>
              )}
              
              {!['update_password'].includes(mode) && (
                <div className="space-y-2">
                  <label className="text-[9px] uppercase text-cyan-600 tracking-[0.2em] flex items-center gap-2">
                    <Mail className="w-3 h-3" /> EMAIL_ADDRESS
                  </label>
                  <input 
                    type="email" 
                    required 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="w-full bg-black/50 border border-cyan-500/30 p-3 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500 focus:bg-black transition-all placeholder:text-cyan-900 font-mono" 
                    placeholder="agent@sandnco.lol"
                  />
                </div>
              )}
              
              {['login', 'signup', 'update_password'].includes(mode) && (
                <div className="space-y-2">
                  <label className="text-[9px] uppercase text-cyan-600 tracking-[0.2em] flex items-center gap-2">
                    <Key className="w-3 h-3" /> {mode === 'update_password' ? 'NEW_CIPHER_KEY' : 'CIPHER_KEY'}
                  </label>
                  <input 
                    type="password" 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-black/50 border border-cyan-500/30 p-3 text-sm text-cyan-400 focus:outline-none focus:border-cyan-500 focus:bg-black transition-all placeholder:text-cyan-900 font-mono tracking-widest" 
                    placeholder="••••••••••••"
                  />
                </div>
              )}
              
              {['login', 'signup'].includes(mode) && (
                <div className="flex justify-center py-3">
                  <Turnstile 
                    sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} 
                    theme="dark" 
                    onVerify={(token) => setTurnstileToken(token)} 
                  />
                </div>
              )}
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={(e) => {
                  if (mode === 'login') handleLogin(e);
                  else if (mode === 'signup') handleSignup(e);
                  else if (mode === 'forgot_password') handleForgotPassword(e);
                }} 
                disabled={loading} 
                className="w-full bg-cyan-500 text-black font-black uppercase py-4 tracking-[0.3em] hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group border-2 border-cyan-400"
              >
                <motion.div
                  className="absolute inset-0 bg-cyan-300"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.5 }}
                />
                <span className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      PROCESSING
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      EXECUTE
                    </>
                  )}
                </span>
              </motion.button>
            </form>

            {/* Footer Links */}
            <div className="mt-6 flex flex-col gap-3 text-center">
              {mode === 'login' && (
                <>
                  <button 
                    onClick={() => { setMode('signup'); setMessage(null); }} 
                    className="text-[10px] text-cyan-600 hover:text-cyan-400 transition-colors uppercase tracking-wider group"
                  >
                    <span className="border-b border-cyan-600/30 group-hover:border-cyan-400/50">
                      NO_ACCESS? REGISTER_NEW_AGENT
                    </span>
                  </button>
                  <button 
                    onClick={() => { setMode('forgot_password'); setMessage(null); }} 
                    className="text-[9px] text-red-900 hover:text-red-500 transition-colors uppercase tracking-wider"
                  >
                    LOST_CREDENTIALS?
                  </button>
                </>
              )}
              {mode === 'signup' && (
                <button 
                  onClick={() => { setMode('login'); setMessage(null); }} 
                  className="text-[10px] text-cyan-600 hover:text-cyan-400 transition-colors uppercase tracking-wider group"
                >
                  <span className="border-b border-cyan-600/30 group-hover:border-cyan-400/50">
                    EXISTING_AGENT? AUTHENTICATE
                  </span>
                </button>
              )}
              {mode === 'forgot_password' && (
                <button 
                  onClick={() => { setMode('login'); setMessage(null); }} 
                  className="text-[10px] text-cyan-600 hover:text-cyan-400 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <ChevronLeft className="w-3 h-3" />
                  RETURN_TO_LOGIN
                </button>
              )}
            </div>
          </div>
          
          {/* Bottom Bar */}
          <div className="bg-cyan-950/30 px-4 py-2 border-t border-cyan-500/30 text-[9px] text-cyan-700 font-mono text-center uppercase tracking-[0.2em] flex items-center justify-center gap-2">
            <Lock className="w-3 h-3" />
            ENCRYPTION: AES-256 | SECTOR_16_HUB
          </div>
        </motion.div>
      </div>
      
      {/* Panic Button */}
      <motion.button 
        onClick={() => setSafeMode(true)} 
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-red-600 rounded-full border-4 border-red-900 flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,0,0,0.5)] group"
        title="PANIC MODE"
      >
        <Eye className="w-6 h-6 group-hover:scale-110 transition-transform" />
      </motion.button>
    </div>
  );
}
