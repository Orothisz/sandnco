"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { useRedFlagAlgorithm } from '../../utils/useRedFlag'; 
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Crosshair, Lock, Activity, Terminal, ChevronRight, X, Check, 
  ArrowRight, ChevronLeft, Radar, Zap, User, Menu, Info, Layers, Eye, EyeOff, Heart, ThumbsDown, Trophy, Flame
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ------------------------------------------------------------------               
// THE GRID CONTROLLER (v10.0.0 - FLAGSHIP INFINITE LOOP ENGINE)
// ------------------------------------------------------------------
export default function MinderHub() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  // Core State
  const [session, setSession] = useState(null);
  const [targets, setTargets] = useState([]);
  const [feed, setFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userSwipes, setUserSwipes] = useState(new Map());
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [mobileLeaderboardOpen, setMobileLeaderboardOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isSwipeInProgress, setIsSwipeInProgress] = useState(false);

  // Haptic Engine
  const triggerHaptic = useCallback((intensity = 'medium') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(intensity === 'heavy' ? 50 : intensity === 'medium' ? 20 : 10);
    }
  }, []);

  // Show Toast
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // 1. INSTANT PARALLEL INGESTION
  useEffect(() => {
    const bootSystem = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);

      // Fire all DB queries in parallel for instant loading
      const [targetsRes, feedRes, swipesRes, leaderRes] = await Promise.all([
        supabase.from('minder_targets').select('*').order('created_at', { ascending: false }),
        supabase.from('minder_targets').select('id, alias').order('created_at', { ascending: false }).limit(15),
        activeSession ? supabase.from('minder_swipes').select('target_id, action').eq('swiper_id', activeSession.user.id) : Promise.resolve({ data: [] }),
        supabase.from('minder_swipes').select('target_id, action').eq('action', 'SMASH')
      ]);

      // A. Populate Targets (Attach a unique renderKey for infinite looping)
      if (targetsRes.data) {
        const processedTargets = targetsRes.data.map(t => ({ ...t, renderKey: `${t.id}-${Date.now()}` }));
        setTargets(processedTargets.reverse()); // Reverse so index 0 is bottom, last is top
      }

      // B. Populate Swipe History Map
      if (swipesRes.data) {
        const swipeMap = new Map();
        swipesRes.data.forEach(s => swipeMap.set(s.target_id, s.action));
        setUserSwipes(swipeMap);
      }

      // C. Populate Initial Feed
      if (feedRes.data) {
        setFeed(feedRes.data.map(t => ({
          id: `hist-${t.id}`,
          text: `> NEW DOSSIER LOGGED: [${t.alias}]`,
          color: 'text-gray-500'
        })));
      }

      // D. Populate Leaderboard
      if (leaderRes.data && targetsRes.data) {
        const counts = leaderRes.data.reduce((acc, s) => { acc[s.target_id] = (acc[s.target_id] || 0) + 1; return acc; }, {});
        const topIds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]).slice(0, 3);
        const topTargets = topIds.map(id => targetsRes.data.find(t => t.id === id)).filter(Boolean);
        setLeaderboard(topTargets.map(t => ({ ...t, score: counts[t.id] })));
      }

      setLoading(false);

      // E. Establish Realtime Websocket
      const channel = supabase.channel(`minder_live_${Math.random()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           if (payload.new.swiper_id === activeSession?.user?.id) return;
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const action = payload.new.action;
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT ${action}ED [${t?.alias || 'ANON'}]`, color: action === 'SMASH' ? 'text-green-500' : 'text-red-500' }, ...prev].slice(0, 30));
        })
        .subscribe();

      return () => supabase.removeChannel(channel);
    };

    bootSystem();
  }, [supabase]);

  // 2. THE INFINITE LOOP SWIPE ENGINE
  const processSwipe = async (direction, targetId, isOwnCard) => {
    if (isSwipeInProgress) return;
    setIsSwipeInProgress(true);

    if (!session && !isOwnCard) {
      setLoginModalOpen(true);
      setIsSwipeInProgress(false);
      return;
    }

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    const targetAlias = targets.find(t => t.id === targetId)?.alias || 'UNKNOWN';
    const previousSwipe = userSwipes.get(targetId);

    // If they changed their mind on a looped card, notify them
    if (!isOwnCard && previousSwipe && previousSwipe !== action && direction !== 'dismiss') {
      showToast(`Decision updated to ${action} for ${targetAlias}`);
    }

    // THE LOOP MECHANIC: Pop the top card, give it a new key, insert at the bottom
    setTimeout(() => {
      setTargets(prev => {
        if (prev.length === 0) return prev;
        const newDeck = [...prev];
        const swipedCard = newDeck.pop();
        // Give it a fresh key so Framer Motion treats it as a new card at the bottom
        newDeck.unshift({ ...swipedCard, renderKey: `${swipedCard.id}-${Date.now()}` });
        return newDeck;
      });
      setIsSwipeInProgress(false);
    }, 300);

    if (isOwnCard || direction === 'dismiss') return;

    triggerHaptic(direction === 'right' ? 'heavy' : 'medium');

    // Optimistic UI Updates
    setUserSwipes(prev => new Map(prev).set(targetId, action));
    setFeed(prev => [{ 
      id: `opt-${Date.now()}`, 
      text: `> YOU ${action}ED [${targetAlias}]`, 
      color: action === 'SMASH' ? 'text-green-500' : 'text-red-500'
    }, ...prev].slice(0, 30));

    // Upsert allows overriding previous choices on looped cards
    await supabase.from('minder_swipes').upsert(
      { swiper_id: session.user.id, target_id: targetId, action },
      { onConflict: 'swiper_id, target_id' }
    );
  };

  return (
    <div className="h-[100dvh] bg-[#020205] text-white overflow-hidden flex flex-col md:flex-row font-mono relative touch-none select-none">
      
      {/* --- FLAGSHIP BACKGROUND --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.7)_50%),linear-gradient(90deg,rgba(255,0,255,0.02),rgba(0,255,255,0.01))] bg-[length:100%_4px,3px_100%]" />
        <div className="hidden md:block absolute bottom-[-50%] left-[-50%] right-[-50%] h-[150%] bg-[linear-gradient(transparent_95%,rgba(219,39,119,0.15)_100%),linear-gradient(90deg,transparent_95%,rgba(219,39,119,0.15)_100%)] bg-[size:50px_50px] [transform:rotateX(75deg)] animate-[grid-move_20s_linear_infinite] opacity-30" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#020205]/90 to-[#020205] z-10" />
      </div>

      {/* --- TOAST NOTIFICATIONS --- */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 bg-pink-600/90 backdrop-blur-xl text-white font-black text-xs uppercase tracking-widest rounded-full shadow-[0_0_40px_rgba(219,39,119,0.8)] border border-pink-400 flex items-center gap-3">
            <Check className="w-4 h-4" /> {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- LOGIN MODAL --- */}
      <AnimatePresence>
        {loginModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-[#0a0a0f] border-2 border-red-600/50 rounded-[2rem] p-8 shadow-[0_0_100px_rgba(220,38,38,0.4)] flex flex-col items-center text-center relative overflow-hidden">
              <Lock className="w-14 h-14 text-red-500 mb-5 animate-pulse drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" />
              <h2 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">ACCESS DENIED</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mb-8 leading-relaxed">Authentication required to log biometric decisions.</p>
              <Link href="/login?next=/minder" className="w-full z-10">
                <button className="w-full py-5 bg-red-600 text-white font-black uppercase tracking-[0.3em] rounded-xl hover:bg-red-500 transition-all shadow-[0_0_30px_rgba(220,38,38,0.5)] active:scale-95 flex items-center justify-center gap-3"><User className="w-5 h-5" /> AUTHENTICATE NOW</button>
              </Link>
              <button onClick={() => setLoginModalOpen(false)} className="mt-6 text-[10px] text-gray-500 hover:text-white uppercase tracking-[0.3em] font-black z-10 p-2">DISMISS</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MOBILE NAVIGATION --- */}
      <div className="md:hidden fixed top-0 left-0 w-full p-5 flex justify-between items-center z-[500] bg-gradient-to-b from-black/90 to-transparent pb-10">
        <Link href="/" className="bg-black/60 border border-white/10 p-3.5 rounded-full backdrop-blur-xl shadow-lg active:scale-90 transition-transform"><ChevronLeft className="w-5 h-5 text-gray-300" /></Link>
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-black italic text-white drop-shadow-[0_0_20px_rgba(219,39,119,0.8)] leading-none">MINDER<span className="text-pink-600">_</span></h1>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setMobileLeaderboardOpen(true)} className="bg-black/80 border border-white/10 p-3.5 rounded-full backdrop-blur-xl text-yellow-500 shadow-lg active:scale-90 transition-transform"><Trophy className="w-5 h-5" /></button>
          <button onClick={() => setMobileHudOpen(true)} className="bg-pink-600 border border-pink-400 p-3.5 rounded-full shadow-[0_0_25px_rgba(219,39,119,0.6)] active:scale-90 transition-transform"><Activity className="w-5 h-5 text-white" /></button>
        </div>
      </div>

      {/* --- MOBILE SLIDEOVERS --- */}
      <AnimatePresence>
        {mobileHudOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl md:hidden p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
               <div><h3 className="text-pink-500 font-black tracking-widest text-2xl uppercase">LIVE FEED</h3><p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Global Uplink</p></div>
               <button onClick={() => setMobileHudOpen(false)} className="bg-white/10 p-3 rounded-full active:scale-90"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-6">
               {feed.slice(0, 20).map(item => <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={item.id} className={`${item.color} text-xs font-bold border-l-2 border-current pl-4 py-3 bg-white/5 rounded-r backdrop-blur-md`}>{item.text}</motion.div>)}
            </div>
            <Link href="/minder/enroll" onClick={() => setMobileHudOpen(false)} className="mt-4"><button className="w-full py-6 bg-pink-600 text-white font-black uppercase tracking-widest rounded-2xl shadow-[0_0_40px_rgba(219,39,119,0.5)] text-sm"><Zap className="w-5 h-5 inline mr-2" /> INJECT DOSSIER</button></Link>
          </motion.div>
        )}
        
        {mobileLeaderboardOpen && (
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[1000] bg-black/98 backdrop-blur-3xl md:hidden p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
               <div><h3 className="text-yellow-500 font-black tracking-widest text-2xl uppercase flex items-center gap-3"><Trophy className="w-6 h-6"/> TRENDING</h3><p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Top Smashed</p></div>
               <button onClick={() => setMobileLeaderboardOpen(false)} className="bg-white/10 p-3 rounded-full active:scale-90"><X className="w-6 h-6" /></button>
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

      {/* --- DESKTOP PRO SIDEBAR --- */}
      <div className="hidden md:flex flex-col w-[450px] lg:w-[500px] bg-black/90 backdrop-blur-3xl border-r border-pink-600/20 p-12 z-[100] h-full relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/5 via-transparent to-transparent animate-[scan_10s_linear_infinite] pointer-events-none" />
        <div className="flex items-center gap-6 text-pink-500 mb-10 pb-8 border-b border-pink-900/40 relative z-10 pt-4">
          <div className="p-4 bg-pink-900/20 rounded-2xl border border-pink-500/30 shadow-[0_0_30px_rgba(219,39,119,0.3)]"><Activity className="w-10 h-10 animate-pulse" /></div>
          <div><h2 className="font-black tracking-tighter uppercase text-3xl leading-none">GLOBAL FEED</h2><p className="text-[10px] text-pink-800 font-black mt-2 tracking-[0.4em] uppercase">Encrypted Uplink</p></div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-5 relative z-10">
          <AnimatePresence mode="popLayout">
            {feed.length === 0 ? <div className="text-gray-900 animate-pulse font-black text-sm tracking-[0.5em] mt-32 text-center">DECRYPTING...</div> : feed.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className={`${item.color} font-black border-l-4 border-current pl-6 py-4 bg-gradient-to-r from-white/5 to-transparent rounded-r shadow-2xl text-xs tracking-tight leading-relaxed relative overflow-hidden`}>
                <span className="text-[9px] opacity-40 block mb-2 font-mono tracking-[0.4em] uppercase italic">Signal_Logged</span>
                {item.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Desktop Leaderboard */}
        <div className="mt-8 border-t border-pink-900/40 pt-8 relative z-10">
          <h3 className="text-yellow-500 font-black text-sm mb-5 tracking-[0.3em] uppercase flex items-center gap-3"><Trophy className="w-5 h-5"/> TOP TARGETS</h3>
          <div className="space-y-4">
             {leaderboard.slice(0, 3).map((l, i) => (
               <div key={l.id} className="flex items-center justify-between bg-black/50 p-4 rounded-2xl border border-white/5 hover:border-white/20 transition-all cursor-default">
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

      {/* --- THE MAIN GRID CENTER --- */}
      <div className="flex-1 flex flex-col relative z-10 p-4 md:p-10 h-full overflow-hidden justify-center items-center pt-24 md:pt-10">
        
        {/* DESKTOP HEADER */}
        <div className="hidden md:flex justify-between items-start w-full absolute top-10 px-10 z-[200]">
           <Link href="/" className="group flex items-center gap-3 text-xs font-black text-gray-400 hover:text-white transition-all uppercase tracking-[0.2em] bg-black/60 px-6 py-3.5 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl">
             <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK TO BASE
           </Link>
           <div className="flex flex-col items-end">
             <h1 className="text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_40px_rgba(219,39,119,0.8)]">MINDER<span className="text-pink-600">_</span></h1>
             <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.4em] bg-pink-900/30 px-4 py-2 rounded-full border border-pink-500/20 mt-3 backdrop-blur-md shadow-inner">LAWSUIT PROTOCOL ACTIVE</p>
           </div>
        </div>

        {/* --- RESPONSIVE CARD VIEWPORT --- */}
        {/* On mobile, this flex-1 container stretches exactly to fill the available space minus nav. */}
        <div className="flex-1 w-full flex items-center justify-center relative my-2 md:my-0 z-10">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-8">
              <Radar className="w-24 h-24 md:w-32 md:h-32 animate-spin opacity-40 text-pink-600" />
              <div className="text-sm md:text-base uppercase tracking-[0.5em] md:tracking-[0.8em] font-black animate-pulse">Scanning Sector...</div>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center w-full max-w-[420px] bg-black/80 p-12 md:p-16 border-2 border-pink-600/40 rounded-[3rem] backdrop-blur-3xl shadow-[0_0_100px_rgba(219,39,119,0.2)] border-dashed">
               <Crosshair className="w-20 h-20 mx-auto mb-8 text-pink-500 opacity-60" />
               <p className="text-3xl uppercase tracking-tighter font-black text-white leading-none">SECTOR EMPTY.</p>
               <p className="text-[10px] md:text-xs mt-6 text-pink-400 font-bold uppercase tracking-widest leading-relaxed opacity-70">No targets found in database.<br/><br/>Deploy fresh intel.</p>
               <Link href="/minder/enroll" className="mt-10 block">
                 <button className="w-full text-xs bg-white text-black px-8 py-5 font-black tracking-widest rounded-2xl flex items-center justify-center gap-3 hover:bg-pink-600 hover:text-white transition-all shadow-xl active:scale-95 uppercase"><Zap className="w-5 h-5 fill-current" /> REPOPULATE GRID</button>
               </Link>
            </div>
          ) : (
            // The absolute bounds of the card stack.
            // On mobile, absolute inset-0 forces it to snap exactly to the edges of the flex container.
            // On desktop, it's a fixed centered rectangle.
            <div className="absolute inset-2 md:relative md:w-full md:max-w-[440px] md:h-[750px] flex items-center justify-center">
              {/* Only render the top 4 cards for performance */}
              {targets.slice(-4).map((target, index, arr) => {
                const isTop = index === arr.length - 1;
                const depth = arr.length - 1 - index;
                const isOwnCard = session?.user?.id === target.user_id;
                
                return (
                  <SwipeCard 
                    key={target.renderKey} // Using the unique renderKey for infinite looping
                    target={target} 
                    isTop={isTop} 
                    depthIndex={depth}
                    session={session}
                    isOwnCard={isOwnCard}
                    existingSwipe={userSwipes.get(target.id)}
                    onSwipe={(dir) => processSwipe(dir, target.id, isOwnCard)}
                    onForceMatch={() => router.push(`/request?target=${encodeURIComponent(target.alias)}&service=matchup`)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* TACTICAL FOOTER (Hidden on mobile to save space, visible on desktop) */}
        <div className="hidden md:flex shrink-0 flex-col items-center gap-3 opacity-30 select-none pb-4 pointer-events-none group hover:opacity-60 transition-opacity z-0">
           <div className="flex items-center gap-6 text-xs font-black uppercase tracking-[0.5em]">
             <span className="text-red-500 animate-pulse">← PASS</span>
             <div className="h-4 w-px bg-gray-600 rotate-12" />
             <span className="text-green-500 animate-pulse">SMASH →</span>
           </div>
           <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-gray-500 italic text-center">Grid Scans validated by Gemini Biometric AI Engine</p>
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
// STANDALONE RED FLAG ALGORITHM (Cleaned up for easy extraction)
// ------------------------------------------------------------------
//export function useRedFlagAlgorithm(target) {
//  return useMemo(() => {
 //   let score = 0;
 //   const bio = target.bio?.toLowerCase() || '';
 //   const alias = target.alias?.toLowerCase() || '';
    
 //   if (bio.length < 15) score += 20; 
 //   if (bio.length > 250) score += 15;
    
//    const flags = ['drama', 'crazy', 'ex', 'toxic', 'alpha', 'boss', 'manifest', 'crypto', 'nft', 'sugar', 'princess'];
//    score += flags.filter(kw => bio.includes(kw)).length * 12;
 ////   
 //   if (bio.includes('venmo') || bio.includes('cashapp')) score += 35;
  //  if (bio.includes('nice guy') || bio.includes('good girl')) score += 25;
  //  if (alias.includes('king') || alias.includes('queen') || alias.includes('official')) score += 15;
    
   // const base = Math.min(Math.max(score, 1), 99);
   // const hash = target.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 12;
   // return Math.min(Math.max(base + hash, 1), 99);
 // }, [target]);
//}

// ------------------------------------------------------------------
// HIGH-KINETIC PHYSICS COMPONENT (ABSOLUTE INSET)
// ------------------------------------------------------------------
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, isOwnCard, existingSwipe, onSwipe, onForceMatch }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const redFlagScore = useRedFlagAlgorithm(target);
  
  const rotate = useTransform(x, [-250, 250], [-25, 25]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.04);
  const opacity = useTransform(x, [-250, -150, 0, 150, 250], [0, 1, 1, 1, 0]);
  const yOffset = isTop ? 0 : depthIndex * 18;
  
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

    const exitX = direction === 'right' ? window.innerWidth + 200 : direction === 'left' ? -(window.innerWidth + 200) : 0;
    const exitY = direction === 'dismiss' ? -(window.innerHeight + 200) : 0;
    const exitRotate = direction === 'right' ? 45 : direction === 'left' ? -45 : 0;
    
    await controls.start({ x: exitX, y: exitY, rotate: exitRotate, transition: { duration: 0.3, ease: "easeOut" } });
    onSwipe(direction);
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return; 
    const threshold = 100;
    const velocityThreshold = 400; // Highly sensitive for easy mobile flicking
    
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) {
      await triggerSwipeAnimation('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) {
      await triggerSwipeAnimation('left');
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  return (
    <motion.div
      style={{ x, rotate, scale, y: isOwnCard && isTop ? 0 : yOffset, zIndex: 50 - depthIndex }}
      animate={controls}
      drag={isTop && !isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1.1}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { scale: 0.98 } : {}}
      className={`absolute inset-0 md:inset-auto md:w-full md:h-full rounded-[2.5rem] md:rounded-[3rem] bg-[#0c0c15] shadow-2xl overflow-hidden flex flex-col will-change-transform ${!isTop && 'opacity-60'} ${isOwnCard && isTop ? 'border-2 border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.3)]' : 'border-2 border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.8)]'}`}
    >
      {/* NATIVE FULL-BLEED IMAGE */}
      <img src={target.image_url} alt={target.alias} loading="eager" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#010103] via-[#010103]/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#010103]/70 via-transparent to-transparent h-48 pointer-events-none" />

      {/* OWN CARD LOCKOUT */}
      {isOwnCard && isTop && (
        <div className="absolute top-10 left-0 w-full bg-yellow-500 text-black py-3 font-black text-center tracking-[0.4em] text-[10px] uppercase z-30 shadow-2xl flex items-center justify-center gap-3">
          <User className="w-4 h-4 stroke-[3px]" /> MATCH_RECOGNIZED: THIS IS YOU
        </div>
      )}

      {/* LOOPED CARD BADGE (CHANGING MIND) */}
      {existingSwipe && isTop && !isOwnCard && (
        <div className={`absolute top-10 left-0 w-full ${existingSwipe === 'SMASH' ? 'bg-green-500' : 'bg-red-500'} text-black py-2 font-black text-center tracking-[0.3em] text-[9px] uppercase z-30 shadow-2xl flex items-center justify-center gap-3 animate-pulse`}>
          <Eye className="w-4 h-4 stroke-[3px]" /> PREVIOUSLY {existingSwipe}ED
        </div>
      )}

      {/* KINETIC STAMPS */}
      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-24 left-6 md:left-10 border-[8px] md:border-[12px] border-green-500 text-green-500 font-black text-5xl md:text-7xl px-8 py-3 rounded-3xl rotate-[-15deg] uppercase z-20 bg-black/60 shadow-[0_0_80px_rgba(34,197,94,0.8)] pointer-events-none">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-24 right-6 md:right-10 border-[8px] md:border-[12px] border-red-500 text-red-500 font-black text-5xl md:text-7xl px-8 py-3 rounded-3xl rotate-[15deg] uppercase z-20 bg-black/60 shadow-[0_0_80px_rgba(239,68,68,0.8)] pointer-events-none">PASS</motion.div>
        </>
      )}

      {/* TACTICAL DATA OVERLAY */}
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

          <div className="text-center bg-black/90 p-3 md:p-4 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl flex flex-col items-center min-w-[70px]">
            <div className="text-[8px] text-red-500 font-black uppercase tracking-widest mb-1 leading-none">FLAG</div>
            <div className="text-3xl md:text-4xl font-black text-white leading-none tracking-tighter">{redFlagScore}%</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-0 w-1.5 h-full bg-pink-600/40 rounded-full" />
          <p className="text-xs md:text-sm text-gray-200 font-bold leading-relaxed bg-white/5 p-4 md:p-5 rounded-2xl border border-white/10 shadow-inner italic line-clamp-3">
            {session ? `"${target.bio}"` : <span className="flex items-center opacity-60"><EyeOff className="w-4 h-4 text-red-500 mr-2" />{target.bio.split(' ').map((w, i) => i % 2 === 0 ? '████' : w).join(' ')}</span>}
          </p>
        </div>

        {/* FLOATING ACTION BUTTONS (HARDWARE OVERRIDES) */}
        {isTop && (
          <div className="mt-4 flex gap-3" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button onClick={() => triggerSwipeAnimation('dismiss')} className="w-full bg-yellow-500 text-black py-4 md:py-5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-95 transition-transform">
                 <X className="w-5 h-5 stroke-[4px]" /> DISMISS DOSSIER
               </button>
             ) : (
               <>
                 <button onClick={() => triggerSwipeAnimation('left')} className="flex-1 bg-red-950/80 border border-red-500/50 text-red-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl active:bg-red-600 active:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(220,38,38,0.3)]">
                   <ThumbsDown className="w-5 h-5"/> {existingSwipe === 'PASS' ? 'PASSED' : 'PASS'}
                 </button>
                 <button onClick={() => triggerSwipeAnimation('right')} className="flex-1 bg-green-950/80 border border-green-500/50 text-green-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl active:bg-green-600 active:text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                   <Heart className="w-5 h-5"/> {existingSwipe === 'SMASH' ? 'SMASHED' : 'SMASH'}
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
