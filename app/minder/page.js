"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Crosshair, Lock, Activity, Terminal, ChevronRight, X, Check, ArrowRight, ChevronLeft, Radar, Zap
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

  // 1. BULLETPROOF SYSTEM INITIALIZATION & PAGINATION LOGIC
  const fetchTargets = useCallback(async (currentOffset = 0, currentSession = session) => {
    setFetchingMore(true);
    const limit = 10;
    
    try {
      // Build the base query
      let query = supabase
        .from('minder_targets')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);
      
      // Apply filters if user is logged in
      if (currentSession?.user?.id) {
        query = query.neq('user_id', currentSession.user.id);

        const { data: swiped, error: swipeError } = await supabase
          .from('minder_swipes')
          .select('target_id')
          .eq('swiper_id', currentSession.user.id);
          
        if (swipeError) console.error("SWIPE FETCH ERROR:", swipeError.message);

        const swipedIds = swiped?.map(s => s.target_id) || [];
        
        if (swipedIds.length > 0) {
          // FIX: Pass the array directly to avoid PostgREST string formatting crashes
          query = query.not('id', 'in', `(${swipedIds.join(',')})`);
        }
      }

      // Execute the query
      const { data, error } = await query;
      
      if (error) {
        console.error("🚨 SUPABASE FETCH ERROR:", error.message, error.details);
        throw error;
      }
      
      if (data && data.length > 0) {
        setTargets(prev => {
          // FIX: Prevent duplicates from breaking the React render cycle
          const existingIds = new Set(prev.map(t => t.id));
          const newTargets = data.filter(t => !existingIds.has(t.id));
          return [...newTargets.reverse(), ...prev];
        });
        setPageOffset(currentOffset + limit);
      } else {
        console.log("Database queried successfully, but 0 targets were returned.");
      }
    } catch (err) {
      console.error("Critical failure during fetchTargets:", err);
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

      // LIVE SYSTEM UPLINK
      const channel = supabase.channel('minder-system')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const alias = t?.alias || 'UNKNOWN';
           const action = payload.new.action;
           const color = action === 'SMASH' ? 'text-green-500' : action === 'PASS' ? 'text-red-500' : 'text-purple-500';
           
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT_*** ${action}ED [${alias}]`, color }, ...prev].slice(0, 20));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_targets' }, (payload) => {
           const newTarget = payload.new;
           if (activeSession?.user?.id !== newTarget.user_id) {
               setTargets(prev => [newTarget, ...prev]);
               setFeed(prev => [{ 
                 id: `new-${newTarget.id}`, 
                 text: `> NEW TARGET ENTERED GRID: [${newTarget.alias}]`, 
                 color: 'text-yellow-500' 
               }, ...prev].slice(0, 20));
           }
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    initializeData();
  }, [supabase, fetchTargets]);

  const processSwipe = async (direction, targetId) => {
    if (!session) {
      triggerLoginWarning();
      return false; 
    }

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    
    setTargets(prev => {
      const newDeck = [...prev];
      newDeck.pop(); 
      if (newDeck.length < 3 && !fetchingMore) {
        fetchTargets(pageOffset, session);
      }
      return newDeck;
    });

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
      
      {/* --- DYNAMIC BACKGROUND: 3D RADAR GRID --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-[1000px]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.02),rgba(0,255,0,0.01),rgba(0,0,255,0.02))] bg-[length:100%_4px,3px_100%]" />
        
        {/* Moving Floor Grid */}
        <div className="absolute bottom-[-50%] left-[-50%] right-[-50%] h-[150%] 
             bg-[linear-gradient(transparent_95%,rgba(219,39,119,0.2)_100%),linear-gradient(90deg,transparent_95%,rgba(219,39,119,0.2)_100%)] 
             bg-[size:60px_60px] 
             [transform:rotateX(75deg)] 
             animate-[grid-move_10s_linear_infinite]
             opacity-30" 
        />
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#050510] to-transparent z-10" />
      </div>

      {/* --- TOP NAVIGATION BAR --- */}
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

      {/* --- LEFT PANEL: LIVE RADAR (DESKTOP) --- */}
      <div className="hidden md:flex flex-col w-80 bg-black/60 backdrop-blur-xl border-r border-pink-900/30 p-4 z-10 shadow-[20px_0_50px_rgba(0,0,0,0.5)] pt-24 relative overflow-hidden">
        {/* Radar Sweep Effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-pink-500/5 to-transparent animate-[scan_4s_linear_infinite] pointer-events-none" />

        <div className="flex items-center justify-between mb-6 border-b border-pink-900/50 pb-4 relative z-10">
          <div className="flex items-center gap-2 text-pink-500">
            <Activity className="w-5 h-5 animate-pulse" />
            <h2 className="font-black tracking-widest uppercase text-sm">GLOBAL RADAR</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 text-[11px] custom-scrollbar pr-2 relative z-10">
          <AnimatePresence>
            {feed.length === 0 && <div className="text-gray-600 animate-pulse font-bold mt-4">AWAITING SYSTEM UPLINK...</div>}
            {feed.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                className={`${item.color} font-bold border-l-2 border-current pl-3 py-1.5 bg-white/5 backdrop-blur-sm rounded-r`}
              >
                {item.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="pt-4 border-t border-pink-900/30 mt-4 relative z-10">
           <Link href="/minder/enroll">
             <button className="w-full py-4 bg-pink-900/20 border border-pink-500/50 text-pink-500 text-xs font-black tracking-widest hover:bg-pink-500 hover:text-white transition-all shadow-[0_0_15px_rgba(219,39,119,0.2)] group flex items-center justify-center gap-2">
               <Zap className="w-4 h-4 group-hover:scale-125 transition-transform" /> ENTER THE GRID
             </button>
           </Link>
        </div>
      </div>

      {/* --- CENTER PANEL: THE GRID --- */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4 w-full pt-20 md:pt-0">
        
        {/* Mobile Header (replaces standard header on small screens) */}
        <div className="flex flex-col items-center justify-center md:hidden mb-6 mt-4 w-full">
           <h1 className="text-3xl font-black italic tracking-tighter drop-shadow-[0_0_10px_rgba(219,39,119,0.8)]">
             MINDER<span className="text-pink-600">_</span>
           </h1>
           <p className="text-[8px] text-pink-400 font-mono mt-1 text-center px-4">
             COULDN'T ADD THE 'T', CAN'T AFFORD LAWSUITS.
           </p>
           <Link href="/minder/enroll" className="mt-4">
             <button className="text-[10px] bg-pink-600 text-white px-4 py-1.5 font-bold tracking-widest rounded flex items-center gap-2 shadow-[0_0_10px_rgba(219,39,119,0.5)]">
               <Zap className="w-3 h-3" /> ENTER GRID
             </button>
           </Link>
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
               {/* Searching Radar Animation */}
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 border border-pink-500/20 rounded-full absolute" />
                  <div className="w-32 h-32 border border-pink-500/30 rounded-full absolute" />
                  <div className="w-16 h-16 border border-pink-500/50 rounded-full absolute bg-pink-500/10" />
                  <div className="w-48 h-1 bg-gradient-to-r from-transparent to-pink-500 absolute origin-left animate-[spin_2s_linear_infinite] opacity-50" />
               </div>
               
               <Crosshair className="w-12 h-12 mx-auto mb-6 text-pink-500 opacity-50 relative z-10" />
               <p className="text-sm md:text-base uppercase tracking-widest font-black text-white relative z-10">NO TARGETS IN RANGE.</p>
               <p className="text-[10px] mt-4 text-pink-300/70 leading-relaxed font-bold relative z-10 uppercase">
                 SECTOR CLEARED.<br/><br/>AWAITING NEW DEPLOYMENTS OR INJECT YOURSELF INTO THE GRID.
               </p>
            </div>
          ) : (
            targets.map((target, index) => {
              const isTop = index === targets.length - 1;
              const positionFromTop = targets.length - 1 - index;
              
              if (positionFromTop > 2) return null;

              return (
                <SwipeCard 
                  key={target.id} 
                  target={target} 
                  isTop={isTop} 
                  depthIndex={positionFromTop}
                  session={session}
                  onSwipe={(dir) => processSwipe(dir, target.id)}
                  onForceMatch={() => handleForceMatch(target.alias)}
                />
              )
            })
          )}
        </div>

        {/* CONTROLS GUIDE (Desktop) */}
        {targets.length > 0 && (
          <div className="hidden md:flex items-center gap-12 mt-12 text-[10px] font-bold text-gray-500 tracking-widest">
            <span className="flex items-center gap-3"><div className="px-3 py-1.5 bg-gray-900 rounded border border-gray-700 text-white shadow-[0_0_10px_rgba(255,0,0,0.2)]">←</div> PASS</span>
            <span className="flex items-center gap-3"><div className="px-3 py-1.5 bg-gray-900 rounded border border-gray-700 text-white shadow-[0_0_10px_rgba(0,255,0,0.2)]">→</div> SMASH</span>
          </div>
        )}

        {/* MOBILE LIVE FEED COMPONENT */}
        <div className="md:hidden absolute bottom-6 w-[calc(100%-2rem)] max-w-[380px] bg-black/80 backdrop-blur-md border border-pink-900/50 p-3 rounded-lg z-20 shadow-[0_0_20px_rgba(219,39,119,0.2)]">
          <div className="text-[10px] text-pink-500 mb-2 font-bold flex items-center gap-2 tracking-widest"><Activity className="w-3 h-3 animate-pulse"/> SECURE UPLINK</div>
          <div className="h-5 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {feed.length > 0 ? (
                <motion.div 
                  key={feed[0].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[10px] font-bold truncate text-gray-200"
                >
                  {feed[0]?.text}
                </motion.div>
              ) : (
                <div className="text-[10px] text-gray-600">AWAITING NETWORK ACTIVITY...</div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* DYNAMIC CSS FOR THE 3D GRID */}
      <style jsx global>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 0 60px; }
        }
        @keyframes scan { 
          0% { transform: translateY(-100%); } 
          100% { transform: translateY(100%); } 
        }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------------
// ADVANCED PHYSICS CARD COMPONENT
// ------------------------------------------------------------------
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, onSwipe, onForceMatch }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.05);
  const yOffset = isTop ? 0 : depthIndex * 20;
  
  // Dynamic Background Glows based on drag
  const smashOpacity = useTransform(x, [10, 150], [0, 1]);
  const passOpacity = useTransform(x, [-10, -150], [0, 1]);
  const glitchOffset = useTransform(x, [-150, 150], [-10, 10]);

  useEffect(() => {
    if (!isTop) return;
    
    const handleKeyDown = async (e) => {
      if (e.key === 'ArrowRight') {
        await triggerSwipeAnimation('right');
      } else if (e.key === 'ArrowLeft') {
        await triggerSwipeAnimation('left');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTop]);

  const triggerSwipeAnimation = async (direction) => {
    const isAllowed = await onSwipe(direction);
    if (!isAllowed) {
      controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
      return;
    }

    const exitX = direction === 'right' ? 800 : -800;
    const exitRotate = direction === 'right' ? 30 : -30;
    
    await controls.start({
      x: exitX,
      rotate: exitRotate,
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.4, ease: "easeOut" }
    });
  };

  const handleDragEnd = async (event, info) => {
    const threshold = 120;
    const velocityThreshold = 500;
    const swipeRight = info.offset.x > threshold || info.velocity.x > velocityThreshold;
    const swipeLeft = info.offset.x < -threshold || info.velocity.x < -velocityThreshold;

    if (swipeRight) {
      await triggerSwipeAnimation('right');
    } else if (swipeLeft) {
      await triggerSwipeAnimation('left');
    } else {
      controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  const redFlagScore = React.useMemo(() => {
    const hash = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 99) + 1;
  }, [target.id]);

  return (
    <motion.div
      style={{ 
        x, 
        rotate, 
        scale, 
        y: yOffset,
        zIndex: 50 - depthIndex 
      }}
      animate={controls}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { cursor: "grabbing", scale: 1.02 } : {}}
      className={`absolute w-full h-full rounded-3xl bg-[#0a0a0a] shadow-[0_30px_60px_rgba(0,0,0,0.9)] overflow-hidden border ${isTop ? 'border-gray-600 cursor-grab hover:border-gray-400' : 'border-gray-900 pointer-events-none opacity-80'} transition-colors duration-300`}
    >
      {/* Dynamic Ambient Glow Behind Card (Only on top card while dragging) */}
      {isTop && (
        <>
          <motion.div className="absolute -inset-4 bg-green-500/20 blur-3xl rounded-full z-[-1] pointer-events-none" style={{ opacity: smashOpacity }} />
          <motion.div className="absolute -inset-4 bg-red-500/20 blur-3xl rounded-full z-[-1] pointer-events-none" style={{ opacity: passOpacity }} />
        </>
      )}

      {/* Target Image */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${target.image_url})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-32" />
      </div>

      {/* Chromatic Drag Overlays */}
      {isTop && (
        <>
          <motion.div 
            className="absolute inset-0 bg-red-600 mix-blend-color-burn pointer-events-none"
            style={{ opacity: passOpacity, x: glitchOffset }}
          />
          <motion.div 
            className="absolute inset-0 bg-green-600 mix-blend-color-dodge pointer-events-none"
            style={{ opacity: smashOpacity, x: glitchOffset }}
          />
        </>
      )}

      {/* SMASH / PASS STAMPS */}
      {isTop && (
        <>
          <motion.div 
            style={{ opacity: smashOpacity }} 
            className="absolute top-16 left-8 border-8 border-green-500 text-green-500 font-black text-6xl px-8 py-3 rounded-2xl rotate-[-15deg] uppercase tracking-widest z-20 backdrop-blur-md bg-black/40 shadow-[0_0_40px_rgba(34,197,94,0.6)]"
          >
            SMASH
          </motion.div>
          <motion.div 
            style={{ opacity: passOpacity }} 
            className="absolute top-16 right-8 border-8 border-red-500 text-red-500 font-black text-6xl px-8 py-3 rounded-2xl rotate-[15deg] uppercase tracking-widest z-20 backdrop-blur-md bg-black/40 shadow-[0_0_40px_rgba(239,68,68,0.6)]"
          >
            PASS
          </motion.div>
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
             <button 
               onClick={() => onForceMatch()} 
               className="w-full bg-white text-black py-4 md:py-5 rounded-xl text-sm md:text-base font-black uppercase tracking-widest hover:bg-pink-600 hover:text-white transition-all flex items-center justify-center gap-3 group shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(219,39,119,0.6)] border-2 border-transparent hover:border-pink-400"
             >
               <Crosshair className="w-5 h-5 group-hover:scale-125 transition-transform" /> INITIATE FORCE MATCH
             </button>
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";
