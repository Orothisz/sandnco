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

  // 1. DATA INGESTION (NOW INCLUDES EVERYONE INCLUDING YOU)
  const fetchTargets = useCallback(async (currentOffset = 0, currentSession = session) => {
    setFetchingMore(true);
    const limit = 20; 
    
    try {
      // Establish the connection to the minder_targets vault
      let query = supabase
        .from('minder_targets')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);
      
      if (currentSession?.user?.id) {
        // We only exclude what you have already swiped on to keep the deck fresh
        const { data: swiped, error: swipeError } = await supabase
          .from('minder_swipes')
          .select('target_id')
          .eq('swiper_id', currentSession.user.id);
          
        if (swipeError) console.error("RADAR ERROR: Could not fetch swipe history.");

        const swipedIds = swiped?.map(s => s.target_id) || [];
        
        if (swipedIds.length > 0) {
          query = query.not('id', 'in', `(${swipedIds.join(',')})`);
        }
        // [REMOVED]: neq('user_id') filter is gone. Your own profile will now render.
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
      console.error("🚨 CRITICAL SYSTEM FAILURE:", err.message);
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

      // 2. PROMINENT REALTIME SYSTEM UPLINK
      const channel = supabase.channel('minder-system')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const alias = t?.alias || 'UNKNOWN_OBJECT';
           const action = payload.new.action;
           const color = action === 'SMASH' ? 'text-green-500' : action === 'PASS' ? 'text-red-500' : 'text-purple-500';
           
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT_*** ${action}ED [${alias}]`, color }, ...prev].slice(0, 40));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_targets' }, (payload) => {
           const newTarget = payload.new;
           setTargets(prev => [newTarget, ...prev]);
           setFeed(prev => [{ 
             id: `new-${newTarget.id}`, 
             text: `> NEW BIOMETRIC DETECTED: [${newTarget.alias}]`, 
             color: 'text-yellow-500' 
           }, ...prev].slice(0, 40));
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
      if (newDeck.length < 5 && !fetchingMore) {
        fetchTargets(pageOffset, session);
      }
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

  const triggerLoginWarning = () => {
    setLoginWarning(true);
    setTimeout(() => setLoginWarning(false), 3000);
  };

  const handleForceMatch = (alias) => {
    if (!session) return triggerLoginWarning();
    router.push(`/request?target=${encodeURIComponent(alias)}&service=matchup`);
  };

  return (
    <div className="min-h-screen bg-[#020205] text-white overflow-hidden flex flex-col md:flex-row font-mono relative">
      
      {/* 3D PERSPECTIVE BACKGROUND GRID */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-[1200px]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%),linear-gradient(90deg,rgba(255,0,255,0.02),rgba(0,255,255,0.01),rgba(255,255,255,0.02))] bg-[length:100%_4px,3px_100%]" />
        <div className="absolute bottom-[-50%] left-[-50%] right-[-50%] h-[150%] bg-[linear-gradient(transparent_95%,rgba(219,39,119,0.15)_100%),linear-gradient(90deg,transparent_95%,rgba(219,39,119,0.15)_100%)] bg-[size:50px_50px] [transform:rotateX(80deg)] animate-[grid-move_12s_linear_infinite] opacity-40" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#020205]/80 to-[#020205] z-10" />
      </div>

      {/* TACTICAL NAVIGATION */}
      <nav className="fixed top-0 w-full p-4 md:p-6 flex justify-between items-center z-50">
        <Link href="/" className="group flex items-center gap-3 text-xs font-black text-gray-400 hover:text-white transition-all uppercase tracking-tighter bg-black/80 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-xl shadow-lg">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> RETURN TO BASE
        </Link>
        
        <div className="hidden md:flex flex-col items-end gap-1 text-right">
           <h1 className="text-4xl font-black italic tracking-tighter drop-shadow-[0_0_20px_rgba(219,39,119,0.6)]">
             MINDER<span className="text-pink-600">_</span>
           </h1>
           <p className="text-[8px] font-bold text-pink-500 uppercase tracking-widest bg-pink-900/20 px-2 py-0.5 rounded border border-pink-500/30">
             COULDN'T ADD THE 'T', CAN'T AFFORD LAWSUITS.
           </p>
        </div>
      </nav>

      {/* PRIMARY GLOBAL FEED SIDEBAR */}
      <div className="hidden md:flex flex-col w-[400px] bg-black/90 backdrop-blur-2xl border-r border-pink-600/30 p-8 z-10 shadow-[40px_0_100px_rgba(0,0,0,0.9)] pt-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/5 via-transparent to-transparent animate-[scan_6s_linear_infinite] pointer-events-none" />

        <div className="flex items-center gap-4 text-pink-500 mb-8 pb-6 border-b border-pink-900/50 relative z-10">
          <div className="p-2 bg-pink-900/20 rounded border border-pink-500/30 shadow-[0_0_15px_rgba(219,39,119,0.3)]">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="font-black tracking-tighter uppercase text-lg leading-none">GLOBAL FEED</h2>
            <p className="text-[10px] text-pink-700 font-bold mt-1">UPLINK STABLE // NO ENCRYPTION</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-5 custom-scrollbar pr-3 relative z-10">
          <AnimatePresence mode="popLayout">
            {feed.length === 0 && <div className="text-gray-700 animate-pulse font-black text-sm tracking-widest mt-10">SYNCING WITH GRID...</div>}
            {feed.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -30, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                className={`${item.color} font-black border-l-4 border-current pl-5 py-3 bg-gradient-to-r from-white/5 to-transparent rounded-r shadow-sm`}
              >
                <span className="text-[10px] opacity-50 block mb-1 font-mono tracking-widest">SIGNAL_RCVD</span>
                <span className="text-xs tracking-tight">{item.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="pt-8 border-t border-pink-600/30 mt-6 relative z-10">
           <Link href="/minder/enroll">
             <button className="w-full py-5 bg-pink-600 text-white text-sm font-black tracking-widest hover:bg-pink-500 transition-all shadow-[0_0_40px_rgba(219,39,119,0.4)] group flex items-center justify-center gap-3 rounded-lg border-b-4 border-pink-800 active:border-b-0 active:translate-y-1">
               <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" /> INJECT NEW DOSSIER
             </button>
           </Link>
        </div>
      </div>

      {/* MAIN TARGETING VIEWPORT */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-6 pt-24 md:pt-0">
        
        {/* Mobile Header Only */}
        <div className="flex flex-col items-center justify-center md:hidden mb-10 w-full">
           <h1 className="text-4xl font-black italic tracking-tighter drop-shadow-[0_0_15px_rgba(219,39,119,0.8)]">
             MINDER<span className="text-pink-600">_</span>
           </h1>
           <p className="text-[10px] text-pink-400 font-bold bg-pink-900/20 px-3 py-1 rounded-full border border-pink-500/20 mt-2">
             NO LAWSUITS ALLOWED
           </p>
        </div>

        <AnimatePresence>
          {loginWarning && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-24 bg-red-600 text-white px-8 py-5 rounded-lg border-2 border-red-900 font-black uppercase tracking-widest z-50 flex items-center gap-4 shadow-[0_0_60px_rgba(220,38,38,0.7)]"
            >
              <Lock className="w-6 h-6 animate-pulse" /> CLEARANCE DENIED: LOG IN REQUIRED.
            </motion.div>
          )}
        </AnimatePresence>

        {/* THE STACK */}
        <div className="relative w-full max-w-[420px] h-[600px] md:h-[700px] flex items-center justify-center">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-6">
              <Radar className="w-20 h-20 animate-spin opacity-40" />
              <div className="text-sm uppercase tracking-[0.3em] font-black animate-pulse">SWEEPING SECTOR...</div>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center w-full bg-black/80 p-12 border-2 border-pink-600/40 rounded-3xl backdrop-blur-3xl relative overflow-hidden shadow-[0_0_60px_rgba(219,39,119,0.1)] border-dashed">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-64 h-64 border border-pink-500 rounded-full animate-ping" />
               </div>
               <Crosshair className="w-16 h-16 mx-auto mb-8 text-pink-500 opacity-60" />
               <p className="text-xl uppercase tracking-tighter font-black text-white">ALL TARGETS NEUTRALIZED.</p>
               <p className="text-[10px] mt-6 text-pink-400 font-bold uppercase tracking-widest leading-relaxed">
                 SYNC COMPLETE. GRID IS CLEAR.<br/>AWAITING FRESH DEPLOYMENTS.
               </p>
               <Link href="/minder/enroll" className="mt-10 block relative z-10">
                 <button className="text-xs bg-white text-black px-8 py-4 font-black tracking-widest rounded-md flex items-center justify-center gap-3 mx-auto hover:bg-pink-600 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                   <Zap className="w-5 h-5" /> REPOPULATE GRID
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
                  onForceMatch={() => handleForceMatch(target.alias)}
                />
              )
            })
          )}
        </div>

        {/* MOBILE FEED FALLBACK */}
        <div className="md:hidden absolute bottom-4 w-[calc(100%-2rem)] max-w-[420px] bg-black/90 backdrop-blur-2xl border-t-4 border-pink-600 p-5 rounded-t-2xl z-20 shadow-[0_-20px_50px_rgba(219,39,119,0.3)]">
          <div className="text-xs text-pink-500 mb-4 font-black flex items-center gap-3 tracking-[0.2em] drop-shadow-[0_0_10px_rgba(219,39,119,0.8)]"><Activity className="w-4 h-4 animate-pulse"/> SECURE FEED</div>
          <div className="h-20 overflow-hidden relative">
            <AnimatePresence mode="popLayout">
              {feed.slice(0, 3).map((item) => (
                 <motion.div 
                   key={item.id}
                   initial={{ opacity: 0, y: 15 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`text-[10px] font-black truncate ${item.color} mb-2 tracking-wide`}
                 >
                   {item.text}
                 </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes grid-move { 0% { background-position: 0 0; } 100% { background-position: 0 50px; } }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(219, 39, 119, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------------
// REFINED PHYSICS CARD COMPONENT
// ------------------------------------------------------------------
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, isOwnCard, onSwipe, onForceMatch }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  const rotate = useTransform(x, [-250, 250], [-15, 15]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.06);
  const opacity = useTransform(x, [-250, -150, 0, 150, 250], [0, 1, 1, 1, 0]);
  const yOffset = isTop ? 0 : depthIndex * 25;
  
  const smashOpacity = useTransform(x, [20, 160], [0, 1]);
  const passOpacity = useTransform(x, [-20, -160], [0, 1]);

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
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 15 } });
      return;
    }

    const exitX = direction === 'right' ? 1000 : direction === 'left' ? -1000 : 0;
    const exitY = direction === 'dismiss' ? -1200 : 0;
    const exitRotate = direction === 'right' ? 45 : direction === 'left' ? -45 : 0;
    
    await controls.start({
      x: exitX,
      y: exitY,
      rotate: exitRotate,
      opacity: 0,
      transition: { duration: 0.5, ease: "circOut" }
    });
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return; 
    const threshold = 140;
    const velocityThreshold = 600;
    const swipeRight = info.offset.x > threshold || info.velocity.x > velocityThreshold;
    const swipeLeft = info.offset.x < -threshold || info.velocity.x < -velocityThreshold;

    if (swipeRight) await triggerSwipeAnimation('right');
    else if (swipeLeft) await triggerSwipeAnimation('left');
    else controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 20 } });
  };

  const redFlagScore = React.useMemo(() => {
    const hash = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (hash % 99) + 1;
  }, [target.id]);

  return (
    <motion.div
      style={{ x, rotate, scale, opacity, y: isOwnCard && isTop ? 0 : yOffset, zIndex: 60 - depthIndex }}
      animate={controls}
      drag={isTop && !isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1.1}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { cursor: "grabbing", scale: 1.03 } : {}}
      className={`absolute w-full h-full rounded-[2.5rem] bg-[#0a0a0f] shadow-[0_40px_100px_rgba(0,0,0,1)] overflow-hidden border-2 ${isTop && !isOwnCard ? 'border-white/10 hover:border-white/20' : isOwnCard && isTop ? 'border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.25)]' : 'border-white/5 opacity-50'} transition-colors duration-500`}
    >
      {/* Target Media Asset */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${target.image_url})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-[#020205]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020205]/60 via-transparent to-transparent h-48" />
      </div>

      {/* OWN PROFILE PROTOCOL */}
      {isOwnCard && isTop && (
        <div className="absolute top-10 left-0 w-full bg-yellow-500 text-black py-2.5 font-black text-center tracking-[0.3em] text-[9px] uppercase z-30 shadow-2xl flex items-center justify-center gap-3">
          <User className="w-4 h-4" /> BIOMETRIC MATCH: YOU ARE VIEWING YOURSELF
        </div>
      )}

      {/* Dynamic Drag HUD */}
      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-24 left-10 border-[10px] border-green-500 text-green-500 font-black text-7xl px-10 py-4 rounded-3xl rotate-[-12deg] uppercase z-20 backdrop-blur-sm bg-black/20 shadow-[0_0_60px_rgba(34,197,94,0.8)]">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-24 right-10 border-[10px] border-red-500 text-red-500 font-black text-7xl px-10 py-4 rounded-3xl rotate-[12deg] uppercase z-20 backdrop-blur-sm bg-black/20 shadow-[0_0_60px_rgba(239,68,68,0.8)]">PASS</motion.div>
          <motion.div className="absolute inset-0 bg-green-500/10 pointer-events-none mix-blend-overlay" style={{ opacity: smashOpacity }} />
          <motion.div className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-overlay" style={{ opacity: passOpacity }} />
        </>
      )}

      {/* DATA HUD: BOTTOM BLOCK */}
      <div className="absolute bottom-0 w-full p-8 flex flex-col gap-4 bg-gradient-to-t from-black via-black/80 to-transparent">
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-4xl font-black uppercase text-white tracking-tighter drop-shadow-2xl flex items-center gap-3 truncate">
              {target.alias} <span className="text-2xl text-gray-400 font-normal">{target.age}</span>
            </h2>
            
            {session ? (
              <div className="text-sm font-black text-white bg-pink-600 w-fit px-4 py-1.5 mt-3 rounded-lg shadow-[0_0_30px_rgba(219,39,119,0.8)] flex items-center gap-3 border border-pink-400/50">
                <Terminal className="w-3.5 h-3.5" /> @{target.instagram_id}
              </div>
            ) : (
              <div className="text-[10px] font-black text-red-400 bg-red-950/60 w-fit px-4 py-1.5 mt-3 border border-red-900/50 rounded flex items-center gap-3 backdrop-blur-md">
                <Lock className="w-3.5 h-3.5" /> ENCRYPTED COORDINATES
              </div>
            )}
          </div>

          <div className="text-center bg-black/90 p-3 rounded-2xl border border-white/10 backdrop-blur-3xl shadow-3xl flex flex-col items-center min-w-[80px]">
            <div className="text-[8px] text-red-500 font-black uppercase tracking-[0.2em] mb-1">RED_FLAG</div>
            <div className="text-3xl font-black text-white leading-none">{redFlagScore}%</div>
          </div>
        </div>

        <p className="text-xs md:text-sm text-gray-300 font-bold leading-relaxed bg-white/5 p-5 rounded-2xl border border-white/5 backdrop-blur-sm shadow-inner italic">
          {session ? `"${target.bio}"` : target.bio.split(' ').map((word, i) => i % 2 === 0 ? '████' : word).join(' ')}
        </p>

        {isTop && (
          <div className="mt-4" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button 
                 onClick={() => triggerSwipeAnimation('dismiss')} 
                 className="w-full bg-yellow-500 text-black py-5 rounded-2xl text-xs font-black uppercase tracking-[0.4em] hover:bg-white transition-all flex items-center justify-center gap-4 shadow-2xl"
               >
                 <X className="w-5 h-5 stroke-[4px]" /> DISMISS YOUR DOSSIER
               </button>
             ) : (
               <button 
                 onClick={() => handleForceMatch(target.alias)} 
                 className="w-full bg-white text-black py-5 rounded-2xl text-xs font-black uppercase tracking-[0.4em] hover:bg-pink-600 hover:text-white transition-all flex items-center justify-center gap-4 shadow-[0_0_50px_rgba(255,255,255,0.4)] group active:scale-95"
               >
                 <Crosshair className="w-5 h-5 group-hover:scale-150 transition-transform stroke-[3px]" /> INITIATE FORCE MATCH
               </button>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";
