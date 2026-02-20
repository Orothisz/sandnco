"use client";

import { motion, AnimatePresence, useScroll, useTransform, useMotionTemplate, useSpring } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  ShieldAlert, Fingerprint, Eye, Lock, Skull, Activity, 
  Terminal, ChevronRight, Flame, Crosshair, Zap, Radar, 
  Database, Network, Cpu, Code2, Layers, ArrowRight, ShieldCheck, 
  BarChart3, Globe, Sparkles, ArrowUpRight, Github, Twitter
} from "lucide-react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import Head from "next/head";

// ============================================================================
// THE SAAS CATALOG (DYSTOPIAN ENTERPRISE COPY)
// ============================================================================
const siteConfig = {
  hero: {
    tag: "SANDNCO V4.0 DEPLOYED",
    line1: "HUMAN CAPITAL",
    line2: "OPTIMIZED.",
    subhead: "The world's first B2C platform for deterministic relationship lifecycle management. We don't wait for fate. We write the algorithm.",
  },
  metrics: [
    { label: "Assets Severed", value: "14,204", suffix: "+" },
    { label: "Pairings Executed", value: "99.8", suffix: "%" },
    { label: "Moral Oversight", value: "0", suffix: "" },
    { label: "Network Uptime", value: "99.99", suffix: "%" }
  ]
};

// ============================================================================
// 60FPS HARDWARE-ACCELERATED CORE COMPONENTS
// ============================================================================
const NoiseOverlay = () => <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.06] mix-blend-screen hw-accel bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />;
const CyberGrid = () => (
  <div className="fixed inset-0 pointer-events-none z-0 hw-accel opacity-20 [mask-image:linear-gradient(to_bottom,white_20%,transparent_80%)]">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px] animate-grid-move-3d" />
  </div>
);

