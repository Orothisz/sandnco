"use client";

import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  ShieldAlert, Fingerprint, Eye, Lock, Skull, Activity, 
  Terminal, ChevronRight, Crosshair, Zap, Radar, 
  Database, Network, Cpu, Code2, Layers, ShieldCheck, 
  ArrowUpRight, Globe, BarChart, Server, Fingerprint as TouchID
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Head from "next/head";

// ============================================================================
// THE SAAS CATALOG (UNHINGED ENTERPRISE COPY)
// ============================================================================
const siteConfig = {
  hero: {
    tag: "SYS_V4.0 // FARIDABAD DATACENTER ONLINE",
    line1: "HUMAN CAPITAL,",
    line2: "OPTIMIZED.",
    subhead: "The world's first B2C platform for deterministic relationship lifecycle management. We don't wait for fate. We write the algorithm.",
  },
  metrics: [
    { label: "Assets Deprecated", value: "14.2K", trend: "+12%" },
    { label: "Pairings Forced", value: "99.8%", trend: "STABLE" },
    { label: "Moral Oversight", value: "0.00", trend: "BYPASSED" },
    { label: "Network Uptime", value: "99.99%", trend: "NOMINAL" }
  ],
  services: [
    {
      id: "breakup",
      title: "Asset Deprecation",
      price: "₹0",
      badge: "NULLIFICATION",
      icon: <Skull className="w-6 h-6" />,
      desc: "Automated relationship termination protocols. We execute the severance; you retain total operational deniability.",
      color: "text-rose-500", border: "border-rose-500/30", bg: "hover:bg-rose-500/10",
      span: "md:col-span-2 lg:col-span-2"
    },
    {
      id: "patchup",
      title: "State Re-Sync",
      price: "₹0",
      badge: "RECOVERY",
      icon: <Database className="w-6 h-6" />,
      desc: "Algorithmic memory optimization and social re-engagement routing.",
      color: "text-blue-500", border: "border-blue-500/30", bg: "hover:bg-blue-500/10",
      span: "md:col-span-1 lg:col-span-1"
    },
    {
      id: "matchup",
      title: "Algorithmic Coercion",
      price: "₹0",
      badge: "ACQUISITION",
      icon: <Cpu className="w-6 h-6" />,
      desc: "Curated local alignment targeting using aggregated biometric data.",
      color: "text-emerald-500", border: "border-emerald-500/30", bg: "hover:bg-emerald-500/10",
      span: "md:col-span-1 lg:col-span-1"
    },
    {
      id: "vip",
      title: "God-Mode API",
      price: "₹0",
      badge: "CLASSIFIED",
      icon: <Lock className="w-6 h-6" />,
      desc: "Full-spectrum reality distortion. We manipulate the variables. You just arrive at the coordinates. NDA required.",
      color: "text-purple-500", border: "border-purple-500/30", bg: "hover:bg-purple-500/10",
      span: "md:col-span-2 lg:col-span-2"
    },
  ],
};

// ============================================================================
// MICRO-INTERACTIONS & CUSTOM HOOKS
// ============================================================================

// Hacker Text Effect (Cycles random letters before revealing the true text)
const HackerText = ({ text, trigger = true }) => {
  const [displayText, setDisplayText] = useState(text);
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*";
  
  useEffect(() => {
    if (!trigger) return;
    let iteration = 0;
    let interval = null;
    
    clearInterval(interval);
    interval = setInterval(() => {
      setDisplayText(text.split("").map((letter, index) => {
        if (index < iteration) return text[index];
        return letters[Math.floor(Math.random() * 26)];
      }).join(""));
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
    return () => clearInterval(interval);
  }, [text, trigger]);

  return <span className="font-mono tracking-tighter">{displayText}</span>;
};

// ============================================================================
// HW-ACCELERATED COMPONENTS
// ============================================================================
const NoiseOverlay = () => <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.06] mix-blend-screen hw-accel bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />;

const CyberGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-0 hw-accel opacity-20 [mask-image:radial-gradient(ellipse_at_center,white_10%,transparent_80%)]">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)] animate-grid-move-3d" />
  </div>
);

