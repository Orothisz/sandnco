"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Fingerprint, 
  Eye, 
  Lock, 
  Skull, 
  Siren, 
  Terminal, 
  ChevronRight,
  LogOut
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Head from "next/head";

// ------------------------------------------------------------------
// CONFIGURATION
// ------------------------------------------------------------------

const siteConfig = {
  identity: {
    name: "SANDNCO",
    domain: ".LOL",
    location: "SECTOR 16, FARIDABAD",
    status: "OPERATIONAL",
  },
  hero: {
    line1: "MANFACTURED",
    line2: "COINCIDENCES",
    subhead: "FARIDABAD’S PREMIERE BLACK-OPS ROMANCE SYNDICATE.",
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
      bg: "group-hover:bg-red-900/10",
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
      bg: "group-hover:bg-blue-900/10",
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
      bg: "group-hover:bg-emerald-900/10",
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
      bg: "group-hover:bg-purple-900/10",
    },
  ],
};

// ------------------------------------------------------------------
// VISUAL COMPONENTS
// ------------------------------------------------------------------

const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.04] mix-blend-hard-light">
    <svg className="w-full h-full">
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#n)" />
    </svg>
  </div>
);

const Scanlines = () => (
  <div className="fixed inset-0 pointer-events-none z-[6] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
);

const PoliceTape = ({ text, direction = "left", rotate = "rotate-2" }) => (
  <div className={`w-[120%] -ml-[10%] bg-[#eab308] text-black py-2 font-black text-xl uppercase tracking-widest overflow-hidden border-y-4 border-black ${rotate} shadow-lg relative z-20`}>
    <motion.div 
      animate={{ x: direction === "left" ? ["0%", "-50%"] : ["-50%", "0%"] }}
      transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
      className="flex gap-8 whitespace-nowrap"
    >
      {Array(20).fill(text).map((t, i) => (
        <span key={i} className="flex items-center gap-4">
          <ShieldAlert className="w-6 h-6" /> {t}
        </span>
      ))}
    </motion.div>
  </div>
);

const GlitchText = ({ text }) => (
  <div className="relative inline-block group">
    <span className="relative z-10">{text}</span>
    <span className="absolute top-0 left-0 -z-10 w-full h-full text-red-500 opacity-0 group-hover:opacity-70 group-hover:translate-x-[3px] transition-all duration-75">{text}</span>
    <span className="absolute top-0 left-0 -z-10 w-full h-full text-blue-500 opacity-0 group-hover:opacity-70 group-hover:-translate-x-[3px] transition-all duration-75">{text}</span>
  </div>
);

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
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-red-600 rounded-full border-4 border-red-900 flex items-center justify-center text-white shadow-[0_0_30px_rgba(255,0,0,0.6)] hover:scale-110 active:scale-95 transition-all group"
      title="PANIC: HIDE EVERYTHING"
    >
      <Eye className="w-6 h-6 group-hover:hidden" />
      <span className="hidden group-hover:block font-bold text-xs">HIDE</span>
    </button>
  );
};

// ------------------------------------------------------------------
// MAIN PAGE
// ------------------------------------------------------------------

