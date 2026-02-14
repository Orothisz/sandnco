"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  Lock, Activity, Terminal, ChevronLeft, Radar, Zap, User, X, Crosshair, 
  Heart, ThumbsDown, Trophy, Flame, EyeOff
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ------------------------------------------------------------------               
// THE NATIVE ENGINE (v9.0.0 - INDEX-BASED RENDERING)
// ------------------------------------------------------------------
export default function MinderHub() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [targets, setTargets] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // Native app method: index tracking
  const [feed, setFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [mobileLeaderboardOpen, setMobileLeaderboardOpen] = useState(false);

  // 1. HIGH-SPEED NATIVE INGESTION
  const fetchTargets = useCallback(async (startIndex = 0, currentSession = session) => {
    try {
      const { data, error } = await supabase
        .from('minder_targets')
        .select('*')
        .order('created_at', { ascending: false }); // Fetch all for fluid local looping
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        let finalTargets = data;

        // Filter out swiped if logged in
        if (currentSession?.user?.id) {
          const { data: swiped } = await supabase.from('minder_swipes').select('target_id').eq('swiper_id', currentSession.user.id);
          const swipedIds = new Set(swiped?.map(s => s.target_id) || []);
          finalTargets = data.filter(t => !swipedIds.has(t.id));
        }

        // If we ran out of targets, loop the original data
        if (finalTargets.length === 0) finalTargets = data;

        setTargets(finalTargets);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error("🚨 GRID_SYNC_FAILURE:", err.message);
    } finally {
      setLoading(false);
    }
  }, [session, supabase]);

  // 2. LEADERBOARD GENERATOR
  const fetchLeaderboard = useCallback(async () => {
    try {
      const { data: swipes } = await supabase.from('minder_swipes').select('target_id, action').eq('action', 'SMASH');
      if (!swipes) return;

      // Count Smashes
      const counts = swipes.reduce((acc, swipe) => {
        acc[swipe.target_id] = (acc[swipe.target_id] || 0) + 1;
        return acc;
      }, {});

      // Sort and take top 3
      const topIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
      if (topIds.length === 0) return;

      const { data: topTargets } = await supabase.from('minder_targets').select('id, alias, image_url').in('id', topIds);
      
      if (topTargets) {
        const sortedLeaderboard = topTargets
          .map(t => ({ ...t, score: counts[t.id] }))
          .sort((a, b) => b.score - a.score);
        setLeaderboard(sortedLeaderboard);
      }
    } catch (err) {
      console.log("Leaderboard sync delayed.");
    }
  }, [supabase]);

  // 3. PARALLEL SYSTEM BOOT & WEBSOCKETS
  useEffect(() => {
    const initializeSystem = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      
      // Fetch everything at once
      fetchTargets(0, activeSession);
      fetchLeaderboard();

      // Websocket Connection
      const channelId = `minder_live_${Math.random().toString(36).substr(2, 9)}`;
      const channel = supabase.channel(channelId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           if (payload.new.swiper_id === activeSession?.user?.id) return;
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const action = payload.new.action;
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT ${action}ED [${t?.alias || 'ANON'}]`, color: action === 'SMASH' ? 'text-green-500' : 'text-red-500' }, ...prev].slice(0, 20));
           if (action === 'SMASH') fetchLeaderboard(); // Update leaderboard live
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    initializeSystem();
  }, [supabase, fetchTargets, fetchLeaderboard]);

  // 4. INSTANT SWIPE ENGINE (Index-based)
  const processSwipe = async (direction, targetId, isOwnCard) => {
    if (!session && !isOwnCard) {
      setLoginModalOpen(true);
      return; 
    }

    const targetAlias = targets[currentIndex]?.alias || 'UNKNOWN';

    // Instantly move to next card
    setCurrentIndex(prev => {
      const next = prev + 1;
      // Loop back to 0 if we hit the end
      return next >= targets.length ? 0 : next;
    });

    if (isOwnCard || direction === 'dismiss') return;

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    
    // Instant Feed Update
    setFeed(prev => [{ 
      id: `opt-${Date.now()}`, 
      text: `> YOU ${action}ED [${targetAlias}]`, 
      color: action === 'SMASH' ? 'text-green-500' : 'text-red-500'
    }, ...prev].slice(0, 20));

    // Background Database Write
    await supabase.from('minder_swipes').insert([{ swiper_id: session.user.id, target_id: targetId, action }]);
    if (action === 'SMASH') fetchLeaderboard();
  };

  return (
    <div className="h-[100dvh] bg-[#010103] text-white overflow-hidden flex flex-col md:flex-row font-mono relative select-none touch-none">
      
      {/* GLOBAL BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.8)_50%),linear-gradient(90deg,rgba(255,0,255,0.02),rgba(0,255,255,0.01))] bg-[length:100%_4px,3px_100%]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#010103]/80 to-[#010103] z-10" />
      </div>

      {/* --- CENTRALIZED LOGIN MODAL --- */}
      <AnimatePresence>
        {loginModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-sm bg-[#0a0a0f] border border-red-600/50 rounded-[2rem] p-8 shadow-[0_0_80px_rgba(220,38,38,0.3)] flex flex-col items-center text-center">
              <Lock className="w-12 h-12 text-red-500 mb-4 animate-pulse" />
              <h2 className="text-2xl font-black uppercase text-white mb-2">ACCESS DENIED</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8">Authentication required.</p>
              <Link href="/login?next=/minder" className="w-full">
                <button className="w-full py-4 bg-red-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-3">
                  <User className="w-5 h-5" /> AUTHENTICATE NOW
                </button>
              </Link>
              <button onClick={() => setLoginModalOpen(false)} className="mt-6 text-[10px] text-gray-500 uppercase font-black p-2">DISMISS</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MOBILE TOP NAVIGATION (NATIVE APP FEEL) --- */}
      <div className="md:hidden fixed top-0 left-0 w-full p-5 flex justify-between items-center z-[100] bg-gradient-to-b from-black/90 to-transparent pb-10">
        <Link href="/" className="bg-black/60 border border-white/10 p-3 rounded-full backdrop-blur-md"><ChevronLeft className="w-5 h-5" /></Link>
        <h1 className="text-2xl font-black italic text-white drop-shadow-lg">MINDER<span className="text-pink-600">_</span></h1>
        <div className="flex gap-3">
          <button onClick={() => setMobileLeaderboardOpen(true)} className="bg-black/60 border border-white/10 p-3 rounded-full backdrop-blur-md text-yellow-500"><Trophy className="w-5 h-5" /></button>
          <button onClick={() => setMobileHudOpen(true)} className="bg-pink-600 border border-pink-400 p-3 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.5)]"><Activity className="w-5 h-5" /></button>
        </div>
      </div>

      {/* --- MOBILE SLIDEOVERS (FEED & LEADERBOARD) --- */}
      <AnimatePresence>
        {mobileHudOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl md:hidden p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
               <h3 className="text-pink-500 font-black tracking-widest text-xl uppercase">LIVE FEED</h3>
               <button onClick={() => setMobileHudOpen(false)} className="bg-white/10 p-2 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
               {feed.map(item => <div key={item.id} className={`${item.color} text-[11px] font-bold border-l-2 border-current pl-3 py-2 bg-white/5 rounded-r`}>{item.text}</div>)}
            </div>
            <Link href="/minder/enroll" onClick={() => setMobileHudOpen(false)} className="mt-4"><button className="w-full py-5 bg-pink-600 text-white font-black uppercase tracking-widest rounded-xl"><Zap className="w-4 h-4 inline mr-2" /> INJECT DOSSIER</button></Link>
          </motion.div>
        )}
        {mobileLeaderboardOpen && (
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-2xl md:hidden p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
               <h3 className="text-yellow-500 font-black tracking-widest text-xl uppercase flex items-center gap-2"><Trophy className="w-5 h-5"/> TRENDING</h3>
               <button onClick={() => setMobileLeaderboardOpen(false)} className="bg-white/10 p-2 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 space-y-4">
               {leaderboard.length === 0 ? <p className="text-gray-500 text-xs text-center mt-10">Compiling intel...</p> : leaderboard.map((leader, i) => (
                 <div key={leader.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                   <h1 className="text-3xl font-black text-gray-600">#{i + 1}</h1>
                   <img src={leader.image_url} alt="leader" className="w-12 h-12 rounded-full object-cover border border-white/20" />
                   <div>
                     <h4 className="font-black text-white uppercase">{leader.alias}</h4>
                     <p className="text-xs text-green-500 font-bold flex items-center gap-1"><Flame className="w-3 h-3"/> {leader.score} SMASHES</p>
                   </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DESKTOP PRO SIDEBAR --- */}
      <div className="hidden md:flex flex-col w-[400px] lg:w-[450px] bg-black/80 backdrop-blur-xl border-r border-pink-600/20 p-10 z-[100] h-full relative">
        <div className="flex items-center gap-4 text-pink-500 mb-8 pb-6 border-b border-pink-900/30">
          <Activity className="w-8 h-8 animate-pulse" />
          <div><h2 className="font-black tracking-tighter uppercase text-2xl">GLOBAL FEED</h2><p className="text-[10px] text-pink-700 tracking-widest uppercase">Encrypted Uplink</p></div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {feed.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`${item.color} font-black border-l-4 border-current pl-4 py-3 bg-white/5 rounded-r shadow-md text-xs tracking-tight`}>{item.text}</motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Desktop Leaderboard Widget */}
        <div className="mt-8 border-t border-white/10 pt-6">
          <h3 className="text-yellow-500 font-black text-sm mb-4 tracking-widest flex items-center gap-2"><Trophy className="w-4 h-4"/> TOP TARGETS</h3>
          <div className="space-y-3">
             {leaderboard.slice(0, 3).map((l, i) => (
               <div key={l.id} className="flex items-center justify-between bg-black/50 p-3 rounded-xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <span className="text-gray-500 font-black text-lg">#{i+1}</span>
                   <span className="text-sm font-black text-white uppercase">{l.alias}</span>
                 </div>
                 <span className="text-xs text-green-500 font-bold">{l.score} <Heart className="w-3 h-3 inline"/></span>
               </div>
             ))}
          </div>
        </div>

        <Link href="/minder/enroll" className="mt-8">
           <button className="w-full py-5 bg-pink-600 text-white text-sm font-black tracking-widest hover:bg-pink-500 transition-all rounded-xl flex items-center justify-center gap-3"><Zap className="w-5 h-5 fill-current" /> INJECT DOSSIER</button>
        </Link>
      </div>

      {/* --- NATIVE MAIN TARGETING GRID --- */}
      <div className="flex-1 flex flex-col relative z-10 p-0 md:p-10 h-full overflow-hidden justify-center items-center">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex justify-between items-start w-full absolute top-10 px-10 z-[200]">
           <Link href="/" className="group flex items-center gap-3 text-xs font-black text-gray-400 hover:text-white transition-all uppercase tracking-widest bg-black/60 px-5 py-3 rounded-full border border-white/10 backdrop-blur-xl">
             <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BASE
           </Link>
           <div className="flex flex-col items-end">
             <h1 className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_40px_rgba(219,39,119,0.6)]">MINDER<span className="text-pink-600">_</span></h1>
             <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] bg-pink-900/30 px-4 py-1.5 rounded-full border border-pink-500/20 mt-3 backdrop-blur-md">LAWSUIT PROTOCOL ACTIVE</p>
           </div>
        </div>

        {/* --- NATIVE TARGET VIEWPORT --- */}
        <div className="relative w-full h-[100dvh] md:h-[750px] md:max-w-[440px] flex items-center justify-center md:my-0 mt-8">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-8">
              <Radar className="w-20 h-20 animate-spin opacity-40 text-pink-600" />
              <div className="text-sm uppercase tracking-[0.4em] font-black animate-pulse">Scanning Grid...</div>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center w-full max-w-[380px] bg-black/80 p-12 border border-pink-600/30 rounded-3xl backdrop-blur-md">
               <Crosshair className="w-16 h-16 mx-auto mb-6 text-pink-500 opacity-60" />
               <p className="text-2xl uppercase tracking-tighter font-black text-white">GRID EMPTY.</p>
            </div>
          ) : (
            <>
              {/* Pre-render only the next card for performance */}
              {currentIndex + 1 < targets.length && (
                <SwipeCard 
                  key={targets[currentIndex + 1].id} 
                  target={targets[currentIndex + 1]} 
                  isTop={false} 
                  session={session}
                  isOwnCard={session?.user?.id === targets[currentIndex + 1].user_id}
                  onSwipe={() => {}}
                />
              )}
              {/* Render the Active Card */}
              {targets[currentIndex] && (
                <SwipeCard 
                  key={targets[currentIndex].id} 
                  target={targets[currentIndex]} 
                  isTop={true} 
                  session={session}
                  isOwnCard={session?.user?.id === targets[currentIndex].user_id}
                  onSwipe={(dir) => processSwipe(dir, targets[currentIndex].id, session?.user?.id === targets[currentIndex].user_id)}
                  onForceMatch={() => router.push(`/request?target=${encodeURIComponent(targets[currentIndex].alias)}&service=matchup`)}
                />
              )}
            </>
          )}
        </div>

        {/* DESKTOP FOOTER */}
        <div className="hidden md:flex shrink-0 flex-col items-center gap-3 opacity-30 select-none absolute bottom-10 z-0 pointer-events-none">
           <div className="flex items-center gap-6 text-xs font-black uppercase tracking-[0.5em]">
             <span className="text-red-500 animate-pulse">← PASS</span>
             <div className="h-4 w-px bg-gray-600 rotate-12" />
             <span className="text-green-500 animate-pulse">SMASH →</span>
           </div>
        </div>

      </div>

      <style jsx global>{`
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(219, 39, 119, 0.4); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ------------------------------------------------------------------
// STANDALONE RED FLAG LOGIC (Ready to export)
// ------------------------------------------------------------------
function useRedFlagAlgorithm(target) {
  return useMemo(() => {
    let score = 0;
    const bio = target.bio?.toLowerCase() || '';
    const alias = target.alias?.toLowerCase() || '';
    
    if (bio.length < 20) score += 15; 
    if (bio.length > 300) score += 10;
    
    const flags = ['drama', 'crazy', 'ex', 'toxic', 'alpha', 'boss babe', 'manifest', 'crypto', 'nft'];
    score += flags.filter(kw => bio.includes(keyword => bio.includes(keyword))).length * 10;
    
    if (bio.includes('venmo') || bio.includes('cashapp')) score += 30;
    if (bio.includes('nice guy') || bio.includes('good girl')) score += 20;
    if (alias.includes('king') || alias.includes('queen')) score += 15;
    
    const base = Math.min(Math.max(score, 1), 99);
    // Add visual hash variance so it doesn't look static
    const hash = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 15;
    return Math.min(Math.max(base + hash, 1), 99);
  }, [target]);
}

// ------------------------------------------------------------------
// HIGH-KINETIC PHYSICS COMPONENT (NATIVE EDGE-TO-EDGE)
// ------------------------------------------------------------------
const SwipeCard = React.memo(({ target, isTop, session, isOwnCard, onSwipe, onForceMatch }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const redFlagScore = useRedFlagAlgorithm(target);
  
  // Kinetic Rotation: Aggressive mapping
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const scale = isTop ? 1 : 0.95;
  const yOffset = isTop ? 0 : 20;
  
  const smashOpacity = useTransform(x, [50, 150], [0, 1]);
  const passOpacity = useTransform(x, [-50, -150], [0, 1]);

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

    const exitX = direction === 'right' ? window.innerWidth : direction === 'left' ? -window.innerWidth : 0;
    const exitY = direction === 'dismiss' ? -window.innerHeight : 0;
    const exitRotate = direction === 'right' ? 45 : direction === 'left' ? -45 : 0;
    
    // Snappy, fast exit
    await controls.start({ x: exitX, y: exitY, rotate: exitRotate, transition: { duration: 0.25, ease: "easeOut" } });
    onSwipe(direction);
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return; 
    const threshold = 100;
    const velocityThreshold = 400; // Easier to flick on mobile
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      await triggerSwipeAnimation('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      await triggerSwipeAnimation('left');
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 20 } });
    }
  };

  return (
    <motion.div
      style={{ x, rotate, scale, y: yOffset, zIndex: isTop ? 20 : 10 }}
      animate={controls}
      drag={isTop && !isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1.1}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { scale: 0.98 } : {}}
      className={`absolute w-full h-[90dvh] md:h-full md:rounded-[2.5rem] bg-[#0c0c15] shadow-2xl overflow-hidden flex flex-col will-change-transform ${!isTop && 'opacity-60'} ${isOwnCard && isTop ? 'border-2 border-yellow-500' : 'md:border-2 md:border-white/10'}`}
    >
      {/* Edge-to-Edge Mobile Image, Contained Desktop Image */}
      <img src={target.image_url} alt={target.alias} loading="eager" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-[#010103]/40 to-transparent pointer-events-none" />

      {isOwnCard && isTop && (
        <div className="absolute top-16 md:top-10 left-0 w-full bg-yellow-500 text-black py-3 font-black text-center tracking-[0.4em] text-[10px] uppercase z-30 shadow-2xl">
          <User className="w-4 h-4 inline mr-2 stroke-[3px]" /> MATCH_RECOGNIZED: YOU
        </div>
      )}

      {/* Kinetic Action Stamps */}
      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-20 md:top-28 left-6 md:left-12 border-[8px] md:border-[10px] border-green-500 text-green-500 font-black text-5xl md:text-6xl px-6 md:px-8 py-2 md:py-3 rounded-2xl md:rounded-[2rem] rotate-[-15deg] uppercase z-20 bg-black/60 shadow-2xl pointer-events-none">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-20 md:top-28 right-6 md:right-12 border-[8px] md:border-[10px] border-red-500 text-red-500 font-black text-5xl md:text-6xl px-6 md:px-8 py-2 md:py-3 rounded-2xl md:rounded-[2rem] rotate-[15deg] uppercase z-20 bg-black/60 shadow-2xl pointer-events-none">PASS</motion.div>
        </>
      )}

      {/* TACTICAL DATA OVERLAY */}
      <div className="mt-auto w-full p-6 md:p-8 flex flex-col gap-4 z-10 shrink-0 pointer-events-auto pb-24 md:pb-8">
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-5xl md:text-5xl font-black uppercase text-white tracking-tighter drop-shadow-2xl flex items-center gap-2 truncate">
              {target.alias} <span className="text-2xl text-gray-400 font-normal">{target.age}</span>
            </h2>
            
            {session ? (
              <div className="text-xs font-black text-white bg-pink-600 w-fit px-4 py-2 mt-2 rounded-xl shadow-lg flex items-center gap-2">
                <Terminal className="w-4 h-4" /> @{target.instagram_id}
              </div>
            ) : (
              <div className="text-[10px] font-black text-red-400 bg-red-950/80 w-fit px-3 py-1.5 mt-2 border border-red-900/80 rounded-lg flex items-center gap-2 uppercase tracking-widest backdrop-blur-md">
                <Lock className="w-3 h-3" /> SECURE COORDS
              </div>
            )}
          </div>

          <div className="text-center bg-black/80 p-3 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl flex flex-col items-center min-w-[70px]">
            <div className="text-[8px] text-red-500 font-black uppercase tracking-widest mb-1 leading-none">FLAG</div>
            <div className="text-3xl font-black text-white leading-none">{redFlagScore}%</div>
          </div>
        </div>

        <p className="text-sm text-gray-200 font-bold leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/10 backdrop-blur-md italic line-clamp-3">
          {session ? `"${target.bio}"` : <span className="flex items-center opacity-60"><EyeOff className="w-4 h-4 text-red-500 mr-2" />{target.bio.split(' ').map((w, i) => i % 2 === 0 ? '████' : w).join(' ')}</span>}
        </p>

        {/* NATIVE HARDWARE BUTTONS */}
        {isTop && (
          <div className="mt-2 flex gap-3" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button onClick={() => triggerSwipeAnimation('dismiss')} className="w-full bg-yellow-500 text-black py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95"><X className="w-5 h-5 stroke-[4px]" /> DISMISS</button>
             ) : (
               <>
                 <button onClick={() => triggerSwipeAnimation('left')} className="flex-1 bg-red-950/80 border border-red-500 text-red-500 font-black text-sm py-4 rounded-2xl active:bg-red-600 active:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)]"><ThumbsDown className="w-5 h-5"/> PASS</button>
                 <button onClick={() => triggerSwipeAnimation('right')} className="flex-1 bg-green-950/80 border border-green-500 text-green-500 font-black text-sm py-4 rounded-2xl active:bg-green-600 active:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)]"><Heart className="w-5 h-5"/> SMASH</button>
               </>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";