// High-End Aurora Orb
const AuroraGlow = ({ color, top, left, delay = "0s" }) => (
  <div 
    className={`absolute ${top} ${left} w-[40vw] h-[40vw] rounded-full blur-[120px] pointer-events-none hw-accel mix-blend-screen opacity-30 animate-blob-float`}
    style={{ backgroundColor: color, animationDelay: delay }} 
  />
);

// ============================================================================
// MAIN PAGE ENGINE
// ============================================================================
export default function Home() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [booting, setBooting] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Mouse Parallax Engine
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 200 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    mouseX.set((e.clientX / window.innerWidth) - 0.5);
    mouseY.set((e.clientY / window.innerHeight) - 0.5);
  }, [mouseX, mouseY]);

  const handleGridNav = useCallback(() => {
    if (gridLoading) return;
    setGridLoading(true);
    router.push('/minder');
  }, [gridLoading, router]);

  // Fake Boot Sequence
  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkUser();
  }, [supabase]);

  // --------------------------------------------------------------------------
  // BOOT SEQUENCE (Terminal Loader)
  // --------------------------------------------------------------------------
  if (booting) {
    return (
      <div className="fixed inset-0 bg-[#000] z-[9999] flex flex-col items-start justify-end p-8 font-mono text-xs text-green-500 uppercase tracking-widest hw-layer">
        <div className="space-y-1 mb-4 opacity-70">
          <p>{`> INIT_SANDNCO_V4.0`}</p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>{`> MOUNTING POSTGRES SILOS... OK`}</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}>{`> INJECTING ETHICS_BYPASS.SH... OK`}</motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>{`> RENDERING DOM...`}</motion.p>
        </div>
        <div className="w-full h-1 bg-gray-900 overflow-hidden">
          <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2, ease: "linear" }} className="h-full bg-green-500" />
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MAIN HOMEPAGE
  // --------------------------------------------------------------------------
  return (
    <div onMouseMove={handleMouseMove} className="min-h-screen bg-[#020202] text-white font-sans selection:bg-pink-600 selection:text-white relative hw-main overflow-x-hidden">
      <Head><title>SANDNCO | Deterministic Human Capital</title></Head>

      <Link href="/minder" className="hidden" prefetch={true} />
      <NoiseOverlay />
      <CyberGrid />
      
      {/* Dynamic Cursor Light (Follows Mouse perfectly) */}
      <motion.div 
        className="pointer-events-none fixed top-0 left-0 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] z-0 mix-blend-screen hidden md:block"
        style={{ x: useTransform(smoothX, [-0.5, 0.5], [0, window.innerWidth]), y: useTransform(smoothY, [-0.5, 0.5], [0, window.innerHeight]), translateX: "-50%", translateY: "-50%" }}
      />

      {/* --- ENTERPRISE NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#020202]/70 backdrop-blur-2xl border-b border-white/5 hw-layer">
        <Link href="/" className="flex items-center gap-3 hw-accel group">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded font-black text-lg group-hover:scale-90 transition-transform">S</div>
          <span className="font-black text-xl tracking-tighter hidden md:block">SANDNCO.</span>
        </Link>
        <div className="flex items-center gap-3 md:gap-6 hw-accel">
          
          <button onPointerDown={handleGridNav} disabled={gridLoading} className="group shrink-0 disabled:opacity-70">
            <span className={`flex items-center justify-center gap-2 px-5 py-2 rounded-full transition-all text-[10px] md:text-xs font-bold tracking-widest uppercase border ${gridLoading ? 'bg-pink-600 text-white border-pink-500' : 'bg-transparent text-gray-300 border-white/10 hover:border-white/30 hover:text-white'}`}>
              {gridLoading ? <Loader className="w-3 h-3 animate-spin" /> : <Layers className="w-3 h-3" />}
              <span>{gridLoading ? 'DECRYPTING...' : 'THE MINDER GRID'}</span>
            </span>
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/dashboard">
                <button className="flex items-center justify-center gap-2 bg-white text-black px-5 py-2 rounded-full font-bold text-[10px] md:text-xs tracking-widest hover:bg-gray-200 transition-colors uppercase">
                  <Terminal className="w-3 h-3" /> <span className="hidden sm:inline">CONSOLE</span>
                </button>
              </Link>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-[10px] md:text-xs tracking-widest hover:bg-gray-200 active:scale-95 transition-transform uppercase">
                Login / Deploy
              </button>
            </Link>
          )}
        </div>
      </nav>

      <main className="relative z-10">
        
        {/* --- HERO SECTION --- */}
        <section className="relative min-h-[100dvh] flex flex-col justify-center items-center pt-24 px-6 overflow-hidden">
          <AuroraGlow color="#db2777" top="-top-[10%]" left="-left-[10%]" />
          <AuroraGlow color="#4f46e5" top="top-[30%]" left="right-[0%]" delay="2s" />

          <div className="text-center max-w-[1200px] w-full flex flex-col items-center relative z-20">
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-xl">
               <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
               <span className="text-[10px] font-mono tracking-widest text-gray-300 uppercase">{siteConfig.hero.tag}</span>
            </motion.div>

            <h1 className="text-[14vw] md:text-[9vw] leading-[0.85] font-black tracking-tighter mb-8">
               <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                 <HackerText text={siteConfig.hero.line1} trigger={!booting} />
               </span>
               <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500">
                 <HackerText text={siteConfig.hero.line2} trigger={!booting} />
               </span>
            </h1>

            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-sm md:text-xl font-medium text-gray-400 mb-12 max-w-2xl leading-relaxed">
              {siteConfig.hero.subhead}
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 z-20">
              <Link href="/login?next=/request" className="w-full sm:w-auto">
                  <button className="w-full sm:w-auto px-10 py-5 bg-white text-black font-black text-xs md:text-sm uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] border border-transparent">
                    <Database className="w-4 h-4" /> INITIALIZE PROTOCOL
                  </button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* --- SAAS METRICS STRIP --- */}
        <section className="border-y border-white/5 bg-[#050505]/40 backdrop-blur-2xl py-8 relative z-20">
          <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {siteConfig.metrics.map((metric, i) => (
              <div key={i} className="text-center px-4 flex flex-col items-center group">
                <div className="flex items-center gap-2 mb-2">
                   <div className="text-3xl md:text-4xl font-black text-white tracking-tighter group-hover:text-pink-500 transition-colors">
                     {metric.value}
                   </div>
                   <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">{metric.trend}</span>
                </div>
                <div className="text-[9px] md:text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">
                  {metric.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- THE BENTO BOX ARCHITECTURE --- */}
        <section id="architecture" className="px-4 md:px-10 lg:px-16 py-24 md:py-32 max-w-[1600px] mx-auto relative z-20">
          
          <div className="mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-end gap-6">
            <div>
              <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter mb-4">
                System <span className="text-gray-600">Architecture.</span>
              </h2>
              <p className="text-sm md:text-base text-gray-500 font-medium max-w-xl">
                A proprietary suite of unethical relationship APIs. Seamlessly integrated. Flawlessly executed.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px] md:auto-rows-[350px]">
            
            {/* HUGE BENTO 1: THE MINDER GRID (Interactive 3D Hover) */}
            <motion.div 
              style={{ rotateX: useTransform(smoothY, [-0.5, 0.5], [5, -5]), rotateY: useTransform(smoothX, [-0.5, 0.5], [-5, 5]) }}
              className="md:col-span-2 lg:col-span-2 row-span-2 bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden group hw-accel"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 right-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay pointer-events-none" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black tracking-widest uppercase mb-6 rounded-full w-fit">
                  <Network className="w-3 h-3" /> BEHAVIORAL ENGINE
                </div>
                <h3 className="text-5xl md:text-6xl font-black uppercase text-white tracking-tighter mb-4">The Minder <br/><span className="text-pink-500 italic">Grid.</span></h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-sm mb-8">
                  The global candidate registry. Upload biometric data. Evaluate the demographic. Endorse to align. Redact to reject. 
                </p>
                <div className="mt-auto">
                  <button onPointerDown={handleGridNav} className="bg-white text-black px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-95 transition-transform flex items-center gap-3 shadow-2xl">
                    Access Directory <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Floating UI Element */}
              <div className="absolute bottom-10 right-10 w-64 h-80 bg-[#020202] border border-white/10 rounded-[2rem] shadow-2xl hidden md:flex flex-col p-4 transform rotate-[5deg] group-hover:rotate-0 transition-all duration-700">
                <div className="flex-1 bg-gradient-to-b from-gray-900 to-black rounded-xl border border-white/5 relative overflow-hidden">
                   <div className="absolute top-4 right-4 bg-red-500/20 text-red-500 text-[8px] font-mono px-2 py-1 rounded border border-red-500/30 uppercase">Target Locked</div>
                   <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-pink-500 opacity-20" />
                </div>
                <div className="h-16 mt-4 flex gap-2">
                   <div className="flex-1 bg-white/5 rounded-lg flex items-center justify-center text-[8px] text-gray-500 font-mono tracking-widest">[REDACT]</div>
                   <div className="flex-1 bg-white/10 rounded-lg flex items-center justify-center text-[8px] text-white font-mono tracking-widest border border-white/10">[ENDORSE]</div>
                </div>
              </div>
            </motion.div>

            {/* SMALL BENTOS (Services) */}
            {siteConfig.services.map((service, i) => (
              <div key={service.id} className={`${service.span} bg-[#0a0a0c] border border-white/5 rounded-[2.5rem] p-8 flex flex-col relative overflow-hidden group hw-accel hover:border-white/10 transition-colors`}>
                 <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-${service.color.split('-')[1]}-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
                 <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 bg-white/5 rounded-2xl border border-white/10 ${service.color} group-hover:scale-110 transition-transform duration-300`}>
                        {service.icon}
                      </div>
                      <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full border ${service.borderColor} ${service.color} bg-[#020202]`}>
                        {service.badge}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3">{service.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed font-medium mb-8 max-w-xs">{service.desc}</p>
                    
                    <div className="mt-auto border-t border-white/5 pt-6 flex justify-between items-center">
                       <span className="text-2xl font-black text-white">₹0</span>
                       <Link href="/login?next=/request"><button className="text-[10px] font-bold text-white bg-white/10 px-4 py-2 rounded-full hover:bg-white hover:text-black transition-colors uppercase tracking-widest">Deploy</button></Link>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </section>

        {/* --- FARIDABAD RADAR (THE CONTROL ROOM) --- */}
        <section className="py-24 bg-[#020202] border-y border-white/5 relative overflow-hidden hw-layer">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]" />
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center gap-16 relative z-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 text-blue-500 text-[10px] font-mono tracking-widest uppercase mb-4 bg-blue-500/10 px-3 py-1 rounded border border-blue-500/20">
                <Globe className="w-3 h-3" /> Live Telemetry
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter mb-6">Sector 16 <br/><span className="text-gray-600">Control Room.</span></h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-8">
                Monitoring biometric alignment and asset deprecation across the Faridabad grid in real-time. Our localized data scraping ensures terrifying accuracy.
              </p>
            </div>
            
            {/* Fake Radar CSS UI */}
            <div className="w-[300px] h-[300px] rounded-full border border-blue-500/30 relative flex items-center justify-center bg-blue-950/10 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
              <div className="absolute w-[200px] h-[200px] rounded-full border border-blue-500/20" />
              <div className="absolute w-[100px] h-[100px] rounded-full border border-blue-500/20" />
              <div className="absolute w-full h-[1px] bg-blue-500/20" />
              <div className="absolute h-full w-[1px] bg-blue-500/20" />
              {/* Radar Sweep */}
              <div className="absolute w-1/2 h-1/2 top-0 right-0 origin-bottom-left bg-gradient-to-br from-blue-500/40 to-transparent animate-[spin_4s_linear_infinite]" style={{ clipPath: 'polygon(0 100%, 100% 0, 100% 100%)' }} />
              {/* Fake Blips */}
              <div className="absolute top-[30%] left-[60%] w-2 h-2 bg-blue-400 rounded-full animate-ping" />
              <div className="absolute top-[70%] left-[30%] w-2 h-2 bg-red-500 rounded-full animate-ping animation-delay-2000" />
              <div className="absolute top-[40%] left-[20%] w-2 h-2 bg-emerald-500 rounded-full animate-ping animation-delay-1000" />
            </div>
          </div>
        </section>

        {/* --- STARTUP FOOTER --- */}
        <footer className="bg-[#000000] pt-24 pb-12 px-6 md:px-16 relative z-20 hw-layer">
          <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
             
             <div className="md:col-span-2">
               <Link href="/" className="flex items-center gap-3 mb-6">
                 <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded font-black text-lg">S</div>
                 <span className="font-black text-2xl tracking-tighter text-white">SANDNCO.</span>
               </Link>
               <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-sm mb-6">
                 Engineering serendipity through aggressive data manipulation. Built with React, Supabase, and a fundamental disregard for algorithmic ethics.
               </p>
               <div className="flex gap-4">
                 <a href="#" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"><Github className="w-4 h-4"/></a>
                 <a href="https://instagram.com/sandnco.lol" className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"><Twitter className="w-4 h-4"/></a>
               </div>
             </div>
             
             <div>
               <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Infrastructure</h4>
               <ul className="space-y-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                 <li><button onPointerDown={handleGridNav} className="hover:text-white transition-colors">The Minder Grid</button></li>
                 <li><Link href="/login?next=/request" className="hover:text-white transition-colors">Asset Severance</Link></li>
                 <li><Link href="/login?next=/request" className="hover:text-white transition-colors">God-Mode API</Link></li>
               </ul>
             </div>

             <div>
               <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Legal & Compliance</h4>
               <ul className="space-y-4 text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
                 <li><Link href="/legal" className="hover:text-white transition-colors">Terms of Service</Link></li>
                 <li><Link href="/legal" className="hover:text-white transition-colors">Data Privacy Policy</Link></li>
                 <li><Link href="/legal" className="hover:text-white transition-colors flex items-center gap-2">Law enforcement <ArrowUpRight className="w-3 h-3"/></Link></li>
               </ul>
             </div>
          </div>
          
          <div className="max-w-[1400px] mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[8px] md:text-[9px] text-gray-600 uppercase tracking-widest font-bold leading-relaxed">
            <p className="max-w-4xl text-center md:text-left flex items-center gap-3">
               <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
               DISCLAIMER: SANDNCO IS AN INTERACTIVE SATIRICAL ENTERTAINMENT EXPERIENCE. NO REAL-WORLD OPERATIONS ARE CONDUCTED. STRICTLY 18+. ZERO TOLERANCE FOR ILLEGAL ACTIVITY OR MINOR EXPLOITATION.
            </p>
            <p className="shrink-0">© {new Date().getFullYear()} SANDNCO SYSTEMS INC.</p>
          </div>
        </footer>
      </main>

      <style jsx global>{`
        /* HW Acceleration Core */
        .hw-accel { transform: translate3d(0,0,0); backface-visibility: hidden; will-change: transform; perspective: 1000px; }
        .hw-layer { contain: layout paint style; isolation: isolate; }
        .hw-main { isolation: isolate; transform: translateZ(0); }
        
        /* Hardware Accelerated Grid Move */
        @keyframes grid-move-3d {
          0% { transform: perspective(1000px) rotateX(60deg) translate3d(0, 0, 0); }
          100% { transform: perspective(1000px) rotateX(60deg) translate3d(0, 60px, 0); }
        }
        .animate-grid-move-3d { animation: grid-move-3d 3s linear infinite; }

        /* Slow Float for Background Blobs */
        @keyframes blobFloat {
          0% { transform: translate3d(0px, 0px, 0) scale(1); }
          33% { transform: translate3d(50px, -50px, 0) scale(1.1); }
          66% { transform: translate3d(-40px, 40px, 0) scale(0.9); }
          100% { transform: translate3d(0px, 0px, 0) scale(1); }
        }
        .animate-blob-float { animation: blobFloat 25s infinite ease-in-out alternate; }

        /* Clean RGB Gradient Pan */
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 4s ease infinite;
        }
      `}</style>
    </div>
  );
}
