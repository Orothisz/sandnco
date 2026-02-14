"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  ShieldAlert, Fingerprint, Eye, Lock, Skull, Siren, 
  Terminal, ChevronRight, LogOut, Flame, Crosshair, Zap
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
    location: "SECTOR 16, FARIDABAD",
    status: "OPERATIONAL",
  },
  hero: {
    line1: "MANUFACTURED",
    line2: "COINCIDENCES",
    subhead: "FARIDABAD’S PREMIERE BLACK-OPS ROMANCE SYNDICATE.",
    beta: "(website is unstable n under beta testing)",
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
// CINEMATIC COMPONENTS
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

const PoliceTape = ({ text, direction = "left", rotate = "rotate-2" }) => (
  <div className={`w-[120%] -ml-[10%] bg-[#eab308] text-black py-3 font-black text-xl md:text-2xl uppercase tracking-[0.2em] overflow-hidden border-y-4 border-black ${rotate} shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative z-20 will-change-transform`}>
    <motion.div 
      animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
      transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
      className="flex gap-10 whitespace-nowrap"
    >
      {Array(20).fill(text).map((t, i) => (
        <span key={i} className="flex items-center gap-4">
          <ShieldAlert className="w-6 h-6 md:w-8 md:h-8" /> {t}
        </span>
      ))}
    </motion.div>
  </div>
);

// High-Fidelity Kinetic Glitch Text
const KineticGlitch = ({ text }) => {
  return (
    <div className="relative inline-block group cursor-crosshair">
      {/* Base Text */}
      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-gray-500 via-gray-700 to-gray-900 group-hover:text-white transition-colors duration-300">
        {text}
      </span>
      
      {/* Glitch Layers (Only appear on hover/tap) */}
      <span className="absolute top-0 left-0 w-full h-full text-red-600 opacity-0 group-hover:opacity-100 group-hover:-translate-x-1 group-hover:translate-y-1 transition-all duration-75 mix-blend-screen select-none pointer-events-none">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-blue-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-75 mix-blend-screen select-none pointer-events-none">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-white opacity-0 group-hover:opacity-100 group-hover:translate-x-2 group-hover:blur-[2px] transition-all duration-100 mix-blend-overlay select-none pointer-events-none">
        {text}
      </span>
    </div>
  );
};

const PanicButton = () => {
  const [safeMode, setSafeMode] = useState(false);
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
    <button
      onClick={() => setSafeMode(true)}
      className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-red-600 rounded-full border-4 border-red-900 flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,0,0,0.6)] hover:scale-110 active:scale-95 transition-all group"
      title="PANIC: HIDE EVERYTHING"
    >
      <Eye className="w-6 h-6 group-hover:hidden" />
      <span className="hidden group-hover:block font-black text-xs">HIDE</span>
    </button>
  );
};