// High-End SaaS Animated Gradient Text
const GradientText = ({ text, from = "from-white", via = "via-gray-200", to = "to-gray-500" }) => (
  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${from} ${via} ${to} animate-gradient-x`}>
    {text}
  </span>
);

// Typing Terminal Effect
const TerminalBlock = () => {
  const [text, setText] = useState("");
  const fullText = ">\n> CONNECTING TO SECURE SILO...\n> AES-256 ENCRYPTION VERIFIED\n> BYPASSING ETHICS PROTOCOLS...\n> ACCESS GRANTED.";
  
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#020202] border border-white/10 rounded-2xl p-6 font-mono text-[10px] md:text-xs text-emerald-500 shadow-inner h-full flex flex-col hw-layer">
      <div className="flex gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500/50" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
        <div className="w-3 h-3 rounded-full bg-green-500/50" />
      </div>
      <div className="whitespace-pre-wrap flex-1">{text}<span className="animate-pulse">_</span></div>
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
  const [gridLoading, setGridLoading] = useState(false);
  const containerRef = useRef(null);

  // Smooth Scroll Parallax
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end end"] });
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 300]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Mouse Tracking for dynamic glowing background
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleGridNav = useCallback(() => {
    if (gridLoading) return;
    setGridLoading(true);
    router.push('/minder');
  }, [gridLoading, router]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkUser();
  }, [supabase]);

  return (
    <div ref={containerRef} onMouseMove={handleMouseMove} className="min-h-screen bg-[#000000] text-gray-100 font-sans selection:bg-pink-500 selection:text-white relative hw-main overflow-x-hidden">
      <Head>
        <title>SANDNCO | Enterprise Human Capital Management</title>
      </Head>

      <Link href="/minder" className="hidden" prefetch={true} />
      <NoiseOverlay />
      <CyberGrid />
      
      {/* Dynamic Cursor Glow (Hardware Accelerated via translate3d) */}
      <div 
        className="pointer-events-none fixed top-0 left-0 w-[600px] h-[600px] bg-pink-600/10 rounded-full blur-[150px] z-0 transition-transform duration-500 ease-out hw-accel hidden md:block mix-blend-screen"
        style={{ transform: `translate3d(${mousePos.x - 300}px, ${mousePos.y - 300}px, 0)` }}
      />

      {/* --- ENTERPRISE NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 px-6 py-4 flex justify-between items-center bg-[#000000]/60 backdrop-blur-xl border-b border-white/5 hw-layer">
        <Link href="/" className="flex items-center gap-3 hw-accel group">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg font-black text-lg group-hover:rotate-12 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]">S</div>
          <span className="font-black text-xl tracking-tighter text-white">SANDNCO<span className="text-gray-500">.LOL</span></span>
        </Link>
        <div className="flex items-center gap-3 md:gap-6 hw-accel">
          
          <button onPointerDown={handleGridNav} disabled={gridLoading} className="group shrink-0 disabled:opacity-70">
            <span className={`flex items-center justify-center gap-2 px-4 py-2 rounded-full transition-all text-[10px] md:text-xs font-bold tracking-wider ${gridLoading ? 'bg-pink-600 text-white' : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'}`}>
              {gridLoading ? <Loader className="w-3 h-3 md:w-4 md:h-4 animate-spin" /> : <Layers className="w-3 h-3 md:w-4 md:h-4" />}
              <span className="hidden sm:inline">{gridLoading ? 'DECRYPTING...' : 'THE MINDER GRID'}</span>
            </span>
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/dashboard">
                <button className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-full font-bold text-[10px] md:text-xs tracking-wider hover:bg-gray-200 transition-colors">
                  <Terminal className="w-3 h-3 md:w-4 md:h-4" /> <span className="hidden sm:inline">DASHBOARD</span>
                </button>
              </Link>
              <button onClick={() => { supabase.auth.signOut(); router.push('/'); }} className="flex items-center justify-center text-gray-400 hover:text-white bg-white/5 p-2 rounded-full transition-colors border border-white/10 hover:bg-white/10">
                <Power className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-white text-black px-6 py-2 rounded-full font-bold text-[10px] md:text-xs tracking-wider hover:scale-105 active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                LOGIN / DEPLOY
              </button>
            </Link>
          )}
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <motion.section style={{ y: yHero, opacity: opacityHero }} className="relative min-h-[100dvh] flex flex-col justify-center items-center pt-24 px-6 z-10 hw-accel">
        <div className="relative text-center max-w-[1200px] w-full flex flex-col items-center">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="inline-flex items-center gap-3 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-xl">
             <Sparkles className="w-3 h-3 text-pink-500" />
             <span className="text-[10px] font-mono tracking-widest text-gray-300 uppercase">{siteConfig.hero.tag}</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: "spring" }} className="text-[13vw] md:text-[9vw] leading-[0.85] font-black tracking-tighter mb-8 z-10">
             <span className="block text-white drop-shadow-2xl">{siteConfig.hero.line1}</span>
             <span className="block mt-1 md:mt-2"><GradientText text={siteConfig.hero.line2} from="from-pink-500" via="via-purple-500" to="to-indigo-500"/></span>
          </motion.h1>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="text-sm md:text-xl font-medium text-gray-400 mb-12 max-w-2xl leading-relaxed">
            {siteConfig.hero.subhead}
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto px-4 z-20">
            <Link href="/login?next=/request" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-white text-black font-black text-xs md:text-sm uppercase tracking-[0.2em] rounded-full active:scale-95 transition-all flex items-center justify-center gap-3 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                  INITIALIZE PROTOCOL <ArrowRight className="w-4 h-4" />
                </button>
            </Link>
            <Link href="#architecture" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-5 bg-white/5 border border-white/10 text-white font-bold text-xs md:text-sm uppercase tracking-[0.2em] rounded-full active:scale-95 transition-all flex items-center justify-center gap-3 hover:bg-white/10 backdrop-blur-md">
                  READ DOCS
                </button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* --- CORPORATE METRICS STRIP --- */}
      <section className="border-y border-white/5 bg-[#050505]/50 backdrop-blur-xl py-12 relative z-20 hw-layer">
        <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
          {siteConfig.metrics.map((metric, i) => (
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={i} className="text-center px-4">
              <div className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">
                {metric.value}<span className="text-pink-500">{metric.suffix}</span>
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest font-bold">
                {metric.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- BENTO BOX ARCHITECTURE (FEATURES) --- */}
      <section id="architecture" className="px-4 md:px-10 lg:px-16 py-24 md:py-32 max-w-[1600px] mx-auto relative z-20 hw-layer">
        
        <div className="mb-16 md:mb-24 text-center">
          <h2 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">
            System <GradientText text="Architecture." from="from-gray-400" via="via-white" to="to-gray-400" />
          </h2>
          <p className="text-sm text-gray-500 font-medium max-w-2xl mx-auto">
            Our proprietary suite of unethical relationship APIs. Seamlessly integrated. Flawlessly executed. Plausible deniability guaranteed.
          </p>
        </div>

        {/* CSS GRID BENTO BOX */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px] md:auto-rows-[350px]">
          
          {/* HUGE BENTO 1: THE MINDER GRID */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="md:col-span-2 lg:col-span-2 row-span-2 bg-[#0a0a0c] border border-white/5 rounded-[2rem] p-8 md:p-12 relative overflow-hidden group hw-accel">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-black tracking-widest uppercase mb-6 rounded-full w-fit">
                <Network className="w-3 h-3" /> Core Database
              </div>
              <h3 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter mb-4">The Minder Grid</h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                The global candidate registry. Upload biometric data. Evaluate the demographic. Endorse to align. Redact to reject. 
              </p>
              
              <div className="mt-auto">
                <button onPointerDown={handleGridNav} className="bg-white text-black px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-2">
                  Access Directory <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Decorative 3D Elements */}
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-[#050505] border-[4px] border-white/5 rounded-[2rem] rotate-[-12deg] shadow-2xl group-hover:rotate-[-5deg] transition-transform duration-500 flex flex-col p-4">
              <div className="w-full h-full border border-white/10 rounded-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-pink-500/20" />
                <Crosshair className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 text-pink-500 opacity-50" />
              </div>
            </div>
          </motion.div>

          {/* BENTO 2: ASSET SEVERANCE (BREAKUP) */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-1 lg:col-span-2 bg-gradient-to-br from-[#110505] to-[#050000] border border-red-500/20 rounded-[2rem] p-8 relative overflow-hidden group hw-accel">
             <div className="relative z-10 h-full flex flex-col">
                <Skull className="w-8 h-8 text-red-500 mb-6" />
                <h3 className="text-2xl font-black uppercase text-white tracking-tight mb-2">Asset Severance</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">Clean, untraceable disengagement. We execute the termination protocol; you retain total deniability.</p>
                <div className="mt-auto flex justify-between items-end border-t border-red-500/20 pt-4">
                  <span className="text-2xl font-black text-white">₹0</span>
                  <Link href="/login?next=/request"><button className="text-xs font-bold text-red-400 hover:text-red-300 uppercase tracking-widest">Deploy →</button></Link>
                </div>
             </div>
          </motion.div>

          {/* BENTO 3: LIVE TERMINAL */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-1 lg:col-span-1 bg-transparent rounded-[2rem] overflow-hidden hw-accel hidden md:block">
            <TerminalBlock />
          </motion.div>

          {/* BENTO 4: STATE RESTORATION (PATCHUP) */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="md:col-span-1 lg:col-span-1 bg-gradient-to-br from-[#050811] to-[#000511] border border-blue-500/20 rounded-[2rem] p-8 relative overflow-hidden group hw-accel">
             <div className="relative z-10 h-full flex flex-col">
                <Database className="w-8 h-8 text-blue-500 mb-6" />
                <h3 className="text-2xl font-black uppercase text-white tracking-tight mb-2">State Restoration</h3>
                <p className="text-xs text-gray-400 leading-relaxed mb-6">Algorithmic memory optimization and social re-engagement routing.</p>
                <div className="mt-auto flex justify-between items-end border-t border-blue-500/20 pt-4">
                  <span className="text-2xl font-black text-white">₹0</span>
                  <Link href="/login?next=/request"><button className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest">Deploy →</button></Link>
                </div>
             </div>
          </motion.div>

          {/* BENTO 5: BLACK BOX (VIP) */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="md:col-span-2 lg:col-span-2 bg-[#0a0a0c] border border-white/5 rounded-[2rem] p-8 relative overflow-hidden group hw-accel flex flex-col justify-center items-center text-center">
             <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
             <Lock className="w-10 h-10 text-purple-500 mb-4 opacity-80 group-hover:scale-110 transition-transform" />
             <h3 className="text-3xl font-black uppercase text-white tracking-tighter mb-2">The Black Box</h3>
             <p className="text-sm text-gray-500 max-w-sm mb-6">Full-spectrum reality distortion. We manipulate the variables. You just arrive at the coordinates. NDA required.</p>
             <Link href="/login?next=/request">
               <button className="bg-white/10 border border-white/20 text-white px-6 py-2 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                 Request Clearance
               </button>
             </Link>
          </motion.div>

        </div>
      </section>

      {/* --- FAKE "TRUST" / SATIRE BANNER --- */}
      <section className="py-20 bg-[#020202] border-t border-white/5 relative z-20 hw-layer overflow-hidden">
        <div className="absolute left-0 w-32 h-full bg-gradient-to-r from-[#020202] to-transparent z-10" />
        <div className="absolute right-0 w-32 h-full bg-gradient-to-l from-[#020202] to-transparent z-10" />
        <div className="flex gap-16 whitespace-nowrap animate-marquee-right-3d opacity-40 font-black text-2xl md:text-4xl text-gray-600 uppercase tracking-tighter mix-blend-screen hw-accel">
           <span>SOC2 NON-COMPLIANT</span> <span>•</span>
           <span>ETHICS-FREE ARCHITECTURE</span> <span>•</span>
           <span>ZERO MORAL OVERSIGHT</span> <span>•</span>
           <span>BANNED IN 14 JURISDICTIONS</span> <span>•</span>
           <span>SOC2 NON-COMPLIANT</span> <span>•</span>
           <span>ETHICS-FREE ARCHITECTURE</span> <span>•</span>
        </div>
      </section>

      {/* --- STARTUP FOOTER --- */}
      <footer className="bg-[#000000] pt-24 pb-12 px-6 md:px-16 border-t border-white/10 relative z-20 hw-layer">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
           
           <div className="md:col-span-2">
             <Link href="/" className="flex items-center gap-3 mb-6">
               <div className="w-8 h-8 bg-white text-black flex items-center justify-center rounded-lg font-black text-lg">S</div>
               <span className="font-black text-2xl tracking-tighter text-white">SANDNCO.</span>
             </Link>
             <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-sm">
               Engineering serendipity through aggressive data manipulation. Built with React, Supabase, and a fundamental disregard for algorithmic ethics.
             </p>
           </div>
           
           <div>
             <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Architecture</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
               <li><button onPointerDown={handleGridNav} className="hover:text-white transition-colors">The Minder Grid</button></li>
               <li><Link href="/login?next=/request" className="hover:text-white transition-colors">Asset Severance</Link></li>
               <li><Link href="/login?next=/request" className="hover:text-white transition-colors">State Restoration</Link></li>
             </ul>
           </div>

           <div>
             <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6">Compliance</h4>
             <ul className="space-y-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
               <li><Link href="/legal" className="hover:text-white transition-colors">Terms of Service</Link></li>
               <li><Link href="/legal" className="hover:text-white transition-colors">Privacy Policy</Link></li>
               <li><a href="https://instagram.com/sandnco.lol" className="hover:text-white transition-colors flex items-center gap-2">IG Uplink <ArrowUpRight className="w-3 h-3"/></a></li>
             </ul>
           </div>
        </div>
        
        <div className="max-w-[1600px] mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] text-gray-600 uppercase tracking-widest font-bold leading-relaxed">
          <p className="max-w-3xl text-center md:text-left flex items-center gap-2">
             <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
             SANDNCO IS AN INTERACTIVE SATIRICAL ENTERTAINMENT EXPERIENCE. STRICTLY 18+. ZERO TOLERANCE FOR ILLEGAL ACTIVITY OR MINOR EXPLOITATION.
          </p>
          <p className="shrink-0 flex items-center gap-4">
            <span>© {new Date().getFullYear()} SANDNCO SYSTEMS</span>
          </p>
        </div>
      </footer>

      <style jsx global>{`
        /* HW Acceleration Core */
        .hw-accel { transform: translate3d(0,0,0); backface-visibility: hidden; will-change: transform; perspective: 1000px; }
        .hw-layer { contain: layout paint style; isolation: isolate; }
        .hw-main { isolation: isolate; transform: translateZ(0); }
        
        /* 60FPS Infinite Marquees */
        @keyframes marqueeLeft3D { 0% { transform: translate3d(0, 0, 0); } 100% { transform: translate3d(-50%, 0, 0); } }
        @keyframes marqueeRight3D { 0% { transform: translate3d(-50%, 0, 0); } 100% { transform: translate3d(0, 0, 0); } }
        .animate-marquee-left-3d { animation: marqueeLeft3D 20s linear infinite; }
        .animate-marquee-right-3d { animation: marqueeRight3D 20s linear infinite; }

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
        .animation-delay-2000 { animation-delay: 2s; }

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
