"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Crosshair, Lock, Activity, Terminal, ChevronRight, X, Check, 
  ArrowRight, ChevronLeft, Radar, Zap, User, Menu, Info, Layers, Eye, EyeOff, Heart, ThumbsDown
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ------------------------------------------------------------------               
// THE GRID CONTROLLER (v9.0.0 - INSTANT LOOP ENGINE)
// ------------------------------------------------------------------
export default function MinderHub() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [targets, setTargets] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [userSwipes, setUserSwipes] = useState(new Map()); 
  const [toastMessage, setToastMessage] = useState(null); 
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);

  const triggerHaptic = useCallback((intensity = 'medium') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const patterns = { light: 10, medium: 20, heavy: 50 };
      navigator.vibrate(patterns[intensity] || 20);
    }
  }, []);

  // 1. HYPER-FAST DATA INGESTION (NO BLOCKING FILTERS)
  const fetchTargets = useCallback(async (currentOffset = 0, currentSession = session) => {
    setFetchingMore(true);
    const limit = 15; 
    
    try {
      // Fetch targets instantly. No 'NOT IN' filters slowing down the DB.
      const { data, error } = await supabase
        .from('minder_targets')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + limit - 1);
      
      if (error) throw error;
      
      // INFINITE LOOP LOGIC: If we hit the end of the DB, reset to 0
      if (data && data.length === 0 && currentOffset > 0) {
        setPageOffset(0);
        return fetchTargets(0, currentSession);
      }

      // Background loading for images so it doesn't block React
      if (data && data.length > 0) {
        setTimeout(() => {
          data.forEach(t => { const img = new Image(); img.src = t.image_url; });
        }, 100);

        setTargets(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTargets = data.filter(t => !existingIds.has(t.id));
          return [...newTargets.reverse(), ...prev];
        });
        setPageOffset(currentOffset + limit);
      }
    } catch (err) {
      console.error("GRID_SYNC_FAILURE:", err.message);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, [session, supabase]);

  // 2. PARALLEL SYSTEM BOOT
  useEffect(() => {
    const initializeSystem = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      
      // Fire UI data instantly
      fetchTargets(0, activeSession);

      // Fire background data (Swipes & Feed) in parallel
      if (activeSession?.user?.id) {
        supabase.from('minder_swipes').select('target_id, action').eq('swiper_id', activeSession.user.id)
          .then(({ data }) => {
            if (data) {
              const swipeMap = new Map();
              data.forEach(s => swipeMap.set(s.target_id, s.action));
              setUserSwipes(swipeMap);
            }
          });
      }

      supabase.from('minder_targets').select('id, alias').order('created_at', { ascending: false }).limit(10)
        .then(({ data }) => {
          if (data) setFeed(data.map(t => ({ id: `hist-${t.id}`, text: `> NEW TARGET LOGGED: [${t.alias}]`, color: 'text-gray-500' })));
        });

      // REALTIME WEBSOCKET
      const channelId = `minder_broadcast_${Math.random().toString(36).substr(2, 9)}`;
      const channel = supabase.channel(channelId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           if (payload.new.swiper_id === activeSession?.user?.id) return;
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const color = payload.new.action === 'SMASH' ? 'text-green-500' : 'text-red-500';
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT_*** ${payload.new.action}ED [${t?.alias || 'ANON'}]`, color }, ...prev].slice(0, 30));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_targets' }, (payload) => {
           setTargets(prev => [payload.new, ...prev]);
           setFeed(prev => [{ id: `new-${payload.new.id}`, text: `> ALERT: NEW TARGET [${payload.new.alias}]`, color: 'text-yellow-500' }, ...prev].slice(0, 30));
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    initializeSystem();
  }, [supabase, fetchTargets]);

  // 3. AGGRESSIVE SWIPE ENGINE
  const processSwipe = async (direction, targetId, isOwnCard = false) => {
    if (isSwipeInProgress) return false;
    setIsSwipeInProgress(true);
    
    if (!session && !isOwnCard) {
      setLoginModalOpen(true);
      setIsSwipeInProgress(false);
      return false; 
    }

    const targetAlias = targets.find(t => t.id === targetId)?.alias || 'UNKNOWN';
    const action = direction === 'right' ? 'SMASH' : 'PASS';
    
    // UI Update Pipeline
    setTargets(prev => {
      const newDeck = prev.slice(0, -1);
      if (newDeck.length < 5 && !fetchingMore) fetchTargets(pageOffset, session);
      return newDeck;
    });

    if (isOwnCard || direction === 'dismiss') {
      setTimeout(() => setIsSwipeInProgress(false), 300);
      return true;
    }

    const color = direction === 'right' ? 'text-green-500' : 'text-red-500';
    triggerHaptic(direction === 'right' ? 'heavy' : 'medium');

    // Optimistic Map Update
    setUserSwipes(prev => new Map(prev).set(targetId, action));

    setFeed(prev => [{ 
      id: `opt-${Date.now()}`, 
      text: `> YOU ${action}ED [${targetAlias}]`, 
      color 
    }, ...prev].slice(0, 30));

    // UPSERT directly to handle looping cards being swiped again
    await supabase.from('minder_swipes').upsert({
      swiper_id: session.user.id, 
      target_id: targetId, 
      action: action
    }, { onConflict: 'swiper_id, target_id' });

    setTimeout(() => setIsSwipeInProgress(false), 300);
    return true;
  };

  return (
    <div className="h-[100dvh] bg-[#010103] text-white overflow-hidden flex flex-col md:flex-row font-mono relative">
      
      {/* GPU ACCELERATED BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden will-change-transform">
        <div className="absolute inset-0 opacity-[0.02] md:opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%),linear-gradient(90deg,rgba(255,0,255,0.02),rgba(0,255,255,0.01),rgba(255,255,255,0.02))] bg-[length:100%_4px,3px_100%]" />
        <div className="hidden md:block absolute bottom-[-50%] left-[-50%] right-[-50%] h-[150%] bg-[linear-gradient(transparent_95%,rgba(219,39,119,0.15)_100%),linear-gradient(90deg,transparent_95%,rgba(219,39,119,0.15)_100%)] bg-[size:50px_50px] [transform:rotateX(80deg)] animate-[grid-move_15s_linear_infinite] opacity-40" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#010103]/80 to-[#010103] z-10" />
      </div>

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {loginModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-sm bg-[#0a0a0f] border-2 border-red-600/50 rounded-[2rem] p-8 shadow-[0_0_80px_rgba(220,38,38,0.4)] flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-red-600/5 animate-pulse pointer-events-none" />
              <Lock className="w-14 h-14 text-red-500 mb-5 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">ACCESS DENIED</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mb-8 leading-relaxed">Authentication required to log biometric decisions.</p>
              <Link href="/login?next=/minder" className="w-full z-10">
                <button className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] rounded-xl hover:bg-red-500 transition-all shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-95 flex items-center justify-center gap-3"><User className="w-5 h-5 fill-current" /> AUTHENTICATE NOW</button>
              </Link>
              <button onClick={() => setLoginModalOpen(false)} className="mt-6 text-[10px] text-gray-500 hover:text-white uppercase tracking-[0.3em] font-black z-10 p-2">DISMISS WARNING</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE TRIGGER */}
      <button onClick={() => setMobileHudOpen(true)} className="md:hidden fixed top-20 right-5 z-[150] w-14 h-14 bg-pink-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(219,39,119,0.6)] border-2 border-pink-400 active:scale-90 transition-transform">
        <Activity className="w-6 h-6 text-white animate-pulse" />
      </button>

      {/* MOBILE HUD */}
      <AnimatePresence>
        {mobileHudOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 200 }} className="fixed inset-0 z-[300] bg-black/98 backdrop-blur-xl md:hidden p-8 flex flex-col">
            <div className="flex justify-between items-start mb-10 border-b border-white/10 pb-4">
               <div>
                 <h3 className="text-pink-500 font-black tracking-[0.3em] uppercase text-2xl">TACTICAL HUD</h3>
                 <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Uplink: Active</p>
               </div>
               <button onClick={() => setMobileHudOpen(false)} className="bg-white/5 p-4 rounded-full border border-white/10 active:bg-white/20"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 mb-8">
               <div className="text-[11px] text-pink-600 font-black tracking-widest pb-2 flex items-center gap-3"><Radar className="w-5 h-5 animate-spin" /> LIVE INTELLIGENCE</div>
               {feed.slice(0, 15).map(item => (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={item.id} className={`${item.color} text-[11px] font-bold border-l-2 border-current pl-4 py-3 bg-white/5 backdrop-blur-md rounded-r shadow-sm`}>{item.text}</motion.div>
               ))}
            </div>

            <Link href="/minder/enroll" onClick={() => setMobileHudOpen(false)}>
              <button className="w-full py-6 bg-pink-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_50px_rgba(219,39,119,0.5)] flex items-center justify-center gap-4 text-sm border-b-4 border-pink-800 active:translate-y-1 active:border-b-0 transition-all"><Zap className="w-6 h-6 fill-current" /> INJECT NEW DOSSIER</button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-[480px] bg-black/90 backdrop-blur-2xl md:backdrop-blur-3xl border-r border-pink-600/20 p-12 z-[100] shadow-[60px_0_150px_rgba(0,0,0,1)] relative overflow-hidden h-full">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/5 via-transparent to-transparent animate-[scan_10s_linear_infinite] pointer-events-none" />
        <div className="flex items-center gap-6 text-pink-500 mb-12 pb-10 border-b border-pink-900/40 relative z-10 pt-10">
          <div className="p-4 bg-pink-900/20 rounded-2xl border border-pink-500/30 shadow-[0_0_30px_rgba(219,39,119,0.3)]"><Activity className="w-10 h-10 animate-pulse" /></div>
          <div><h2 className="font-black tracking-tighter uppercase text-3xl leading-none">GLOBAL FEED</h2><p className="text-[10px] text-pink-800 font-black mt-3 tracking-[0.4em]">ENCRYPTED UPLINK // ACTIVE</p></div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-7 custom-scrollbar pr-5 relative z-10">
          <AnimatePresence mode="popLayout">
            {feed.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className={`${item.color} font-black border-l-4 border-current pl-7 py-5 bg-gradient-to-r from-white/5 to-transparent rounded-r shadow-2xl relative group overflow-hidden`}>
                <div className="absolute inset-y-0 left-0 w-1 bg-current opacity-20" />
                <span className="text-[9px] opacity-40 block mb-3 font-mono tracking-[0.5em] uppercase italic">Signal_Logged</span>
                <span className="text-sm tracking-tight leading-relaxed">{item.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="pt-12 border-t border-pink-600/20 mt-10 relative z-10">
           <Link href="/minder/enroll" className="block relative z-[200]">
             <button className="w-full py-6 bg-pink-600 text-white text-sm font-black tracking-[0.3em] hover:bg-pink-500 transition-all shadow-[0_0_60px_rgba(219,39,119,0.5)] group flex items-center justify-center gap-4 rounded-2xl border-b-4 border-pink-900 active:border-b-0 active:translate-y-1 relative z-[200]"><Zap className="w-6 h-6 group-hover:rotate-12 transition-transform fill-current text-white" /> INJECT DOSSIER</button>
           </Link>
        </div>
      </div>

      {/* THE GRID CENTER */}
      <div className="flex-1 flex flex-col relative z-10 p-4 md:p-10 h-full overflow-hidden">
        
        {/* HEADER */}
        <div className="flex justify-between items-start w-full shrink-0 relative z-[200] mb-4 md:mb-0">
           <Link href="/" className="group flex items-center gap-2 md:gap-3 text-[9px] md:text-xs font-black text-gray-400 hover:text-white transition-all uppercase tracking-[0.2em] bg-black/60 px-3 md:px-5 py-2 md:py-3 rounded-full border border-white/10 backdrop-blur-xl shadow-xl pointer-events-auto">
             <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 group-hover:-translate-x-1 transition-transform" /> BACK
           </Link>
           <div className="flex flex-col items-end pointer-events-none">
             <h1 className="text-3xl md:text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_40px_rgba(219,39,119,0.6)]">MINDER<span className="text-pink-600">_</span></h1>
             <p className="text-[7px] md:text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] md:tracking-[0.3em] bg-pink-900/30 px-2 md:px-4 py-1 md:py-1.5 rounded-full border border-pink-500/20 mt-2 md:mt-3 backdrop-blur-md shadow-inner">LAWSUIT PROTOCOL</p>
           </div>
        </div>

        {/* TARGET VIEWPORT */}
        <div className="flex-1 w-full flex items-center justify-center relative my-4 md:my-6 z-10 min-h-[450px] md:min-h-[500px]">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-10">
              <div className="relative scale-100 md:scale-125">
                <Radar className="w-20 h-20 md:w-28 md:h-28 animate-spin opacity-40 text-pink-600" />
                <div className="absolute inset-0 flex items-center justify-center"><div className="w-10 h-10 md:w-14 md:h-14 border-4 border-pink-500 rounded-full animate-ping" /></div>
              </div>
              <div className="text-xs md:text-sm uppercase tracking-[0.4em] md:tracking-[0.6em] font-black animate-pulse text-center">Scanning Grid...</div>
            </div>
          ) : (
            <div className="relative w-full max-w-[420px] md:max-w-[440px] h-[60vh] md:h-[65vh] min-h-[450px] md:min-h-[500px] max-h-[650px] md:max-h-[750px] flex items-center justify-center">
              {targets.map((target, index) => {
                const isTop = index === targets.length - 1;
                const positionFromTop = targets.length - 1 - index;
                const isOwnCard = session?.user?.id === target.user_id;
                
                if (positionFromTop > 2) return null;

                return (
                  <SwipeCard 
                    key={target.id} target={target} isTop={isTop} depthIndex={positionFromTop} session={session} isOwnCard={isOwnCard} existingSwipe={userSwipes.get(target.id)}
                    onSwipe={(dir) => processSwipe(dir, target.id, isOwnCard)} onForceMatch={() => router.push(`/request?target=${encodeURIComponent(target.alias)}&service=matchup`)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* FOOTER INSTRUCTIONS */}
        <div className="shrink-0 flex flex-col items-center gap-2 md:gap-3 opacity-20 md:opacity-30 select-none pb-2 md:pb-4 pointer-events-none group hover:opacity-60 transition-opacity z-0">
           <div className="flex items-center gap-3 md:gap-6 text-[9px] md:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.5em]">
             <span className="text-red-500 animate-pulse hidden md:inline">← Swipe Left to Pass</span><span className="text-red-500 animate-pulse md:hidden">← PASS</span>
             <div className="h-3 md:h-4 w-px bg-gray-600 rotate-12" />
             <span className="text-green-500 animate-pulse hidden md:inline">Swipe Right to Smash →</span><span className="text-green-500 animate-pulse md:hidden">SMASH →</span>
           </div>
           <p className="text-[7px] md:text-[9px] font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-gray-500 italic text-center">Grid Scans validated by Gemini Biometric AI Engine</p>
        </div>

      </div>

      {/* TOASTS */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[600] px-8 py-4 bg-pink-600 text-white font-black text-sm rounded-2xl shadow-[0_0_60px_rgba(219,39,119,0.8)] border-2 border-pink-400 flex items-center gap-3">
            <Info className="w-5 h-5" />{toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes grid-move { 0% { background-position: 0 0; } 100% { background-position: 0 50px; } }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(219, 39, 119, 0.4); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(219, 39, 119, 0.7); }
        * { -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; }
        body { overscroll-behavior: none; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .will-change-transform { will-change: transform; transform: translateZ(0); backface-visibility: hidden; }
        .will-change-opacity { will-change: opacity; }
        .touch-action-pan-y { touch-action: pan-y; }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------------
// HIGH-KINETIC PHYSICS COMPONENT
// ------------------------------------------------------------------
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, isOwnCard, existingSwipe, onSwipe, onForceMatch }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Juiced up rotation for more aggressive, dramatic swings
  const rotate = useTransform(x, [-250, 250], [-25, 25]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.06);
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

  const triggerSwipeAnimation = async (direction) => {
    if (isOwnCard && direction !== 'dismiss') return;

    const exitX = direction === 'right' ? 1200 : direction === 'left' ? -1200 : 0;
    const exitY = direction === 'dismiss' ? -1000 : 0;
    // Massive spin on exit
    const exitRotate = direction === 'right' ? 75 : direction === 'left' ? -75 : 0;
    
    // Aggressive, fast exit animation
    await controls.start({ 
      x: exitX, 
      y: exitY, 
      rotate: exitRotate, 
      opacity: 0, 
      transition: { duration: 0.35, ease: "anticipate" } 
    });
    onSwipe(direction);
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return; 
    const threshold = 100; 
    const velocityThreshold = 500; 
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      await triggerSwipeAnimation('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      await triggerSwipeAnimation('left');
    } else {
      // Snappier spring when cancelling
      controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 25 } });
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
      dragElastic={1.2}
      onDragEnd={handleDragEnd}
      whileHover={isTop && !isOwnCard ? { scale: 1.02 } : {}}
      whileTap={isTop && !isOwnCard ? { cursor: "grabbing", scale: 0.98 } : {}}
      className={`absolute w-full h-full rounded-[2rem] md:rounded-[2.5rem] bg-[#0c0c15] shadow-[0_30px_80px_rgba(0,0,0,0.7)] md:shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden border-2 flex flex-col will-change-transform touch-action-pan-y ${isTop && !isOwnCard ? 'border-white/10 hover:border-white/20' : isOwnCard && isTop ? 'border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)]' : 'border-white/5 opacity-50'} transition-all duration-300`}
    >
      <div className="absolute inset-0 bg-cover bg-center will-change-transform" style={{ backgroundImage: `url(${target.image_url})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-[#010103]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#010103]/80 via-transparent to-transparent h-48" />
        <div className="absolute top-0 left-0 w-full h-1 bg-pink-500/50 shadow-[0_0_20px_rgba(219,39,119,1)] animate-[scan_4s_linear_infinite] opacity-30 pointer-events-none mix-blend-screen" />
      </div>

      {isOwnCard && isTop && (
        <div className="absolute top-6 md:top-10 left-0 w-full bg-yellow-500 text-black py-2 md:py-2.5 font-black text-center tracking-[0.3em] md:tracking-[0.4em] text-[9px] md:text-[10px] uppercase z-30 shadow-2xl flex items-center justify-center gap-3 md:gap-4">
          <User className="w-4 h-4 md:w-5 md:h-5 stroke-[3px]" /> YOU
        </div>
      )}

      {existingSwipe && isTop && !isOwnCard && (
        <div className={`absolute top-6 md:top-10 left-0 w-full ${existingSwipe === 'SMASH' ? 'bg-green-500' : 'bg-red-500'} text-black py-2 md:py-2.5 font-black text-center tracking-[0.3em] md:tracking-[0.4em] text-[9px] md:text-[10px] uppercase z-30 shadow-2xl flex items-center justify-center gap-3 md:gap-4 animate-pulse`}>
          <Eye className="w-4 h-4 md:w-5 md:h-5 stroke-[3px]" /> PREVIOUSLY {existingSwipe}ED
        </div>
      )}

      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-20 md:top-28 left-4 md:left-8 border-[6px] md:border-[10px] border-green-500 text-green-500 font-black text-4xl md:text-6xl px-4 md:px-8 py-2 md:py-3 rounded-[1.5rem] md:rounded-[2rem] rotate-[-15deg] uppercase z-20 bg-black/40 shadow-[0_0_60px_rgba(34,197,94,0.7)] md:shadow-[0_0_80px_rgba(34,197,94,0.8)] pointer-events-none will-change-transform">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-20 md:top-28 right-4 md:right-8 border-[6px] md:border-[10px] border-red-500 text-red-500 font-black text-4xl md:text-6xl px-4 md:px-8 py-2 md:py-3 rounded-[1.5rem] md:rounded-[2rem] rotate-[15deg] uppercase z-20 bg-black/40 shadow-[0_0_60px_rgba(239,68,68,0.7)] md:shadow-[0_0_80px_rgba(239,68,68,0.8)] pointer-events-none will-change-transform">PASS</motion.div>
        </>
      )}

      <div className="mt-auto w-full p-4 md:p-6 lg:p-8 flex flex-col gap-3 md:gap-5 bg-gradient-to-t from-[#010103] via-[#010103]/98 to-transparent z-10 shrink-0 pointer-events-auto">
        <div className="flex justify-between items-end gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase text-white tracking-tighter drop-shadow-2xl flex items-center gap-2 md:gap-3 truncate">
              {target.alias} <span className="text-xl md:text-2xl text-gray-500 font-normal">{target.age}</span>
            </h2>
            
            {session ? (
              <div className="text-[10px] md:text-xs lg:text-sm font-black text-white bg-pink-600 w-fit px-3 md:px-5 py-1.5 md:py-2 mt-2 md:mt-3 rounded-lg md:rounded-xl shadow-[0_0_30px_rgba(219,39,119,0.8)] flex items-center gap-2 md:gap-3 border border-pink-400/50">
                <Terminal className="w-3 h-3 md:w-4 md:h-4" /> @{target.instagram_id}
              </div>
            ) : (
              <div className="text-[9px] md:text-[10px] lg:text-[11px] font-black text-red-400 bg-red-950/80 w-fit px-3 md:px-4 py-1.5 md:py-2 mt-2 md:mt-3 border border-red-900/80 rounded-lg flex items-center gap-2 md:gap-3 backdrop-blur-3xl uppercase tracking-[0.2em] shadow-lg">
                <Lock className="w-2.5 h-2.5 md:w-3 md:h-3" /> ENCRYPTED
              </div>
            )}
          </div>

          <div className="text-center bg-black/95 p-2.5 md:p-3 lg:p-4 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-3xl shadow-2xl flex flex-col items-center min-w-[70px] md:min-w-[80px]">
            <div className="text-[7px] md:text-[8px] lg:text-[9px] text-red-500 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] mb-0.5 md:mb-1 leading-none">FLAG</div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-black text-white leading-none tracking-tighter">{redFlagScore}%</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-2 md:-left-4 top-0 w-1 md:w-1.5 h-full bg-pink-600/40 rounded-full" />
          <p className="text-[11px] md:text-xs lg:text-sm text-gray-300 font-bold leading-relaxed bg-white/5 p-3 md:p-5 rounded-[1.2rem] md:rounded-[1.5rem] border border-white/5 backdrop-blur-sm shadow-inner italic line-clamp-3">
            {session ? `"${target.bio}"` : <span className="flex flex-wrap gap-1 md:gap-1.5 items-center opacity-60"><EyeOff className="w-3 h-3 md:w-4 md:h-4 inline text-red-500 mr-1" />{target.bio.split(' ').map((word, i) => i % 2 === 0 ? '████' : word).join(' ')}</span>}
          </p>
        </div>

        {isTop && (
          <div className="mt-1 md:mt-2 flex gap-2 md:gap-3" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button onClick={() => triggerSwipeAnimation('dismiss')} className="w-full bg-yellow-500 text-black py-3 md:py-4 lg:py-5 rounded-[1rem] md:rounded-[1.2rem] text-[9px] md:text-[10px] lg:text-xs font-black uppercase tracking-[0.3em] md:tracking-[0.4em] hover:bg-white transition-all flex items-center justify-center gap-2 md:gap-3 shadow-[0_0_40px_rgba(234,179,8,0.4)] active:scale-95">
                 <X className="w-4 h-4 md:w-5 md:h-5 stroke-[4px]" /> DISMISS
               </button>
             ) : (
               <>
                 <button onClick={() => triggerSwipeAnimation('left')} className="flex-1 relative group overflow-hidden rounded-[1rem] md:rounded-[1.2rem] bg-red-950/60 border border-red-500/30 text-red-500 font-black text-[10px] md:text-xs py-3 md:py-4 lg:py-5 transition-all hover:bg-red-900/80 hover:border-red-400 hover:shadow-[0_0_40px_rgba(220,38,38,0.5)] active:scale-95 active:translate-y-1 z-50">
                   <div className="absolute inset-0 bg-red-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                   <span className="relative z-10 flex items-center justify-center gap-1.5 md:gap-2 tracking-widest"><ThumbsDown className="w-3.5 h-3.5 md:w-4 md:h-4"/><span className="hidden sm:inline">{existingSwipe === 'PASS' ? 'PASS' : existingSwipe === 'SMASH' ? 'CHANGE' : 'PASS'}</span></span>
                 </button>
                 <button onClick={() => triggerSwipeAnimation('right')} className="flex-1 relative group overflow-hidden rounded-[1rem] md:rounded-[1.2rem] bg-green-950/60 border border-green-500/30 text-green-500 font-black text-[10px] md:text-xs py-3 md:py-4 lg:py-5 transition-all hover:bg-green-900/80 hover:border-green-400 hover:shadow-[0_0_40px_rgba(34,197,94,0.5)] active:scale-95 active:translate-y-1 z-50">
                   <div className="absolute inset-0 bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                   <span className="relative z-10 flex items-center justify-center gap-1.5 md:gap-2 tracking-widest"><Heart className="w-3.5 h-3.5 md:w-4 md:h-4"/><span className="hidden sm:inline">{existingSwipe === 'SMASH' ? 'SMASH' : existingSwipe === 'PASS' ? 'CHANGE' : 'SMASH'}</span></span>
                 </button>
               </>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";