// ============================================================================
// MAIN PAGE ENGINE
// ============================================================================
export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  // Parallax Setup
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  // State
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [agreed, setAgreed] = useState(true); // Default true, checked in useEffect
  const [progress, setProgress] = useState(0);

  // 3D Mouse Tracking for Minder Ad
  const adRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!adRef.current) return;
    const rect = adRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  // 1. AUTH & WAIVER CHECK (Once per 24hrs)
  useEffect(() => {
    const checkUserAndWaiver = async () => {
      // Auth Check
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      // Waiver Logic (24 Hour Expiry)
      const waiverKey = 'sandnco_waiver_accepted';
      const lastAccepted = localStorage.getItem(waiverKey);
      
      if (!lastAccepted) {
        setAgreed(false);
      } else {
        const now = new Date().getTime();
        const timeSince = now - parseInt(lastAccepted);
        // 86400000 ms = 24 Hours
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

  // Loading bar for Waiver
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
  // WAIVER SCREEN (Rendered if not agreed today)
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
        <div className="max-w-lg w-full bg-black/60 border border-red-900/50 p-8 rounded-2xl text-left mb-10 backdrop-blur-md shadow-2xl">
          <p className="text-xs md:text-sm font-mono text-red-400 leading-relaxed uppercase tracking-wider">
            WARNING: You are accessing <strong className="text-white">SANDNCO.LOL</strong>. By proceeding, you acknowledge that we are not responsible for broken hearts, restraining orders, or public humiliation. Our algorithms are aggressive. Our agents are anonymous.
          </p>
        </div>
        
        {progress < 100 ? (
          <div className="w-64 md:w-96 h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
            <div className="h-full bg-red-600 transition-all duration-75" style={{ width: `${progress}%` }} />
          </div>
        ) : (
          <button 
            onClick={acceptWaiver}
            className="px-10 py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black hover:scale-105 active:scale-95 transition-all animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.6)] rounded-xl border border-red-400"
          >
            Accept & Enter
          </button>
        )}
        <div className="mt-6 text-[10px] text-gray-600 font-mono tracking-widest">
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

      <main className="bg-[#020205] text-gray-100 selection:bg-red-500 selection:text-black overflow-x-hidden font-sans">
        <NoiseOverlay />
        <Scanlines />
        <PanicButton />

        {/* --- PREMIUM NAVBAR --- */}
        <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-4 flex flex-wrap justify-between items-center bg-[#020205]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl">
            <div className="flex items-center gap-3">
              <img src="/logo.png" className="w-8 h-8 md:w-10 md:h-10 object-contain invert hover:rotate-12 transition-transform" alt="logo" />
              <span className="font-black text-xl md:text-2xl italic tracking-tighter text-white drop-shadow-md">
                {siteConfig.identity.name}<span className="text-red-600">{siteConfig.identity.domain}</span>
              </span>
            </div>

            <div className="flex items-center gap-4 md:gap-8 text-[10px] md:text-xs font-mono tracking-widest uppercase font-bold">
              <div className="hidden lg:flex gap-6 items-center">
                {/* PREMIER MINDER ADVERTISEMENT IN NAV */}
                <Link href="/minder" className="group">
                  <span className="flex items-center gap-2 text-pink-500 group-hover:text-white transition-colors border border-pink-500/50 bg-pink-900/20 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.3)]">
                    <Crosshair className="w-3 h-3 animate-spin-slow" /> MINDER GRID
                  </span>
                </Link>
                <Link href="#pricing"><span className="text-gray-400 hover:text-white transition-colors">Pricing</span></Link>
                <Link href="/legal"><span className="text-gray-400 hover:text-white transition-colors">Legal</span></Link>
              </div>
              
              {isLoggedIn ? (
                <div className="flex items-center gap-2 md:gap-4">
                  <Link href="/minder" className="lg:hidden">
                    <button className="bg-pink-600/20 border border-pink-500 text-pink-500 p-2 rounded-full"><Crosshair className="w-4 h-4" /></button>
                  </Link>
                  <Link href="/dashboard">
                    <button className="flex items-center gap-2 bg-green-900/30 border border-green-500/50 text-green-400 px-4 py-2 hover:bg-green-500 hover:text-black transition-all rounded">
                      <Terminal className="w-4 h-4" /> <span className="hidden sm:inline">DASHBOARD</span>
                    </button>
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-2 text-red-500 hover:text-white border border-red-500/30 px-4 py-2 rounded hover:bg-red-600 transition-colors">
                    <LogOut className="w-4 h-4" /> <span className="hidden sm:inline">LOGOUT</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link href="/minder" className="lg:hidden">
                    <button className="bg-pink-600/20 border border-pink-500 text-pink-500 p-2 rounded-full"><Crosshair className="w-4 h-4" /></button>
                  </Link>
                  <Link href="/login"><span className="hidden sm:inline text-gray-400 hover:text-white transition-colors">LOGIN</span></Link>
                  <Link href="/login">
                    <button className="bg-white text-black px-6 py-2 hover:bg-red-600 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)] rounded hover:scale-105 active:scale-95">
                      ENROLL
                    </button>
                  </Link>
                </div>
              )}
            </div>
        </nav>

        {/* --- CINEMATIC HERO SECTION --- */}
        <section className="relative min-h-[100dvh] flex flex-col justify-center items-center pt-20 px-4 overflow-hidden">
          <motion.div style={{ y, opacity }} className="relative z-10 text-center max-w-[1400px] w-full flex flex-col items-center">
            
            <div className="inline-flex items-center gap-3 px-5 py-2 border border-yellow-500/50 bg-yellow-900/20 rounded-full mb-10 backdrop-blur-md shadow-[0_0_30px_rgba(234,179,8,0.3)]">
               <Siren className="w-4 h-4 text-yellow-500 animate-pulse" />
               <span className="text-[10px] md:text-xs font-black tracking-[0.2em] text-yellow-400 uppercase">
                 COST WAIVER ACTIVE: FREE UNTIL MARCH 12
               </span>
            </div>

            <h1 className="text-[12vw] md:text-[10vw] leading-[0.85] font-black tracking-tighter mb-8 relative select-none w-full flex flex-col items-center justify-center">
               <span className="block text-white drop-shadow-[0_10px_30px_rgba(255,255,255,0.2)]">
                 {siteConfig.hero.line1}
               </span>
               <span className="block mt-2 md:mt-0">
                 {/* KINETIC GLITCH TEXT */}
                 <KineticGlitch text={siteConfig.hero.line2} />
               </span>
            </h1>

            <p className="text-sm md:text-xl font-black uppercase tracking-[0.3em] text-red-500 mb-2 drop-shadow-md max-w-3xl">
              {siteConfig.hero.subhead}
            </p>
            <p className="text-[9px] md:text-[10px] font-mono tracking-widest text-gray-500 mb-12 uppercase">
              {siteConfig.hero.beta}
            </p>

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-center w-full max-w-2xl">
              <Link href="/login?next=/request" className="w-full md:w-auto">
                  <button className="w-full md:w-auto px-10 py-5 bg-white text-black font-black text-sm md:text-base uppercase tracking-[0.2em] hover:bg-red-600 hover:text-white transition-all shadow-[0_0_50px_rgba(255,255,255,0.3)] rounded-xl hover:scale-105 active:scale-95 flex items-center justify-center gap-3">
                    <Terminal className="w-5 h-5" /> INITIATE PROTOCOL
                  </button>
              </Link>
              <p className="text-[10px] md:text-xs font-mono text-gray-500 max-w-[250px] text-center md:text-left border-t md:border-t-0 md:border-l-2 border-gray-800 pt-4 md:pt-0 md:pl-6 leading-relaxed">
                // {siteConfig.hero.manifesto}
              </p>
            </div>
          </motion.div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[1000px] md:h-[1000px] bg-red-600/10 rounded-full blur-[150px] pointer-events-none" />
        </section>

        {/* --- KINETIC POLICE TAPE --- */}
        <div className="relative py-16 md:py-24 overflow-hidden bg-black/50 backdrop-blur-sm border-y border-white/5">
           <PoliceTape text="FREE SERVICES UNTIL MARCH 12 // BETA TESTING PHASE" rotate="rotate-2" direction="left" />
           <PoliceTape text="NO PAYMENTS REQUIRED // TOTAL ANONYMITY GUARANTEED" rotate="-rotate-1" direction="right" />
        </div>

        {/* --- LIVE KILL LOG Ticker --- */}
        <div className="w-full bg-[#050505] border-b border-white/10 py-4 overflow-hidden relative z-20 shadow-inner">
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />
          <motion.div 
            className="flex gap-20 whitespace-nowrap text-[10px] md:text-xs font-mono text-green-500 font-bold uppercase tracking-widest"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
          >
            {[...siteConfig.liveFeed, ...siteConfig.liveFeed, ...siteConfig.liveFeed].map((log, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" /> {log}
              </span>
            ))}
          </motion.div>
        </div>

        {/* --- THE PREMIER MINDER ADVERTISEMENT --- */}
        <section className="px-4 md:px-12 lg:px-20 py-32 max-w-[1600px] mx-auto relative z-20">
           <motion.div
             initial={{ opacity: 0, y: 50 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8, ease: "easeOut" }}
             className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-pink-500/30 p-8 md:p-16 rounded-[3rem] relative overflow-hidden group shadow-[0_0_100px_rgba(219,39,119,0.15)]"
             onMouseMove={handleMouseMove}
             ref={adRef}
           >
             <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-pink-600/20 blur-[150px] pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />

             <div className="flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
               
               {/* Content Side */}
               <div className="flex-1 text-center lg:text-left">
                 <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-pink-500/10 border border-pink-500/50 text-pink-400 text-[10px] font-black tracking-[0.3em] uppercase mb-6 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.3)]">
                   <Flame className="w-4 h-4 animate-pulse" /> PREMIER FEATURE
                 </div>
                 
                 <h2 className="text-5xl md:text-8xl font-black uppercase text-white mb-4 italic tracking-tighter drop-shadow-[0_0_30px_rgba(219,39,119,0.6)]">
                   MINDER<span className="text-pink-600">_</span>
                 </h2>
                 
                 <div className="inline-block bg-pink-950/40 border-l-4 border-pink-500 p-4 mb-8 rounded-r-xl max-w-xl">
                    <p className="text-[10px] md:text-xs font-mono text-pink-300 font-bold uppercase tracking-widest leading-relaxed">
                      "Couldn't add the 'T' cuz we aren't rich enough and can't afford lawsuits n shit like that."
                    </p>
                 </div>

                 <p className="text-sm md:text-base text-gray-300 font-medium leading-relaxed max-w-xl mb-10 mx-auto lg:mx-0 border-b border-white/10 pb-10">
                   Welcome to the Black-Ops Meat Market. Browse targets. Log in to decrypt their exact Instagram coordinates. See someone you want? Don't just swipe—hit <strong className="text-pink-400 bg-pink-900/20 px-2 py-0.5 rounded border border-pink-500/30">FORCE MATCH</strong> and let our operatives engineer your serendipity.
                 </p>
                 
                 <Link href="/minder">
                   <button className="w-full md:w-auto bg-pink-600 text-white font-black uppercase px-10 py-5 tracking-[0.3em] hover:bg-white hover:text-black transition-all shadow-[0_0_40px_rgba(219,39,119,0.6)] flex items-center justify-center gap-4 hover:scale-105 active:scale-95 rounded-2xl border-2 border-pink-400">
                     <Crosshair className="w-5 h-5" /> ENTER THE GRID
                   </button>
                 </Link>
               </div>

               {/* Interactive 3D Hologram Terminal */}
               <motion.div 
                 animate={{ 
                   rotateX: mousePos.y * -20, 
                   rotateY: mousePos.x * 20,
                   z: 50
                 }}
                 transition={{ type: "spring", stiffness: 100, damping: 30, mass: 1 }}
                 style={{ perspective: 1000 }}
                 className="hidden lg:flex w-[350px] h-[500px] bg-[#050505] border-2 border-pink-500/50 rounded-3xl relative overflow-hidden shadow-[0_0_80px_rgba(219,39,119,0.3)] items-center justify-center flex-col group/holo"
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
        <section id="pricing" className="px-4 md:px-12 lg:px-20 pb-40 max-w-[1600px] mx-auto">
           <div className="mb-16 md:mb-24 text-center md:text-left">
              <h2 className="text-4xl md:text-7xl font-black uppercase text-white mb-6 tracking-tighter drop-shadow-lg">
                Operational <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Menu</span>
              </h2>
              <p className="text-xs md:text-sm font-mono text-gray-400 font-bold uppercase tracking-[0.3em] bg-white/5 inline-block px-6 py-2 rounded-full border border-white/10">
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
                  className={`group relative bg-[#0a0a0f] border border-white/10 rounded-3xl p-8 md:p-10 min-h-[500px] flex flex-col justify-between transition-all duration-300 overflow-hidden ${service.hoverBg} ${service.glow}`}
                >
                  <div className={`absolute inset-0 border-2 border-transparent ${service.border} transition-colors duration-500 rounded-3xl pointer-events-none`} />
                  
                  <div className="relative z-10">
                     <div className={`mb-8 p-4 bg-black w-fit rounded-2xl border border-white/5 shadow-lg ${service.color}`}>
                       {service.icon}
                     </div>
                     <h3 className="text-2xl md:text-3xl font-black uppercase italic mb-3 text-white group-hover:translate-x-2 transition-transform duration-300">
                       {service.title}
                     </h3>
                     <div className={`text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-6 ${service.color}`}>
                       // {service.tagline}
                     </div>
                     <p className="text-sm text-gray-400 leading-relaxed font-medium mb-8">
                       {service.desc}
                     </p>
                     
                     <ul className="space-y-4 mb-8">
                       {service.features.map((feat, idx) => (
                         <li key={idx} className="text-xs font-bold text-gray-500 flex items-start gap-3 uppercase tracking-wider">
                           <ChevronRight className={`w-4 h-4 shrink-0 ${service.color}`} /> {feat}
                         </li>
                       ))}
                     </ul>
                  </div>

                  <div className="relative z-10 mt-auto">
                    <div className="flex justify-between items-end border-t border-white/10 pt-8">
                       <div>
                          <span className="text-xs text-red-500 line-through block font-black tracking-widest mb-1 opacity-70">
                            {service.originalPrice}
                          </span>
                          <span className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                            {service.price}
                          </span>
                       </div>
                       <Link href="/login?next=/request">
                          <button className="text-xs font-black uppercase bg-white text-black px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors shadow-lg active:scale-95">
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
        <footer className="bg-black py-24 px-6 md:px-12 lg:px-20 border-t border-white/10 relative z-20">
          <div className="max-w-[1600px] mx-auto grid lg:grid-cols-2 gap-16 lg:gap-12">
             <div>
               <div className="flex items-center gap-4 mb-8">
                 <img src="/logo.png" className="w-12 h-12 invert opacity-50" alt="logo" />
                 <h4 className="text-3xl md:text-4xl font-black italic text-gray-300 tracking-tighter">SANDNCO.LOL</h4>
               </div>
               <div className="space-y-3 text-xs md:text-sm font-black uppercase tracking-widest text-gray-600">
                  <p className="flex items-center gap-3"><MapPin className="w-4 h-4 text-red-500"/> LOCATION: UNDISCLOSED (SECTOR 16)</p>
                  <p className="flex items-center gap-3"><Activity className="w-4 h-4 text-red-500"/> STATUS: HUNTING</p>
                  <p className="flex items-center gap-3"><Lock className="w-4 h-4 text-red-500"/> ENCRYPTED: YES (AES-256)</p>
               </div>
             </div>
             
             <div className="flex flex-col lg:items-end justify-between">
               <div className="flex flex-wrap gap-6 md:gap-10 text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-12">
                 <Link href="/legal" className="hover:text-red-500 transition-colors">Terms</Link>
                 <Link href="/legal" className="hover:text-red-500 transition-colors">Privacy</Link>
                 <a href="https://instagram.com" className="hover:text-red-500 transition-colors">Instagram</a>
               </div>
               <p className="text-[10px] text-gray-700 max-w-md lg:text-right font-bold uppercase tracking-widest leading-relaxed border-t border-gray-900 pt-6">
                 DISCLAIMER: We are an entertainment service. Any resemblance to real-life stalking, emotional manipulation, or actual black-ops is purely coincidental. Please do not sue us. We have no money.
               </p>
             </div>
          </div>
        </footer>
      </main>

      {/* A quick dummy icon for the footer */}
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </>
  );
}

// Dummy icon for footer
function MapPin(props) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
}
