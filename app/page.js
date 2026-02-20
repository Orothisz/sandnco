"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  ShieldAlert, Fingerprint, Eye, Lock, Skull, Siren, 
  Terminal, ChevronRight, LogOut, Flame, Crosshair, Zap,
  Radar, Activity, MapPin, Power, ShoppingCart, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Head from "next/head";

// ============================================================================
// CONFIGURATION (THE CATALOG)
// ============================================================================
const siteConfig = {
  hero: {
    line1: "MANUFACTURED",
    line2: "COINCIDENCES.",
    subhead: "Faridabad's Premiere Black-Ops Romance Syndicate.",
    beta: "SECURE TERMINAL // v3.0 ONLINE",
  },
  liveFeed: [
    "📦 ORDER PLACED: PSY-OP RECOVERY [SECTOR 15]",
    "👁️ SYSTEM ALERt: MINDER TARGET MATCHED [NIT 3]",
    "💸 PAYMENT CLEARED: SCORCHED EARTH PROTOCOL",
    "🎯 TARGET ACQUIRED: VIP SURVEILLANCE INITIATED",
    "⚡ NETWORK: AES-256 ENCRYPTION STABLE",
  ],
  services: [
    {
      id: "breakup",
      title: "Scorched Earth",
      price: "₹0",
      originalPrice: "₹999",
      badge: "TERMINATION",
      icon: <Skull className="w-8 h-8" />,
      desc: "We create the situation. You play the victim. Full alibi provision included.",
      features: ["Evidence Fabrication", "3rd Party Intervention"],
      color: "text-red-500",
      bgHover: "hover:bg-red-500/10",
      glowColor: "rgba(239, 68, 68, 0.4)",
      borderColor: "border-red-500/30",
    },
    {
      id: "patchup",
      title: "Psy-Op Recovery",
      price: "₹0",
      originalPrice: "₹1,499",
      badge: "RESTORATION",
      icon: <Fingerprint className="w-8 h-8" />,
      desc: "Gaslighting? No. We call it 'Strategic Reality Distortion'. Get them back.",
      features: ["Jealousy Engineering", "Memory Manipulation"],
      color: "text-blue-500",
      bgHover: "hover:bg-blue-500/10",
      glowColor: "rgba(59, 130, 246, 0.4)",
      borderColor: "border-blue-500/30",
    },
    {
      id: "matchup",
      title: "Forced Fate",
      price: "₹0",
      originalPrice: "₹1,999",
      badge: "ACQUISITION",
      icon: <Eye className="w-8 h-8" />,
      desc: "Consent is easier when we curate the choices using deep-web data targeting.",
      features: ["Geo-Fenced Entrapment", "Social Engineering"],
      color: "text-emerald-500",
      bgHover: "hover:bg-emerald-500/10",
      glowColor: "rgba(16, 185, 129, 0.4)",
      borderColor: "border-emerald-500/30",
    },
    {
      id: "vip",
      title: "God Complex",
      price: "₹0",
      originalPrice: "₹2,700",
      badge: "EXCLUSIVE",
      icon: <Lock className="w-8 h-8" />,
      desc: "Full reality distortion field. We control the weather of your love life.",
      features: ["24/7 Surveillance", "NDA Required"],
      color: "text-purple-500",
      bgHover: "hover:bg-purple-500/10",
      glowColor: "rgba(168, 85, 247, 0.4)",
      borderColor: "border-purple-500/30",
    },
  ],
};

// ============================================================================
// 60FPS HARDWARE-ACCELERATED COMPONENTS
// ============================================================================
const NoiseOverlay = () => <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.15] mix-blend-overlay hw-accel bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />;
const Scanlines = () => <div className="fixed inset-0 pointer-events-none z-[6] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] hw-accel" />;

const LiveTicker = ({ text }) => (
  <div className={`w-[120%] -ml-[10%] bg-white text-black py-2 font-black text-xs md:text-sm uppercase tracking-widest overflow-hidden border-y border-white/20 relative z-20 hw-accel hw-layer shadow-[0_0_20px_rgba(255,255,255,0.2)]`}>
    <div className={`flex gap-8 whitespace-nowrap animate-marquee-left-3d hw-accel`}>
      {Array(15).fill(text).map((t, i) => (
        <span key={i} className="flex items-center gap-3">
          <Activity className="w-4 h-4 text-red-600" /> {t}
        </span>
      ))}
    </div>
  </div>
);

