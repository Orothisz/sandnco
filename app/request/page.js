"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Camera, Calendar, Instagram, Phone, Mail, User, 
  HeartCrack, Heart, Search, Lock, CheckCircle, Loader, 
  AlertTriangle, FileWarning, ChevronLeft, ShieldAlert, Zap, Terminal
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { submitRequest } from "../actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================================
// CINEMATIC OVERLAYS
// ============================================================================
const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.03] mix-blend-overlay will-change-transform">
    <svg className="w-full h-full">
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#n)" />
    </svg>
  </div>
);

const Scanlines = () => (
  <div className="fixed inset-0 pointer-events-none z-[6] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] will-change-transform" />
);

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const containerVars = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVars = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 20 } }
};

export default function RequestPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Service Selection
  const [service, setService] = useState("breakup"); 
  
  // Dynamic States
  const [hasTarget, setHasTarget] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Files
  const [userPhoto, setUserPhoto] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);

  // AUTH LOCK
  useEffect(() => {
    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push("/login"); 
        } else {
            setUserEmail(session.user.email);
            setCheckingAuth(false);
        }
    };
    checkUser();
  }, [router, supabase]);

  // Universal Upload Helper
  const uploadFile = async (file, bucket) => {
    if (!file) return null;
    const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`;
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsAgreed) return alert("YOU MUST ACCEPT THE RISKS TO PROCEED.");
    
    setLoading(true);

    try {
      const formData = new FormData(e.target);
      
      const photoUrl = await uploadFile(userPhoto, "evidence");
      const paymentUrl = await uploadFile(paymentProof, "payments");
      
      if (photoUrl) formData.append("user_photo_url", photoUrl);
      if (paymentUrl) formData.append("payment_screenshot_url", paymentUrl);
      
      formData.append("service", service);
      formData.append("has_specific_target", hasTarget);

      const result = await submitRequest(formData);
      
      if (result.success) {
        setSuccess(true);
      } else {
        alert("SYSTEM ERROR: " + (result.error || result.message || "UNAUTHORIZED"));
      }

    } catch (err) {
      alert("UPLOAD ERROR: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-[100dvh] bg-[#020205] flex flex-col items-center justify-center text-green-500 font-mono">
         <Radar className="w-10 h-10 mb-4 animate-spin"/>
         <div className="text-xs uppercase tracking-widest font-black animate-pulse">VERIFYING CLEARANCE...</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[100dvh] bg-[#020205] flex items-center justify-center p-6 text-center font-mono relative overflow-hidden">
        <NoiseOverlay />
        <Scanlines />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, filter: "blur(10px)" }}
          animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
          transition={{ type: "spring", damping: 20, stiffness: 100 }}
          className="max-w-md w-full border border-green-500/30 bg-black/60 backdrop-blur-xl p-10 rounded-[2rem] shadow-[0_0_50px_rgba(34,197,94,0.15)] relative z-10"
        >
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter drop-shadow-md">PROTOCOL INITIATED</h1>
          <p className="text-green-400/80 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
            Your request has been encrypted and securely transmitted to Command. An operative will establish contact shortly.
          </p>
          <Link href="/dashboard">
            <button className="w-full bg-green-600 text-black font-black py-5 rounded-xl hover:bg-white hover:text-black transition-all uppercase tracking-[0.3em] shadow-[0_0_20px_rgba(34,197,94,0.3)] active:scale-95 flex items-center justify-center gap-3">
              <Terminal className="w-4 h-4" /> Track Status
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#020205] text-gray-200 font-sans pb-20 selection:bg-red-500 selection:text-black relative overflow-hidden">
      
      <NoiseOverlay />
      <Scanlines />
      
      {/* Dynamic Background Glows based on service */}
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[150px] pointer-events-none z-0 transition-colors duration-1000 ${
        service === 'breakup' ? 'bg-red-600/10' : 
        service === 'patchup' ? 'bg-blue-600/10' : 
        service === 'matchup' ? 'bg-emerald-600/10' : 
        'bg-purple-600/10'
      }`} />

      {/* -------------------------------------------------------------------------- */}
      {/* FLAGSHIP HEADER */}
      {/* -------------------------------------------------------------------------- */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-5 flex justify-between items-center bg-[#020205]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
         <div className="flex items-center gap-4">
           {/* LOGO LINKS TO HOME */}
           <Link href="/">
             <span className="font-black italic text-xl tracking-tighter drop-shadow-md text-white hover:text-red-500 transition-colors cursor-pointer">
               SANDNCO<span className="text-red-600">.LOL</span>
             </span>
           </Link>
           <div className="hidden md:flex px-3 py-1 bg-green-900/20 border border-green-500/30 rounded-full text-[9px] font-black tracking-widest text-green-400 items-center gap-2 uppercase">
             <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> UPLINK: {userEmail}
           </div>
         </div>
         
         <div className="flex items-center">
           {/* BACK TO BASE BUTTON */}
           <Link href="/">
             <button className="flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-400 hover:text-white transition-all bg-white/5 px-4 py-2.5 rounded-full border border-white/10 hover:bg-white/10 shadow-lg active:scale-95">
               <ChevronLeft className="w-4 h-4"/> <span className="hidden sm:inline">BACK TO BASE</span>
             </button>
           </Link>
         </div>
      </nav>

      <main className="max-w-4xl mx-auto mt-32 px-4 relative z-10">
        
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-5xl md:text-7xl font-black uppercase mb-4 text-white tracking-tighter drop-shadow-lg">
            Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Parameters</span>
          </h1>
          <p className="text-center text-gray-400 font-bold uppercase tracking-[0.3em] text-xs bg-white/5 border border-white/10 px-6 py-2 rounded-full inline-block backdrop-blur-sm">
            SELECT OBJECTIVE. PROVIDE INTEL. EXECUTE.
          </p>
        </motion.div>

        {/* -------------------------------------------------------------------------- */}
        {/* SERVICE SELECTOR CARDS */}
        {/* -------------------------------------------------------------------------- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
            {[
                { id: "breakup", icon: <HeartCrack/>, label: "Break Up", color: "text-red-500", border: "border-red-500", shadow: "shadow-[0_0_30px_rgba(220,38,38,0.3)]", bg: "bg-red-950/20" },
                { id: "patchup", icon: <Heart/>, label: "Patch Up", color: "text-blue-500", border: "border-blue-500", shadow: "shadow-[0_0_30px_rgba(59,130,246,0.3)]", bg: "bg-blue-950/20" },
                { id: "matchup", icon: <Search/>, label: "Match Up", color: "text-emerald-500", border: "border-emerald-500", shadow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]", bg: "bg-emerald-950/20" },
                { id: "exclusive", icon: <Lock/>, label: "Exclusive", color: "text-purple-500", border: "border-purple-500", shadow: "shadow-[0_0_30px_rgba(168,85,247,0.3)]", bg: "bg-purple-950/20" }
            ].map((s) => (
              <button 
                key={s.id}
                onClick={() => { setService(s.id); setHasTarget(false); }}
                className={`flex flex-col items-center justify-center p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                    service === s.id 
                    ? `bg-[#0a0a0f] text-white ${s.border} ${s.shadow} scale-105` 
                    : `bg-black/40 border-white/5 text-gray-500 hover:border-white/20 hover:text-gray-300 hover:bg-white/5`
                }`}
              >
                <div className={`absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none ${service === s.id ? 'opacity-100' : 'group-hover:opacity-100'} ${s.bg}`} />
                <div className={`mb-4 scale-125 transition-transform duration-300 ${service === s.id ? s.color : 'text-gray-600 group-hover:text-gray-400 group-hover:scale-150'}`}>
                  {s.icon}
                </div>
                <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] relative z-10">{s.label}</span>
              </button>
            ))}
        </div>

        {/* -------------------------------------------------------------------------- */}
        {/* EXCLUSIVE VIEW (NO FORM) */}
        {/* -------------------------------------------------------------------------- */}
        {service === "exclusive" ? (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border-2 border-purple-500/50 bg-[#050505] p-12 md:p-20 text-center rounded-[3rem] backdrop-blur-2xl shadow-[0_0_80px_rgba(168,85,247,0.2)] relative overflow-hidden">
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                 <Lock className="w-20 h-20 text-purple-500 mx-auto mb-8 animate-pulse drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />
                 <h2 className="text-3xl md:text-5xl font-black text-white mb-6 uppercase tracking-tighter">VIP CLEARANCE REQUIRED</h2>
                 <p className="text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed font-medium">
                     This tier involves Non-Disclosure Agreements, 24/7 surveillance teams, and total reality fabrication. We do not accept web requests for this tier.
                     <br/><span className="text-purple-400 font-bold uppercase tracking-widest text-[10px] mt-6 block bg-purple-900/20 py-2 rounded border border-purple-500/30 w-fit mx-auto px-6">STARTING BUDGET: ₹2,700+</span>
                 </p>
                 <div className="flex flex-col sm:flex-row gap-6 justify-center items-center relative z-10">
                     <a href="mailto:sandnco.lol@gmail.com" className="w-full sm:w-auto bg-purple-600 text-white px-8 py-5 font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.4)]">
                         Secure Email Channel
                     </a>
                     <a href="https://instagram.com/sandnco.lol" target="_blank" className="w-full sm:w-auto bg-black border border-purple-500 text-purple-400 px-8 py-5 font-black uppercase tracking-[0.2em] hover:bg-purple-500 hover:text-white transition-all rounded-xl">
                         DM @sandnco.lol
                     </a>
                 </div>
             </motion.div>
        ) : (
        
        /* -------------------------------------------------------------------------- */
        /* DYNAMIC FORM */
        /* -------------------------------------------------------------------------- */
        <motion.form 
          variants={containerVars} 
          initial="hidden" 
          animate="show" 
          onSubmit={handleSubmit} 
          className="space-y-8"
        >
          
          <div className="bg-[#050505] border border-white/10 p-8 md:p-12 space-y-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />
             
             {/* --- SECTION 1: OPERATIVE DETAILS --- */}
             <motion.div variants={itemVars} className="relative z-10">
                <div className="absolute -left-8 md:-left-12 top-0 h-full w-1.5 bg-red-600 rounded-r" />
                <h3 className="text-sm md:text-base font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <User className="w-5 h-5 text-red-500"/> 1. Your Intel (Operative)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Your Phone (Mandatory)</label>
                        <input required name="user_phone" className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm focus:border-red-500 focus:bg-red-950/10 focus:ring-4 focus:ring-red-500/10 outline-none text-white font-mono transition-all placeholder:text-gray-700" placeholder="+91..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Your Instagram (Mandatory)</label>
                        <input required name="user_insta" className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm focus:border-red-500 focus:bg-red-950/10 focus:ring-4 focus:ring-red-500/10 outline-none text-white font-mono transition-all placeholder:text-gray-700" placeholder="@username" />
                    </div>
                    
                    {/* MATCHUP: Needs User Photo */}
                    {service === "matchup" && (
                        <div className="col-span-full space-y-3 p-6 border border-emerald-500/30 bg-emerald-950/20 rounded-2xl">
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                <Camera className="w-4 h-4"/> Upload Your Recent Photo (Required for Algorithm)
                            </label>
                            <input type="file" required onChange={(e) => setUserPhoto(e.target.files[0])} className="w-full text-xs text-gray-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:bg-emerald-600 file:text-black file:font-black file:uppercase file:tracking-widest file:border-0 hover:file:bg-emerald-500 cursor-pointer transition-all" />
                        </div>
                    )}
                </div>
             </motion.div>

             {/* --- SECTION 2: TARGET INTEL --- */}
             <motion.div variants={itemVars} className="relative z-10 border-t border-white/10 pt-10">
                <div className="absolute -left-8 md:-left-12 top-10 h-[calc(100%-40px)] w-1.5 bg-blue-600 rounded-r" />
                <h3 className="text-sm md:text-base font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <Search className="w-5 h-5 text-blue-500"/> 2. Target Intel
                </h3>

                {/* MATCHUP TOGGLE */}
                {service === "matchup" && (
                    <div className="flex flex-wrap gap-2 mb-8 bg-[#0a0a0f] border border-white/10 p-2 w-fit rounded-xl">
                        <button type="button" onClick={() => setHasTarget(true)} className={`text-[10px] px-6 py-3 font-black uppercase tracking-widest transition-all rounded-lg ${hasTarget ? "bg-white text-black shadow-md" : "text-gray-500 hover:text-white"}`}>Specific Person</button>
                        <button type="button" onClick={() => setHasTarget(false)} className={`text-[10px] px-6 py-3 font-black uppercase tracking-widest transition-all rounded-lg ${!hasTarget ? "bg-white text-black shadow-md" : "text-gray-500 hover:text-white"}`}>Random / Algorithm</button>
                    </div>
                )}

                {/* ALGORITHM MODE (No Target) */}
                {(!hasTarget && service === "matchup") ? (
                    <div className="p-8 bg-blue-950/30 border border-blue-500/30 text-blue-200 text-xs font-mono leading-relaxed rounded-2xl shadow-inner">
                        <strong className="text-blue-400 flex items-center gap-2 mb-2 text-sm uppercase tracking-widest"><ShieldAlert className="w-4 h-4"/> BLIND MATCHMAKING ACTIVE</strong>
                        Our algorithm will scan Instagram databases, mutual connections, and sector-specific data to find a highly compatible target based on your "Preferences" below. The operation begins immediately upon processing.
                    </div>
                ) : (
                    // TARGET FORM
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Name</label>
                            <input required name="target_name" className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm focus:border-blue-500 focus:bg-blue-950/10 focus:ring-4 focus:ring-blue-500/10 outline-none text-white font-mono transition-all placeholder:text-gray-700" placeholder="Full Name or Alias" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Instagram</label>
                            <input required name="target_insta" className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm focus:border-blue-500 focus:bg-blue-950/10 focus:ring-4 focus:ring-blue-500/10 outline-none text-white font-mono transition-all placeholder:text-gray-700" placeholder="@username" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Phone</label>
                            <input required name="target_phone" className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm focus:border-blue-500 focus:bg-blue-950/10 focus:ring-4 focus:ring-blue-500/10 outline-none text-white font-mono transition-all placeholder:text-gray-700" placeholder="+91..." />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Target Email (Optional)</label>
                            <input name="target_email" type="email" className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm focus:border-blue-500 focus:bg-blue-950/10 focus:ring-4 focus:ring-blue-500/10 outline-none text-white font-mono transition-all placeholder:text-gray-700" placeholder="target@email.com" />
                        </div>
                    </div>
                )}
             </motion.div>

             {/* --- SECTION 3: MISSION LOGISTICS --- */}
             <motion.div variants={itemVars} className="relative z-10 border-t border-white/10 pt-10">
                <div className="absolute -left-8 md:-left-12 top-10 h-[calc(100%-40px)] w-1.5 bg-yellow-500 rounded-r" />
                <h3 className="text-sm md:text-base font-black text-white uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <FileWarning className="w-5 h-5 text-yellow-500"/> 3. Logistics & Details
                </h3>
                
                {/* BREAKUP SPECIFICS */}
                {service === "breakup" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Reason for Termination</label>
                            <select name="reason" className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm focus:border-yellow-500 focus:bg-yellow-950/10 focus:ring-4 focus:ring-yellow-500/10 outline-none text-white font-mono appearance-none transition-all cursor-pointer">
                                <option>Boredom / Lost Spark</option>
                                <option>Found Someone Else</option>
                                <option>They are Toxic / Abusive</option>
                                <option>Just want to be single</option>
                                <option>Other (Specify in notes below)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Deadline (Ideal)</label>
                            <input type="date" name="deadline" className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-4 text-sm text-gray-300 focus:border-yellow-500 focus:bg-yellow-950/10 focus:ring-4 focus:ring-yellow-500/10 outline-none font-mono transition-all cursor-pointer" />
                        </div>
                    </div>
                )}

                {/* DETAILS TEXTAREA */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">
                        {service === "matchup" && !hasTarget ? "Describe Your Type / Preferences" : "Additional Operational Notes"}
                    </label>
                    <textarea 
                        name="details" 
                        required 
                        className="w-full bg-[#0a0a0f] border border-white/10 rounded-2xl p-5 text-sm focus:border-yellow-500 focus:bg-yellow-950/10 focus:ring-4 focus:ring-yellow-500/10 outline-none text-white font-mono resize-none custom-scrollbar transition-all placeholder:text-gray-700" 
                        rows="5" 
                        placeholder={service === "matchup" ? "E.g., Tall, artistic, lives in Sector 15, hates cats..." : "Any specific instructions? Time of day to call? Alibis needed? Drop the intel here."} 
                    />
                </div>
                
                {/* PAYMENT PROOF */}
                <div className="pt-8 mt-8 border-t border-white/5">
                   <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-3 block">Financial Verification</label>
                   <div className="flex items-center justify-between p-6 border-2 border-dashed border-white/10 bg-white/[0.02] hover:bg-white/5 rounded-2xl cursor-pointer transition-all hover:border-white/30 group" onClick={() => document.getElementById('pay_upload').click()}>
                      <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-3 tracking-widest group-hover:text-white transition-colors">
                          <Upload className="w-5 h-5" /> 
                          {paymentProof ? <span className="text-green-500">{paymentProof.name}</span> : "Upload Payment Screenshot (Optional / Promo Applied)"}
                      </span>
                   </div>
                   <input id="pay_upload" type="file" className="hidden" onChange={(e) => setPaymentProof(e.target.files[0])} />
                </div>
             </motion.div>

             {/* --- SECTION 4: LEGAL BINDING --- */}
             <motion.div variants={itemVars} className="bg-red-950/20 border border-red-500/30 p-6 rounded-2xl flex items-start gap-4 relative z-10 shadow-inner">
                <input 
                    type="checkbox" 
                    id="legal_check" 
                    className="mt-1 w-5 h-5 rounded border-red-500/50 bg-black/50 accent-red-600 cursor-pointer shrink-0"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                />
                <label htmlFor="legal_check" className="text-[10px] md:text-xs text-red-200/70 font-mono leading-relaxed cursor-pointer select-none">
                    I ACKNOWLEDGE THAT SANDNCO IS AN ENTERTAINMENT SERVICE. I UNDERSTAND THE RISKS INVOLVED IN RELATIONSHIP ARBITRAGE. I AGREE THAT ANY PSYCHOLOGICAL DAMAGE, BREAKUPS, OR UNINTENDED MARRIAGES ARE MY SOLE RESPONSIBILITY. 
                    <Link href="/legal" className="text-red-500 font-bold underline ml-2 hover:text-white transition-colors block mt-2">READ FULL TERMS.</Link>
                </label>
             </motion.div>

          </div>

          <motion.div variants={itemVars}>
            <button 
              type="submit" 
              disabled={loading || !termsAgreed}
              className="w-full relative group overflow-hidden bg-white/5 border border-white/10 text-white font-black uppercase py-6 text-lg tracking-[0.3em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 rounded-[2rem] mt-6 shadow-2xl hover:border-red-500/50 hover:shadow-[0_0_50px_rgba(220,38,38,0.3)] active:scale-95"
            >
              <div className="absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
              
              <span className="relative z-10 flex items-center gap-3">
                {loading ? (
                  <><Loader className="w-5 h-5 animate-spin"/> UPLOADING TO COMMAND...</>
                ) : (
                  <><Zap className="w-5 h-5" /> INITIATE PROTOCOL</>
                )}
              </span>
            </button>
          </motion.div>
        </motion.form>
        )}

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .will-change-transform { will-change: transform; transform: translateZ(0); }
      `}</style>
    </div>
  );
}
