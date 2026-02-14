"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, Fingerprint, Eye, Lock, Skull, Siren, 
  Terminal, ChevronRight, LogOut, Flame, Crosshair, Zap,
  Radar, Activity, MapPin, Power
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Head from "next/head";

// ============================================================================
// CONFIGURATION
// ============================================================================
const siteConfig = {
  identity: {
    name: "SANDNCO",
    domain: ".LOL",
  },
  hero: {
    line1: "MANUFACTURED",
    line2: "COINCIDENCES",
    subhead: "FARIDABAD’S PREMIERE BLACK-OPS ROMANCE SYNDICATE.",
    beta: "(SECURE TERMINAL // BETA PHASE)",
    manifesto: "WE DON'T FIND LOVE. WE FORCE IT. WE DON'T WAIT FOR BREAKUPS. WE ENGINEER THEM.",
  },
  liveFeed: [
    "⚠️ ALERT: CLIENT_892 INITIATED 'GHOSTING' PROTOCOL [SECTOR 15]",
    "👁️ SURVEILLANCE: TARGET SPOTTED AT 'WORLD STREET' [MATCH_CONFIRMED]",
    "💔 BREAKUP: SUCCESSFUL EVIDENCE PLANTING [NIT 3]",
    "💸 BILLING: WAIVED [PROMO_MARCH_12]",
    "🚓 POLICE SCAN: EVADING... EVADING... [CLEAN]",
  ],
  services: [
    {
      id: "breakup",
      title: "SCORCHED EARTH (BREAKUP)",
      price: "₹0",
      originalPrice: "₹999",
      icon: <Skull className="w-6 h-6" />,
      tagline: "TERMINATION PROTOCOL",
      desc: "We create the situation. You play the victim. Full alibi provision included.",
      features: ["Evidence Fabrication", "The 'Crazy Ex' Narrative", "3rd Party Intervention"],
      color: "text-red-500",
      border: "group-hover:border-red-500/50",
      bg: "group-hover:bg-red-950/20",
      hoverBg: "hover:bg-red-900/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(220,38,38,0.15)]"
    },
    {
      id: "patchup",
      title: "PSY-OP RECOVERY (PATCHUP)",
      price: "₹0",
      originalPrice: "₹1,499",
      icon: <Fingerprint className="w-6 h-6" />,
      tagline: "RESTORATION",
      desc: "Gaslighting? No. We call it 'Strategic Reality Distortion'.",
      features: ["Jealousy Engineering", "Staged Run-Ins", "Memory Manipulation"],
      color: "text-blue-500",
      border: "group-hover:border-blue-500/50",
      bg: "group-hover:bg-blue-950/20",
      hoverBg: "hover:bg-blue-900/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(59,130,246,0.15)]"
    },
    {
      id: "matchup",
      title: "FORCED FATE (MATCHUP)",
      price: "₹0",
      originalPrice: "₹1,999",
      icon: <Eye className="w-6 h-6" />,
      tagline: "AGGRESSIVE ACQUISITION",
      desc: "Consent is easier when we curate the choices using deep-web data.",
      features: ["Geo-Fenced Entrapment", "Financial Audits", "Social Engineering"],
      color: "text-emerald-500",
      border: "group-hover:border-emerald-500/50",
      bg: "group-hover:bg-emerald-950/20",
      hoverBg: "hover:bg-emerald-900/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]"
    },
    {
      id: "vip",
      title: "GOD COMPLEX (EXCLUSIVE)",
      price: "₹0",
      originalPrice: "₹2,700",
      icon: <Lock className="w-6 h-6" />,
      tagline: "TOTAL CONTROL",
      desc: "Full reality distortion field. We control the weather of your love life.",
      features: ["24/7 Surveillance", "Burner Phones", "NDA Required"],
      color: "text-purple-500",
      border: "group-hover:border-purple-500/50",
      bg: "group-hover:bg-purple-950/20",
      hoverBg: "hover:bg-purple-900/10",
      glow: "group-hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]"
    },
  ],
};

