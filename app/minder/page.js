"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Crosshair, Lock, Activity, Terminal, ChevronRight, X, Check, 
  ArrowRight, ChevronLeft, Radar, Zap, User, Menu, Info, Layers, Eye, EyeOff
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ------------------------------------------------------------------               
// THE GRID CONTROLLER (v2.0.0-PRO)
// ------------------------------------------------------------------
export default function MinderHub() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [targets, setTargets] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginWarning, setLoginWarning] = useState(false);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);

  // 1. DATA INGESTION & TACTICAL PRE-LOADING
  const fetchTargets = useCallback(async (currentOffset = 0, currentSession = session) => {
    setFetchingMore(true);
    const limit = 20; 
    
    try {
      // Establish base uplink to public.minder_targets
      let query = supabase
        .from('minder_targets')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);
      
      if (currentSession?.user?.id) {
        const { data: swiped, error: swipeError } = await supabase
          .from('minder_swipes')
          .select('target_id')
          .eq('swiper_id', currentSession.user.id);
          
        if (swipeError) console.error("RADAR_ERROR: Swipe link degraded.");

        const swipedIds = swiped?.map(s => s.target_id).filter(id => !!id) || [];
        
        // CRITICAL FIX: Only exclude if history exists. Empty 'in' clause returns 0 results.
        if (swipedIds.length > 0) {
          query = query.not('id', 'in', `(${swipedIds.join(',')})`);
        }
        // neq('user_id') removed so users see their own profiles as requested.
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data && data.length > 0) {
        // PERFORMANCE: Pre-load image assets into browser cache immediately
        data.forEach(t => {
          const img = new Image();
          img.src = t.image_url;
        });

        setTargets(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTargets = data.filter(t => !existingIds.has(t.id));
          return [...newTargets.reverse(), ...prev];
        });
        setPageOffset(currentOffset + limit);
      }
    } catch (err) {
      console.error("🚨 CRITICAL_DB_SYNC_FAILURE:", err.message);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [session, supabase]);

  // 2. STABLE SYSTEM UPLINK (REALTIME FEED)
  useEffect(() => {
    const initializeSystem = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      await fetchTargets(0, activeSession);

      // Unique Channel ID prevents subscription collisions
      const channelId = `minder_broadcast_${Math.random().toString(36).substr(2, 9)}`;
      const channel = supabase.channel(channelId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const alias = t?.alias || 'ANON_TARGET';
           const action = payload.new.action;
           const color = action === 'SMASH' ? 'text-green-500' : action === 'PASS' ? 'text-red-500' : 'text-purple-500';
           
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT_*** ${action}ED [${alias}]`, color }, ...prev].slice(0, 50));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_targets' }, (payload) => {
           const newTarget = payload.new;
           setTargets(prev => [newTarget, ...prev]);
           setFeed(prev => [{ 
             id: `new-${newTarget.id}`, 
             text: `> NEW TARGET ENTERED GRID: [${newTarget.alias}]`, 
             color: 'text-yellow-500' 
           }, ...prev].slice(0, 50));
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    initializeSystem();
  }, [supabase, fetchTargets]);

  const processSwipe = async (direction, targetId, isOwnCard = false) => {
    if (!session && !isOwnCard) {
      setLoginWarning(true);
      setTimeout(() => setLoginWarning(false), 3000);
      return false; 
    }

    setTargets(prev => {
      const newDeck = [...prev];
      newDeck.pop(); 
      if (newDeck.length < 5 && !fetchingMore) fetchTargets(pageOffset, session);
      return newDeck;
    });

    if (isOwnCard || direction === 'dismiss') return true;

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    await supabase.from('minder_swipes').insert([{
      swiper_id: session.user.id,
      target_id: targetId,
      action: action
    }]);

    return true;
  };

  return (
    <div className="min-h-[100dvh] bg-[#010103] text-white overflow-hidden flex flex-col md:flex-row font-mono relative">
      
      {/* --- DYNAMIC BACKGROUND ARCHITECTURE --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-[1200px]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%),linear-gradient(90deg,rgba(255,0,255,0.02),rgba(0,255,255,0.01),rgba(255,255,255,0.02))] bg-[length:100%_4px,3px_100%]" />
        
        {/* Animated Perspective Floor */}
        <div className="absolute bottom-[-50%] left-[-50%] right-[-50%] h-[150%] 
             bg-[linear-gradient(transparent_95%,rgba(219,39,119,0.15)_100%),linear-gradient(90deg,transparent_95%,rgba(219,39,119,0.15)_100%)] 
             bg-[size:50px_50px] 
             [transform:rotateX(80deg)] 
             animate-[grid-move_15s_linear_infinite]
             opacity-40" 
        />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#010103]/80 to-[#010103] z-10" />
      </div>

      {/* --- MOBILE TACTICAL HUD TRIGGER --- */}
      <button 
        onClick={() => setMobileHudOpen(true)}
        className="md:hidden fixed top-6 right-6 z-[60] w-14 h-14 bg-pink-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(219,39,119,0.6)] border-2 border-pink-400 active:scale-90 transition-transform"
      >
        <Activity className="w-6 h-6 text-white animate-pulse" />
      </button>

      {/* --- MOBILE TACTICAL OVERLAY --- */}
      <AnimatePresence>
        {mobileHudOpen && (
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl md:hidden p-10 flex flex-col"
          >
            <div className="flex justify-between items-start mb-12">
               <div>
                 <h3 className="text-pink-500 font-black tracking-[0.4em] uppercase text-2xl">TACTICAL HUD</h3>
                 <p className="text-[10px] text-pink-900 font-black mt-2 uppercase tracking-widest bg-pink-500/10 px-2 py-0.5 rounded">Status: Operational</p>
               </div>
               <button onClick={() => setMobileHudOpen(false)} className="bg-white/5 p-4 rounded-full border border-white/10 active:bg-white/20"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-2 mb-10">
               <div className="text-[11px] text-pink-700 font-black tracking-widest border-b border-pink-900/30 pb-4 flex items-center gap-3">
                 <Radar className="w-4 h-4 animate-spin" /> LIVE GRID INTELLIGENCE
               </div>
               {feed.map(item => (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={item.id} className={`${item.color} text-[11px] font-bold border-l-2 border-current pl-4 py-3 bg-white/5 backdrop-blur-md rounded-r shadow-sm`}>
                   {item.text}
                 </motion.div>
               ))}
               {feed.length === 0 && <div className="text-gray-800 font-black text-xs animate-pulse tracking-[0.2em] mt-20 text-center">SCANNING NETWORK...</div>}
            </div>

            <Link href="/minder/enroll" onClick={() => setMobileHudOpen(false)}>
              <button className="w-full py-6 bg-pink-600 text-white font-black uppercase tracking-[0.3em] rounded-2xl shadow-[0_0_50px_rgba(219,39,119,0.5)] flex items-center justify-center gap-5 text-sm border-b-4 border-pink-800 active:translate-y-1 active:border-b-0 transition-all">
                <Zap className="w-6 h-6 fill-current" /> INJECT NEW DOSSIER
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DESKTOP PRO FEED SIDEBAR --- */}
      <div className="hidden md:flex flex-col w-[480px] bg-black/90 backdrop-blur-3xl border-r border-pink-600/20 p-12 z-10 shadow-[60px_0_150px_rgba(0,0,0,1)] pt-44 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/5 via-transparent to-transparent animate-[scan_10s_linear_infinite] pointer-events-none" />

        <div className="flex items-center gap-6 text-pink-500 mb-12 pb-10 border-b border-pink-900/40 relative z-10">
          <div className="p-4 bg-pink-900/20 rounded-2xl border border-pink-500/30 shadow-[0_0_30px_rgba(219,39,119,0.3)]">
            <Activity className="w-10 h-10 animate-pulse" />
          </div>
          <div>
            <h2 className="font-black tracking-tighter uppercase text-3xl leading-none">GLOBAL FEED</h2>
            <p className="text-xs text-pink-800 font-black mt-3 tracking-[0.4em]">ENCRYPTED UPLINK // ACTIVE</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-7 custom-scrollbar pr-5 relative z-10">
          <AnimatePresence mode="popLayout">
            {feed.length === 0 && <div className="text-gray-900 animate-pulse font-black text-sm tracking-[0.5em] mt-32 text-center">DECRYPTING...</div>}
            {feed.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -50, filter: "blur(12px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                className={`${item.color} font-black border-l-4 border-current pl-7 py-5 bg-gradient-to-r from-white/5 to-transparent rounded-r shadow-2xl relative group overflow-hidden`}
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-current animate-pulse" />
                <span className="text-[10px] opacity-30 block mb-3 font-mono tracking-[0.5em] uppercase italic">Signal_Aquired</span>
                <span className="text-sm tracking-tight leading-relaxed">{item.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="pt-12 border-t border-pink-600/20 mt-10 relative z-10">
           <Link href="/minder/enroll">
             <button className="w-full py-7 bg-pink-600 text-white text-base font-black tracking-[0.3em] hover:bg-pink-500 transition-all shadow-[0_0_80px_rgba(219,39,119,0.5)] group flex items-center justify-center gap-5 rounded-[2rem] border-b-4 border-pink-900 active:border-b-0 active:translate-y-1">
               <Zap className="w-7 h-7 group-hover:rotate-12 transition-transform fill-current text-white" /> INJECT NEW DOSSIER
             </button>
           </Link>
        </div>
      </div>

      {/* --- MAIN TARGETING GRID --- */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-10 pt-36 md:pt-0">
        
        {/* Responsive Header Branding */}
        <div className="absolute top-8 left-8 md:left-auto md:right-12 flex flex-col items-start md:items-end pointer-events-none">
           <Link href="/" className="group pointer-events-auto flex items-center gap-4 text-xs font-black text-gray-500 hover:text-white transition-all uppercase tracking-widest bg-black/60 px-6 py-3 rounded-full border border-white/10 backdrop-blur-xl mb-6 shadow-xl">
             <ChevronLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" /> BACK TO BASE
           </Link>
           <h1 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_40px_rgba(219,39,119,0.6)]">
             MINDER<span className="text-pink-600">_</span>
           </h1>
           <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] bg-pink-900/30 px-4 py-1.5 rounded-full border border-pink-500/20 mt-4 backdrop-blur-md shadow-inner">
             LAWSUIT PROTOCOL INITIATED
           </p>
        </div>

        <AnimatePresence>
          {loginWarning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.7, y: -100 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.7 }}
              className="absolute top-40 bg-red-600 text-white px-12 py-7 rounded-[2rem] border-4 border-red-900 font-black uppercase tracking-[0.3em] z-[120] flex items-center gap-6 shadow-[0_0_100px_rgba(220,38,38,0.9)] text-base"
            >
              <Lock className="w-8 h-8 animate-pulse" /> ACCESS_DENIED: LOGIN REQUIRED
            </motion.div>
          )}
        </AnimatePresence>

        {/* THE TARGET VIEWPORT (RESPONSIVE) */}
        <div className="relative w-full max-w-[460px] h-[70vh] md:h-[780px] flex items-center justify-center">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-10">
              <div className="relative scale-125">
                <Radar className="w-32 h-32 animate-spin opacity-40 text-pink-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 border-4 border-pink-500 rounded-full animate-ping" />
                </div>
              </div>
              <div className="text-base uppercase tracking-[0.6em] font-black animate-pulse text-center">Initializing<br/>Tactical Scan...</div>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center w-full bg-black/80 p-20 border-2 border-pink-600/40 rounded-[4rem] backdrop-blur-3xl relative overflow-hidden shadow-[0_0_120px_rgba(219,39,119,0.3)] border-dashed group">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-[500px] h-[500px] border-2 border-pink-500 rounded-full animate-ping" />
               </div>
               <Crosshair className="w-24 h-24 mx-auto mb-12 text-pink-500 opacity-60 group-hover:rotate-90 transition-transform duration-1000" />
               <p className="text-3xl uppercase tracking-tighter font-black text-white leading-none">NO BIOMETRICS DETECTED.</p>
               <p className="text-[12px] mt-10 text-pink-400 font-black uppercase tracking-[0.3em] leading-relaxed max-w-sm mx-auto opacity-70">
                 SECTOR NEUTRALIZED. GRID SYNC TERMINATED.<br/><br/>AWAITING FRESH INTEL UPLOADS.
               </p>
               <Link href="/minder/enroll" className="mt-16 block relative z-10">
                 <button className="text-sm bg-white text-black px-12 py-6 font-black tracking-[0.4em] rounded-[2rem] flex items-center justify-center gap-5 mx-auto hover:bg-pink-600 hover:text-white transition-all shadow-[0_0_40px_rgba(255,255,255,0.4)] uppercase active:scale-95">
                   <Zap className="w-6 h-6 fill-current" /> REPOPULATE GRID
                 </button>
               </Link>
            </div>
          ) : (
            targets.map((target, index) => {
              const isTop = index === targets.length - 1;
              const positionFromTop = targets.length - 1 - index;
              const isOwnCard = session?.user?.id === target.user_id;
              
              if (positionFromTop > 3) return null;

              return (
                <SwipeCard 
                  key={target.id} 
                  target={target} 
                  isTop={isTop} 
                  depthIndex={positionFromTop}
                  session={session}
                  isOwnCard={isOwnCard}
                  onSwipe={(dir) => processSwipe(dir, target.id, isOwnCard)}
                  onForceMatch={() => router.push(`/request?target=${encodeURIComponent(target.alias)}&service=matchup`)}
                />
              )
            })
          )}
        </div>

        {/* TACTICAL INSTRUCTIONS HUD (FOOTER) */}
        <div className="mt-12 md:mt-16 flex flex-col items-center gap-3 opacity-20 select-none pointer-events-none group hover:opacity-50 transition-opacity">
           <div className="flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.5em]">
             <span className="text-red-500 animate-pulse">← Swipe Left to Pass</span>
             <div className="h-4 w-px bg-gray-600 rotate-12" />
             <span className="text-green-500 animate-pulse">Swipe Right to Smash →</span>
           </div>
           <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500 italic">Grid Scans validated by Gemini Biometric Neural Engine</p>
        </div>

      </div>

      <style jsx global>{`
        @keyframes grid-move { 0% { background-position: 0 0; } 100% { background-position: 0 60px; } }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(219, 39, 119, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(219, 39, 119, 0.7); }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------------
// ADVANCED PHYSICS CARD COMPONENT
// ------------------------------------------------------------------
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, isOwnCard, onSwipe, onForceMatch }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  const rotate = useTransform(x, [-250, 250], [-18, 18]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.07);
  const opacity = useTransform(x, [-280, -180, 0, 180, 280], [0, 1, 1, 1, 0]);
  const yOffset = isTop ? 0 : depthIndex * 30;
  
  const smashOpacity = useTransform(x, [40, 200], [0, 1]);
  const passOpacity = useTransform(x, [-40, -200], [0, 1]);

  useEffect(() => {
    if (!isTop || isOwnCard) return;
    const handleKeyDown = async (e) => {
      if (e.key === 'ArrowRight') await triggerSwipeAnimation('right');
      else if (e.key === 'ArrowLeft') await triggerSwipeAnimation('left');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTop, isOwnCard]);

  const triggerSwipeAnimation = async (direction) => {
    const isAllowed = await onSwipe(direction);
    if (!isAllowed) {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 12 } });
      return;
    }
    const exitX = direction === 'right' ? 1500 : direction === 'left' ? -1500 : 0;
    const exitY = direction === 'dismiss' ? -1800 : 0;
    const exitRotate = direction === 'right' ? 80 : direction === 'left' ? -80 : 0;
    await controls.start({ x: exitX, y: exitY, rotate: exitRotate, opacity: 0, transition: { duration: 0.7, ease: "circOut" } });
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return; 
    const threshold = 160;
    const velocityThreshold = 800;
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) await triggerSwipeAnimation('right');
    else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) await triggerSwipeAnimation('left');
    else controls.start({ x: 0, transition: { type: "spring", stiffness: 600, damping: 20 } });
  };

  const redFlagScore = useMemo(() => {
    const hash = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 99) + 1;
  }, [target.id]);

  return (
    <motion.div
      style={{ x, rotate, scale, opacity, y: isOwnCard && isTop ? 0 : yOffset, zIndex: 70 - depthIndex }}
      animate={controls}
      drag={isTop && !isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1.3}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { cursor: "grabbing", scale: 1.05 } : {}}
      className={`absolute w-full h-full rounded-[3.5rem] bg-[#0c0c15] shadow-[0_60px_150px_rgba(0,0,0,1)] overflow-hidden border-2 ${isTop && !isOwnCard ? 'border-white/10 hover:border-white/25' : isOwnCard && isTop ? 'border-yellow-500 shadow-[0_0_80px_rgba(234,179,8,0.4)]' : 'border-white/5 opacity-40'} transition-all duration-700`}
    >
      {/* Target Asset Container */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${target.image_url})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-[#010103]/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#010103]/80 via-transparent to-transparent h-72" />
      </div>

      {/* OWN PROFILE PROTOCOL LOCK */}
      {isOwnCard && isTop && (
        <div className="absolute top-14 left-0 w-full bg-yellow-500 text-black py-4 font-black text-center tracking-[0.5em] text-[11px] uppercase z-30 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center gap-5">
          <User className="w-6 h-6 stroke-[3px]" /> BIOMETRIC_RECOGNITION: THIS IS YOU
        </div>
      )}

      {/* Dynamic Action Stamps */}
      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-40 left-12 border-[15px] border-green-500 text-green-500 font-black text-8xl px-14 py-6 rounded-[2.5rem] rotate-[-15deg] uppercase z-20 backdrop-blur-md bg-black/40 shadow-[0_0_120px_rgba(34,197,94,0.9)] pointer-events-none scale-110">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-40 right-12 border-[15px] border-red-500 text-red-500 font-black text-8xl px-14 py-6 rounded-[2.5rem] rotate-[15deg] uppercase z-20 backdrop-blur-md bg-black/40 shadow-[0_0_120px_rgba(239,68,68,0.9)] pointer-events-none scale-110">PASS</motion.div>
          <motion.div className="absolute inset-0 bg-green-500/15 pointer-events-none mix-blend-screen transition-opacity" style={{ opacity: smashOpacity }} />
          <motion.div className="absolute inset-0 bg-red-500/15 pointer-events-none mix-blend-screen transition-opacity" style={{ opacity: passOpacity }} />
        </>
      )}

      {/* BOTTOM DATA BLOCK */}
      <div className="absolute bottom-0 w-full p-12 flex flex-col gap-8 bg-gradient-to-t from-[#010103] via-[#010103]/98 to-transparent">
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0 pr-8">
            <h2 className="text-5xl md:text-6xl font-black uppercase text-white tracking-tighter drop-shadow-[0_4px_30px_rgba(0,0,0,1)] flex items-center gap-5 truncate leading-tight">
              {target.alias} <span className="text-3xl text-gray-500 font-normal">{target.age}</span>
            </h2>
            
            {session ? (
              <div className="text-base font-black text-white bg-pink-600 w-fit px-6 py-2.5 mt-5 rounded-2xl shadow-[0_0_50px_rgba(219,39,119,1)] flex items-center gap-5 border border-pink-400/50 group-hover:scale-110 transition-transform">
                <Terminal className="w-6 h-6" /> @{target.instagram_id}
              </div>
            ) : (
              <div className="text-[11px] font-black text-red-400 bg-red-950/80 w-fit px-6 py-2.5 mt-5 border border-red-900/80 rounded-2xl flex items-center gap-5 backdrop-blur-3xl uppercase tracking-[0.3em] shadow-lg">
                <Lock className="w-5 h-5" /> COORDINATES_ENCRYPTED
              </div>
            )}
          </div>

          <div className="text-center bg-black/98 p-5 rounded-[2.5rem] border border-white/10 backdrop-blur-3xl shadow-[0_20px_60px_rgba(0,0,0,1)] flex flex-col items-center min-w-[120px]">
            <div className="text-[10px] text-red-500 font-black uppercase tracking-[0.4em] mb-3 leading-none">RED_FLAG</div>
            <div className="text-5xl font-black text-white leading-none tracking-tighter">{redFlagScore}%</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 top-0 w-1.5 h-full bg-pink-600/40 rounded-full" />
          <p className="text-base md:text-lg text-gray-200 font-bold leading-relaxed bg-white/5 p-8 rounded-[2rem] border border-white/5 backdrop-blur-sm shadow-inner italic">
            {session ? (
              `"${target.bio}"`
            ) : (
              <span className="flex flex-wrap gap-2 items-center opacity-60">
                <EyeOff className="w-5 h-5 inline text-red-500 mr-2" />
                {target.bio.split(' ').map((word, i) => i % 2 === 0 ? '██████' : word).join(' ')}
              </span>
            )}
          </p>
        </div>

        {isTop && (
          <div className="mt-8" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button 
                 onClick={() => triggerSwipeAnimation('dismiss')} 
                 className="w-full bg-yellow-500 text-black py-7 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.6em] hover:bg-white transition-all flex items-center justify-center gap-6 shadow-[0_20px_80px_rgba(0,0,0,0.5)] active:scale-95"
               >
                 <X className="w-7 h-7 stroke-[4px]" /> DISMISS YOUR DOSSIER
               </button>
             ) : (
               <button 
                 onClick={() => onForceMatch()} 
                 className="w-full bg-white text-black py-7 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.6em] hover:bg-pink-600 hover:text-white transition-all flex items-center justify-center gap-6 shadow-[0_0_80px_rgba(255,255,255,0.4)] group active:scale-95 border-b-8 border-gray-300 hover:border-pink-800"
               >
                 <Crosshair className="w-8 h-8 group-hover:scale-150 transition-transform stroke-[4px]" /> INITIATE FORCE MATCH
               </button>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";
