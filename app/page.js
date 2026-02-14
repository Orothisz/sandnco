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
      bgHover: "bg-red-950/20",
      glowColor: "rgba(220,38,38,0.3)",
      borderColor: "border-red-500",
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
      bgHover: "bg-blue-950/20",
      glowColor: "rgba(59,130,246,0.3)",
      borderColor: "border-blue-500",
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
      bgHover: "bg-emerald-950/20",
      glowColor: "rgba(16,185,129,0.3)",
      borderColor: "border-emerald-500",
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
      bgHover: "bg-purple-950/20",
      glowColor: "rgba(168,85,247,0.3)",
      borderColor: "border-purple-500",
    },
  ],
};

// ============================================================================
// 60FPS HARDWARE-ACCELERATED COMPONENTS
// ============================================================================
const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.12] mix-blend-overlay hw-accel bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
);

const Scanlines = () => (
  <div className="fixed inset-0 pointer-events-none z-[6] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] hw-accel" />
);

// 60FPS Pure CSS Marquee via Translate3D
const PoliceTape = ({ text, direction = "left", rotate = "rotate-2" }) => (
  <div className={`w-[120%] -ml-[10%] bg-[#eab308] text-black py-3 font-black text-xl md:text-2xl uppercase tracking-[0.2em] overflow-hidden border-y-4 border-black ${rotate} shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative z-20 hw-accel hw-layer`}>
    <div className={`flex gap-10 whitespace-nowrap ${direction === "left" ? 'animate-marquee-left-3d' : 'animate-marquee-right-3d'} hw-accel`}>
      {Array(15).fill(text).map((t, i) => (
        <span key={i} className="flex items-center gap-4">
          <ShieldAlert className="w-6 h-6 md:w-8 md:h-8" /> {t}
        </span>
      ))}
    </div>
  </div>
);

// GPU-Promoted Kinetic Glitch Text (Opacity/Transform Only)
const KineticGlitch = ({ text }) => {
  return (
    <div className="relative inline-block group cursor-crosshair hw-accel">
      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-gray-200 via-gray-400 to-gray-700 group-hover:text-white transition-colors duration-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-75 mix-blend-screen select-none pointer-events-none group-hover:animate-glitch-1-3d hw-accel">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-75 mix-blend-screen select-none pointer-events-none group-hover:animate-glitch-2-3d hw-accel">
        {text}
      </span>
      <span className="absolute top-0 left-0 w-full h-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-100 mix-blend-overlay select-none pointer-events-none group-hover:blur-[2px] hw-accel">
        {text}
      </span>
    </div>
  );
};

