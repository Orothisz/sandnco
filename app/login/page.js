"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Turnstile from "react-turnstile";
import { createClient } from "@supabase/supabase-js";
import { 
  AlertTriangle, 
  Lock, 
  Terminal, 
  Loader, 
  CheckCircle, 
  ChevronLeft, 
  Key, 
  Mail, 
  ShieldCheck, 
  User, 
  Phone,
  Eye
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// --- SUPABASE CONFIG ---
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Login() {
  const router = useRouter();
  
  // MODES: 'login' | 'signup' | 'verify_signup' | 'forgot_password' | 'verify_recovery' | 'update_password'
  const [mode, setMode] = useState("login"); 
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState(null);
  const [message, setMessage] = useState(null); 
  const [safeMode, setSafeMode] = useState(false);

  // FORM DATA
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  // ------------------------------------------------
  // SMART REDIRECT (FIXED FOR INSTANT LOAD)
  // ------------------------------------------------
  const performSmartRedirect = async (userId) => {
    try {
      const { count, error } = await supabase
        .from("requests")
        .select("id", { count: "exact" })
        .eq("user_id", userId);

      if (error) throw error;

      const destination = count && count > 0 ? "/dashboard" : "/request";
      
      router.replace(destination);
      router.refresh();

    } catch (err) {
      console.error("Redirect error:", err);
      setMessage({ type: "error", text: "DATABASE SCAN FAILED. FALLBACK TO REQUESTS." });
      router.push("/request");
    }
  };

  // ------------------------------------------------
  // HANDLERS
  // ------------------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!turnstileToken) return setMessage({ type: "error", text: "BOT DETECTED. VERIFY CAPTCHA." });
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setMessage({ type: "error", text: error.message.toUpperCase() });
      setLoading(false);
    } else {
      setMessage({ type: "success", text: "ACCESS GRANTED. SCANNING DATABASE..." });
      await performSmartRedirect(data.user.id);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!turnstileToken) return setMessage({ type: "error", text: "BOT DETECTED." });
    if (username.length < 3) return setMessage({ type: "error", text: "USERNAME TOO SHORT." });

    setLoading(true);

    // Username Uniqueness Check
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .maybeSingle();

    if (existingUser) {
      setLoading(false);
      return setMessage({ type: "error", text: "USERNAME ALREADY TAKEN BY ANOTHER AGENT." });
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { username, phone_number: phone },
        emailRedirectTo: null 
      }
    });

    if (error) {
      setMessage({ type: "error", text: error.message.toUpperCase() });
      setLoading(false);
    } else {
      setMode("verify_signup");
      setMessage({ type: "success", text: "8-DIGIT ENCRYPTED CODE SENT TO EMAIL. ENTER IT BELOW." });
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup"
    });

    if (error) {
      setMessage({ type: "error", text: "INVALID 8-DIGIT CODE." });
      setLoading(false);
    } else {
      setMessage({ type: "success", text: "IDENTITY VERIFIED. REDIRECTING..." });
      await performSmartRedirect(data.session.user.id);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) {
      setMessage({ type: "error", text: error.message.toUpperCase() });
      setLoading(false);
    } else {
      setMode("verify_recovery");
      setMessage({ type: "success", text: "RECOVERY CODE SENT. CHECK INBOX." });
      setLoading(false);
    }
  };

  const handleVerifyRecovery = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "recovery"
    });
    if (error) {
      setMessage({ type: "error", text: "INVALID RECOVERY CODE." });
      setLoading(false);
    } else {
      setMode("update_password");
      setMessage({ type: "success", text: "CODE ACCEPTED. SET NEW PASSWORD." });
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage({ type: "error", text: "UPDATE FAILED." });
      setLoading(false);
    } else {
      setMessage({ type: "success", text: "PASSWORD RESET. ACCESSING TERMINAL..." });
      await performSmartRedirect(data.user.id);
    }
  };

  const renderHeader = () => {
    switch(mode) {
      case 'login': return { title: "Identity Verification", sub: "ENTER CREDENTIALS TO ACCESS DASHBOARD." };
      case 'signup': return { title: "New Operative", sub: "CREATE AN ENCRYPTED PROFILE." };
      case 'verify_signup': return { title: "Confirm Identity", sub: "ENTER THE 8-DIGIT CODE SENT TO YOUR EMAIL." };
      case 'forgot_password': return { title: "Account Recovery", sub: "INITIATE PASSWORD RESET PROTOCOL." };
      case 'verify_recovery': return { title: "Security Check", sub: "ENTER RECOVERY CODE." };
      case 'update_password': return { title: "New Credentials", sub: "SET YOUR NEW PASSWORD." };
      default: return { title: "System Error", sub: "REBOOT REQUIRED." };
    }
  };

  // --- PANIC MODE FALLBACK ---
  if (safeMode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white text-black font-serif p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="border-b pb-4 mb-4 flex items-center gap-4">
              <img src="https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Wikipedia-logo-v2.svg/1200px-Wikipedia-logo-v2.svg.png" className="w-12 h-12" alt="wiki"/>
              <h1 className="text-3xl font-serif">Cat</h1>
          </div>
          <p className="text-sm text-gray-600 mb-4">From Wikipedia, the free encyclopedia</p>
          <div className="float-right border border-gray-300 p-2 mb-4 ml-4 bg-gray-50 w-64 text-xs">
            <img src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=300" className="w-full mb-2" alt="cat"/>
            <p>The domestic cat (Felis catus).</p>
          </div>
          <p className="mb-4">The <b>cat</b> (<i>Felis catus</i>) is a domestic species of small carnivorous mammal. It is the only domesticated species in the family Felidae.</p>
          <button onClick={() => setSafeMode(false)} className="mt-8 text-blue-600 hover:underline text-xs">(Restore Session)</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050510] text-gray-200 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* BACKGROUND FX */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 shadow-[0_0_20px_rgba(0,255,0,0.5)] animate-[scan_3s_linear_infinite]" />
         <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        
        <Link href="/">
           <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-red-500 mb-8 transition-colors uppercase tracking-widest">
             <ChevronLeft className="w-4 h-4" /> Abort Mission
           </button>
        </Link>

        {/* TERMINAL BOX */}
        <div className="bg-black border border-gray-800 shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden rounded-lg">
           
           <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center">
             <div className="flex gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500/50" />
               <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
               <div className="w-3 h-3 rounded-full bg-green-500/50" />
             </div>
             <div className="text-[10px] text-gray-500 uppercase tracking-widest">
               SECURE_SHELL_V3.0
             </div>
           </div>

           <div className="p-8">
             <div className="text-center mb-8">
               <div className="inline-block p-3 rounded-full bg-white/5 mb-4 border border-white/10">
                 {mode.includes('verify') ? <ShieldCheck className="w-8 h-8 text-green-500" /> : <Lock className="w-8 h-8 text-white" />}
               </div>
               <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">
                 {renderHeader().title}
               </h1>
               <p className="text-xs text-gray-500">{renderHeader().sub}</p>
             </div>

             <AnimatePresence>
               {message && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: "auto" }}
                   exit={{ opacity: 0, height: 0 }}
                   className={`mb-6 p-3 text-xs border-l-2 flex items-center gap-3 ${
                     message.type === 'error' ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-green-900/20 border-green-500 text-green-400'
                   }`}
                 >
                   {message.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                   {message.text}
                 </motion.div>
               )}
             </AnimatePresence>

             <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
               
               {mode === 'signup' && (
                 <>
                   <div className="space-y-1">
                     <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                       <User className="w-3 h-3" /> Agent Alias
                     </label>
                     <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 p-3 text-sm text-white focus:outline-none focus:border-red-500 focus:bg-gray-900 transition-all" placeholder="CODENAME" />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                       <Phone className="w-3 h-3" /> Secure Line
                     </label>
                     <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 p-3 text-sm text-white focus:outline-none focus:border-red-500 focus:bg-gray-900 transition-all" placeholder="+91" />
                   </div>
                 </>
               )}

               {!['verify_signup', 'verify_recovery', 'update_password'].includes(mode) && (
                 <div className="space-y-1">
                   <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                     <Mail className="w-3 h-3" /> Alias (Email)
                   </label>
                   <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 p-3 text-sm text-white focus:outline-none focus:border-red-500 focus:bg-gray-900 transition-all" placeholder="agent@sandnco.lol" />
                 </div>
               )}

               {['login', 'signup', 'update_password'].includes(mode) && (
                 <div className="space-y-1">
                   <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                     <Key className="w-3 h-3" /> {mode === 'update_password' ? 'New Password' : 'Keyphrase'}
                   </label>
                   <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 p-3 text-sm text-white focus:outline-none focus:border-red-500 focus:bg-gray-900 transition-all" placeholder="••••••••" />
                 </div>
               )}

               {['verify_signup', 'verify_recovery'].includes(mode) && (
                 <div className="space-y-1">
                   <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2">
                     <ShieldCheck className="w-3 h-3" /> 8-Digit Code
                   </label>
                   <input type="text" required value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 p-3 text-sm text-white focus:outline-none focus:border-green-500 focus:bg-gray-900 transition-all font-mono tracking-[0.6em] text-center" placeholder="00000000" maxLength={8} />
                 </div>
               )}

               {['login', 'signup'].includes(mode) && (
                 <div className="flex justify-center py-2">
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
                 className="w-full bg-white text-black font-black uppercase py-4 tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
               >
                 {loading ? <Loader className="w-4 h-4 animate-spin" /> : "EXECUTE"}
               </button>
             </form>

             <div className="mt-6 flex flex-col gap-3 text-center">
               {mode === 'login' && (
                 <>
                   <button onClick={() => { setMode('signup'); setMessage(null); }} className="text-xs text-gray-500 hover:text-white underline decoration-gray-700 transition-colors uppercase">NO CLEARANCE? REGISTER.</button>
                   <button onClick={() => { setMode('forgot_password'); setMessage(null); }} className="text-[10px] text-red-900 hover:text-red-500 transition-colors uppercase">LOST CREDENTIALS?</button>
                 </>
               )}
               {mode === 'signup' && (
                 <button onClick={() => { setMode('login'); setMessage(null); }} className="text-xs text-gray-500 hover:text-white underline decoration-gray-700 transition-colors uppercase">ALREADY AN AGENT? LOGIN.</button>
               )}
               {(mode === 'verify_signup' || mode === 'forgot_password' || mode === 'verify_recovery') && (
                 <button onClick={() => { setMode('login'); setMessage(null); }} className="text-xs text-gray-500 hover:text-white transition-colors uppercase">← RETURN TO LOGIN</button>
               )}
             </div>
           </div>
           
           <div className="bg-gray-900 px-4 py-2 border-t border-gray-800 text-[10px] text-gray-600 font-mono text-center uppercase">ENCRYPTION: AES-256 // SECTOR 16 HUB</div>
        </div>
      </div>
      
      {/* PANIC BUTTON */}
      <button
        onClick={() => setSafeMode(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-red-600 rounded-full border-4 border-red-900 flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all group"
        title="PANIC"
      >
        <Eye className="w-5 h-5" />
      </button>

      <style jsx>{`
        @keyframes scan {
          0% { top: -10%; }
          100% { top: 110%; }
        }
      `}</style>
    </div>
  );
}
