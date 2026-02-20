"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  ShieldAlert, Fingerprint, Eye, Lock, Skull, Activity, 
  Terminal, ChevronRight, Flame, Crosshair, Zap, Radar, 
  MapPin, CheckCircle, Power, ArrowRight, Database, 
  Network, Cpu, Code2, Layers
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Head from "next/head";

// ============================================================================
// THE CORPORATE CATALOG (DYSTOPIAN STARTUP COPY)
// ============================================================================
const siteConfig = {
  hero: {
    line1: "PREDICTIVE",
    line2: "SERENDIPITY.",
    subhead: "Optimizing human alignment through ruthless efficiency and deterministic data modeling.",
    beta: "SECURE TERMINAL // SYSTEM V4.0",
  },
  liveFeed: [
    "DATA INGESTION: 450MB/s [NODE_12]",
    "STATUS: CANDIDATE ENDORSED [SECTOR 15]",
    "TRANSACTION VERIFIED: ASSET SEVERANCE",
    "ALGORITHM: REAL-TIME BIAS TRAINING ACTIVE",
    "NETWORK: AES-256 ENCRYPTION NOMINAL",
  ],
  services: [
    {
      id: "breakup",
      title: "Asset Severance",
      price: "₹0",
      originalPrice: "₹999",
      badge: "NULLIFICATION",
      icon: <Skull className="w-6 h-6 md:w-8 md:h-8" />,
      desc: "Clean, untraceable disengagement. We execute the termination protocol; you retain total deniability.",
      features: ["Evidence Synthesis", "Mediation Routing"],
      color: "text-rose-500",
      bgHover: "group-hover:bg-rose-500/10",
      glowColor: "rgba(244, 63, 94, 0.4)",
      borderColor: "border-rose-500/30",
      colSpan: "md:col-span-2 lg:col-span-2",
    },
    {
      id: "patchup",
      title: "State Restoration",
      price: "₹0",
      originalPrice: "₹1,499",
      badge: "RECOVERY",
      icon: <Network className="w-6 h-6 md:w-8 md:h-8" />,
      desc: "Algorithmic memory optimization and social re-engagement routing.",
      features: ["Behavioral Nudging", "Asset Re-acquisition"],
      color: "text-blue-500",
      bgHover: "group-hover:bg-blue-500/10",
      glowColor: "rgba(59, 130, 246, 0.4)",
      borderColor: "border-blue-500/30",
      colSpan: "md:col-span-1 lg:col-span-1",
    },
    {
      id: "matchup",
      title: "Deterministic Pairing",
      price: "₹0",
      originalPrice: "₹1,999",
      badge: "ACQUISITION",
      icon: <Cpu className="w-6 h-6 md:w-8 md:h-8" />,
      desc: "Curated local alignment targeting using aggregated biometric data.",
      features: ["Geo-Fenced Syncing", "Profile Optimization"],
      color: "text-emerald-500",
      bgHover: "group-hover:bg-emerald-500/10",
      glowColor: "rgba(16, 185, 129, 0.4)",
      borderColor: "border-emerald-500/30",
      colSpan: "md:col-span-1 lg:col-span-1",
    },
    {
      id: "vip",
      title: "The Black Box Tier",
      price: "₹0",
      originalPrice: "₹2,700",
      badge: "CLASSIFIED",
      icon: <Lock className="w-6 h-6 md:w-8 md:h-8" />,
      desc: "Full-spectrum reality distortion. We manipulate the variables. You just arrive at the coordinates.",
      features: ["24/7 Oversight", "NDA Mandated", "Zero Footprint"],
      color: "text-purple-500",
      bgHover: "group-hover:bg-purple-500/10",
      glowColor: "rgba(168, 85, 247, 0.4)",
      borderColor: "border-purple-500/30",
      colSpan: "md:col-span-2 lg:col-span-2",
    },
  ],
};