// High-End RGB Split Text (Replacing the messy glitch for a cleaner startup vibe)
const RGBSplitText = ({ text }) => {
  return (
    <div className="relative inline-block group hw-accel">
      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 group-hover:text-white transition-colors duration-300">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 mix-blend-screen pointer-events-none translate-x-[-2px] translate-y-[2px] hw-accel">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 mix-blend-screen pointer-events-none translate-x-[2px] translate-y-[-2px] hw-accel">
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
  // WAIVER SCREEN (TOS Popup Style)
  // --------------------------------------------------------------------------
  if (!agreed) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center p-6 text-center select-none hw-layer">
        <Scanlines />
        <div className="max-w-md w-full bg-[#0a0a0f] border border-white/10 p-10 rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative z-10 hw-accel">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-black uppercase text-white mb-4 tracking-tight">Terms of Service</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-8 font-medium">
            SANDNCO.LOL operates in a legally gray area. By accessing this platform, you assume all liability for emotional, psychological, or social damages incurred. Our algorithms execute without empathy.
          </p>
          
          {progress < 100 ? (
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden relative">
              <div className="h-full bg-red-600" style={{ width: `${progress}%`, transform: 'translateZ(0)' }} />
            </div>
          ) : (
            <button onClick={() => { localStorage.setItem('sandnco_waiver_accepted', new Date().getTime().toString()); setAgreed(true); }} className="w-full py-4 bg-white text-black font-black uppercase tracking-widest active:scale-95 transition-transform rounded-xl hover:bg-gray-200">
              I Accept the Risks
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
        <title>SANDNCO | Order Engineered Serendipity</title>
      </Head>

      <Link href="/minder" className="hidden" prefetch={true} />
      <NoiseOverlay />
      <Scanlines />

      {/* --- SLEEK STARTUP NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#050505]/70 backdrop-blur-2xl border-b border-white/5 hw-layer">
        <Link href="/" className="flex items-center gap-3 hw-accel">
          <img src="/logo.png" className="w-8 h-8 invert" alt="logo" />
          <span className="font-black text-xl tracking-tighter text-white">SANDNCO</span>
        </Link>
        <div className="flex items-center gap-3 md:gap-6 hw-accel">
          
          <button onPointerDown={handleGridNav} disabled={gridLoading} className="group shrink-0 disabled:opacity-70">
            <span className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all text-xs font-black tracking-widest ${gridLoading ? 'bg-pink-600 text-white' : 'bg-pink-500/10 text-pink-500 hover:bg-pink-500/20'}`}>
              {gridLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
              <span className="hidden sm:inline">{gridLoading ? 'DECRYPTING' : 'MINDER GRID'}</span>
            </span>
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/dashboard">
                <button className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-full font-black text-xs tracking-widest hover:bg-gray-200 transition-colors">
                  <Terminal className="w-4 h-4" /> <span className="hidden sm:inline">DASHBOARD</span>
                </button>
              </Link>
              <button onClick={handleLogout} className="flex items-center justify-center text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors">
                <Power className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-white text-black px-6 py-2 rounded-full font-black text-xs tracking-widest hover:bg-gray-200 transition-colors active:scale-95">
                LOGIN
              </button>
            </Link>
          )}
        </div>
      </nav>

      <main className="bg-[#050505] text-white overflow-x-hidden font-sans relative hw-main">
        
        {/* --- PREMIUM HERO SECTION --- */}
        <section className="relative min-h-[90dvh] flex flex-col justify-center items-center pt-20 px-6 overflow-hidden hw-layer">
          
          {/* Subtle Glowing Orb instead of messy grid */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none z-0 hw-accel" />

          <div className="relative z-20 text-center max-w-[1200px] w-full flex flex-col items-center hw-accel">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
               <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">{siteConfig.hero.beta}</span>
            </div>

            <h1 className="text-[12vw] md:text-[8vw] leading-[0.9] font-black tracking-tighter mb-6">
               <span className="block text-gray-100">{siteConfig.hero.line1}</span>
               <span className="block mt-1"><RGBSplitText text={siteConfig.hero.line2} /></span>
            </h1>

            <p className="text-sm md:text-xl font-medium text-gray-400 mb-10 max-w-2xl leading-relaxed">
              {siteConfig.hero.subhead} Stop leaving your love life to chance. We engineer the outcome.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 relative z-30">
              <Link href="/login?next=/request" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black text-sm uppercase tracking-widest rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 hover:bg-gray-200 shadow-[0_0_40px_rgba(255,255,255,0.15)]">
                    BROWSE CATALOG <ArrowRight className="w-5 h-5" />
                  </button>
              </Link>
            </div>
          </div>
        </section>

        {/* --- E-COMMERCE LIVE FEED --- */}
        <LiveTicker text="LIVE ORDERS // SECURE ROUTING // NO REFUNDS // GUARANTEED RESULTS" />

        {/* --- THE STOREFRONT (SERVICES) --- */}
        <section id="pricing" className="px-6 md:px-12 lg:px-20 py-24 md:py-32 max-w-[1600px] mx-auto hw-layer">
           <div className="mb-16 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter mb-4">
                  The <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">Catalog</span>
                </h2>
                <p className="text-sm font-medium text-gray-500">Select your objective. Add to cart. We handle the rest.</p>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {siteConfig.services.map((service) => (
                <div key={service.id} className={`group relative bg-[#0a0a0f] border border-white/5 rounded-3xl p-8 min-h-[450px] flex flex-col justify-between overflow-hidden transition-all duration-300 ${service.bgHover} hw-accel`}>
                  
                  <div className="relative z-10">
                     <div className="flex justify-between items-start mb-8">
                       <div className={`p-4 bg-white/5 rounded-2xl border border-white/5 ${service.color}`}>
                         {service.icon}
                       </div>
                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${service.borderColor} ${service.color} bg-white/[0.02]`}>
                         {service.badge}
                       </span>
                     </div>
                     
                     <h3 className="text-3xl font-black uppercase tracking-tight text-white mb-3">
                       {service.title}
                     </h3>
                     <p className="text-sm text-gray-400 leading-relaxed font-medium mb-8">
                       {service.desc}
                     </p>
                     
                     <div className="space-y-3">
                       {service.features.map((feat, idx) => (
                         <div key={idx} className="flex items-center gap-3">
                           <CheckCircle className={`w-4 h-4 ${service.color}`} />
                           <span className="text-xs font-bold text-gray-300 uppercase tracking-wide">{feat}</span>
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="relative z-10 mt-10 pt-6 border-t border-white/10 flex justify-between items-end">
                     <div>
                        <span className="text-xs text-gray-500 line-through block font-black mb-1">{service.originalPrice}</span>
                        <span className="text-4xl font-black text-white">{service.price}</span>
                     </div>
                     <Link href="/login?next=/request">
                        <button className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors active:scale-90">
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                     </Link>
                  </div>
                </div>
              ))}
           </div>
        </section>

        {/* --- FLAGSHIP MINDER SHOWCASE --- */}
        <section className="px-6 md:px-12 lg:px-20 py-12 md:py-24 max-w-[1600px] mx-auto hw-layer">
           <div className="bg-gradient-to-br from-[#0a0a0f] to-[#110011] border border-pink-500/20 p-8 md:p-16 rounded-[3rem] relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-16 shadow-[0_20px_80px_rgba(219,39,119,0.1)] hw-accel">
             
             {/* Text Content */}
             <div className="flex-1 text-center lg:text-left relative z-10">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-pink-500/10 border border-pink-500/30 text-pink-400 text-[10px] font-black tracking-widest uppercase mb-6 rounded-full">
                 <Flame className="w-4 h-4" /> THE MEAT MARKET
               </div>
               
               <h2 className="text-5xl md:text-7xl font-black uppercase text-white mb-6 tracking-tighter">
                 MINDER<span className="text-pink-500">_</span>
               </h2>
               
               <p className="text-sm md:text-lg text-gray-300 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10">
                 Browse targets. Acquire intel. Execute the match. We took the algorithm out of the hands of tech giants and gave it to you. 
               </p>
               
               <button onPointerDown={handleGridNav} disabled={gridLoading} className="w-full sm:w-auto bg-pink-600 text-white font-black uppercase px-10 py-5 tracking-widest rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-3 disabled:opacity-70 mx-auto lg:mx-0 text-sm">
                 {gridLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Crosshair className="w-5 h-5" />} 
                 {gridLoading ? 'ESTABLISHING UPLINK...' : 'ENTER THE GRID'}
               </button>
             </div>

             {/* UI Mockup Graphic */}
             <div className="hidden md:flex relative w-[300px] h-[500px] bg-black border-[4px] border-gray-800 rounded-[3rem] p-2 shadow-2xl rotate-[-5deg] hover:rotate-0 transition-transform duration-500 hw-accel">
                <div className="w-full h-full bg-[#050505] rounded-[2.5rem] overflow-hidden relative border border-white/10">
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-black rounded-full z-20" />
                  <div className="absolute inset-0 bg-gradient-to-b from-pink-500/20 to-transparent opacity-50" />
                  <div className="absolute bottom-10 left-0 w-full px-6 text-center z-20">
                     <Crosshair className="w-20 h-20 text-pink-500 mx-auto mb-6 opacity-80" />
                     <div className="h-4 w-3/4 bg-white/20 rounded mx-auto mb-3" />
                     <div className="h-4 w-1/2 bg-white/10 rounded mx-auto" />
                  </div>
                </div>
             </div>
           </div>
        </section>

        {/* --- PREMIUM FOOTER --- */}
        <footer className="bg-[#050505] py-16 px-6 md:px-12 lg:px-20 border-t border-white/10 relative z-20 hw-layer">
          <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
             <div className="text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                 <img src="/logo.png" className="w-8 h-8 invert" alt="logo" />
                 <h4 className="text-2xl font-black tracking-tighter text-white">SANDNCO.LOL</h4>
               </div>
               <p className="text-xs text-gray-500 font-medium">Faridabad's Premiere Romance Syndicate.</p>
             </div>
             
             <div className="flex flex-col items-center md:items-end gap-6">
               <div className="flex gap-6 text-xs font-bold uppercase tracking-widest text-gray-400">
                 <Link href="/legal" className="hover:text-white transition-colors">Terms</Link>
                 <Link href="/legal" className="hover:text-white transition-colors">Privacy</Link>
                 <a href="https://instagram.com/sandnco.lol" className="hover:text-white transition-colors">Instagram</a>
               </div>
               <p className="text-[10px] text-gray-600 max-w-xs text-center md:text-right uppercase tracking-widest leading-relaxed">
                 ENTERTAINMENT SERVICE. ALL MISSIONS ARE CLASSIFIED. NO REFUNDS.
               </p>
             </div>
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
      `}</style>
    </>
  );
}
