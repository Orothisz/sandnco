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
// THE GRID CONTROLLER (v3.0.0 - PERFORMANCE OPTIMIZED)
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

  // 1. STABLE DATA INGESTION
  const fetchTargets = useCallback(async (currentOffset = 0, currentSession = session) => {
    setFetchingMore(true);
    const limit = 15; 
    
    try {
      let query = supabase
        .from('minder_targets')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);
      
      if (currentSession?.user?.id) {
        const { data: swiped } = await supabase
          .from('minder_swipes')
          .select('target_id')
          .eq('swiper_id', currentSession.user.id);
          
        const swipedIds = swiped?.map(s => s.target_id).filter(id => !!id) || [];
        
        if (swipedIds.length > 0) {
          query = query.not('id', 'in', `(${swipedIds.join(',')})`);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      
      if (data && data.length > 0) {
        setTargets(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTargets = data.filter(t => !existingIds.has(t.id));
          return [...newTargets.reverse(), ...prev];
        });
        setPageOffset(currentOffset + limit);
      }
    } catch (err) {
      console.error("🚨 DATABASE_SYNC_ERROR:", err.message);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [session, supabase]);

  // 2. REALTIME UPLINK
  useEffect(() => {
    const initializeSystem = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      await fetchTargets(0, activeSession);

      const channelId = `minder_broadcast_${Math.random().toString(36).substr(2, 9)}`;
      const channel = supabase.channel(channelId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const alias = t?.alias || 'ANON_TARGET';
           const action = payload.new.action;
           const color = action === 'SMASH' ? 'text-green-500' : 'text-red-500' : 'text-purple-500';
           
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

  // 3. SWIPE HANDLER (Fixes the Smash/Pass Glitch)
  const processSwipe = async (direction, targetId, isOwnCard = false) => {
    if (!session && !isOwnCard) {
      setLoginWarning(true);
      setTimeout(() => setLoginWarning(false), 3000);
      return; 
    }

    // Delay the array pop so Framer Motion can finish the fly-away animation
    setTimeout(() => {
      setTargets(prev => {
        const newDeck = [...prev];
        newDeck.pop(); 
        if (newDeck.length < 5 && !fetchingMore) fetchTargets(pageOffset, session);
        return newDeck;
      });
    }, 300);

    if (isOwnCard || direction === 'dismiss') return;

    await supabase.from('minder_swipes').insert([{
      swiper_id: session.user.id,
      target_id: targetId,
      action: direction === 'right' ? 'SMASH' : 'PASS'
    }]);
  };

  return (
    <div className="min-h-[100dvh] bg-[#020205] text-white overflow-hidden flex flex-col md:flex-row font-mono relative">
      
      {/* --- BACKGROUND EFFECTS (Optimized for Safari) --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%),linear-gradient(90deg,rgba(255,0,255,0.02),rgba(0,255,255,0.01))] bg-[length:100%_4px,3px_100%]" />
        <div className="absolute bottom-[-50%] left-[-50%] right-[-50%] h-[150%] bg-[linear-gradient(transparent_95%,rgba(219,39,119,0.1)_100%),linear-gradient(90deg,transparent_95%,rgba(219,39,119,0.1)_100%)] bg-[size:50px_50px] [transform:rotateX(75deg)] animate-[grid-move_20s_linear_infinite] opacity-30" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#020205]/80 to-[#020205] z-10" />
      </div>

      {/* --- MOBILE TACTICAL HUD TRIGGER --- */}
      <button 
        onClick={() => setMobileHudOpen(true)}
        className="md:hidden fixed top-4 right-4 z-[60] w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(219,39,119,0.4)] border border-pink-400 active:scale-90 transition-transform"
      >
        <Activity className="w-5 h-5 text-white animate-pulse" />
      </button>

      {/* --- MOBILE TACTICAL OVERLAY --- */}
      <AnimatePresence>
        {mobileHudOpen && (
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md md:hidden p-8 flex flex-col"
          >
            <div className="flex justify-between items-start mb-10 border-b border-white/10 pb-4">
               <div>
                 <h3 className="text-pink-500 font-black tracking-[0.2em] uppercase text-xl">TACTICAL HUD</h3>
                 <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Uplink: Active</p>
               </div>
               <button onClick={() => setMobileHudOpen(false)} className="bg-white/5 p-3 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-8 custom-scrollbar">
               <div className="text-[10px] text-pink-600 font-black tracking-widest pb-2 flex items-center gap-2">
                 <Radar className="w-3 h-3 animate-spin" /> LIVE INTELLIGENCE
               </div>
               {feed.map(item => (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={item.id} className={`${item.color} text-[10px] font-bold border-l-2 border-current pl-3 py-2 bg-white/5 rounded-r`}>
                   {item.text}
                 </motion.div>
               ))}
               {feed.length === 0 && <div className="text-gray-700 font-bold text-xs animate-pulse tracking-widest mt-10">SCANNING NETWORK...</div>}
            </div>

            <Link href="/minder/enroll" onClick={() => setMobileHudOpen(false)}>
              <button className="w-full py-5 bg-pink-600 text-white font-black uppercase tracking-[0.2em] rounded-xl shadow-[0_0_20px_rgba(219,39,119,0.4)] flex items-center justify-center gap-3 text-sm active:scale-95 transition-transform">
                <Zap className="w-5 h-5 fill-current" /> INJECT NEW DOSSIER
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DESKTOP PRO FEED SIDEBAR --- */}
      <div className="hidden md:flex flex-col w-[400px] bg-black/80 backdrop-blur-md border-r border-pink-600/20 p-10 z-10 shadow-2xl relative">
        <div className="flex items-center gap-4 text-pink-500 mb-8 pb-6 border-b border-pink-900/30">
          <Activity className="w-8 h-8 animate-pulse" />
          <div>
            <h2 className="font-black tracking-tighter uppercase text-2xl leading-none">GLOBAL FEED</h2>
            <p className="text-[10px] text-pink-700 font-bold mt-2 tracking-[0.2em]">ENCRYPTED UPLINK</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-4">
          <AnimatePresence mode="popLayout">
            {feed.length === 0 && <div className="text-gray-800 animate-pulse font-black text-xs tracking-[0.3em] mt-10 text-center">DECRYPTING TRAFFIC...</div>}
            {feed.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className={`${item.color} font-black border-l-4 border-current pl-5 py-4 bg-white/5 rounded-r text-xs tracking-tight leading-relaxed`}
              >
                <span className="text-[9px] opacity-40 block mb-1 font-mono tracking-widest uppercase">Signal_Rcvd</span>
                {item.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="pt-8 border-t border-pink-600/20 mt-6">
           <Link href="/minder/enroll">
             <button className="w-full py-5 bg-pink-600 text-white text-sm font-black tracking-[0.2em] hover:bg-pink-500 transition-all rounded-xl shadow-[0_0_30px_rgba(219,39,119,0.3)] flex items-center justify-center gap-3">
               <Zap className="w-5 h-5 fill-current" /> INJECT DOSSIER
             </button>
           </Link>
        </div>
      </div>

      {/* --- MAIN TARGETING GRID (FLEX LAYOUT PREVENTS OVERLAP) --- */}
      <div className="flex-1 flex flex-col relative z-10 p-4 md:p-8 h-[100dvh]">
        
        {/* HEADER BLOCK */}
        <div className="flex justify-between items-start w-full mb-6">
           <Link href="/" className="group flex items-center gap-3 text-[10px] font-black text-gray-400 hover:text-white transition-all uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
             <ChevronLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" /> BASE
           </Link>
           <div className="text-right flex flex-col items-end">
             <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-lg">
               MINDER<span className="text-pink-600">_</span>
             </h1>
             <p className="text-[8px] md:text-[9px] font-bold text-pink-500 uppercase tracking-widest bg-pink-900/20 px-3 py-1 rounded border border-pink-500/20 mt-2">
               LAWSUIT PROTOCOL ACTIVE
             </p>
           </div>
        </div>

        {/* SECURITY WARNING */}
        <AnimatePresence>
          {loginWarning && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="absolute top-24 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-4 rounded-xl border-2 border-red-900 font-black uppercase tracking-widest z-[120] flex items-center gap-4 shadow-[0_0_40px_rgba(220,38,38,0.7)] text-sm w-max"
            >
              <Lock className="w-5 h-5 animate-pulse" /> LOGIN REQUIRED
            </motion.div>
          )}
        </AnimatePresence>

        {/* TARGET VIEWPORT STACK (Takes up remaining middle space) */}
        <div className="flex-1 w-full flex items-center justify-center relative my-4">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-6">
              <Radar className="w-20 h-20 animate-spin opacity-40 text-pink-600" />
              <div className="text-sm uppercase tracking-[0.4em] font-black animate-pulse">Scanning Grid...</div>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center w-full max-w-[400px] bg-black/80 p-12 border border-pink-600/30 rounded-[3rem] backdrop-blur-md border-dashed shadow-2xl">
               <Crosshair className="w-16 h-16 mx-auto mb-8 text-pink-500 opacity-60" />
               <p className="text-2xl uppercase tracking-tighter font-black text-white leading-none">NO BIOMETRICS DETECTED.</p>
               <p className="text-[10px] mt-6 text-pink-400 font-bold uppercase tracking-widest leading-relaxed opacity-70">
                 SECTOR NEUTRALIZED.<br/><br/>AWAITING FRESH INTEL.
               </p>
               <Link href="/minder/enroll" className="mt-10 block">
                 <button className="text-xs bg-white text-black px-8 py-4 font-black tracking-widest rounded-xl flex items-center justify-center gap-3 mx-auto hover:bg-pink-600 hover:text-white transition-all shadow-xl">
                   <Zap className="w-4 h-4 fill-current" /> REPOPULATE SECTOR
                 </button>
               </Link>
            </div>
          ) : (
            <div className="relative w-full max-w-[420px] h-full max-h-[70vh] md:max-h-[700px] flex items-center justify-center">
              {targets.map((target, index) => {
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
              })}
            </div>
          )}
        </div>

        {/* TACTICAL INSTRUCTIONS HUD (FOOTER) */}
        <div className="mt-auto pt-4 flex flex-col items-center gap-2 opacity-30 select-none pb-4">
           <div className="flex items-center gap-4 text-[10px] md:text-xs font-black uppercase tracking-widest">
             <span className="text-red-500">← Swipe Left to Pass</span>
             <div className="h-4 w-px bg-gray-600" />
             <span className="text-green-500">Swipe Right to Smash →</span>
           </div>
           <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 italic text-center">
             Grid Scans validated by Gemini Biometric AI
           </p>
        </div>

      </div>

      <style jsx global>{`
        @keyframes grid-move { 0% { background-position: 0 0; } 100% { background-position: 0 50px; } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(219, 39, 119, 0.4); border-radius: 10px; }
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
  
  const rotate = useTransform(x, [-250, 250], [-10, 10]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.05);
  const opacity = useTransform(x, [-250, -150, 0, 150, 250], [0, 1, 1, 1, 0]);
  const yOffset = isTop ? 0 : depthIndex * 20;
  
  const smashOpacity = useTransform(x, [40, 150], [0, 1]);
  const passOpacity = useTransform(x, [-40, -150], [0, 1]);

  useEffect(() => {
    if (!isTop || isOwnCard) return;
    const handleKeyDown = async (e) => {
      if (e.key === 'ArrowRight') await triggerSwipeAnimation('right');
      else if (e.key === 'ArrowLeft') await triggerSwipeAnimation('left');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTop, isOwnCard]);

  // Fix: Animate the card off screen FIRST, then call onSwipe to delete it from state
  const triggerSwipeAnimation = async (direction) => {
    if (isOwnCard && direction !== 'dismiss') return;

    const exitX = direction === 'right' ? 1000 : direction === 'left' ? -1000 : 0;
    const exitY = direction === 'dismiss' ? -1000 : 0;
    const exitRotate = direction === 'right' ? 45 : direction === 'left' ? -45 : 0;
    
    await controls.start({ x: exitX, y: exitY, rotate: exitRotate, opacity: 0, transition: { duration: 0.4, ease: "circOut" } });
    
    // Only process state removal AFTER animation finishes
    onSwipe(direction);
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return; 
    const threshold = 120;
    const velocityThreshold = 600;
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      await triggerSwipeAnimation('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      await triggerSwipeAnimation('left');
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 20 } });
    }
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
      dragElastic={1.1}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { cursor: "grabbing", scale: 1.02 } : {}}
      className={`absolute w-full h-full rounded-[2.5rem] bg-[#0c0c15] shadow-2xl overflow-hidden border-2 ${isTop && !isOwnCard ? 'border-white/10 hover:border-white/20' : isOwnCard && isTop ? 'border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.2)]' : 'border-white/5 opacity-60'}`}
    >
      {/* Optimized Background Image (No massive backdrop blurs) */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${target.image_url})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-[#010103]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#010103]/80 via-transparent to-transparent h-40" />
      </div>

      {isOwnCard && isTop && (
        <div className="absolute top-8 left-0 w-full bg-yellow-500 text-black py-2.5 font-black text-center tracking-[0.3em] text-[10px] uppercase z-30 shadow-lg flex items-center justify-center gap-3">
          <User className="w-4 h-4 stroke-[3px]" /> MATCH_RECOGNIZED: YOU
        </div>
      )}

      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-24 left-8 border-8 border-green-500 text-green-500 font-black text-6xl px-8 py-4 rounded-[2rem] rotate-[-15deg] uppercase z-20 bg-black/60 shadow-lg pointer-events-none">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-24 right-8 border-8 border-red-500 text-red-500 font-black text-6xl px-8 py-4 rounded-[2rem] rotate-[15deg] uppercase z-20 bg-black/60 shadow-lg pointer-events-none">PASS</motion.div>
        </>
      )}

      <div className="absolute bottom-0 w-full p-8 flex flex-col gap-5 bg-gradient-to-t from-[#010103] via-[#010103]/95 to-transparent">
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter drop-shadow-lg flex items-center gap-3 truncate">
              {target.alias} <span className="text-2xl text-gray-500 font-normal">{target.age}</span>
            </h2>
            
            {session ? (
              <div className="text-sm font-black text-white bg-pink-600 w-fit px-4 py-2 mt-3 rounded-xl shadow-lg flex items-center gap-3 border border-pink-400/50">
                <Terminal className="w-4 h-4" /> @{target.instagram_id}
              </div>
            ) : (
              <div className="text-[10px] font-black text-red-400 bg-red-950/80 w-fit px-4 py-2 mt-3 border border-red-900/80 rounded-xl flex items-center gap-3 uppercase tracking-widest shadow-md">
                <Lock className="w-4 h-4" /> SECURE COORDS
              </div>
            )}
          </div>

          <div className="text-center bg-black/90 p-4 rounded-3xl border border-white/10 shadow-xl flex flex-col items-center min-w-[90px]">
            <div className="text-[9px] text-red-500 font-black uppercase tracking-[0.2em] mb-2 leading-none">RED_FLAG</div>
            <div className="text-4xl font-black text-white leading-none tracking-tighter">{redFlagScore}%</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-pink-600/60 rounded-full" />
          <p className="text-sm md:text-base text-gray-300 font-bold leading-relaxed bg-white/10 p-5 rounded-[1.5rem] border border-white/10 shadow-inner italic">
            {session ? (
              `"${target.bio}"`
            ) : (
              <span className="flex flex-wrap gap-2 items-center opacity-70 text-xs">
                <EyeOff className="w-4 h-4 inline text-red-500 mr-1" />
                {target.bio.split(' ').map((word, i) => i % 2 === 0 ? '████' : word).join(' ')}
              </span>
            )}
          </p>
        </div>

        {isTop && (
          <div className="mt-4" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button 
                 onClick={() => triggerSwipeAnimation('dismiss')} 
                 className="w-full bg-yellow-500 text-black py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.4em] hover:bg-white transition-all flex items-center justify-center gap-4 shadow-xl active:scale-95"
               >
                 <X className="w-5 h-5 stroke-[4px]" /> DISMISS DOSSIER
               </button>
             ) : (
               <button 
                 onClick={() => onForceMatch()} 
                 className="w-full bg-white text-black py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-[0.4em] hover:bg-pink-600 hover:text-white transition-all flex items-center justify-center gap-4 shadow-xl group active:scale-95 border-b-4 border-gray-300 hover:border-pink-800"
               >
                 <Crosshair className="w-5 h-5 group-hover:scale-125 transition-transform stroke-[4px]" /> INITIATE FORCE MATCH
               </button>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";