// ============================================================================
// 60FPS HARDWARE-ACCELERATED COMPONENTS
// ============================================================================
const NoiseOverlay = () => <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.08] mix-blend-screen hw-accel bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />;

// High-End RGB Split Text (Sleek Startup Glitch)
const RGBSplitText = ({ text }) => {
  return (
    <div className="relative inline-block group hw-accel cursor-crosshair">
      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 group-hover:text-white transition-colors duration-300">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 mix-blend-screen pointer-events-none translate-x-[-3px] translate-y-[2px] hw-accel">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 mix-blend-screen pointer-events-none translate-x-[3px] translate-y-[-2px] hw-accel">
        {text}
      </span>
    </div>
  );
};

// ============================================================================
// MAIN PAGE ENGINE
// ============================================================================
export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [agreed, setAgreed] = useState(true); 
  const [progress, setProgress] = useState(0);
  const [gridLoading, setGridLoading] = useState(false);

  // HYPER-SPEED NAVIGATION ENGINE
  const handleGridNav = useCallback(() => {
    if (gridLoading) return;
    setGridLoading(true);
    router.push('/minder');
  }, [gridLoading, router]);

  useEffect(() => {
    const checkUserAndWaiver = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      const waiverKey = 'sandnco_waiver_accepted';
      const lastAccepted = localStorage.getItem(waiverKey);
      if (!lastAccepted) setAgreed(false);
      else if (new Date().getTime() - parseInt(lastAccepted) > 86400000) setAgreed(false);
    };
    checkUserAndWaiver();
  }, [supabase]);

  useEffect(() => {
    if (!agreed) {
      const timer = setInterval(() => {
        setProgress(p => (p >= 100 ? 100 : p + Math.random() * 20));
      }, 40);
      return () => clearInterval(timer);
    }
  }, [agreed]);

  // --------------------------------------------------------------------------
  // WAIVER SCREEN (Corporate Compliance Popup)
  // --------------------------------------------------------------------------
  if (!agreed) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#020202] flex flex-col items-center justify-center p-6 text-center select-none hw-layer">
        <NoiseOverlay />
        <div className="max-w-md w-full bg-[#0a0a0c] border border-white/10 p-10 rounded-[2rem] shadow-[0_20px_80px_rgba(0,0,0,0.9)] relative z-10 hw-accel">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/10">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-black uppercase text-white mb-3 tracking-tight">Access Restricted</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-8 font-medium">
            SANDNCO is a satirical interactive data experiment. By engaging with this terminal, you accept all simulated operational risks. We claim zero liability for algorithmically bruised egos.
          </p>
          
          {progress < 100 ? (
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
              <div className="h-full bg-white transition-all duration-75" style={{ width: `${progress}%`, transform: 'translateZ(0)' }} />
            </div>
          ) : (
            <button onClick={() => { localStorage.setItem('sandnco_waiver_accepted', new Date().getTime().toString()); setAgreed(true); }} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest active:scale-95 transition-transform rounded-xl hover:bg-gray-200">
              Acknowledge & Proceed
            </button>
          )}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN HOMEPAGE
  // --------------------------------------------------------------------------
  return (
    <>
      <Head>
        <title>SANDNCO | Algorithmic Curation</title>
      </Head>

      <Link href="/minder" className="hidden" prefetch={true} />
      <NoiseOverlay />
      
      {/* 60FPS Ambient Aurora Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 hw-accel opacity-40">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-indigo-600/20 blur-[120px] animate-blob-float mix-blend-screen" />
        <div className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] rounded-full bg-pink-600/10 blur-[120px] animate-blob-float animation-delay-2000 mix-blend-screen" />
      </div>

      {/* --- SLEEK STARTUP NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#020202]/80 backdrop-blur-2xl border-b border-white/5 hw-layer">
        <Link href="/" className="flex items-center gap-3 hw-accel group">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg font-black text-lg group-hover:rotate-12 transition-transform">S</div>
          <span className="font-black text-xl tracking-tighter text-white">SANDNCO.</span>
        </Link>
        <div className="flex items-center gap-3 md:gap-6 hw-accel">
          
          <button onPointerDown={handleGridNav} disabled={gridLoading} className="group shrink-0 disabled:opacity-70">
            <span className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all text-[10px] md:text-xs font-black tracking-widest uppercase border ${gridLoading ? 'bg-white text-black border-white' : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'}`}>
              {gridLoading ? <Loader className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Layers className="w-3 h-3 md:w-4 md:h-4" />}
              <span className="hidden sm:inline">{gridLoading ? 'DECRYPTING...' : 'THE MINDER GRID'}</span>
            </span>
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/dashboard">
                <button className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-full font-black text-[10px] md:text-xs tracking-widest hover:bg-gray-200 transition-colors uppercase">
                  <Terminal className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">DASHBOARD</span>
                </button>
              </Link>
              <button onClick={handleLogout} className="flex items-center justify-center text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors border border-white/10 hover:bg-white/10">
                <Power className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-white text-black px-6 py-2 rounded-full font-black text-[10px] md:text-xs tracking-widest hover:bg-gray-200 transition-colors active:scale-95 uppercase">
                Login
              </button>
            </Link>
          )}
        </div>
      </nav>

      <main className="bg-[#020202] text-white overflow-x-hidden font-sans relative hw-main">
        
        {/* --- Y-COMBINATOR STYLE HERO SECTION --- */}
        <section className="relative min-h-[100dvh] flex flex-col justify-center items-center pt-24 px-6 overflow-hidden hw-layer">
          
          <div className="relative z-20 text-center max-w-[1200px] w-full flex flex-col items-center hw-accel">
            
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-black/50 border border-white/10 rounded-full mb-8 backdrop-blur-xl shadow-2xl">
               <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
               <span className="text-[9px] md:text-[10px] font-black tracking-[0.3em] text-gray-300 uppercase">{siteConfig.hero.beta}</span>
            </div>

            <h1 className="text-[13vw] md:text-[8vw] leading-[0.85] font-black tracking-tighter mb-8">
               <span className="block text-gray-400">{siteConfig.hero.line1}</span>
               <span className="block mt-1 md:mt-2"><RGBSplitText text={siteConfig.hero.line2} /></span>
            </h1>

            <p className="text-sm md:text-xl font-medium text-gray-400 mb-12 max-w-2xl leading-relaxed">
              {siteConfig.hero.subhead}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 relative z-30">
              <Link href="/login?next=/request" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-white text-black font-black text-xs md:text-sm uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                    DEPLOY PROTOCOL <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- CORPORATE TICKER --- */}
        <div className={`w-[120%] -ml-[10%] bg-white/5 border-y border-white/10 py-3 text-gray-400 font-mono text-[9px] md:text-[10px] uppercase tracking-[0.3em] overflow-hidden relative z-20 hw-accel hw-layer backdrop-blur-md`}>
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#020202] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#020202] to-transparent z-10" />
          <div className={`flex gap-12 whitespace-nowrap animate-marquee-left-3d hw-accel`}>
            {[...siteConfig.liveFeed, ...siteConfig.liveFeed].map((t, i) => (
              <span key={i} className="flex items-center gap-3 font-bold">
                <Database className="w-3 h-3 text-pink-500" /> {t}
              </span>
            ))}
          </div>
        </div>

        {/* --- THE BENTO BOX CATALOG (SAAS PRICING STYLE) --- */}
        <section id="pricing" className="px-6 md:px-12 lg:px-20 py-24 md:py-32 max-w-[1400px] mx-auto hw-layer">
           <div className="mb-16 text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter mb-4">
                Operational <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">Assets.</span>
              </h2>
              <p className="text-sm md:text-base font-medium text-gray-500">Select objective. Transfer data. Let the algorithm execute.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {siteConfig.services.map((service) => (
                <div 
                  key={service.id} 
                  className={`group relative bg-[#08080a] border border-white/10 rounded-[2rem] p-8 md:p-10 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-white/20 ${service.colSpan} hw-accel`}
                >
                  {/* Subtle Gradient Hover Injection */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-transparent to-${service.color.split('-')[1]}-900/10 hw-accel`} />
                  
                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-8">
                       <div className={`p-4 bg-white/5 rounded-2xl border border-white/10 ${service.color} group-hover:scale-110 transition-transform duration-300`}>
                         {service.icon}
                       </div>
                       <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${service.borderColor} ${service.color} bg-[#020202]`}>
                         {service.badge}
                       </span>
                     </div>
                     
                     <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-3">
                       {service.title}
                     </h3>
                     <p className="text-sm text-gray-400 leading-relaxed font-medium mb-8 max-w-sm">
                       {service.desc}
                     </p>
                     
                     <div className="space-y-3">
                       {service.features.map((feat, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                           <Code2 className={`w-4 h-4 ${service.color} opacity-70`} />
                           <span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest">{feat}</span>
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="relative z-10 mt-12 pt-6 border-t border-white/10 flex justify-between items-end">
                     <div>
                        <span className="text-[10px] text-gray-500 line-through block font-black tracking-widest mb-1">{service.originalPrice}</span>
                        <span className="text-3xl md:text-4xl font-black text-white">{service.price}</span>
                     </div>
                     <Link href="/login?next=/request">
                        <button className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-gray-200 transition-colors active:scale-95 flex items-center gap-2 shadow-lg">
                          Initiate <ArrowRight className="w-3 h-3" />
                        </button>
                     </Link>
                  </div>
                </div>
              ))}
           </div>
        </section>

        {/* --- THE MINDER GRID SAAS SHOWCASE --- */}
        <section className="px-6 md:px-12 lg:px-20 pb-24 md:pb-32 max-w-[1400px] mx-auto hw-layer">
           <div className="bg-[#050505] border border-white/10 p-8 md:p-16 rounded-[3rem] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-16 shadow-2xl hw-accel group">
             
             {/* Dynamic Mesh Background inside card */}
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none mix-blend-screen" />
             <div className="absolute -bottom-[50%] -right-[20%] w-[80%] h-[100%] bg-pink-600/10 blur-[100px] pointer-events-none rounded-full group-hover:bg-pink-600/20 transition-colors duration-700" />

             {/* Text Content */}
             <div className="flex-1 text-center lg:text-left relative z-10">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[9px] font-black tracking-[0.3em] uppercase mb-6 rounded-full">
                 <Network className="w-3 h-3" /> BEHAVIORAL ENGINE
               </div>
               
               <h2 className="text-5xl md:text-7xl font-black uppercase text-white mb-6 tracking-tighter">
                 THE MINDER <span className="text-pink-500 italic">GRID.</span>
               </h2>
               
               <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10">
                 The global candidate registry. Upload your biometric profile. Evaluate the demographic. <span className="text-white font-bold">Endorse</span> to align. <span className="text-gray-500 font-bold">Redact</span> to reject. Train the algorithm with your bias.
               </p>
               
               <button onPointerDown={handleGridNav} disabled={gridLoading} className="w-full sm:w-auto bg-white text-black font-black uppercase px-8 py-5 tracking-[0.2em] rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-70 mx-auto lg:mx-0 text-[10px] md:text-xs">
                 {gridLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} 
                 {gridLoading ? 'ESTABLISHING UPLINK...' : 'ACCESS THE DIRECTORY'}
               </button>
             </div>

             {/* Minimalist UI Graphic representation */}
             <div className="hidden lg:flex relative w-[320px] h-[480px] bg-[#020202] border border-white/10 rounded-[2.5rem] p-4 shadow-2xl rotate-[2deg] group-hover:rotate-0 transition-transform duration-700 hw-accel flex-col">
                <div className="w-full h-full bg-[#0a0a0c] rounded-[1.5rem] overflow-hidden relative border border-white/5 flex flex-col">
                  {/* Fake Image Area */}
                  <div className="flex-1 bg-gradient-to-b from-gray-900 to-black relative">
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                       <span className="text-[8px] text-white font-mono uppercase tracking-widest">Target_Active</span>
                    </div>
                  </div>
                  {/* Fake Controls */}
                  <div className="h-32 bg-[#050505] border-t border-white/5 p-4 flex flex-col gap-3 justify-end pb-6">
                    <div className="h-3 w-1/2 bg-white/20 rounded-full" />
                    <div className="h-2 w-3/4 bg-white/10 rounded-full mb-2" />
                    <div className="flex gap-2">
                      <div className="flex-1 h-10 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center"><span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">[ REDACT ]</span></div>
                      <div className="flex-1 h-10 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center"><span className="text-[8px] font-mono text-white uppercase tracking-widest">[ ENDORSE ]</span></div>
                    </div>
                  </div>
                </div>
             </div>
           </div>
        </section>

        {/* --- COMPLIANCE FOOTER --- */}
        <footer className="bg-[#020202] py-16 px-6 md:px-12 lg:px-20 border-t border-white/5 relative z-20 hw-layer">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
             
             <div className="text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                 <div className="w-6 h-6 bg-white text-black flex items-center justify-center rounded font-black text-xs">S</div>
                 <h4 className="text-xl font-black tracking-tighter text-white">SANDNCO.LOL</h4>
               </div>
               <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest">Algorithmic Matchmaking Division.</p>
             </div>
             
             <div className="flex flex-col items-center md:items-end gap-6">
               <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-500">
                 <Link href="/legal" className="hover:text-white transition-colors">Compliance / TOS</Link>
                 <Link href="/legal" className="hover:text-white transition-colors">Data Privacy</Link>
                 <a href="https://instagram.com/sandnco.lol" className="hover:text-white transition-colors">IG Uplink</a>
               </div>
             </div>
          </div>
          
          <div className="max-w-[1400px] mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[8px] md:text-[9px] text-gray-700 uppercase tracking-widest font-bold leading-relaxed w-full">
            <p className="max-w-4xl text-center md:text-left">
              DISCLAIMER: SANDNCO IS AN INTERACTIVE SATIRICAL ENTERTAINMENT EXPERIENCE. NO REAL-WORLD OPERATIONS ARE CONDUCTED. STRICTLY 18+. ZERO TOLERANCE FOR ILLEGAL ACTIVITY OR THE SEXUALIZATION OF MINORS. ACCOUNTS VIOLATING SAFETY GUIDELINES WILL BE PURGED.
            </p>
            <p className="shrink-0">© {new Date().getFullYear()} SANDNCO SYSTEMS</p>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        /* HW Acceleration Utilities */
        .hw-accel { transform: translate3d(0,0,0); backface-visibility: hidden; will-change: transform; perspective: 1000px; }
        .hw-layer { contain: layout paint style; isolation: isolate; }
        .hw-main { isolation: isolate; transform: translateZ(0); }
        
        @keyframes marqueeLeft3D { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
        .animate-marquee-left-3d { animation: marqueeLeft3D 15s linear infinite; }

        @keyframes blobFloat {
          0% { transform: translate3d(0px, 0px, 0) scale(1); }
          33% { transform: translate3d(30px, -50px, 0) scale(1.1); }
          66% { transform: translate3d(-20px, 20px, 0) scale(0.9); }
          100% { transform: translate3d(0px, 0px, 0) scale(1); }
        }
        .animate-blob-float { animation: blobFloat 20s infinite ease-in-out alternate; }
        .animation-delay-2000 { animation-delay: 2s; }
      `}</style>
    </>
  );
}