export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [agreed, setAgreed] = useState(false);
  const [progress, setProgress] = useState(0);

  // AUTH CHECK
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // LOGOUT HANDLER
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.refresh();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  if (!agreed) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#020205] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 bg-red-900/10 pointer-events-none" />
        <Scanlines />
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-6xl mb-8 grayscale"
        >
          👾
        </motion.div>
        <h2 className="text-2xl md:text-4xl font-black uppercase text-red-600 mb-4 glitch-text">
          Liability Waiver
        </h2>
        <div className="max-w-md w-full bg-red-900/10 border border-red-900/50 p-6 rounded text-left mb-8 backdrop-blur-sm">
          <p className="text-xs font-mono text-red-400 leading-relaxed">
            WARNING: You are accessing <strong>SANDNCO.LOL</strong>. By proceeding, you acknowledge that we are not responsible for broken hearts, restraining orders, or public humiliation. Our algorithms are aggressive. Our agents are anonymous.
          </p>
        </div>
        
        {progress < 100 ? (
          <div className="w-64 h-2 bg-gray-900 rounded overflow-hidden border border-gray-800">
            <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        ) : (
          <button 
            onClick={() => setAgreed(true)}
            className="px-8 py-3 bg-red-600 text-black font-black uppercase tracking-widest hover:bg-white transition-all animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]"
          >
            Accept & Enter
          </button>
        )}
        <div className="mt-4 text-[10px] text-gray-600 font-mono">
          LOADING ASSETS... {Math.min(100, Math.floor(progress))}%
        </div>
      </div>
    );
  }

  return (
    <>
      {/* FAVICON FIX: Injected directly for the home page */}
      <Head>
        <title>SANDNCO.LOL | Black-Ops Romance</title>
        <link rel="icon" href="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=32" />
      </Head>

      <main className="min-h-screen bg-[#020205] text-gray-100 selection:bg-red-500 selection:text-black overflow-x-hidden font-sans">
        <NoiseOverlay />
        <Scanlines />
        <PanicButton />

        {/* --- NAVBAR --- */}
        {/* Changed: Adjusted padding and flex-wrap to ensure visibility on mobile */}
        <nav className="fixed top-0 w-full z-40 px-4 md:px-6 py-4 flex flex-wrap justify-between items-center bg-[#020205]/90 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-2 md:gap-3">
              <img src="/logo.png" className="w-8 h-8 md:w-10 md:h-10 object-contain invert hover:rotate-12 transition-transform" alt="logo" />
              <span className="font-black text-lg md:text-xl italic tracking-tighter text-white">
                {siteConfig.identity.name}<span className="text-red-600">{siteConfig.identity.domain}</span>
              </span>
            </div>

            {/* Mobile-Friendly Navigation Links & Auth */}
            <div className="flex items-center gap-3 md:gap-8 text-[10px] md:text-[11px] font-mono tracking-widest uppercase">
              {/* Desktop-only secondary links to keep mobile clean */}
              <div className="hidden sm:flex gap-4">
                <Link href="#pricing">
                  <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">[Pricing]</span>
                </Link>
                <Link href="/legal">
                  <span className="text-gray-400 hover:text-white cursor-pointer transition-colors">[Legal]</span>
                </Link>
              </div>
              
              {isLoggedIn ? (
                <div className="flex items-center gap-2 md:gap-4">
                  <Link href="/dashboard">
                    <button className="flex items-center gap-2 bg-green-900/20 border border-green-500/50 text-green-400 px-3 md:px-6 py-1.5 md:py-2 hover:bg-green-500 hover:text-black transition-all font-bold">
                      <Terminal className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden xs:inline">DASHBOARD</span>
                      <span className="xs:hidden">DSH</span>
                    </button>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-1 md:gap-2 text-red-500 hover:text-white transition-colors border border-red-500/20 px-3 md:px-4 py-1.5 md:py-2 rounded hover:bg-red-600 font-bold"
                  >
                    <LogOut className="w-3 h-3" />
                    <span className="hidden xs:inline">LOGOUT</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-4">
                  <Link href="/login">
                    <span className="text-gray-400 hover:text-red-500 cursor-pointer transition-colors py-1 px-2">Log In</span>
                  </Link>
                  <Link href="/login">
                    <button className="bg-white text-black px-3 md:px-6 py-1.5 md:py-2 font-bold hover:bg-red-600 hover:text-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                      SIGN UP
                    </button>
                  </Link>
                </div>
              )}
            </div>
        </nav>

        {/* --- HERO SECTION --- */}
        <section className="relative min-h-screen flex flex-col justify-center items-center pt-24 md:pt-20 px-4 overflow-hidden">
          <motion.div style={{ y }} className="relative z-10 text-center max-w-7xl w-full">
            
            <div className="inline-flex items-center gap-2 px-4 py-1 border border-yellow-500/30 bg-yellow-900/20 rounded-full mb-8 backdrop-blur-md animate-pulse">
               <Siren className="w-4 h-4 text-yellow-500" />
               <span className="text-[10px] font-mono tracking-widest text-yellow-300 uppercase">
                 COST WAIVER ACTIVE: FREE UNTIL MARCH 12
               </span>
            </div>

            {/* MANUFACTURED COINCIDENCES TEXT FIX */}
            <h1 className="text-[10vw] md:text-[12vw] leading-[0.8] font-black tracking-tighter mb-6 relative select-none break-words w-full">
               <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white via-gray-200 to-gray-600">
                 {siteConfig.hero.line1}
               </span>
               <span className="block text-transparent bg-clip-text bg-gradient-to-b from-gray-400 via-gray-600 to-gray-900 opacity-80">
                 <GlitchText text={siteConfig.hero.line2} />
               </span>
            </h1>

            <p className="text-lg md:text-xl font-bold uppercase tracking-[0.2em] text-red-500 mb-12">
              {siteConfig.hero.subhead}
            </p>

            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
              <Link href="/request">
                  <button className="px-12 py-5 bg-white text-black font-black text-xl uppercase tracking-tighter hover:bg-red-600 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  INITIATE PROTOCOL (FREE)
                  </button>
              </Link>
              <p className="text-xs font-mono text-gray-500 max-w-xs text-left border-l-2 border-gray-700 pl-4">
                // {siteConfig.hero.manifesto}
              </p>
            </div>
          </motion.div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-red-600/5 rounded-full blur-[120px] pointer-events-none" />
        </section>

        {/* --- POLICE TAPE --- */}
        <div className="relative py-24 overflow-hidden">
           <PoliceTape text="FREE SERVICES UNTIL MARCH 12 // BETA TESTING PHASE" rotate="rotate-2" direction="left" />
           <PoliceTape text="NO PAYMENTS REQUIRED // ANONYMITY GUARANTEED" rotate="-rotate-1" direction="right" />
        </div>

        {/* --- LIVE KILL LOG --- */}
        <div className="w-full bg-black border-y border-white/10 py-3 mb-24 overflow-hidden relative z-20">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black to-transparent z-10" />
          <motion.div 
            className="flex gap-16 whitespace-nowrap text-xs font-mono text-green-500/80"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          >
            {[...siteConfig.liveFeed, ...siteConfig.liveFeed, ...siteConfig.liveFeed].map((log, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                {log}
              </span>
            ))}
          </motion.div>
        </div>

        {/* --- SERVICES / PRICING --- */}
        <section id="pricing" className="px-6 md:px-20 pb-40 max-w-[1800px] mx-auto">
           <div className="mb-20">
              <h2 className="text-4xl md:text-6xl font-black uppercase text-white mb-4">
                Operational <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Menu</span>
              </h2>
              <p className="text-xs font-mono text-gray-500">
                SECURE CONNECTION ESTABLISHED. SELECT YOUR OBJECTIVE.
              </p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {siteConfig.services.map((service, i) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`group relative bg-[#050510] border border-white/10 p-8 min-h-[500px] flex flex-col justify-between hover:border-transparent transition-all duration-300 overflow-hidden ${service.bg}`}
                >
                  <div className={`absolute inset-0 border-2 border-transparent ${service.border} transition-all duration-500 pointer-events-none`} />
                  
                  <div>
                     <div className={`mb-6 p-3 bg-white/5 w-fit rounded ${service.color}`}>
                       {service.icon}
                     </div>
                     <h3 className="text-2xl font-black uppercase italic mb-2 text-white group-hover:translate-x-2 transition-transform">
                       {service.title}
                     </h3>
                     <div className={`text-[10px] font-mono uppercase tracking-widest mb-6 ${service.color}`}>
                       // {service.tagline}
                     </div>
                     <p className="text-sm text-gray-400 leading-relaxed font-medium mb-6">
                       {service.desc}
                     </p>
                     
                     <ul className="space-y-3">
                       {service.features.map((feat, idx) => (
                         <li key={idx} className="text-xs font-mono text-gray-500 flex items-start gap-2">
                           <ChevronRight className="w-3 h-3 mt-0.5 text-gray-600" /> {feat}
                         </li>
                       ))}
                     </ul>
                  </div>

                  <div>
                    <div className="flex justify-between items-end border-t border-white/5 pt-6 mt-8">
                       <div>
                          <span className="text-xs text-red-500 line-through block font-mono">
                            {service.originalPrice}
                          </span>
                          <span className="text-3xl font-bold font-mono text-white animate-pulse">
                            {service.price}
                          </span>
                       </div>
                       <Link href="/request">
                          <button className="text-xs font-black uppercase bg-white text-black px-4 py-2 hover:bg-gray-300 transition-colors">
                          Select
                          </button>
                       </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
           </div>
        </section>

        {/* --- FOOTER / LEGAL --- */}
        <footer className="bg-black py-20 px-6 border-t border-white/10 relative z-10">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
             <div>
               <h4 className="text-2xl font-black italic text-white mb-4">SANDNCO.LOL</h4>
               <div className="space-y-2 text-xs font-mono text-gray-600">
                  <p>LOCATION: UNDISCLOSED (SECTOR 16)</p>
                  <p>STATUS: HUNTING</p>
                  <p>ENCRYPTED: YES (AES-256)</p>
               </div>
             </div>
             
             <div className="text-right">
               <div className="flex justify-end gap-8 text-xs font-bold uppercase tracking-widest text-white/40 mb-8">
                 <Link href="/legal" className="hover:text-red-500 transition">Terms of Service</Link>
                 <Link href="/legal" className="hover:text-red-500 transition">Privacy Policy</Link>
                 <a href="https://instagram.com" className="hover:text-red-500 transition">Instagram</a>
               </div>
               <p className="text-[10px] text-gray-700 max-w-sm ml-auto">
                 DISCLAIMER: We are an entertainment service. Any resemblance to real-life stalking, emotional manipulation, or actual black-ops is purely coincidental. Please do not sue us. We have no money.
               </p>
             </div>
          </div>
        </footer>
      </main>
    </>
  );
}