const PanicButton = () => {
  const [safeMode, setSafeMode] = useState(false);
  if (safeMode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white text-black font-serif p-8 overflow-auto hw-layer">
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
      className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-red-600 rounded-full border-4 border-red-900 flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,0,0,0.6)] hover:scale-110 active:scale-95 transition-transform group hw-accel"
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
  
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [agreed, setAgreed] = useState(true); 
  const [progress, setProgress] = useState(0);

  const adRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!adRef.current) return;
    const rect = adRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 15;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -15;
    setMousePos({ x, y });
  };

  // AUTH & WAIVER CHECK
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
      <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col items-center justify-center p-6 text-center select-none hw-layer">
        <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />
        <Scanlines />
        <motion.div animate={{ rotateZ: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear", type: "tween" }} className="text-6xl mb-8 grayscale opacity-50 hw-accel">
          👾
        </motion.div>
        <h2 className="text-3xl md:text-5xl font-black uppercase text-red-600 mb-6 tracking-widest drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
          Liability Waiver
        </h2>
        <div className="max-w-lg w-full bg-black/60 border border-red-900/50 p-8 rounded-2xl text-left mb-10 backdrop-blur-md shadow-2xl relative z-10 hw-accel">
          <p className="text-xs md:text-sm font-mono text-red-400 leading-relaxed uppercase tracking-wider">
            WARNING: You are accessing <strong className="text-white">SANDNCO.LOL</strong>. By proceeding, you acknowledge that we are not responsible for broken hearts, restraining orders, or public humiliation. Our algorithms are aggressive. Our agents are anonymous.
          </p>
        </div>
        
        {progress < 100 ? (
          <div className="w-64 md:w-96 h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800 relative z-10 hw-accel">
            <div className="h-full bg-red-600 transition-all duration-75" style={{ width: `${progress}%`, transform: 'translateZ(0)' }} />
          </div>
        ) : (
          <button 
            onClick={acceptWaiver}
            className="px-10 py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] transition-transform active:scale-95 animate-pulse shadow-[0_0_40px_rgba(220,38,38,0.6)] rounded-xl border border-red-400 relative z-10 hw-accel"
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

      {/* EXTRACTED: Fixed Elements moved completely OUTSIDE the transformed main tag to prevent scroll breakage */}
      <NoiseOverlay />
      <Scanlines />
      <PanicButton />

      {/* --- PREMIUM NAVBAR (Mobile & Desktop 60FPS) --- */}
      <nav className="fixed top-0 w-full z-50 px-4 md:px-8 py-3 md:py-4 flex justify-between items-center bg-[#020205]/80 backdrop-blur-xl border-b border-white/10 shadow-2xl hw-layer">
          
          {/* Logo Group */}
          <Link href="/" className="flex items-center gap-2 md:gap-3 group shrink-0 hw-accel">
            <img src="/logo.png" className="w-7 h-7 md:w-10 md:h-10 object-contain invert transition-transform" alt="logo" />
            <span className="font-black text-lg md:text-2xl italic tracking-tighter text-white drop-shadow-md">
              SANDNCO<span className="text-red-600">.LOL</span>
            </span>
          </Link>

          {/* Navigation & Actions */}
          <div className="flex items-center gap-3 md:gap-8 text-[10px] md:text-xs font-mono tracking-widest uppercase font-bold hw-accel">
            
            {/* Desktop Only Text Links */}
            <div className="hidden lg:flex gap-6 items-center mr-4">
              <Link href="#pricing"><span className="text-gray-400 hover:text-white transition-colors cursor-pointer">Pricing</span></Link>
              <Link href="/legal"><span className="text-gray-400 hover:text-white transition-colors cursor-pointer">Legal</span></Link>
            </div>
            
            {/* MINDER TACTICAL BADGE - Fixed to just show text MINDER */}
            <Link href="/minder" className="group shrink-0">
              <span className="flex items-center justify-center gap-1.5 md:gap-2 text-pink-500 transition-colors border border-pink-500/50 bg-pink-900/20 px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.6)]">
                <span className="font-black tracking-[0.2em]">MINDER</span>
              </span>
            </Link>

            {/* Dynamic Auth Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2 md:gap-4 shrink-0">
                <Link href="/dashboard">
                  <button className="flex items-center justify-center gap-2 bg-green-900/30 border border-green-500/50 text-green-400 px-3 md:px-4 py-1.5 md:py-2 rounded font-black shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                    <Terminal className="w-3 h-3 md:w-4 md:h-4" /> 
                    <span className="hidden sm:inline">DASHBOARD</span>
                  </button>
                </Link>
                <button onClick={handleLogout} className="flex items-center justify-center text-red-500 border border-red-500/30 px-3 py-1.5 md:py-2 rounded font-black">
                  <Power className="w-3 h-3 md:w-4 md:h-4" />
                  <span className="hidden sm:inline ml-2">LOGOUT</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/login" className="hidden sm:inline-block"><span className="text-gray-400 transition-colors cursor-pointer font-black">LOGIN</span></Link>
                <Link href="/login">
                  <button className="bg-white text-black px-4 md:px-6 py-1.5 md:py-2 shadow-[0_0_20px_rgba(255,255,255,0.4)] rounded active:scale-95 font-black transition-transform">
                    <span className="hidden sm:inline">ENROLL</span><span className="sm:hidden">LOGIN</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
      </nav>

      <main className="bg-[#020205] text-gray-100 selection:bg-red-500 selection:text-black overflow-x-hidden font-sans relative hw-main">

        {/* --- CRAZY CINEMATIC HERO SECTION --- */}
        <section className="relative min-h-[100dvh] flex flex-col justify-center items-center pt-24 px-4 overflow-hidden hw-layer">
          
          {/* Hardware Accelerated Spinning Wireframe Radar (Costs 0 CPU) */}
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] md:w-[1200px] md:h-[1200px] -mt-[400px] -ml-[400px] md:-mt-[600px] md:-ml-[600px] border-[1px] border-white/5 rounded-full animate-radar-spin-3d pointer-events-none z-0">
            <div className="absolute inset-0 border-[1px] border-white/5 rounded-full scale-75" />
            <div className="absolute inset-0 border-[1px] border-white/5 rounded-full scale-50" />
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-white/5" />
            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-white/5" />
          </div>

          {/* 3D Cyber-Grid Floor via GPU Translate */}
          <div className="absolute bottom-0 w-[200vw] h-[50vh] left-[-50vw] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] [transform:perspective(500px)_rotateX(60deg)_translate3d(0,0,0)] animate-grid-move-3d pointer-events-none z-0 opacity-40" />

          {/* Cinematic Scanning Laser (Translate3D) */}
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 shadow-[0_0_30px_rgba(220,38,38,1)] animate-laser-scan-3d pointer-events-none z-10" />

          <motion.div style={{ y, opacity }} className="relative z-20 text-center max-w-[1400px] w-full flex flex-col items-center hw-accel">
            
            <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 border border-yellow-500/50 bg-yellow-900/20 rounded-full mb-8 md:mb-10 backdrop-blur-md shadow-[0_0_30px_rgba(234,179,8,0.3)]">
               <Siren className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 animate-pulse" />
               <span className="text-[9px] md:text-xs font-black tracking-[0.2em] text-yellow-400 uppercase">
                 COST WAIVER ACTIVE: FREE UNTIL MARCH 12
               </span>
            </div>

            <h1 className="text-[14vw] md:text-[10vw] leading-[0.85] font-black tracking-tighter mb-8 relative select-none w-full flex flex-col items-center justify-center z-20">
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

            <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center items-center w-full max-w-2xl px-4 relative z-30">
              <Link href="/login?next=/request" className="w-full md:w-auto">
                  <button className="w-full md:w-auto px-8 md:px-10 py-4 md:py-5 bg-white text-black font-black text-sm md:text-base uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(255,255,255,0.3)] rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-3">
                    <Terminal className="w-4 h-4 md:w-5 md:h-5" /> INITIATE PROTOCOL
                  </button>
              </Link>
              <p className="text-[9px] md:text-xs font-mono text-gray-500 max-w-[280px] text-center md:text-left border-t md:border-t-0 md:border-l-2 border-gray-800 pt-4 md:pt-0 md:pl-6 leading-relaxed bg-black/40 md:bg-transparent p-3 md:p-0 rounded md:rounded-none">
                // {siteConfig.hero.manifesto}
              </p>
            </div>
          </motion.div>

          {/* Deep Ambient Glow (Static size, rasterized) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] md:w-[800px] md:h-[800px] bg-red-600/20 rounded-full blur-[100px] pointer-events-none z-0 hw-accel" />
        </section>

        {/* --- 60FPS CSS POLICE TAPE --- */}
        <div className="relative py-12 md:py-24 overflow-hidden bg-black/50 backdrop-blur-sm border-y border-white/5 hw-layer">
           <PoliceTape text="FREE SERVICES UNTIL MARCH 12 // BETA TESTING PHASE" rotate="rotate-2" direction="left" />
           <PoliceTape text="NO PAYMENTS REQUIRED // TOTAL ANONYMITY GUARANTEED" rotate="-rotate-1" direction="right" />
        </div>

        {/* --- 60FPS CSS LIVE KILL LOG --- */}
        <div className="w-full bg-[#050505] border-b border-white/10 py-4 overflow-hidden relative z-20 shadow-inner hw-layer">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#050505] to-transparent z-10 hw-accel" />
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#050505] to-transparent z-10 hw-accel" />
          <div className="flex gap-10 md:gap-20 whitespace-nowrap text-[10px] md:text-xs font-mono text-green-500 font-bold uppercase tracking-widest animate-marquee-left-3d hw-accel">
            {[...siteConfig.liveFeed, ...siteConfig.liveFeed, ...siteConfig.liveFeed].map((log, i) => (
              <span key={i} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-ping" /> {log}
              </span>
            ))}
          </div>
        </div>

        {/* --- THE PREMIER MINDER ADVERTISEMENT --- */}
        <section className="px-4 md:px-12 lg:px-20 py-24 md:py-32 max-w-[1600px] mx-auto relative z-20 hw-layer">
           <motion.div
             initial={{ opacity: 0, y: 50 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true, margin: "-100px" }}
             transition={{ duration: 0.8, type: "tween" }}
             className="bg-[#0a0a0f]/80 backdrop-blur-2xl border border-pink-500/30 p-6 md:p-16 rounded-[2rem] md:rounded-[3rem] relative overflow-hidden group shadow-[0_0_100px_rgba(219,39,119,0.15)] hw-accel"
             onMouseMove={handleMouseMove}
             ref={adRef}
           >
             {/* Static background glow */}
             <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-pink-600/20 blur-[150px] pointer-events-none opacity-50 hw-accel" />

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
                   <button className="w-full md:w-auto bg-pink-600 text-white font-black uppercase px-8 md:px-10 py-4 md:py-5 tracking-[0.3em] shadow-[0_0_40px_rgba(219,39,119,0.6)] flex items-center justify-center gap-3 md:gap-4 active:scale-95 transition-transform rounded-2xl border-2 border-pink-400 text-xs md:text-sm">
                     <Crosshair className="w-4 h-4 md:w-5 md:h-5" /> ENTER THE GRID
                   </button>
                 </Link>
               </div>

               {/* Interactive 3D Hologram Terminal (Hardware Accelerated) */}
               <motion.div 
                 animate={{ 
                   rotateX: mousePos.y, 
                   rotateY: mousePos.x,
                   z: 0
                 }}
                 transition={{ type: "tween", ease: "linear", duration: 0.1 }}
                 style={{ perspective: 1000 }}
                 className="hidden lg:flex w-[350px] h-[500px] bg-[#050505] border-2 border-pink-500/50 rounded-3xl relative overflow-hidden shadow-[0_0_80px_rgba(219,39,119,0.3)] items-center justify-center flex-col group/holo hw-accel"
               >
                 <div className="absolute inset-0 bg-gradient-to-b from-transparent via-pink-500/20 to-transparent h-[200%] animate-scan-3d pointer-events-none mix-blend-screen" />
                  
                 <div className="absolute top-5 left-5 flex gap-2 items-center bg-black/60 px-3 py-1 rounded-full border border-pink-500/30 backdrop-blur-md">
                   <div className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                   <div className="text-[9px] font-black text-pink-500 uppercase tracking-widest">LIVE TRACKING</div>
                 </div>

                 <div className="absolute top-5 right-5">
                   <Radar className="w-6 h-6 text-pink-500 opacity-50 animate-spin-slow-3d" />
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

        {/* --- THE MENU (SERVICES) Optimized GPU Render --- */}
        <section id="pricing" className="px-4 md:px-12 lg:px-20 pb-32 md:pb-40 max-w-[1600px] mx-auto hw-layer">
           <div className="mb-12 md:mb-24 text-center md:text-left">
              <h2 className="text-4xl md:text-7xl font-black uppercase text-white mb-4 md:mb-6 tracking-tighter drop-shadow-lg">
                Operational <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Menu</span>
              </h2>
              <p className="text-[10px] md:text-sm font-mono text-gray-400 font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] bg-white/5 inline-block px-4 md:px-6 py-2 rounded-full border border-white/10 shadow-md">
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
                  transition={{ delay: i * 0.1, duration: 0.5, type: "tween" }}
                  className={`group relative bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 md:p-10 min-h-[400px] md:min-h-[500px] flex flex-col justify-between overflow-hidden hw-accel`}
                >
                  {/* Performance fix: Fade in a pre-rendered glowing div instead of transitioning border colors */}
                  <div className={`absolute inset-0 border-2 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${service.borderColor} shadow-[inset_0_0_30px_${service.glowColor}] hw-accel`} />
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${service.bgHover} hw-accel`} />
                  
                  <div className="relative z-10">
                     <div className={`mb-6 md:mb-8 p-3 md:p-4 bg-black w-fit rounded-2xl border border-white/5 shadow-lg ${service.color}`}>
                       {service.icon}
                     </div>
                     <h3 className="text-2xl md:text-3xl font-black uppercase italic mb-2 md:mb-3 text-white group-hover:translate-x-2 transition-transform duration-300 hw-accel">
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
                          <button className="text-[10px] md:text-xs font-black uppercase bg-white text-black px-4 md:px-6 py-2.5 md:py-3 rounded-xl shadow-lg active:scale-95 transition-transform">
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
        <footer className="bg-black py-16 md:py-24 px-6 md:px-12 lg:px-20 border-t border-white/10 relative z-20 hw-layer">
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
        /* HW Acceleration Utilities */
        .hw-accel {
          transform: translate3d(0,0,0);
          backface-visibility: hidden;
          perspective: 1000px;
          will-change: transform;
        }
        .hw-layer {
          contain: layout paint style;
          isolation: isolate;
        }
        .hw-main {
          isolation: isolate;
          transform: translateZ(0);
        }

        /* Pure CSS 60FPS Marquees via Translate3D */
        @keyframes marqueeLeft3D {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes marqueeRight3D {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-marquee-left-3d {
          animation: marqueeLeft3D 15s linear infinite;
        }
        .animate-marquee-right-3d {
          animation: marqueeRight3D 15s linear infinite;
        }

        /* Moving Cyber Grid 3D */
        @keyframes grid-move-3d {
          0% { transform: perspective(500px) rotateX(60deg) translate3d(0, -100px, -200px); }
          100% { transform: perspective(500px) rotateX(60deg) translate3d(0, -50px, -200px); }
        }
        .animate-grid-move-3d {
          animation: grid-move-3d 2s linear infinite;
        }

        /* Scanning Laser 3D */
        @keyframes laser-scan-3d {
          0% { transform: translate3d(0, -10vh, 0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate3d(0, 110vh, 0); opacity: 0; }
        }
        .animate-laser-scan-3d {
          animation: laser-scan-3d 4s ease-in-out infinite;
        }

        /* Radar Spin 3D */
        @keyframes radar-spin-3d {
          0% { transform: rotateZ(0deg) translate3d(0,0,0); }
          100% { transform: rotateZ(360deg) translate3d(0,0,0); }
        }
        .animate-radar-spin-3d {
          animation: radar-spin-3d 20s linear infinite;
        }

        /* Spin Slow 3D */
        @keyframes spin-slow-3d {
          0% { transform: rotateZ(0deg) translate3d(0,0,0); }
          100% { transform: rotateZ(360deg) translate3d(0,0,0); }
        }
        .animate-spin-slow-3d {
          animation: spin-slow-3d 8s linear infinite;
        }

        /* Scan 3D */
        @keyframes scan-3d {
          0% { transform: translate3d(0, -100%, 0); }
          100% { transform: translate3d(0, 100%, 0); }
        }
        .animate-scan-3d {
          animation: scan-3d 2.5s linear infinite;
        }

        /* Violent Glitch Animations via Translate3D */
        @keyframes glitch1-3d {
          0% { transform: translate3d(0, 0, 0); }
          20% { transform: translate3d(-3px, 3px, 0); }
          40% { transform: translate3d(-3px, -3px, 0); }
          60% { transform: translate3d(3px, 3px, 0); }
          80% { transform: translate3d(3px, -3px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        @keyframes glitch2-3d {
          0% { transform: translate3d(0, 0, 0); }
          20% { transform: translate3d(3px, -3px, 0); }
          40% { transform: translate3d(3px, 3px, 0); }
          60% { transform: translate3d(-3px, -3px, 0); }
          80% { transform: translate3d(-3px, 3px, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-glitch-1-3d { animation: glitch1-3d 0.2s infinite; }
        .animate-glitch-2-3d { animation: glitch2-3d 0.25s infinite; }

        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </>
  );
}
