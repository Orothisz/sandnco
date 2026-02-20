"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { 
  Terminal, Lock, Eye, Fingerprint, Crosshair, Radar, 
  Power, Package, Cpu, ShoppingCart, Activity, ShieldCheck,
  Zap, Code, Globe
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Head from "next/head";

// ============================================================================
// CONFIGURATION: HTSDOF STARTUP VIBE
// ============================================================================
const siteConfig = {
  identity: {
    name: "SANDNCO",
    domain: ".LOL",
  },
  hero: {
    title: "MANUFACTURED SERENDIPITY",
    subhead: "Faridabad’s premiere boutique for engineered romance and strategic detachment.",
    version: "v2.0.4-beta // SECURE NODE",
    manifesto: "Disrupting fate. One engineered coincidence at a time.",
  },
  liveFeed: [
    "NEW ORDER: TERMINATION PROTOCOL [SECTOR 15] // PROCESSING...",
    "NODE CONNECTED: DEEP WEB SCRAPER ONLINE // MATCH_CONFIRMED",
    "PAYMENT RECEIVED: 0.045 BTC // ANONYMITY SHIELD ACTIVE",
    "PROMO ACTIVE: FREEMIUM TIER UNLOCKED",
    "ENCRYPTION: AES-256 GCM STATUS: GREEN",
  ],
  services: [
    {
      id: "breakup",
      title: "Scorched Earth",
      price: "₹0",
      originalPrice: "₹999",
      icon: <Package className="w-6 h-6" />,
      tagline: "TERMINATION",
      desc: "Clean, frictionless breakups. We fabricate the narrative, you play the victim. Alibi provision included.",
      features: ["Evidence Generation", "Narrative Control", "3rd Party Proxies"],
      gradient: "from-pink-500 to-rose-500",
      shadow: "rgba(236,72,153,0.4)",
    },
    {
      id: "patchup",
      title: "Psy-Op Recovery",
      price: "₹0",
      originalPrice: "₹1,499",
      icon: <Cpu className="w-6 h-6" />,
      tagline: "RESTORATION",
      desc: "Strategic reality distortion. We deploy targeted psychological triggers to restore fractured bonds.",
      features: ["Algorithmic Jealousy", "Staged Encounters", "Digital Gaslighting"],
      gradient: "from-cyan-400 to-blue-500",
      shadow: "rgba(6,182,212,0.4)",
    },
    {
      id: "matchup",
      title: "Forced Fate",
      price: "₹0",
      originalPrice: "₹1,999",
      icon: <Radar className="w-6 h-6" />,
      tagline: "ACQUISITION",
      desc: "Aggressive matchmaking using unauthorized deep-web analytics. We curate your reality.",
      features: ["Geo-Fencing", "Financial Profiling", "Social Engineering"],
      gradient: "from-violet-500 to-purple-600",
      shadow: "rgba(139,92,246,0.4)",
    },
    {
      id: "vip",
      title: "God Complex",
      price: "₹0",
      originalPrice: "₹2,700",
      icon: <Lock className="w-6 h-6" />,
      tagline: "ENTERPRISE",
      desc: "Full-scale reality manipulation. We control the weather of your digital and physical love life.",
      features: ["24/7 Surveillance", "Burner Hardware", "Ironclad NDAs"],
      gradient: "from-fuchsia-500 to-pink-600",
      shadow: "rgba(217,70,239,0.4)",
    },
  ],
};

// ============================================================================
// HTSDOF / STARTUP AESTHETIC COMPONENTS
// ============================================================================
const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.04] mix-blend-overlay hw-accel bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
);

// Sleek E-Commerce Marquee
const PromoTicker = ({ text, direction = "left" }) => (
  <div className="w-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 text-white py-2 font-mono text-xs uppercase tracking-[0.2em] overflow-hidden border-y border-white/10 relative z-20 hw-accel hw-layer">
    <div className={`flex gap-10 whitespace-nowrap ${direction === "left" ? 'animate-marquee-left-3d' : 'animate-marquee-right-3d'} hw-accel`}>
      {Array(15).fill(text).map((t, i) => (
        <span key={i} className="flex items-center gap-4 font-bold">
          <Zap className="w-3 h-3 text-yellow-300" /> {t}
        </span>
      ))}
    </div>
  </div>
);