// ============================================================================
// 60FPS HARDWARE-ACCELERATED COMPONENTS
// ============================================================================

// Replaced heavy SVG filter with lightweight static noise for 60fps mobile
const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.15] mix-blend-overlay will-change-transform bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
);

const Scanlines = () => (
  <div className="fixed inset-0 pointer-events-none z-[6] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] will-change-transform" />
);

// High-Fidelity Kinetic Glitch Text
const KineticGlitch = ({ text }) => {
  return (
    <div className="relative inline-block group cursor-crosshair">
      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-gray-300 via-gray-500 to-gray-800 group-hover:text-white transition-colors duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-red-600 opacity-0 group-hover:opacity-100 transition-all duration-75 mix-blend-screen select-none pointer-events-none group-hover:animate-glitch-1">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-blue-600 opacity-0 group-hover:opacity-100 transition-all duration-75 mix-blend-screen select-none pointer-events-none group-hover:animate-glitch-2">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-white opacity-0 group-hover:opacity-100 transition-all duration-100 mix-blend-overlay select-none pointer-events-none group-hover:blur-[2px]">
        {text}
      </span>
    </div>
  );
};

// 60FPS Pure CSS Marquee
const PoliceTape = ({ text, direction = "left", rotate = "rotate-2" }) => (
  <div className={`w-[120%] -ml-[10%] bg-[#eab308] text-black py-3 font-black text-xl md:text-2xl uppercase tracking-[0.2em] overflow-hidden border-y-4 border-black ${rotate} shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative z-20 will-change-transform`}>
    <div className={`flex gap-10 whitespace-nowrap ${direction === "left" ? 'animate-marquee-left' : 'animate-marquee-right'}`}>
      {Array(15).fill(text).map((t, i) => (
        <span key={i} className="flex items-center gap-4">
          <ShieldAlert className="w-6 h-6 md:w-8 md:h-8" /> {t}
        </span>
      ))}
    </div>
  </div>
);

