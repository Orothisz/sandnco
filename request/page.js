"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, Calendar, Instagram, Phone, Mail, User, HeartCrack, Heart, Search, Lock, CheckCircle, Loader, AlertTriangle, FileWarning } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { submitRequest } from "../actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Init Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function RequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Service Selection
  const [service, setService] = useState("breakup"); 
  
  // Dynamic States
  const [hasTarget, setHasTarget] = useState(false); // For Matchup
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Files
  const [userPhoto, setUserPhoto] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);

  // AUTH LOCK
  useEffect(() => {
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push("/login"); 
        } else {
            setUserEmail(user.email);
            setCheckingAuth(false);
        }
    };
    checkUser();
  }, []);

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
      
      // Upload Files
      const photoUrl = await uploadFile(userPhoto, "evidence");
      const paymentUrl = await uploadFile(paymentProof, "payments");
      
      if (photoUrl) formData.append("user_photo_url", photoUrl);
      if (paymentUrl) formData.append("payment_screenshot_url", paymentUrl);
      
      // Add Logic Flags
      formData.append("service", service);
      formData.append("has_specific_target", hasTarget);

      const result = await submitRequest(formData);
      
      if (result.success) setSuccess(true);
      else alert("SYSTEM ERROR: " + result.message);

    } catch (err) {
      alert("UPLOAD ERROR: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) return <div className="min-h-screen bg-black flex items-center justify-center text-green-500 font-mono">VERIFYING CLEARANCE...</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center p-6 text-center font-mono">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full border border-green-500/30 bg-green-900/10 p-8 rounded"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black text-white mb-2">PROTOCOL INITIATED</h1>
          <p className="text-gray-400 text-sm mb-6">
            Your request has been encrypted and sent to Command.
            <br/>An operative will contact you via the details provided.
          </p>
          <Link href="/dashboard">
            <button className="w-full bg-green-600 text-black font-bold py-3 hover:bg-white transition-colors uppercase tracking-widest">
              Track Status
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] text-gray-200 font-sans pb-20 selection:bg-red-500 selection:text-black">
      
      {/* HEADER */}
      <header className="px-6 py-4 border-b border-white/5 bg-[#050510] flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
         <span className="font-black italic text-xl">SANDNCO<span className="text-red-600">.LOL</span></span>
         <div className="text-[10px] font-mono text-gray-500 uppercase flex items-center gap-2">
           <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
           Agent: {userEmail}
         </div>
      </header>

      <main className="max-w-4xl mx-auto mt-8 px-4">
        
        <h1 className="text-4xl md:text-5xl font-black uppercase text-center mb-2 text-white">
          Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Parameters</span>
        </h1>
        <p className="text-center text-gray-500 font-mono text-xs mb-10">SELECT OBJECTIVE. PROVIDE INTEL. EXECUTE.</p>

        {/* SERVICE SELECTOR */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
                { id: "breakup", icon: <HeartCrack/>, label: "Break Up", color: "hover:border-red-500" },
                { id: "patchup", icon: <Heart/>, label: "Patch Up", color: "hover:border-blue-500" },
                { id: "matchup", icon: <Search/>, label: "Match Up", color: "hover:border-emerald-500" },
                { id: "exclusive", icon: <Lock/>, label: "Exclusive", color: "hover:border-purple-500" }
            ].map((s) => (
              <button 
                key={s.id}
                onClick={() => { setService(s.id); setHasTarget(false); }}
                className={`flex flex-col items-center justify-center p-6 border transition-all duration-300 ${
                    service === s.id 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                    : `bg-white/5 border-white/10 text-gray-500 ${s.color}`
                }`}
              >
                <div className="mb-3 scale-110">{s.icon}</div>
                <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
              </button>
            ))}
        </div>

        {/* --- EXCLUSIVE VIEW (NO FORM) --- */}
        {service === "exclusive" ? (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-purple-500/30 bg-purple-900/10 p-12 text-center rounded-lg backdrop-blur-sm">
                 <Lock className="w-16 h-16 text-purple-500 mx-auto mb-6" />
                 <h2 className="text-3xl font-black text-white mb-4">VIP CLEARANCE REQUIRED</h2>
                 <p className="text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                     This tier involves NDA signatures, 24/7 surveillance teams, and total reality fabrication. 
                     <br/><span className="text-purple-400 font-mono text-xs mt-2 block">STARTING BUDGET: ₹50,000+</span>
                 </p>
                 <div className="flex flex-col gap-4 max-w-xs mx-auto">
                     <a href="mailto:sandnco.lol@gmail.com" className="bg-purple-600 text-white py-4 font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all">
                         Contact Secure Channel
                     </a>
                     <a href="https://instagram.com/sandnco.lol" target="_blank" className="border border-purple-500 text-purple-400 py-4 font-bold uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all">
                         DM @sandnco.lol
                     </a>
                 </div>
             </motion.div>
        ) : (
        
        /* --- DYNAMIC FORM --- */
        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="bg-[#0a0a15] border border-white/10 p-8 space-y-10 rounded-xl relative overflow-hidden shadow-2xl">
             
             {/* ---------------- SECTION 1: OPERATIVE DETAILS ---------------- */}
             <div className="relative">
                <div className="absolute -left-8 top-0 h-full w-1 bg-red-600" />
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-500"/> 1. Your Intel (Operative)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Your Phone (Mandatory)</label>
                        <input required name="user_phone" className="w-full bg-black/40 border border-white/10 p-4 text-sm focus:border-red-500 outline-none text-white font-mono" placeholder="+91..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-mono text-gray-500 uppercase">Your Instagram (Mandatory)</label>
                        <input required name="user_insta" className="w-full bg-black/40 border border-white/10 p-4 text-sm focus:border-red-500 outline-none text-white font-mono" placeholder="@username" />
                    </div>
                    
                    {/* MATCHUP: Needs User Photo */}
                    {service === "matchup" && (
                        <div className="col-span-full space-y-2 p-4 border border-emerald-500/20 bg-emerald-900/10 rounded">
                            <label className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-2">
                                <Camera className="w-3 h-3"/> Upload Your Recent Photo (Required for Algorithm)
                            </label>
                            <input type="file" required onChange={(e) => setUserPhoto(e.target.files[0])} className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:bg-emerald-600 file:text-black file:font-bold file:border-0 hover:file:bg-white cursor-pointer" />
                        </div>
                    )}
                </div>
             </div>

             {/* ---------------- SECTION 2: TARGET INTEL ---------------- */}
             <div className="relative border-t border-white/5 pt-8">
                <div className="absolute -left-8 top-8 h-full w-1 bg-blue-600" />
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-500"/> 2. Target Intel
                </h3>

                {/* MATCHUP TOGGLE */}
                {service === "matchup" && (
                    <div className="flex gap-4 mb-8 bg-white/5 p-2 w-fit rounded-lg">
                        <button type="button" onClick={() => setHasTarget(true)} className={`text-xs px-4 py-2 font-bold uppercase transition-all rounded ${hasTarget ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}>Specific Person</button>
                        <button type="button" onClick={() => setHasTarget(false)} className={`text-xs px-4 py-2 font-bold uppercase transition-all rounded ${!hasTarget ? "bg-white text-black" : "text-gray-500 hover:text-white"}`}>Random / Algorithm</button>
                    </div>
                )}

                {/* ALGORITHM MODE (No Target) */}
                {(!hasTarget && service === "matchup") ? (
                    <div className="p-6 bg-blue-900/20 border border-blue-500/30 text-blue-200 text-xs font-mono leading-relaxed rounded">
                        <strong>STATUS: BLIND MATCHMAKING ACTIVE.</strong><br/><br/>
                        Our algorithm will scan Instagram databases, mutual connections, and sector-specific data to find a compatible match based on your "Preferences" below.
                    </div>
                ) : (
                    // TARGET FORM
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Target Name</label>
                            <input required name="target_name" className="w-full bg-black/40 border border-white/10 p-4 text-sm focus:border-blue-500 outline-none text-white font-mono" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Target Instagram</label>
                            <input required name="target_insta" className="w-full bg-black/40 border border-white/10 p-4 text-sm focus:border-blue-500 outline-none text-white font-mono" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Target Phone</label>
                            <input required name="target_phone" className="w-full bg-black/40 border border-white/10 p-4 text-sm focus:border-blue-500 outline-none text-white font-mono" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Target Email (Optional)</label>
                            <input name="target_email" type="email" className="w-full bg-black/40 border border-white/10 p-4 text-sm focus:border-blue-500 outline-none text-white font-mono" />
                        </div>
                    </div>
                )}
             </div>

             {/* ---------------- SECTION 3: MISSION LOGISTICS ---------------- */}
             <div className="relative border-t border-white/5 pt-8">
                <div className="absolute -left-8 top-8 h-full w-1 bg-yellow-500" />
                <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <FileWarning className="w-4 h-4 text-yellow-500"/> 3. Logistics & Details
                </h3>
                
                {/* BREAKUP SPECIFICS */}
                {service === "breakup" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Reason for Termination</label>
                            <select name="reason" className="w-full bg-black/40 border border-white/10 p-4 text-sm focus:border-yellow-500 outline-none text-white font-mono appearance-none">
                                <option>Boredom / Lost Spark</option>
                                <option>Found Someone Else</option>
                                <option>They are Toxic</option>
                                <option>Just want to be single</option>
                                <option>Other (Specify in notes)</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-mono text-gray-500 uppercase">Deadline (Ideal)</label>
                            <input type="date" name="deadline" className="w-full bg-black/40 border border-white/10 p-4 text-sm text-gray-400 focus:border-yellow-500 outline-none font-mono" />
                        </div>
                    </div>
                )}

                {/* DETAILS TEXTAREA */}
                <div className="space-y-2">
                    <label className="text-[10px] font-mono text-gray-500 uppercase">
                        {service === "matchup" && !hasTarget ? "Describe Your Type / Preferences" : "Additional Operational Notes"}
                    </label>
                    <textarea 
                        name="details" 
                        required 
                        className="w-full bg-black/40 border border-white/10 p-4 text-sm focus:border-yellow-500 outline-none text-white font-mono resize-none" 
                        rows="4" 
                        placeholder={service === "matchup" ? "E.g., Tall, artistic, lives in Sector 15, hates cats..." : "Any specific instructions? Time of day to call? Alibis needed?"} 
                    />
                </div>
                
                {/* PAYMENT PROOF */}
                <div className="pt-6 mt-6 border-t border-white/5">
                   <div className="flex items-center justify-between p-4 border border-dashed border-white/10 hover:border-white/30 rounded cursor-pointer transition-colors" onClick={() => document.getElementById('pay_upload').click()}>
                      <span className="text-xs font-mono text-gray-400 uppercase flex items-center gap-3">
                          <Upload className="w-4 h-4" /> 
                          {paymentProof ? <span className="text-green-500 font-bold">{paymentProof.name}</span> : "Upload Payment Screenshot (Optional)"}
                      </span>
                   </div>
                   <input id="pay_upload" type="file" className="hidden" onChange={(e) => setPaymentProof(e.target.files[0])} />
                </div>
             </div>

             {/* ---------------- SECTION 4: LEGAL BINDING ---------------- */}
             <div className="bg-red-900/10 border border-red-900/30 p-4 rounded flex items-start gap-4">
                <input 
                    type="checkbox" 
                    id="legal_check" 
                    className="mt-1 w-4 h-4 accent-red-600"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                />
                <label htmlFor="legal_check" className="text-[10px] text-gray-400 font-mono leading-relaxed cursor-pointer select-none">
                    I ACKNOWLEDGE THAT SANDNCO IS AN ENTERTAINMENT SERVICE. I UNDERSTAND THE RISKS INVOLVED IN RELATIONSHIP ARBITRAGE. I AGREE THAT ANY PSYCHOLOGICAL DAMAGE, BREAKUPS, OR UNINTENDED MARRIAGES ARE MY SOLE RESPONSIBILITY. 
                    <Link href="/legal" className="text-red-500 underline ml-1 hover:text-white">READ FULL TERMS.</Link>
                </label>
             </div>

          </div>

          <button 
            type="submit" 
            disabled={loading || !termsAgreed}
            className="w-full bg-white text-black font-black uppercase py-5 text-xl tracking-tighter hover:bg-red-600 hover:text-white transition-all shadow-[0_0_50px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? <Loader className="w-6 h-6 animate-spin"/> : "INITIATE PROTOCOL"}
          </button>
        </form>
        )}

      </main>
    </div>
  );
}