// Innocuous Panic Button (Looks like a customer support chat icon)
const PanicButton = () => {
  const [safeMode, setSafeMode] = useState(false);
  if (safeMode) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white text-black font-sans p-8 overflow-auto hw-layer flex justify-center items-center">
        <div className="max-w-2xl text-center">
          <h1 className="text-4xl font-bold mb-4 text-gray-800">404 - Page Not Found</h1>
          <p className="text-gray-500 mb-8">The requested URL was not found on this server. That is all we know.</p>
          <button onClick={() => setSafeMode(false)} className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 text-sm font-medium transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }
  return (
    <button
      onClick={() => setSafeMode(true)}
      className="fixed bottom-6 right-6 z-[100] w-14 h-14 bg-white rounded-full border border-gray-200 flex items-center justify-center text-gray-600 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all group hw-accel"
      title="Customer Support"
    >
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 transition-opacity" />
      <ShieldCheck className="w-6 h-6 relative z-10 group-hover:text-white transition-colors" />
    </button>
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
  const [terminalText, setTerminalText] = useState("");

  const adRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!adRef.current) return;
    const rect = adRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setMousePos({ x, y });
  };

  const handleGridNav = () => {
    setGridLoading(true);
    router.push('/minder');
  };

  useEffect(() => {
    const checkUserAndWaiver = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      const waiverKey = 'sandnco_crypto_handshake';
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

  // Terminal Typing Effect for Boot Sequence
  useEffect(() => {
    if (!agreed) {
      const fullText = "> ESTABLISHING SECURE P2P CONNECTION...\n> BYPASSING FIREWALLS...\n> INJECTING PAYLOAD...\n> DECRYPTING MARKETPLACE DATA...\n\nWARNING: YOU ARE ACCESSING AN UNREGULATED NODE.\nSANDNCO ACCEPTS ZERO LIABILITY FOR REAL-WORLD CONSEQUENCES.\n\nPRESS 'INITIALIZE' TO CONTINUE.";
      let i = 0;
      const typingTimer = setInterval(() => {
        setTerminalText(fullText.slice(0, i));
        i++;
        if (i > fullText.length) {
          clearInterval(typingTimer);
          // Start progress bar after typing finishes
          const progressTimer = setInterval(() => {
            setProgress(prev => {
              if (prev >= 100) {
                clearInterval(progressTimer);
                return 100;
              }
              return prev + 5;
            });
          }, 30);
        }
      }, 20);
      return () => clearInterval(typingTimer);
    }
  }, [agreed]);

  const acceptWaiver = () => {
    localStorage.setItem('sandnco_crypto_handshake', new Date().getTime().toString());
    setAgreed(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    router.refresh();
  };

  // --------------------------------------------------------------------------
  // TERMINAL BOOT SCREEN (Replaces Liability Waiver)
  // --------------------------------------------------------------------------
  if (!agreed) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#050508] flex flex-col items-center justify-center p-6 select-none hw-layer font-mono">
        <NoiseOverlay />
        
        <div className="max-w-2xl w-full bg-[#0a0a0f] border border-white/10 rounded-lg overflow-hidden shadow-2xl relative z-10 hw-accel">
          {/* Terminal Header */}
          <div className="bg-[#111118] px-4 py-2 flex items-center gap-2 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-xs text-gray-500">terminal // root@sandnco</span>
          </div>
          
          {/* Terminal Body */}
          <div className="p-6 h-[300px] flex flex-col">
            <div className="text-sm text-cyan-400 whitespace-pre-line flex-1">
              {terminalText}
              <span className="animate-pulse">_</span>
            </div>
            
            {progress > 0 && (
              <div className="mt-4">
                <div className="w-full h-1 bg-gray-900 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-cyan-400 transition-all duration-75 shadow-[0_0_10px_rgba(34,211,238,0.8)]" style={{ width: `${progress}%` }} />
                </div>
                {progress >= 100 && (
                  <button 
                    onClick={acceptWaiver}
                    className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-cyan-400 transition-colors"
                  >
                    Initialize Connection
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN HOMEPAGE (HTSDOF VIBE)
  // --------------------------------------------------------------------------
  return (
    <>
      <Head>
        <title>SANDNCO | Premium Services</title>
      </Head>

      <NoiseOverlay />
      <PanicButton />

      {/* Deep Web Ambient Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[150px] pointer-events-none rounded-full z-0 hw-accel mix-blend-screen" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 blur-[150px] pointer-events-none rounded-full z-0 hw-accel mix-blend-screen" />

      {/* --- SLEEK STARTUP NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 px-6 lg:px-12 py-4 flex justify-between items-center bg-[#050508]/70 backdrop-blur-2xl border-b border-white/5 hw-layer transition-all">
          <Link href="/" className="flex items-center gap-3 group shrink-0 hw-accel">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.5)]">
              <Package className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">
              SANDNCO<span className="text-gray-500 font-normal">.LOL</span>
            </span>
          </Link>

          <div className="flex items-center gap-6 text-sm font-medium hw-accel">
            <div className="hidden lg:flex gap-8 items-center mr-4">
              <Link href="#store"><span className="text-gray-400 hover:text-white transition-colors cursor-pointer">Products</span></Link>
              <Link href="/about"><span className="text-gray-400 hover:text-white transition-colors cursor-pointer">About Us</span></Link>
              <div className="h-4 w-[1px] bg-white/10" />
            </div>
            
            {/* The "Minder" Gateway - Styled like a premium feature */}
            <button onClick={handleGridNav} disabled={gridLoading} className="group shrink-0 disabled:opacity-70">
              <span className="flex items-center justify-center gap-2 text-white bg-white/5 border border-white/10 hover:bg-white/10 px-4 py-2 rounded-full transition-all">
                {gridLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4 text-fuchsia-400" />}
                <span className="font-semibold text-xs tracking-wider">MINDER GRID</span>
              </span>
            </button>

            {isLoggedIn ? (
              <div className="flex items-center gap-3 shrink-0">
                <Link href="/dashboard">
                  <button className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-5 py-2 rounded-full shadow-[0_0_20px_rgba(139,92,246,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-shadow">
                    <Terminal className="w-4 h-4" /> 
                    <span className="hidden sm:inline font-semibold">Console</span>
                  </button>
                </Link>
                <button onClick={handleLogout} className="text-gray-500 hover:text-white transition-colors p-2">
                  <Power className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                  Log In
                </button>
              </Link>
            )}
          </div>
      </nav>

      <main className="bg-[#050508] text-gray-200 selection:bg-fuchsia-500 selection:text-white overflow-x-hidden font-sans relative hw-main min-h-screen pt-24">

        {/* --- HERO SECTION: Clean UI hiding dark implications --- */}
        <section className="relative flex flex-col justify-center items-center py-20 px-6 lg:px-12 max-w-[1200px] mx-auto z-20 hw-layer">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyan-900/20 border border-cyan-500/30 rounded-full mb-10 backdrop-blur-md">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
             <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
               System Online {siteConfig.hero.version}
             </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-center mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
            {siteConfig.hero.title}
          </h1>

          <p className="text-lg md:text-xl text-gray-400 text-center max-w-2xl mb-12 leading-relaxed">
            {siteConfig.hero.subhead}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link href="/login?next=/request" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Browse Products
              </button>
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              <Code className="w-5 h-5" /> View API Docs
            </button>
          </div>
        </section>

        {/* --- LIVE ORDER TICKER --- */}
        <div className="mt-12">
          <PromoTicker text="100% DISCREET SHIPPING ON ALL DIGITAL ORDERS" direction="left" />
        </div>
        
        <div className="w-full bg-[#0a0a0f] border-b border-white/5 py-3 overflow-hidden relative z-20 shadow-inner hw-layer">
          <div className="flex gap-16 whitespace-nowrap text-xs font-mono text-gray-500 uppercase tracking-widest animate-marquee-left-3d hw-accel">
            {[...siteConfig.liveFeed, ...siteConfig.liveFeed].map((log, i) => (
              <span key={i} className="flex items-center gap-2">
                <Globe className="w-3 h-3 text-fuchsia-500" /> {log}
              </span>
            ))}
          </div>
        </div>

        {/* --- THE STOREFRONT (SERVICES) --- */}
        <section id="store" className="px-6 lg:px-12 py-24 max-w-[1400px] mx-auto relative z-20 hw-layer">
           <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
             <div>
               <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">Our Catalog.</h2>
               <p className="text-gray-400 text-lg">Premium solutions for complex interpersonal variables.</p>
             </div>
             <div className="bg-[#111118] border border-white/10 px-4 py-2 rounded-lg font-mono text-xs text-fuchsia-400 flex items-center gap-2">
               <Lock className="w-3 h-3" /> PGP VERIFIED VENDOR
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {siteConfig.services.map((service) => (
                <div
                  key={service.id}
                  className="group relative bg-[#0a0a0f] border border-white/5 rounded-2xl p-8 flex flex-col justify-between overflow-hidden hover:border-white/20 transition-colors duration-500"
                >
                  {/* Subtle hover gradient background */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${service.gradient} transition-opacity duration-500 pointer-events-none`} />
                  
                  <div className="relative z-10">
                     <div className={`mb-6 p-4 rounded-xl inline-flex bg-gradient-to-br ${service.gradient} text-white shadow-[0_0_20px_${service.shadow}]`}>
                       {service.icon}
                     </div>
                     <h3 className="text-2xl font-bold mb-2 text-white">
                       {service.title}
                     </h3>
                     <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">
                       // {service.tagline}
                     </div>
                     <p className="text-sm text-gray-400 leading-relaxed mb-6">
                       {service.desc}
                     </p>
                     
                     <div className="space-y-3 mb-8">
                       {service.features.map((feat, idx) => (
                         <div key={idx} className="flex items-center gap-2 text-xs font-medium text-gray-300">
                           <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${service.gradient}`} />
                           {feat}
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="relative z-10 mt-auto pt-6 border-t border-white/5 flex justify-between items-center">
                     <div>
                        <span className="text-2xl font-bold text-white">
                          {service.price}
                        </span>
                        <span className="text-xs text-gray-500 line-through ml-2">
                          {service.originalPrice}
                        </span>
                     </div>
                     <Link href="/login?next=/request">
                        <button className="p-2 bg-white/5 hover:bg-white text-white hover:text-black rounded-full transition-colors duration-300">
                          <ShoppingCart className="w-5 h-5" />
                        </button>
                     </Link>
                  </div>
                </div>
              ))}
           </div>
        </section>

        {/* --- THE MINDER PROMO (Like a high-end SaaS feature rollout) --- */}
        <section className="px-6 lg:px-12 pb-32 max-w-[1400px] mx-auto relative z-20 hw-layer">
           <div 
             className="bg-gradient-to-br from-[#111118] to-[#0a0a0f] border border-white/10 p-10 md:p-16 rounded-[2rem] relative overflow-hidden group shadow-2xl"
             onMouseMove={handleMouseMove}
             ref={adRef}
           >
             {/* Dynamic lighting effect following mouse */}
             <div 
               className="absolute inset-0 opacity-20 transition-transform duration-200 ease-out pointer-events-none"
               style={{
                 background: `radial-gradient(circle at ${50 + mousePos.x}% ${50 + mousePos.y}%, rgba(139, 92, 246, 0.4), transparent 50%)`
               }}
             />

             <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
               
               <div className="flex-1">
                 <div className="inline-block px-3 py-1 bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-bold uppercase tracking-widest rounded-full mb-6">
                   Beta Preview
                 </div>
                 
                 <h2 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
                   Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">Minder.</span>
                 </h2>
                 
                 <p className="text-lg text-gray-400 max-w-xl mb-8 leading-relaxed">
                   The marketplace for targeted encounters. Browse our encrypted grid, locate your objective, and initiate a forced match protocol. We handle the logistics of serendipity.
                 </p>
                 
                 <button 
                   onClick={handleGridNav}
                   disabled={gridLoading}
                   className="px-8 py-4 bg-white text-black font-bold rounded-xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-transform flex items-center gap-3 disabled:opacity-70"
                 >
                   {gridLoading ? <Activity className="w-5 h-5 animate-spin" /> : <Radar className="w-5 h-5" />} 
                   {gridLoading ? 'Decrypting Grid...' : 'Access The Grid'}
                 </button>
               </div>

               {/* Mock UI Interface (Glassmorphism) */}
               <div 
                 style={{ perspective: 1000, transform: `rotateX(${mousePos.y * 0.5}deg) rotateY(${mousePos.x * 0.5}deg)` }}
                 className="hidden lg:flex w-[400px] h-[450px] bg-[#050508]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex-col shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-100 ease-out"
               >
                 <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                   <div className="flex gap-2">
                     <div className="w-3 h-3 rounded-full bg-gray-600" />
                     <div className="w-3 h-3 rounded-full bg-gray-600" />
                     <div className="w-3 h-3 rounded-full bg-gray-600" />
                   </div>
                   <div className="font-mono text-xs text-gray-500">minder.exe</div>
                 </div>

                 {/* Fake Target Cards */}
                 <div className="space-y-4">
                   {[1, 2, 3].map((i) => (
                     <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 flex items-center gap-4">
                       <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-800 to-gray-700 animate-pulse" />
                       <div className="flex-1 space-y-2">
                         <div className="h-2 w-24 bg-gray-700 rounded" />
                         <div className="h-2 w-16 bg-gray-800 rounded" />
                       </div>
                       <button className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
                         <Crosshair className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>
               </div>

             </div>
           </div>
        </section>

        {/* --- CLEAN STARTUP FOOTER --- */}
        <footer className="bg-[#050508] py-16 px-6 lg:px-12 border-t border-white/5 relative z-20 hw-layer">
          <div className="max-w-[1400px] mx-auto grid md:grid-cols-2 gap-12">
             <div>
               <div className="flex items-center gap-3 mb-6">
                 <Package className="w-6 h-6 text-gray-500" />
                 <h4 className="text-xl font-bold text-gray-300 tracking-tight">SANDNCO.LOL</h4>
               </div>
               <p className="text-sm text-gray-600 max-w-sm leading-relaxed mb-6">
                 Building the infrastructure for engineered reality. Operating strictly within the grey areas of the social contract.
               </p>
               <div className="font-mono text-xs text-gray-600 space-y-2">
                 <p>LOCATION: UNDISCLOSED</p>
                 <p>NETWORK: DECENTRALIZED</p>
               </div>
             </div>
             
             <div className="flex flex-col md:items-end justify-between">
               <div className="flex gap-6 text-sm font-semibold text-gray-400 mb-8">
                 <Link href="/legal" className="hover:text-white transition-colors">Terms of Service</Link>
                 <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                 <a href="#" className="hover:text-white transition-colors">API</a>
               </div>
               <p className="text-xs text-gray-700 md:text-right max-w-md font-mono">
                 Disclaimer: This platform operates as a localized tactical service. Any resemblance to real-world stalking or illegal activities is merely a reflection of your own moral compass.
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

        @keyframes marqueeLeft3D {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        @keyframes marqueeRight3D {
          0% { transform: translate3d(-50%, 0, 0); }
          100% { transform: translate3d(0, 0, 0); }
        }
        .animate-marquee-left-3d {
          animation: marqueeLeft3D 20s linear infinite;
        }
        .animate-marquee-right-3d {
          animation: marqueeRight3D 20s linear infinite;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050508; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1f1f2e; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #2d2d44; }
      `}</style>
    </>
  );
}
