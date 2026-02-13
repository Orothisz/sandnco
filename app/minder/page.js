"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Crosshair, Lock, Activity, Terminal, ChevronRight, X, Check, ArrowRight, ChevronLeft, Radar, Zap, User
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ------------------------------------------------------------------               
// MAIN HUB CONTROLLER
// ------------------------------------------------------------------
export default function MinderHub() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [targets, setTargets] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginWarning, setLoginWarning] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);

  // 1. DATA INGESTION (OWN CARDS INCLUDED)
  const fetchTargets = useCallback(async (currentOffset = 0, currentSession = session) => {
    setFetchingMore(true);
    const limit = 15; // Increased batch size
    
    try {
      let query = supabase
        .from('minder_targets')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);
      
      if (currentSession?.user?.id) {
        // Fetch what the user has ALREADY swiped on
        const { data: swiped, error: swipeError } = await supabase
          .from('minder_swipes')
          .select('target_id')
          .eq('swiper_id', currentSession.user.id);
          
        if (swipeError) console.error("SWIPE FETCH ERROR:", swipeError.message);

        const swipedIds = swiped?.map(s => s.target_id) || [];
        
        // Exclude already swiped cards, but DO NOT exclude the user's own card
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
      console.error("🚨 DATABASE FAILURE:", err);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [session, supabase]);

  useEffect(() => {
    const initializeData = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      await fetchTargets(0, activeSession);

      // 2. PROMINENT REALTIME FEED
      const channel = supabase.channel('minder-system')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const alias = t?.alias || 'UNKNOWN';
           const action = payload.new.action;
           const color = action === 'SMASH' ? 'text-green-500' : action === 'PASS' ? 'text-red-500' : 'text-purple-500';
           
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT_*** ${action}ED [${alias}]`, color }, ...prev].slice(0, 30));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_targets' }, (payload) => {
           const newTarget = payload.new;
           // Instantly show new cards (even your own)
           setTargets(prev => [newTarget, ...prev]);
           setFeed(prev => [{ 
             id: `new-${newTarget.id}`, 
             text: `> NEW TARGET ENTERED GRID: [${newTarget.alias}]`, 
             color: 'text-yellow-500' 
           }, ...prev].slice(0, 30));
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    initializeData();
  }, [supabase, fetchTargets]);

  const processSwipe = async (direction, targetId, isOwnCard = false) => {
    if (!session && !isOwnCard) {
      triggerLoginWarning();
      return false; 
    }

    setTargets(prev => {
      const newDeck = [...prev];
      newDeck.pop(); 
      if (newDeck.length < 4 && !fetchingMore) {
        fetchTargets(pageOffset, session);
      }
      return newDeck;
    });

    // If it's the user dismissing their own card, don't write a fake swipe to the DB
    if (isOwnCard || direction === 'dismiss') return true;

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    await supabase.from('minder_swipes').insert([{
      swiper_id: session.user.id,
      target_id: targetId,
      action: action
    }]);

    return true;
  };

  const triggerLoginWarning = () => {
    setLoginWarning(true);
    setTimeout(() => setLoginWarning(false), 3000);
  };

  const handleForceMatch = (alias) => {
    if (!session) return triggerLoginWarning();
    router.push(`/request?target=${encodeURIComponent(alias)}&service=matchup`);
  };

  return (
    <div className="min-h-screen bg-[#050510] text-white overflow-hidden flex flex-col md:flex-row font-mono relative">
      
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-[1000px]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%]" />
        <div className="absolute bottom-[-50%] left-[-50%] right-[-50%] h-[150%] bg-[linear-gradient(transparent_95%,rgba(219,39,119,0.2)_100%),linear-gradient(90deg,transparent_95%,rgba(219,39,119,0.2)_100%)] bg-[size:60px_60px] [transform:rotateX(75deg)] animate-[grid-move_10s_linear_infinite] opacity-30" />
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#050510] to-transparent z-10" />
      </div>

      {/* TOP NAVIGATION */}
      <nav className="fixed top-0 w-full p-4 md:p-6 flex justify-between items-start z-50 pointer-events-none">
        <Link href="/" className="pointer-events-auto flex items-center gap-2 text-xs font-black text-gray-500 hover:text-red-500 transition-all uppercase tracking-widest bg-black/50 px-4 py-2 rounded-full border border-gray-800 backdrop-blur-md hover:scale-105 active:scale-95">
          <ChevronLeft className="w-4 h-4" /> RETURN TO BASE
        </Link>
        
        <div className="hidden md:flex flex-col items-end gap-2 text-right pointer-events-auto">
           <h1 className="text-3xl font-black italic tracking-tighter drop-shadow-[0_0_15px_rgba(219,39,119,0.8)]">
             MINDER<span className="text-pink-600">_</span>
           </h1>
           <p className="text-[9px] text-pink-500 font-mono bg-pink-900/20 px-2 py-1 rounded border border-pink-500/30">
             COULDN'T ADD THE 'T', CAN'T AFFORD LAWSUITS.
           </p>
        </div>
      </nav>

      {/* LEFT PANEL: PROMINENT LIVE RADAR (DESKTOP) */}
      <div className="hidden md:flex flex-col w-96 bg-black/80 backdrop-blur-xl border-r-2 border-pink-600/50 p-6 z-10 shadow-[20px_0_60px_rgba(219,39,119,0.15)] pt-24 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-pink-500/10 to-transparent animate-[scan_4s_linear_infinite] pointer-events-none" />

        <div className="flex items-center justify-between mb-6 border-b border-pink-600/50 pb-4 relative z-10">
          <div className="flex items-center gap-3 text-pink-500">
            <Activity className="w-6 h-6 animate-pulse" />
            <h2 className="font-black tracking-widest uppercase text-base drop-shadow-[0_0_8px_rgba(219,39,119,0.8)]">GLOBAL FEED</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 text-xs custom-scrollbar pr-2 relative z-10">
          <AnimatePresence>
            {feed.length === 0 && <div className="text-gray-500 animate-pulse font-bold mt-4 tracking-widest">AWAITING SYSTEM UPLINK...</div>}
            {feed.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                className={`${item.color} font-black border-l-4 border-current pl-4 py-2 bg-gradient-to-r from-white/10 to-transparent backdrop-blur-sm rounded-r tracking-wide`}
              >
                {item.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="pt-6 border-t border-pink-600/50 mt-4 relative z-10">
           <Link href="/minder/enroll">
             <button className="w-full py-4 bg-pink-600 text-white text-sm font-black tracking-widest hover:bg-pink-500 transition-all shadow-[0_0_25px_rgba(219,39,119,0.5)] group flex items-center justify-center gap-3 rounded">
               <Zap className="w-5 h-5 group-hover:scale-125 transition-transform" /> ENTER THE GRID
             </button>
           </Link>
        </div>
      </div>

      {/* CENTER PANEL: THE GRID */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4 w-full pt-20 md:pt-0">
        
        {/* Mobile Header */}
        <div className="flex flex-col items-center justify-center md:hidden mb-6 mt-4 w-full">
           <h1 className="text-3xl font-black italic tracking-tighter drop-shadow-[0_0_10px_rgba(219,39,119,0.8)]">
             MINDER<span className="text-pink-600">_</span>
           </h1>
           <p className="text-[8px] text-pink-400 font-mono mt-1 text-center px-4">
             COULDN'T ADD THE 'T', CAN'T AFFORD LAWSUITS.
           </p>
        </div>

        {/* SECURITY WARNING OVERLAY */}
        <AnimatePresence>
          {loginWarning && (
            <motion.div 
              initial={{ opacity: 0, y: -50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-20 bg-red-600 text-white px-6 py-4 rounded border-2 border-red-900 font-black uppercase tracking-widest z-50 flex items-center gap-3 shadow-[0_0_40px_rgba(220,38,38,0.8)]"
            >
              <Lock className="w-5 h-5 animate-pulse" /> CLEARANCE DENIED. LOG IN REQUIRED.
            </motion.div>
          )}
        </AnimatePresence>

        {/* DECK RENDERER */}
        <div className="relative w-full max-w-[380px] h-[550px] md:h-[650px] flex items-center justify-center">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-4">
              <Radar className="w-16 h-16 animate-spin opacity-50" />
              <div className="text-xs uppercase tracking-widest font-bold animate-pulse">DECRYPTING TARGET SECTOR...</div>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center w-full bg-black/60 p-10 border border-pink-900/50 rounded-2xl backdrop-blur-xl relative overflow-hidden shadow-[0_0_40px_rgba(219,39,119,0.1)]">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border border-pink-500/20 rounded-full absolute" />
                  <div className="w-32 h-32 border border-pink-500/30 rounded-full absolute" />
                  <div className="w-48 h-1 bg-gradient-to-r from-transparent to-pink-500 absolute origin-left animate-[spin_2s_linear_infinite] opacity-50" />
               </div>
               <Crosshair className="w-12 h-12 mx-auto mb-6 text-pink-500 opacity-50 relative z-10" />
               <p className="text-sm md:text-base uppercase tracking-widest font-black text-white relative z-10">NO TARGETS IN RANGE.</p>
               <p className="text-[10px] mt-4 text-pink-300/70 leading-relaxed font-bold relative z-10 uppercase">
                 SECTOR CLEARED.<br/><br/>AWAITING NEW DEPLOYMENTS.
               </p>
               <Link href="/minder/enroll" className="mt-8 block relative z-10">
                 <button className="text-[10px] bg-pink-600 text-white px-6 py-3 font-black tracking-widest rounded flex items-center justify-center gap-2 mx-auto shadow-[0_0_15px_rgba(219,39,119,0.5)]">
                   <Zap className="w-4 h-4" /> INJECT YOURSELF
                 </button>
               </Link>
            </div>
          ) : (
            targets.map((target, index) => {
              const isTop = index === targets.length - 1;
              const positionFromTop = targets.length - 1 - index;
              const isOwnCard = session?.user?.id === target.user_id;
              
              if (positionFromTop > 2) return null;

              return (
                <SwipeCard 
                  key={target.id} 
                  target={target} 
                  isTop={isTop} 
                  depthIndex={positionFromTop}
                  session={session}
                  isOwnCard={isOwnCard}
                  onSwipe={(dir) => processSwipe(dir, target.id, isOwnCard)}
                  onForceMatch={() => handleForceMatch(target.alias)}
                />
              )
            })
          )}
        </div>

        {/* MOBILE LIVE FEED COMPONENT */}
        <div className="md:hidden absolute bottom-6 w-[calc(100%-2rem)] max-w-[380px] bg-black/90 backdrop-blur-xl border-t-2 border-pink-600 p-4 rounded-t-xl z-20 shadow-[0_-10px_30px_rgba(219,39,119,0.3)]">
          <div className="text-xs text-pink-500 mb-3 font-black flex items-center gap-2 tracking-widest drop-shadow-[0_0_5px_rgba(219,39,119,0.8)]"><Activity className="w-4 h-4 animate-pulse"/> LIVE FEED</div>
          <div className="h-16 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black z-10 pointer-events-none" />
            <AnimatePresence mode="popLayout">
              {feed.length > 0 ? (
                feed.slice(0, 3).map((item) => (
                   <motion.div 
                     key={item.id}
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className={`text-[10px] font-black truncate ${item.color} mb-1.5`}
                   >
                     {item.text}
                   </motion.div>
                ))
              ) : (
                <div className="text-[10px] text-gray-500 font-bold">AWAITING NETWORK ACTIVITY...</div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes grid-move { 0% { background-position: 0 0; } 100% { background-position: 0 60px; } }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
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
  
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.05);
  const yOffset = isTop ? 0 : depthIndex * 20;
  
  const smashOpacity = useTransform(x, [10, 150], [0, 1]);
  const passOpacity = useTransform(x, [-10, -150], [0, 1]);
  const glitchOffset = useTransform(x, [-150, 150], [-10, 10]);

  useEffect(() => {
    // Disable keyboard swiping if it's the user's own card
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
      controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
      return;
    }

    const exitX = direction === 'right' ? 800 : direction === 'left' ? -800 : 0;
    const exitY = direction === 'dismiss' ? -800 : 0; // Dismiss flies upwards
    const exitRotate = direction === 'right' ? 30 : direction === 'left' ? -30 : 0;
    
    await controls.start({
      x: exitX,
      y: exitY,
      rotate: exitRotate,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.4, ease: "easeOut" }
    });
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return; // Failsafe
    const threshold = 120;
    const velocityThreshold = 500;
    const swipeRight = info.offset.x > threshold || info.velocity.x > velocityThreshold;
    const swipeLeft = info.offset.x < -threshold || info.velocity.x < -velocityThreshold;

    if (swipeRight) await triggerSwipeAnimation('right');
    else if (swipeLeft) await triggerSwipeAnimation('left');
    else controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
  };

  const redFlagScore = React.useMemo(() => {
    const hash = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 99) + 1;
  }, [target.id]);

  return (
    <motion.div
      style={{ x, rotate, scale, y: isOwnCard && isTop ? 0 : yOffset, zIndex: 50 - depthIndex }}
      animate={controls}
      // ONLY allow drag if it is NOT their own card
      drag={isTop && !isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { cursor: "grabbing", scale: 1.02 } : {}}
      className={`absolute w-full h-full rounded-3xl bg-[#0a0a0a] shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden border ${isTop && !isOwnCard ? 'border-gray-600 cursor-grab hover:border-gray-400' : isOwnCard && isTop ? 'border-yellow-500 shadow-[0_0_40px_rgba(234,179,8,0.3)]' : 'border-gray-900 pointer-events-none opacity-80'} transition-colors duration-300`}
    >
      {/* Target Image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${target.image_url})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent h-32" />
      </div>

      {/* OWN CARD IDENTIFIER BANNER */}
      {isOwnCard && isTop && (
        <div className="absolute top-6 left-0 w-full bg-yellow-500 text-black py-2 font-black text-center tracking-widest text-xs uppercase shadow-[0_5px_20px_rgba(234,179,8,0.5)] z-30 flex items-center justify-center gap-2">
          <User className="w-4 h-4" /> THIS IS YOUR DOSSIER (UNSWIPABLE)
        </div>
      )}

      {/* Drag Overlays (Only if not own card) */}
      {isTop && !isOwnCard && (
        <>
          <motion.div className="absolute -inset-4 bg-green-500/20 blur-3xl rounded-full z-[-1] pointer-events-none" style={{ opacity: smashOpacity }} />
          <motion.div className="absolute -inset-4 bg-red-500/20 blur-3xl rounded-full z-[-1] pointer-events-none" style={{ opacity: passOpacity }} />
          <motion.div className="absolute inset-0 bg-red-600 mix-blend-color-burn pointer-events-none" style={{ opacity: passOpacity, x: glitchOffset }} />
          <motion.div className="absolute inset-0 bg-green-600 mix-blend-color-dodge pointer-events-none" style={{ opacity: smashOpacity, x: glitchOffset }} />
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-20 left-8 border-8 border-green-500 text-green-500 font-black text-6xl px-8 py-3 rounded-2xl rotate-[-15deg] uppercase tracking-widest z-20 backdrop-blur-md bg-black/40 shadow-[0_0_40px_rgba(34,197,94,0.6)]">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-20 right-8 border-8 border-red-500 text-red-500 font-black text-6xl px-8 py-3 rounded-2xl rotate-[15deg] uppercase tracking-widest z-20 backdrop-blur-md bg-black/40 shadow-[0_0_40px_rgba(239,68,68,0.6)]">PASS</motion.div>
        </>
      )}

      {/* BOTTOM INTEL HUD */}
      <div className="absolute bottom-0 w-full p-6 flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <div className="max-w-[75%]">
            <h2 className="text-3xl md:text-4xl font-black uppercase text-white drop-shadow-[0_4px_15px_rgba(0,0,0,1)] flex items-center gap-2 truncate">
              {target.alias} <span className="text-xl md:text-2xl text-gray-300 font-normal">{target.age}</span>
            </h2>
            
            {session ? (
              <div className="text-sm font-bold text-white bg-pink-600 w-fit px-3 py-1 mt-2 rounded-md shadow-[0_0_20px_rgba(219,39,119,0.6)] flex items-center gap-2 border border-pink-400">
                @{target.instagram_id}
              </div>
            ) : (
              <div className="text-[10px] font-bold text-red-400 bg-red-950/80 w-fit px-3 py-1 mt-2 border border-red-900 flex items-center gap-2 backdrop-blur-md rounded">
                <Lock className="w-3 h-3" /> INTEL LOCKED. LOG IN.
              </div>
            )}
          </div>

          <div className="text-center bg-black/80 p-2 rounded-lg border border-white/20 backdrop-blur-md shadow-2xl shrink-0">
            <div className="text-[9px] text-red-500 font-black uppercase tracking-widest">Red Flag</div>
            <div className="text-2xl font-black text-white">{redFlagScore}%</div>
          </div>
        </div>

        <p className="text-xs md:text-sm text-gray-200 mt-2 font-medium leading-relaxed bg-black/70 p-4 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
          {session ? target.bio : target.bio.split(' ').map((word, i) => i % 3 === 0 ? '██████' : word).join(' ')}
        </p>

        {isTop && (
          <div className="mt-4" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button 
                 onClick={() => triggerSwipeAnimation('dismiss')} 
                 className="w-full bg-black/80 border border-yellow-500 text-yellow-500 py-4 md:py-5 rounded-xl text-sm md:text-base font-black uppercase tracking-widest hover:bg-yellow-500 hover:text-black transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.2)]"
               >
                 <X className="w-5 h-5" /> DISMISS OWN PROFILE
               </button>
             ) : (
               <button 
                 onClick={() => onForceMatch()} 
                 className="w-full bg-white text-black py-4 md:py-5 rounded-xl text-sm md:text-base font-black uppercase tracking-widest hover:bg-pink-600 hover:text-white transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.6)] border-2 border-transparent hover:border-pink-400"
               >
                 <Crosshair className="w-5 h-5" /> INITIATE FORCE MATCH
               </button>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";
