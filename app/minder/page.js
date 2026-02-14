"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  Lock, Activity, Terminal, ChevronLeft, Radar, Zap, User, X, 
  Crosshair, Heart, ThumbsDown, EyeOff, Trophy, Flame, Eye 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================================
// THE FLAGSHIP ENGINE (v13.0 - TINDER/BUMBLE EXACT ARCHITECTURE)
// ============================================================================
export default function MinderHub() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  // CORE DATA LAYER (Never mutate the array during swipes, only advance the pointer)
  const [session, setSession] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // UPLINK DATA
  const [feed, setFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userSwipes, setUserSwipes] = useState(new Map());
  
  // UI LAYER
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(false);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [mobileLeaderboardOpen, setMobileLeaderboardOpen] = useState(false);

  // --------------------------------------------------------------------------
  // 1. DATA INGESTION (FETCH ONCE, STORE IN MEMORY)
  // --------------------------------------------------------------------------
  const loadBatch = useCallback(async (activeSession) => {
    try {
      // Fetch 50 profiles into memory
      const { data: rawProfiles, error } = await supabase
        .from('minder_targets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      if (!rawProfiles) return;

      let swipeMap = new Map();
      let unswipedDeck = [...rawProfiles];

      if (activeSession?.user?.id) {
        const { data: swipes } = await supabase.from('minder_swipes').select('target_id, action').eq('swiper_id', activeSession.user.id);
        if (swipes) {
          swipes.forEach(s => swipeMap.set(s.target_id, s.action));
          const swipedIds = new Set(swipes.map(s => s.target_id));
          // Put unswiped first, swiped last (for the loop)
          unswipedDeck = [
            ...rawProfiles.filter(t => !swipedIds.has(t.id)),
            ...rawProfiles.filter(t => swipedIds.has(t.id))
          ];
        }
      }

      // Pre-fetch images natively to prevent blank cards
      unswipedDeck.slice(0, 5).forEach(t => { 
        if (t.image_url) { const img = new Image(); img.src = t.image_url; } 
      });

      setUserSwipes(swipeMap);
      setProfiles(unswipedDeck);
      setCurrentIndex(0); // Reset pointer
    } catch (err) {
      console.error("DATA LAYER FAILED:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // --------------------------------------------------------------------------
  // 2. SYSTEM INITIALIZATION & WEBSOCKETS
  // --------------------------------------------------------------------------
  useEffect(() => {
    const boot = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      
      // Load Grid
      await loadBatch(activeSession);

      // Parallelize side-data
      Promise.all([
        supabase.from('minder_targets').select('id, alias').order('created_at', { ascending: false }).limit(15),
        supabase.from('minder_swipes').select('target_id, action').eq('action', 'SMASH')
      ]).then(([feedRes, leaderRes]) => {
        if (feedRes.data) {
          setFeed(feedRes.data.map(t => ({ id: `init-${t.id}`, text: `> DOSSIER ACTIVE: [${t.alias}]`, color: 'text-gray-500' })));
        }
        if (leaderRes.data && profiles.length > 0) {
          const counts = leaderRes.data.reduce((acc, s) => { acc[s.target_id] = (acc[s.target_id] || 0) + 1; return acc; }, {});
          const topIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
          // Only map if we already fetched profiles
          supabase.from('minder_targets').select('id, alias, image_url').in('id', topIds).then(res => {
            if (res.data) setLeaderboard(res.data.map(t => ({ ...t, score: counts[t.id] })).sort((a, b) => b.score - a.score));
          });
        }
      });

      // Live Uplink
      const channel = supabase.channel(`minder_live_${Date.now()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           if (payload.new.swiper_id === activeSession?.user?.id) return;
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const action = payload.new.action;
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT ${action}ED [${t?.alias || 'ANON'}]`, color: action === 'SMASH' ? 'text-green-500' : 'text-red-500' }, ...prev].slice(0, 20));
        }).subscribe();

      return () => supabase.removeChannel(channel);
    };
    boot();
  }, [supabase, loadBatch, profiles.length]);

  // --------------------------------------------------------------------------
  // 3. INTERACTION LAYER (FIRE AND FORGET)
  // --------------------------------------------------------------------------
  const executeSwipe = useCallback((direction, targetId, isOwnCard) => {
    if (!session && !isOwnCard) {
      setAuthModal(true);
      return;
    }

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    const targetAlias = profiles[currentIndex]?.alias || 'TARGET';

    // 1. Instantly advance the pointer. React will unmount the top card.
    setCurrentIndex(prev => {
      const next = prev + 1;
      // INFINITE LOOP: If we run out of memory array, loop back to 0
      if (next >= profiles.length) return 0;
      return next;
    });

    if (isOwnCard || direction === 'dismiss') return;

    // 2. Optimistic UI Updates
    setUserSwipes(prev => new Map(prev).set(targetId, action));
    setFeed(prev => [{ 
      id: `opt-${Date.now()}`, 
      text: `> YOU ${action}ED [${targetAlias}]`, 
      color: action === 'SMASH' ? 'text-green-500' : 'text-red-500' 
    }, ...prev].slice(0, 20));

    // 3. Background DB Execution (No blocking)
    supabase.from('minder_swipes').upsert(
      { swiper_id: session.user.id, target_id: targetId, action },
      { onConflict: 'swiper_id, target_id' }
    ).then(() => console.log('Swipe logged.'));

  }, [currentIndex, profiles, session, supabase]);

  // --- RENDER RULES (MAX 3 CARDS IN DOM) ---
  const visibleCards = profiles.slice(currentIndex, currentIndex + 3).map((target, idx) => ({
    target,
    relativeIndex: idx, // 0 is top, 1 is behind, 2 is back
    isTop: idx === 0
  })).reverse(); // Reverse so index 0 renders last in DOM (on top visually)

  return (
    <div className="h-[100dvh] bg-[#020205] text-white overflow-hidden flex flex-col md:flex-row font-mono relative touch-none select-none">
      
      {/* GPU ACCELERATED BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.8)_50%),linear-gradient(90deg,rgba(255,0,255,0.02),rgba(0,255,255,0.01))] bg-[length:100%_4px,3px_100%]" />
        <div className="hidden md:block absolute bottom-[-50%] left-[-50%] right-[-50%] h-[150%] bg-[linear-gradient(transparent_95%,rgba(219,39,119,0.15)_100%),linear-gradient(90deg,transparent_95%,rgba(219,39,119,0.15)_100%)] bg-[size:50px_50px] [transform:rotateX(75deg)] animate-[grid-move_20s_linear_infinite] opacity-30" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#020205]/90 to-[#020205] z-10" />
      </div>

      {/* AUTH MODAL */}
      <AnimatePresence>
        {authModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-[#0a0a0f] border-2 border-red-600/50 rounded-[2rem] p-8 shadow-[0_0_100px_rgba(220,38,38,0.4)] flex flex-col items-center text-center relative overflow-hidden">
              <Lock className="w-14 h-14 text-red-500 mb-5 animate-pulse" />
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">ACCESS DENIED</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mb-8 leading-relaxed">Authentication required to execute biometric decisions.</p>
              <Link href="/login?next=/minder" className="w-full z-10">
                <button className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] rounded-xl hover:bg-red-500 transition-all shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-95 flex items-center justify-center gap-3"><User className="w-5 h-5" /> AUTHENTICATE NOW</button>
              </Link>
              <button onClick={() => setAuthModal(false)} className="mt-6 text-[10px] text-gray-500 hover:text-white uppercase tracking-[0.3em] font-black z-10 p-2">DISMISS</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE NAVIGATION */}
      <div className="md:hidden fixed top-0 left-0 w-full p-5 flex justify-between items-start z-[500] bg-gradient-to-b from-black/90 to-transparent pb-10 pointer-events-none">
        <Link href="/" className="pointer-events-auto flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-white transition-all uppercase tracking-widest bg-white/5 px-4 py-2.5 rounded-full border border-white/10 backdrop-blur-md shadow-lg active:scale-90"><ChevronLeft className="w-5 h-5 text-gray-300" /></Link>
        <div className="flex flex-col items-center pointer-events-none mt-2">
          <h1 className="text-3xl font-black italic text-white drop-shadow-[0_0_20px_rgba(219,39,119,0.8)] leading-none">MINDER<span className="text-pink-600">_</span></h1>
        </div>
        <div className="flex gap-3 pointer-events-auto">
          <button onClick={() => setMobileLeaderboardOpen(true)} className="bg-black/80 border border-white/10 p-3.5 rounded-full backdrop-blur-xl text-yellow-500 shadow-lg active:scale-90"><Trophy className="w-5 h-5" /></button>
          <button onClick={() => setMobileHudOpen(true)} className="bg-pink-600 border border-pink-400 p-3.5 rounded-full shadow-[0_0_25px_rgba(219,39,119,0.6)] active:scale-90"><Activity className="w-5 h-5 text-white" /></button>
        </div>
      </div>

      {/* MOBILE HUD OVERLAYS */}
      <AnimatePresence>
        {mobileHudOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl md:hidden p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
               <div><h3 className="text-pink-500 font-black tracking-widest text-2xl uppercase">LIVE FEED</h3><p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Global Uplink</p></div>
               <button onClick={() => setMobileHudOpen(false)} className="bg-white/10 p-3 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-6">
               {feed.map(item => <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={item.id} className={`${item.color} text-xs font-bold border-l-2 border-current pl-4 py-3 bg-white/5 rounded-r backdrop-blur-md shadow-sm`}>{item.text}</motion.div>)}
            </div>
          </motion.div>
        )}
        
        {mobileLeaderboardOpen && (
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl md:hidden p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
               <div><h3 className="text-yellow-500 font-black tracking-widest text-2xl uppercase flex items-center gap-3"><Trophy className="w-6 h-6"/> TRENDING</h3></div>
               <button onClick={() => setMobileLeaderboardOpen(false)} className="bg-white/10 p-3 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 space-y-5">
               {leaderboard.length === 0 ? <p className="text-gray-500 text-sm font-bold text-center mt-20 uppercase tracking-widest">Compiling intel...</p> : leaderboard.map((leader, i) => (
                 <div key={leader.id} className="flex items-center gap-5 bg-gradient-to-r from-white/10 to-transparent p-5 rounded-[2rem] border border-white/10 shadow-lg">
                   <h1 className="text-4xl font-black text-gray-600 w-10">#{i + 1}</h1>
                   <img src={leader.image_url} alt="leader" className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500/50 shadow-lg" />
                   <div>
                     <h4 className="font-black text-white uppercase text-lg">{leader.alias}</h4>
                     <p className="text-xs text-green-500 font-black tracking-widest flex items-center gap-2 mt-1"><Flame className="w-4 h-4"/> {leader.score} SMASHES</p>
                   </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:flex flex-col w-[450px] lg:w-[480px] bg-black/90 backdrop-blur-3xl border-r border-pink-600/20 p-12 z-[100] h-full relative overflow-hidden">
        <div className="flex items-center gap-6 text-pink-500 mb-10 pb-8 border-b border-pink-900/40 relative z-10 pt-4">
          <div className="p-4 bg-pink-900/20 rounded-2xl border border-pink-500/30 shadow-[0_0_30px_rgba(219,39,119,0.3)]"><Activity className="w-10 h-10 animate-pulse" /></div>
          <div><h2 className="font-black tracking-tighter uppercase text-3xl leading-none">GLOBAL FEED</h2><p className="text-[10px] text-pink-800 font-black mt-2 tracking-[0.4em] uppercase">Encrypted Uplink</p></div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-5 relative z-10">
          <AnimatePresence mode="popLayout">
            {feed.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className={`${item.color} font-black border-l-4 border-current pl-6 py-4 bg-gradient-to-r from-white/5 to-transparent rounded-r shadow-2xl text-xs tracking-tight leading-relaxed relative overflow-hidden`}>
                <span className="text-[9px] opacity-40 block mb-2 font-mono tracking-[0.4em] uppercase italic">Signal_Logged</span>
                {item.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Leaderboard */}
        <div className="mt-8 border-t border-pink-900/40 pt-8 relative z-10">
          <h3 className="text-yellow-500 font-black text-sm mb-5 tracking-[0.3em] uppercase flex items-center gap-3"><Trophy className="w-5 h-5"/> TOP TARGETS</h3>
          <div className="space-y-4">
             {leaderboard.map((l, i) => (
               <div key={l.id} className="flex items-center justify-between bg-black/50 p-4 rounded-2xl border border-white/5 cursor-default">
                 <div className="flex items-center gap-4">
                   <span className="text-gray-600 font-black text-2xl">#{i+1}</span>
                   <span className="text-sm font-black text-white uppercase tracking-widest">{l.alias}</span>
                 </div>
                 <span className="text-xs text-green-500 font-black tracking-widest flex items-center gap-1.5"><Flame className="w-4 h-4"/> {l.score}</span>
               </div>
             ))}
          </div>
        </div>

        <Link href="/minder/enroll" className="block relative z-[200] mt-8">
           <button className="w-full py-6 bg-pink-600 text-white text-sm font-black tracking-[0.3em] uppercase hover:bg-pink-500 transition-all shadow-[0_0_60px_rgba(219,39,119,0.5)] flex items-center justify-center gap-4 rounded-[2rem] border-b-4 border-pink-900 active:border-b-0 active:translate-y-1"><Zap className="w-6 h-6 fill-current" /> INJECT DOSSIER</button>
        </Link>
      </div>

      {/* --- THE VIRTUALIZED MAIN GRID CENTER --- */}
      <div className="flex-1 flex flex-col relative z-10 p-0 md:p-10 h-full overflow-hidden justify-center items-center pt-24 md:pt-10">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex justify-between items-start w-full absolute top-10 px-10 z-[200]">
           <Link href="/" className="group flex items-center gap-3 text-xs font-black text-gray-400 hover:text-white transition-all uppercase tracking-[0.2em] bg-black/60 px-6 py-3.5 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl">
             <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK TO BASE
           </Link>
           <div className="flex flex-col items-end pointer-events-none">
             <h1 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_40px_rgba(219,39,119,0.8)]">MINDER<span className="text-pink-600">_</span></h1>
             <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.4em] bg-pink-900/30 px-4 py-2 rounded-full border border-pink-500/20 mt-3 backdrop-blur-md shadow-inner">LAWSUIT PROTOCOL ACTIVE</p>
           </div>
        </div>

        {/* TINDER-GRADE VIEWPORT */}
        <div className="relative w-full h-[100dvh] md:h-[750px] md:max-w-[420px] flex items-center justify-center md:my-0 mt-0">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-6">
              <Radar className="w-16 h-16 animate-spin opacity-50 text-pink-600" />
              <div className="text-xs uppercase tracking-[0.5em] font-black animate-pulse">Decrypting Grid...</div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center w-[90%] md:w-full bg-black/60 p-10 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl">
               <Crosshair className="w-12 h-12 mx-auto mb-6 text-gray-600" />
               <p className="text-xl uppercase tracking-widest font-black text-white">GRID CLEARED.</p>
            </div>
          ) : (
            <div className="relative w-[95%] md:w-full h-[85dvh] md:h-full max-h-[800px] flex items-center justify-center">
              <AnimatePresence>
                {/* WE ONLY RENDER THE 3 CARDS IN THE DOM SLICE */}
                {visibleCards.map((card) => (
                  <SwipeCard 
                    key={card.target.id} // Stable ID key prevents React re-render crashes
                    target={card.target} 
                    isTop={card.isTop} 
                    depthIndex={card.relativeIndex}
                    session={session}
                    isOwnCard={session?.user?.id === card.target.user_id}
                    existingSwipe={userSwipes.get(card.target.id)}
                    onExecuteSwipe={(dir) => executeSwipe(dir, card.target.id, session?.user?.id === card.target.user_id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        /* GPU Boost */
        .will-change-transform { will-change: transform; transform: translateZ(0); }
      `}</style>
    </div>
  );
}

// ============================================================================
// NATIVE SWIPE CARD (DETERMINISTIC STATE MACHINE)
// ============================================================================
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, isOwnCard, existingSwipe, onExecuteSwipe }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Safe 6-Second Hybrid Hook
  const { score: redFlagScore, loading: scoreLoading } = useHybridRedFlag(target);
  
  // Hardware accelerated CSS mappings
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.05);
  const yOffset = isTop ? 0 : depthIndex * 18;
  const smashOpacity = useTransform(x, [50, 150], [0, 1]);
  const passOpacity = useTransform(x, [-50, -150], [0, 1]);

  useEffect(() => {
    if (!isTop || isOwnCard) return;
    const handleKeyDown = async (e) => {
      if (e.key === 'ArrowRight') await processPhysicalSwipe('right');
      else if (e.key === 'ArrowLeft') await processPhysicalSwipe('left');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTop, isOwnCard]);

  // The Physics Engine: Fire Animation -> Await Finish -> Tell Parent to Advance Index
  const processPhysicalSwipe = async (direction) => {
    if (isOwnCard && direction !== 'dismiss') return;

    const exitX = direction === 'right' ? window.innerWidth : direction === 'left' ? -window.innerWidth : 0;
    const exitY = direction === 'dismiss' ? -(window.innerHeight) : 0;
    const exitRotate = direction === 'right' ? 30 : direction === 'left' ? -30 : 0;
    
    // Animate physically off the screen FIRST
    await controls.start({ 
      x: exitX, 
      y: exitY, 
      rotate: exitRotate, 
      opacity: 0, 
      transition: { duration: 0.25, ease: "easeOut" } 
    });
    
    // THEN advance the React index state
    onExecuteSwipe(direction);
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return; 
    const threshold = 90;
    const velocity = 400; 
    
    if (info.offset.x > threshold || info.velocity.x > velocity) {
      await processPhysicalSwipe('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      await processPhysicalSwipe('left');
    } else {
      // Snap back safely
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  return (
    <motion.div
      style={{ x, rotate, scale, y: isOwnCard && isTop ? 0 : yOffset, zIndex: 50 - depthIndex }}
      animate={controls}
      drag={isTop && !isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { scale: 0.98 } : {}}
      className={`absolute inset-0 md:inset-auto md:w-full md:h-full rounded-[2.5rem] md:rounded-[3rem] bg-[#0c0c15] shadow-2xl overflow-hidden flex flex-col will-change-transform ${!isTop && 'opacity-70'} ${isOwnCard && isTop ? 'border-2 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)]' : 'border-2 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]'}`}
    >
      <img src={target.image_url} alt={target.alias} draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-[#010103]/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#010103]/70 via-transparent to-transparent h-48 pointer-events-none" />

      {isOwnCard && isTop && (
        <div className="absolute top-10 left-0 w-full bg-yellow-500 text-black py-3 font-black text-center tracking-[0.4em] text-[10px] uppercase z-30 shadow-2xl">
          <User className="w-4 h-4 inline mr-2 stroke-[3px]" /> MATCH_RECOGNIZED: THIS IS YOU
        </div>
      )}

      {existingSwipe && isTop && !isOwnCard && (
        <div className={`absolute top-10 left-0 w-full ${existingSwipe === 'SMASH' ? 'bg-green-500' : 'bg-red-500'} text-black py-2 font-black text-center tracking-[0.3em] text-[9px] uppercase z-30 shadow-2xl animate-pulse`}>
          <Eye className="w-3 h-3 inline mr-2 stroke-[3px]" /> PREVIOUSLY {existingSwipe}ED
        </div>
      )}

      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-24 left-6 md:left-10 border-[8px] md:border-[12px] border-green-500 text-green-500 font-black text-5xl md:text-7xl px-8 py-3 rounded-3xl rotate-[-15deg] uppercase z-20 bg-black/60 shadow-[0_0_80px_rgba(34,197,94,0.8)] pointer-events-none">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-24 right-6 md:right-10 border-[8px] md:border-[12px] border-red-500 text-red-500 font-black text-5xl md:text-7xl px-8 py-3 rounded-3xl rotate-[15deg] uppercase z-20 bg-black/60 shadow-[0_0_80px_rgba(239,68,68,0.8)] pointer-events-none">PASS</motion.div>
        </>
      )}

      <div className="mt-auto w-full p-6 md:p-8 flex flex-col gap-4 z-10 shrink-0 pointer-events-auto pb-10 md:pb-8 bg-gradient-to-t from-[#010103] via-[#010103]/95 to-transparent">
        <div className="flex justify-between items-end gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter drop-shadow-2xl flex items-center gap-3 truncate">
              {target.alias} <span className="text-2xl text-gray-500 font-normal">{target.age}</span>
            </h2>
            
            {session ? (
              <div className="text-xs md:text-sm font-black text-white bg-pink-600 w-fit px-4 py-2 mt-3 rounded-xl shadow-[0_0_30px_rgba(219,39,119,0.8)] flex items-center gap-2 border border-pink-400/50">
                <Terminal className="w-4 h-4" /> @{target.instagram_id}
              </div>
            ) : (
              <div className="text-[9px] md:text-[10px] font-black text-red-400 bg-red-950/80 w-fit px-3 py-1.5 mt-3 border border-red-900/80 rounded-lg flex items-center gap-2 uppercase tracking-[0.2em] shadow-lg backdrop-blur-md">
                <Lock className="w-3 h-3" /> SECURE COORDS
              </div>
            )}
          </div>

          <div className="text-center bg-black/80 p-3 md:p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl flex flex-col items-center min-w-[70px]">
            <div className="text-[8px] text-red-500 font-black uppercase tracking-widest mb-1 leading-none">FLAG</div>
            <div className="text-3xl font-black text-white leading-none">
              {scoreLoading ? <Activity className="w-6 h-6 animate-spin text-pink-600 my-1" /> : `${redFlagScore}%`}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-0 w-1.5 h-full bg-pink-600/40 rounded-full" />
          <p className="text-xs md:text-sm text-gray-200 font-bold leading-relaxed bg-white/5 p-4 md:p-5 rounded-2xl border border-white/10 shadow-inner italic line-clamp-3">
            {session ? `"${target.bio}"` : <span className="flex items-center opacity-60"><EyeOff className="w-4 h-4 text-red-500 mr-2" />{target.bio.split(' ').map((w, i) => i % 2 === 0 ? '████' : w).join(' ')}</span>}
          </p>
        </div>

        {isTop && (
          <div className="mt-4 flex gap-3" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button onClick={() => processPhysicalSwipe('dismiss')} className="w-full bg-yellow-500 text-black py-4 md:py-5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-95 transition-transform"><X className="w-5 h-5 stroke-[4px]" /> DISMISS DOSSIER</button>
             ) : (
               <>
                 <button onClick={() => processPhysicalSwipe('left')} className="flex-1 bg-red-950/80 border border-red-500/50 text-red-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl active:bg-red-600 active:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)]"><ThumbsDown className="w-5 h-5"/> {existingSwipe === 'PASS' ? 'PASSED' : 'PASS'}</button>
                 <button onClick={() => processPhysicalSwipe('right')} className="flex-1 bg-green-950/80 border border-green-500/50 text-green-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl active:bg-green-600 active:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)]"><Heart className="w-5 h-5"/> {existingSwipe === 'SMASH' ? 'SMASHED' : 'SMASH'}</button>
               </>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";

// ============================================================================
// HYBRID AI HOOK (EXTENDED 6 SECOND TIMEOUT FOR API RELIABILITY)
// ============================================================================
function useHybridRedFlag(target) {
  const [data, setData] = useState({ score: 0, loading: true });

  useEffect(() => {
    let isMounted = true;

    const calculateScore = async () => {
      if (!target) return;
      if (isMounted) setData({ score: 0, loading: true });

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000); // Expanded to 6 seconds

        const res = await fetch('/api/redflag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bio: target.bio, age: target.age, alias: target.alias }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const apiData = await res.json();
          if (isMounted) setData({ score: apiData.score, loading: false });
          return;
        }
      } catch (err) {
        console.warn("AI Uplink failed. Routing to V-Smart Offline Engine.");
      }

      // Offline Fallback Math
      let score = 10; // Reduced base skepticism
      const bioLower = target.bio?.toLowerCase() || '';
      
      const wordCount = bioLower.split(/\s+/).length;
      if (wordCount < 4) score += 20; 
      if (wordCount > 60) score += 10; 

      if (/(no drama|drama free|toxic|fake people|trust issues)/.test(bioLower)) score += 25;
      if (/(cashapp|venmo|paypal|spoil me|sugar|generous)/.test(bioLower)) score += 40;
      
      const pronounCount = (bioLower.match(/\b(i|me|my|mine)\b/g) || []).length;
      if (wordCount > 10 && (pronounCount / wordCount) > 0.15) score += 10; 
      
      if (/(alpha|sigma|king|queen|boss bitch)/.test(bioLower)) score += 15;
      
      const demandCount = (bioLower.match(/\b(must|should|never|require|need to)\b/g) || []).length;
      score += (demandCount * 8);

      if (/(nice guy|good girl)/.test(bioLower)) score += 20;

      const variance = (target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 15) - 7;
      let finalScore = Math.round(score + variance);
      finalScore = Math.min(Math.max(finalScore, 1), 99);

      if (isMounted) setData({ score: finalScore, loading: false });
    };

    calculateScore();

    return () => { isMounted = false; };
  }, [target]);

  return data;
}