// ============================================================================
// MAIN PAGE ENGINE
// ============================================================================
export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [agreed, setAgreed] = useState(true); 
  const [progress, setProgress] = useState(0);

  const adRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!adRef.current) return;
    const rect = adRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  // AUTH & WAIVER CHECK (Once per 24hrs)
  useEffect(() => {
    const checkUserAndWaiver = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      const waiverKey = 'sandnco_waiver_accepted';
      const lastAccepted = localStorage.getItem(waiverKey);
      
      if (!lastAccepted) {
        setAgreed(false);
      } else {
        const now = new Date().getTime();
        const timeSince = now - parseInt(lastAccepted);
        if (timeSince > 86400000) {
          localStorage.removeItem(waiverKey);
          setAgreed(false);
        }
      }
    };
    
    checkUserAndWaiver();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!agreed) {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + Math.random() * 20;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [agreed]);

  const acceptWaiver = () => {
    localStorage.setItem('sandnco_waiver_accepted', new Date().getTime().toString());
    setAgreed(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.refresh();
  };

  // --------------------------------------------------------------------------
  // WAIVER SCREEN
  // --------------------------------------------------------------------------
  if (!agreed) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />
        <Scanlines />
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="text-6xl mb-8 grayscale opacity-50">
          👾
        </motion.div>
        <h2 className="text-3xl md:text-5xl font-black uppercase text-red-600 mb-6 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
          Liability Waiver
        </h2>
        <div className="max-w-lg w-full bg-black/60 border border-red-900/50 p-8 rounded-2xl text-left mb-10 backdrop-blur-md shadow-2xl relative z-10">
          <p className="text-xs md:text-sm font-mono text-red-400 leading-relaxed uppercase tracking-wider">
            WARNING: You are accessing <strong className="text-white">SANDNCO.LOL</strong>. By proceeding, you acknowledge that we are not responsible for broken hearts, restraining orders, or public humiliation. Our algorithms are aggressive. Our agents are anonymous.
          </p>
        </div>
        
        {progress < 100 ? (
          <div className="w-64 md:w-96 h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800 relative z-10">
            <div className="h-full bg-red-600 transition-all duration-75" style={{ width: `${progress}%` }} />
          </div>
        ) : (
          <button 
            onClick={acceptWaiver}
            className="px-10 py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(220,38,38,0.6)] rounded-xl border border-red-400 relative z-10"
          >
            Accept & Enter
          </button>
        )}
        <div className="mt-6 text-[10px] text-gray-600 font-mono tracking-widest relative z-10">
          ESTABLISHING SECURE UPLINK... {Math.min(100, Math.floor(progress))}%
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
        <title>SANDNCO.LOL | Black-Ops Romance</title>
        <link rel="icon" href="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=32" />
      </Head>

      <main className="bg-[#020205] text-gray-100 selection:bg-red-500 selection:text-black overflow-x-hidden font-sans relative">
        <NoiseOverlay />
        <Scanlines />

        {/* --- PREMIUM NAVBAR (Mobile Optimized) --- */}
        <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center bg-[#020205]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl will-change-transform">
            
            {/* Logo Group */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0">
              <img src="/logo.png" className="w-7 h-7 md:w-10 md:h-10 object-contain invert group-hover:rotate-12 transition-transform" alt="logo" />
              <span className="font-black text-lg md:text-2xl italic tracking-tighter text-white drop-shadow-md">
                SANDNCO<span className="text-red-600">.LOL</span>
              </span>
            </Link>

            {/* Navigation & Actions */}
            <div className="flex items-center gap-3 md:gap-8 text-[10px] md:text-xs font-mono tracking-widest uppercase font-bold">
              
              {/* Desktop Only Text Links */}
              <div className="hidden lg:flex gap-6 items-center mr-4">
                <Link href="#pricing"><span className="text-gray-400 hover:text-white transition-colors cursor-pointer">Pricing</span></Link>
                <Link href="/legal"><span className="text-gray-400 hover:text-white transition-colors cursor-pointer">Legal</span></Link>
              </div>
              
              {/* MINDER TACTICAL BADGE */}
              <Link href="/minder" className="group shrink-0">
                <span className="flex items-center justify-center gap-1.5 md:gap-2 text-pink-500 group-hover:text-white transition-colors border border-pink-500/50 bg-pink-900/20 px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.6)]">
                  <Crosshair className="w-3 h-3 md:w-4 md:h-4 animate-spin-slow" /> 
                  <span className="font-black hidden sm:inline">MINDER</span>
                </span>
              </Link>

              {/* Dynamic Auth Buttons */}
              {isLoggedIn ? (
                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                  <Link href="/dashboard">
                    <button className="flex items-center justify-center gap-2 bg-green-900/30 border border-green-500/50 text-green-400 px-3 md:px-4 py-1.5 md:py-2 hover:bg-green-500 hover:text-black transition-all rounded font-black shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                      <Terminal className="w-3 h-3 md:w-4 md:h-4" /> 
                      <span className="hidden sm:inline">DASHBOARD</span>
                    </button>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center justify-center text-red-500 hover:text-white border border-red-500/30 px-3 py-1.5 md:py-2 rounded hover:bg-red-600 transition-colors font-black">
                    <Power className="w-3 h-3 md:w-4 md:h-4" />
                    <span className="hidden sm:inline ml-2">LOGOUT</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Link href="/login">
                    <button className="bg-white text-black px-4 md:px-6 py-1.5 md:py-2 hover:bg-red-600 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] rounded hover:scale-105 active:scale-95 font-black">
                      LOGIN
                    </button>
                  </Link>
                </div>
              )}
            </div>
        </nav>

        {/* --- CRAZY CINEMATIC HERO SECTION --- */}
        <section className="relative min-h-[100dvh] flex flex-col justify-center items-center pt-24 px-4 overflow-hidden">
          
          {/* Animated 3D Cyber-Grid Floor */}
          <div className="absolute inset-0 z-0 opacity-30 pointer-events-none overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [transform:perspective(500px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] animate-grid-move will-change-transform" />
          </div>

          {/* Cinematic Scanning Laser */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
             <div className="w-full h-1 bg-red-500/50 shadow-[0_0_30px_rgba(220,38,38,1)] animate-laser-scan will-change-transform" />
          </div>

          <div className="relative z-20 text-center max-w-[1400px] w-full flex flex-col items-center">
            
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 border border-yellow-500/50 bg-yellow-900/20 rounded-full mb-8 md:mb-10 backdrop-blur-md shadow-[0_0_30px_rgba(234,179,8,0.3)]">
               <Siren className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 animate-pulse" />
               <span className="text-[9px] md:text-xs font-black tracking-[0.2em] text-yellow-400 uppercase">
                 COST WAIVER ACTIVE: FREE UNTIL MARCH 12
               </span>
            </div>

            <h1 className="text-[14vw] md:text-[10vw] leading-[0.85] font-black tracking-tighter mb-8 relative select-none w-full flex flex-col items-center justify-center">
               <span className="block text-white drop-shadow-[0_10px_30px_rgba(255,255,255,0.2)] mix-blend-screen">
                 {siteConfig.hero.line1}
               </span>
               <span className="block mt-2 md:mt-0">
                 <KineticGlitch text={siteConfig.hero.line2} />
               </span>
            </h1>

            <p className="text-xs md:text-xl font-black uppercase tracking-[0.3em] text-red-500 mb-3 drop-shadow-[0_0_10px_rgba(220,38,38,0.5)] max-w-3xl leading-relaxed px-4">
              {siteConfig.hero.subhead}
            </p>
            <p className="text-[9px] md:text-[10px] font-mono tracking-widest text-gray-500 mb-10 md:mb-12 uppercase bg-black/50 px-4 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
              {siteConfig.hero.beta}
            </p>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-center w-full max-w-2xl px-4">
              <Link href="/login?next=/request" className="w-full md:w-auto">
                  <button className="w-full md:w-auto px-8 md:px-10 py-4 md:py-5 bg-white text-black font-black text-sm md:text-base uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] rounded-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                    <Terminal className="w-4 h-4 md:w-5 md:h-5" /> INITIATE PROTOCOL
                  </button>
              </Link>
              <p className="text-[9px] md:text-xs font-mono text-gray-400 max-w-[280px] text-center md:text-left border-t md:border-t-0 md:border-l-2 border-gray-700 pt-4 md:pt-0 md:pl-6 leading-relaxed bg-black/40 md:bg-transparent p-3 md:p-0 rounded md:rounded-none">
                // {siteConfig.hero.manifesto}
              </p>
            </div>
          </div>

          {/* Deep Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[800px] bg-red-600/20 rounded-full blur-[100px] md:blur-[150px] pointer-events-none z-0 will-change-transform" />
        </section>

        {/* --- 60FPS CSS POLICE TAPE --- */}
        <div className="relative py-12 md:py-24 overflow-hidden bg-black/50 backdrop-blur-sm border-y border-white/5">
           <PoliceTape text="FREE SERVICES UNTIL MARCH 12 // BETA TESTING PHASE" rotate="rotate-2" direction="left" />
           <PoliceTape text="NO PAYMENTS REQUIRED // TOTAL ANONYMITY GUARANTEED" rotate="-rotate-1" direction="right" />
        </div>

        {/* --- 60FPS CSS LIVE KILL LOG --- */}
        <div className="w-full bg-[#050505] border-b border-white/10 py-4 overflow-hidden relative z-20 shadow-inner">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />
          <div className="flex gap-10 md:gap-20 whitespace-nowrap text-[10px] md:text-xs font-mono text-green-500 font-bold uppercase tracking-widest animate-marquee-left will-change-transform">
            {[...siteConfig.liveFeed, ...siteConfig.liveFeed, ...siteConfig.liveFeed].map((log, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-ping" /> {log}
              </span>
            ))}
          </div>
        </div>

        {/* --- THE PREMIER MINDER ADVERTISEMENT --- */}
        <section className="px-4 md:px-12 lg:px-20 py-24 md:py-32 max-w-[1600px] mx-auto relative z-20">
           <motion.div
             initial={{ opacity: 0, y: 50 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-pink-500/30 p-6 md:p-16 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden group shadow-[0_0_100px_rgba(219,39,119,0.15)]"
             onMouseMove={handleMouseMove}
             ref={adRef}
           >
             <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-pink-600/20 blur-[150px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50 will-change-transform" />

             <div className="flex flex-col lg:flex-row items-center justify-between gap-12 md:gap-16 relative z-10">
               
               {/* Content Side */}
               <div className="flex-1 text-center lg:text-left">
                 <div className="inline-flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 bg-pink-500/10 border border-pink-500/50 text-pink-400 text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase mb-6 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.3)]">
                   <Flame className="w-3 h-3 md:w-4 md:h-4 animate-pulse" /> PREMIER FEATURE
                 </div>
                 
                 <h2 className="text-5xl md:text-8xl font-black uppercase text-white mb-4 italic tracking-tighter drop-shadow-[0_0_30px_rgba(219,39,119,0.6)]">
                   MINDER<span className="text-pink-600">_</span>
                 </h2>
                 
                 <div className="inline-block bg-pink-950/40 border-l-4 border-pink-500 p-3 md:p-4 mb-6 md:mb-8 rounded-r-xl max-w-xl text-left shadow-md">
                    <p className="text-[9px] md:text-xs font-mono text-pink-300 font-bold uppercase tracking-widest leading-relaxed">
                      "Couldn't add the 'T' cuz we aren't rich enough and can't afford lawsuits n shit like that."
                    </p>
                 </div>

                 <p className="text-xs md:text-base text-gray-300 font-medium leading-relaxed max-w-xl mb-8 md:mb-10 mx-auto lg:mx-0 border-b border-white/10 pb-8 md:pb-10 text-left">
                   Welcome to the Black-Ops Meat Market. Browse targets. Log in to decrypt their exact Instagram coordinates. See someone you want? Don't just swipe—hit <strong className="text-pink-400 bg-pink-900/20 px-2 py-0.5 rounded border border-pink-500/30">FORCE MATCH</strong> and let our operatives engineer your serendipity.
                 </p>
                 
                 <Link href="/minder" className="block w-full md:w-auto">
                   <button className="w-full md:w-auto bg-pink-600 text-white font-black uppercase px-8 md:px-10 py-4 md:py-5 tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-[0_0_40px_rgba(219,39,119,0.6)] flex items-center justify-center gap-3 md:gap-4 hover:scale-105 active:scale-95 rounded-2xl border-2 border-pink-400 text-xs md:text-sm">
                     <Crosshair className="w-4 h-4 md:w-5 md:h-5" /> ENTER THE GRID
                   </button>
                 </Link>
               </div>

               {/* Interactive 3D Hologram Terminal (Desktop Only) */}
               <motion.div 
                 animate={{ 
                   rotateX: mousePos.y * -20, 
                   rotateY: mousePos.x * 20,
                   z: 50
                 }}
                 transition={{ type: "spring", stiffness: 100, damping: 30, mass: 1 }}
                 style={{ perspective: 1000 }}
                 className="hidden lg:flex w-[350px] h-[500px] bg-[#050505] border-2 border-pink-500/50 rounded-3xl relative overflow-hidden shadow-[0_0_80px_rgba(219,39,119,0.3)] items-center justify-center flex-col group/holo will-change-transform"
               >
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/20 to-transparent h-[200%] animate-[scan_2.5s_linear_infinite] pointer-events-none mix-blend-screen" />
                 <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
                  
                 <div className="absolute top-5 left-5 flex gap-2 items-center bg-black/60 px-3 py-1 rounded-full border border-pink-500/30 backdrop-blur-md">
                   <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                   <div className="text-[9px] font-black text-pink-500 uppercase tracking-widest">LIVE TRACKING</div>
                 </div>

                 <div className="absolute top-5 right-5">
                   <Radar className="w-6 h-6 text-pink-500 opacity-50 animate-spin" />
                 </div>

                 <div className="relative z-10 flex flex-col items-center transform translate-z-10 transition-transform duration-300 group-hover/holo:scale-110">
                   <Crosshair className="w-32 h-32 text-pink-500 opacity-30 drop-shadow-[0_0_20px_rgba(219,39,119,1)]" />
                   <div className="mt-8 text-pink-500 font-black text-6xl tracking-tighter border-8 border-pink-500 px-8 py-2 rotate-[-15deg] backdrop-blur-md bg-black/60 shadow-[0_0_50px_rgba(219,39,119,0.8)]">
                     SMASH
                   </div>
                 </div>

                 <div className="absolute bottom-8 w-full px-8 opacity-50">
                   <div className="h-4 w-40 bg-pink-900/80 rounded mb-3" />
                   <div className="h-2 w-24 bg-pink-900/50 rounded" />
                 </div>
               </motion.div>
             </div>
           </motion.div>
        </section>

        {/* --- THE MENU (SERVICES) --- */}
        <section id="pricing" className="px-4 md:px-12 lg:px-20 pb-32 md:pb-40 max-w-[1600px] mx-auto">
           <div className="mb-12 md:mb-24 text-center md:text-left">
              <h2 className="text-4xl md:text-7xl font-black uppercase text-white mb-4 md:mb-6 tracking-tighter drop-shadow-lg">
                Operational <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Menu</span>
              </h2>
              <p className="text-[9px] md:text-sm font-mono text-gray-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] bg-white/5 inline-block px-4 md:px-6 py-2 rounded-full border border-white/10 shadow-md">
                SECURE CONNECTION ESTABLISHED. SELECT OBJECTIVE.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8">
              {siteConfig.services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`group relative bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 md:p-10 min-h-[400px] md:min-h-[500px] flex flex-col justify-between transition-all duration-300 overflow-hidden ${service.hoverBg} ${service.glow}`}
                >
                  <div className={`absolute inset-0 border-2 border-transparent ${service.border} transition-colors duration-500 rounded-3xl pointer-events-none`} />
                  
                  <div className="relative z-10">
                     <div className={`mb-6 md:mb-8 p-3 md:p-4 bg-black w-fit rounded-2xl border border-white/5 shadow-lg ${service.color}`}>
                       {service.icon}
                     </div>
                     <h3 className="text-2xl md:text-3xl font-black uppercase italic mb-2 md:mb-3 text-white group-hover:translate-x-2 transition-transform duration-300">
                       {service.title}
                     </h3>
                     <div className={`text-[9px] md:text-xs font-black uppercase tracking-[0.2em] mb-4 md:mb-6 ${service.color}`}>
                       // {service.tagline}
                     </div>
                     <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-medium mb-6 md:mb-8">
                       {service.desc}
                     </p>
                     
                     <ul className="space-y-3 md:space-y-4 mb-8">
                       {service.features.map((feat, idx) => (
                         <li key={idx} className="text-[10px] md:text-xs font-bold text-gray-500 flex items-start gap-2 md:gap-3 uppercase tracking-wider">
                           <ChevronRight className={`w-3 h-3 md:w-4 md:h-4 shrink-0 ${service.color}`} /> {feat}
                         </li>
                       ))}
                     </ul>
                  </div>

                  <div className="relative z-10 mt-auto">
                    <div className="flex justify-between items-end border-t border-white/10 pt-6 md:pt-8">
                       <div>
                          <span className="text-[10px] md:text-xs text-red-500 line-through block font-black tracking-widest mb-1 opacity-70">
                            {service.originalPrice}
                          </span>
                          <span className="text-3xl md:text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            {service.price}
                          </span>
                       </div>
                       <Link href="/login?next=/request">
                          <button className="text-[10px] md:text-xs font-black uppercase bg-white text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl hover:bg-gray-300 transition-colors shadow-lg active:scale-95">
                          Select
                          </button>
                       </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* --- FLAGSHIP FOOTER --- */}
        <footer className="bg-black py-16 md:py-24 px-6 md:px-12 lg:px-20 border-t border-white/10 relative z-20">
          <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 gap-12 lg:gap-12">
             <div>
               <div className="flex items-center gap-4 mb-6 md:mb-8">
                 <img src="/logo.png" className="w-10 h-10 md:w-12 md:h-12 invert opacity-50" alt="logo" />
                 <h4 className="text-2xl md:text-4xl font-black italic text-gray-300 tracking-tighter">SANDNCO.LOL</h4>
               </div>
               <div className="space-y-3 text-[10px] md:text-sm font-black uppercase tracking-widest text-gray-600">
                  <p className="flex items-center gap-3"><MapPin className="w-3 h-3 md:w-4 md:h-4 text-red-500"/> LOCATION: UNDISCLOSED (SECTOR 16)</p>
                  <p className="flex items-center gap-3"><Activity className="w-3 h-3 md:w-4 md:h-4 text-red-500"/> STATUS: HUNTING</p>
                  <p className="flex items-center gap-3"><Lock className="w-3 h-3 md:w-4 md:h-4 text-red-500"/> ENCRYPTED: YES (AES-256)</p>
               </div>
             </div>
             
             <div className="flex flex-col lg:items-end justify-between">
               <div className="flex flex-wrap gap-4 md:gap-10 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-8 md:mb-12">
                 <Link href="/legal" className="hover:text-red-500 transition-colors">Terms</Link>
                 <Link href="/legal" className="hover:text-red-500 transition-colors">Privacy</Link>
                 <a href="https://instagram.com" className="hover:text-red-500 transition-colors">Instagram</a>
               </div>
               <p className="text-[9px] md:text-[10px] text-gray-700 max-w-md lg:text-right font-bold uppercase tracking-widest leading-relaxed border-t border-gray-900 pt-6">
                 DISCLAIMER: We are an entertainment service. Any resemblance to real-life stalking, emotional manipulation, or actual black-ops is purely coincidental. Please do not sue us. We have no money.
               </p>
             </div>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        /* Pure CSS 60FPS Marquees */
        @keyframes marqueeLeft {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes marqueeRight {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-marquee-left {
          animation: marqueeLeft 15s linear infinite;
          will-change: transform;
        }
        .animate-marquee-right {
          animation: marqueeRight 15s linear infinite;
          will-change: transform;
        }

        /* Moving Cyber Grid */
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 50px; }
        }
        .animate-grid-move {
          animation: grid-move 2s linear infinite;
        }

        /* Scanning Laser */
        @keyframes laser-scan {
          0% { transform: translateY(-10vh); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(110vh); opacity: 0; }
        }
        .animate-laser-scan {
          animation: laser-scan 4s ease-in-out infinite;
        }

        /* Violent Glitch Animations */
        @keyframes glitch1 {
          0% { transform: translate(0) }
          20% { transform: translate(-3px, 3px) }
          40% { transform: translate(-3px, -3px) }
          60% { transform: translate(3px, 3px) }
          80% { transform: translate(3px, -3px) }
          100% { transform: translate(0) }
        }
        @keyframes glitch2 {
          0% { transform: translate(0) }
          20% { transform: translate(3px, -3px) }
          40% { transform: translate(3px, 3px) }
          60% { transform: translate(-3px, -3px) }
          80% { transform: translate(-3px, 3px) }
          100% { transform: translate(0) }
        }
        .animate-glitch-1 { animation: glitch1 0.2s infinite; }
        .animate-glitch-2 { animation: glitch2 0.25s infinite; }

        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .will-change-transform { will-change: transform; }
      `}</style>
    </>
  );
}
