"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  Lock, Activity, Terminal, ChevronLeft, Radar, Zap, User, X, 
  Crosshair, Heart, ThumbsDown, EyeOff, Trophy, Flame, Eye, ArrowUpRight, Edit2
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================================
// THE FLAGSHIP ENGINE (v14.2 - PC HEADER GEOMETRY FIX)
// ============================================================================
export default function MinderHub() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  // CORE DATA LAYER
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
  // 1. DATA INGESTION
  // --------------------------------------------------------------------------
  const loadBatch = useCallback(async (activeSession) => {
    try {
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
          unswipedDeck = [
            ...rawProfiles.filter(t => !swipedIds.has(t.id)),
            ...rawProfiles.filter(t => swipedIds.has(t.id))
          ];
        }
      }

      unswipedDeck.slice(0, 5).forEach(t => { 
        if (t.image_url) { const img = new Image(); img.src = t.image_url; } 
      });

      setUserSwipes(swipeMap);
      setProfiles(unswipedDeck);
      setCurrentIndex(0);
    } catch (err) {
      console.error("DATA LAYER FAILED:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // --------------------------------------------------------------------------
  // 2. SYSTEM INITIALIZATION
  // --------------------------------------------------------------------------
  useEffect(() => {
    const boot = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      
      await loadBatch(activeSession);

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
          supabase.from('minder_targets').select('id, alias, image_url').in('id', topIds).then(res => {
            if (res.data) setLeaderboard(res.data.map(t => ({ ...t, score: counts[t.id] })).sort((a, b) => b.score - a.score));
          });
        }
      });

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
  // 3. INTERACTION LAYER 
  // --------------------------------------------------------------------------
  const executeSwipe = useCallback((direction, targetId, isOwnCard) => {
    if (!session && !isOwnCard) {
      setAuthModal(true);
      return;
    }

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    const targetAlias = profiles[currentIndex]?.alias || 'TARGET';

    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= profiles.length) return 0;
      return next;
    });

    if (isOwnCard || direction === 'dismiss') return;

    setUserSwipes(prev => new Map(prev).set(targetId, action));
    setFeed(prev => [{ 
      id: `opt-${Date.now()}`, 
      text: `> YOU ${action}ED [${targetAlias}]`, 
      color: action === 'SMASH' ? 'text-green-500' : 'text-red-500' 
    }, ...prev].slice(0, 20));

    supabase.from('minder_swipes').upsert(
      { swiper_id: session.user.id, target_id: targetId, action },
      { onConflict: 'swiper_id, target_id' }
    ).then(() => console.log('Swipe logged.'));

  }, [currentIndex, profiles, session, supabase]);

  const visibleCards = profiles.slice(currentIndex, currentIndex + 3).map((target, idx) => ({
    target,
    relativeIndex: idx, 
    isTop: idx === 0
  })).reverse(); 

  return (
    <div className="h-[100dvh] bg-[#000000] text-white overflow-hidden flex flex-col md:flex-row font-mono relative touch-none select-none">
      
      {/* -------------------------------------------------------------------------- */}
      {/* PREMIUM BACKGROUND */}
      {/* -------------------------------------------------------------------------- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] opacity-30" />
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-black/80 to-black z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-pink-600/5 rounded-full blur-[150px]" />
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* AUTH MODAL */}
      {/* -------------------------------------------------------------------------- */}
      <AnimatePresence>
        {authModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-[#050505] border border-red-500/50 rounded-3xl p-8 shadow-[0_0_100px_rgba(220,38,38,0.2)] flex flex-col items-center text-center relative overflow-hidden">
              <Lock className="w-12 h-12 text-red-500 mb-6 animate-pulse" />
              <h2 className="text-2xl font-black uppercase text-white mb-2">ACCESS DENIED</h2>
              <p className="text-xs text-gray-400 font-medium leading-relaxed mb-8">Authentication required to execute biometric decisions.</p>
              <Link href="/login?next=/minder" className="w-full z-10">
                <button className="w-full py-4 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-500 transition-all shadow-[0_0_30px_rgba(220,38,38,0.3)] active:scale-95 flex items-center justify-center gap-3"><User className="w-4 h-4" /> AUTHENTICATE</button>
              </Link>
              <button onClick={() => setAuthModal(false)} className="mt-6 text-[10px] text-gray-500 hover:text-white uppercase tracking-widest font-bold z-10">DISMISS</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* -------------------------------------------------------------------------- */}
      {/* MOBILE NAVIGATION */}
      {/* -------------------------------------------------------------------------- */}
      <div className="md:hidden fixed top-0 left-0 w-full z-[500] bg-gradient-to-b from-black via-black/80 to-transparent pt-5 pb-10 px-5 pointer-events-none">
        <div className="flex justify-between items-center w-full pointer-events-auto mb-4">
          <Link href="/" className="bg-white/5 border border-white/10 p-3 rounded-full backdrop-blur-md shadow-lg active:scale-90 transition-transform">
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <h1 className="text-2xl font-black italic text-white drop-shadow-[0_0_15px_rgba(219,39,119,0.8)] tracking-tighter">
            MINDER<span className="text-pink-500">_</span>
          </h1>
          <div className="flex gap-2">
            <button onClick={() => setMobileLeaderboardOpen(true)} className="bg-black/60 border border-white/10 p-3 rounded-full backdrop-blur-md text-yellow-500 shadow-lg active:scale-90 transition-transform"><Trophy className="w-4 h-4" /></button>
            <button onClick={() => setMobileHudOpen(true)} className="bg-black/60 border border-white/10 p-3 rounded-full backdrop-blur-md text-emerald-400 shadow-lg active:scale-90 transition-transform"><Activity className="w-4 h-4" /></button>
            <Link href="/minder/enroll">
              <button className="bg-pink-600 border border-pink-400 p-3 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.5)] active:scale-90 transition-transform"><Zap className="w-4 h-4 text-white" /></button>
            </Link>
          </div>
        </div>
        <div className="flex justify-center pointer-events-auto w-full">
           <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-bold text-gray-400 hover:text-white uppercase tracking-widest bg-white/5 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md transition-colors">
             <Edit2 className="w-3 h-3" /> To edit profile, head to dashboard <ArrowUpRight className="w-3 h-3" />
           </Link>
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* MOBILE SLIDEOVERS */}
      {/* -------------------------------------------------------------------------- */}
      <AnimatePresence>
        {mobileHudOpen && (
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl md:hidden p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
               <div><h3 className="text-emerald-400 font-black tracking-widest text-2xl uppercase">LIVE FEED</h3></div>
               <button onClick={() => setMobileHudOpen(false)} className="bg-white/10 p-3 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-6">
               {feed.map(item => <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={item.id} className={`${item.color} text-xs font-bold border-l-2 border-current pl-4 py-3 bg-white/5 rounded-r backdrop-blur-md shadow-sm`}>{item.text}</motion.div>)}
            </div>
          </motion.div>
        )}
        
        {mobileLeaderboardOpen && (
          <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl md:hidden p-8 flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
               <div><h3 className="text-yellow-500 font-black tracking-widest text-2xl uppercase flex items-center gap-3"><Trophy className="w-6 h-6"/> TRENDING</h3></div>
               <button onClick={() => setMobileLeaderboardOpen(false)} className="bg-white/10 p-3 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 space-y-5">
               {leaderboard.length === 0 ? <p className="text-gray-500 text-sm font-bold text-center mt-20 uppercase tracking-widest">Compiling intel...</p> : leaderboard.map((leader, i) => (
                 <div key={leader.id} className="flex items-center gap-5 bg-gradient-to-r from-white/10 to-transparent p-5 rounded-[2rem] border border-white/10 shadow-lg">
                   <h1 className="text-4xl font-black text-gray-700 w-10">#{i + 1}</h1>
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

      {/* -------------------------------------------------------------------------- */}
      {/* DESKTOP SIDEBAR */}
      {/* -------------------------------------------------------------------------- */}
      <div className="hidden md:flex flex-col w-[450px] lg:w-[480px] bg-[#050505]/80 backdrop-blur-3xl border-r border-white/5 p-12 z-[100] h-full relative overflow-hidden shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-6 text-emerald-400 mb-10 pb-8 border-b border-white/10 relative z-10 pt-4">
          <div className="p-4 bg-emerald-900/20 rounded-2xl border border-emerald-500/30"><Activity className="w-8 h-8 animate-pulse" /></div>
          <div><h2 className="font-black tracking-widest uppercase text-2xl leading-none">GLOBAL FEED</h2><p className="text-[10px] text-emerald-600 font-bold mt-2 tracking-widest uppercase">Encrypted Uplink</p></div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-5 relative z-10">
          <AnimatePresence mode="popLayout">
            {feed.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className={`${item.color} font-bold border-l-2 border-current pl-5 py-4 bg-white/5 rounded-r shadow-md text-xs tracking-wide leading-relaxed`}>
                <span className="text-[9px] opacity-40 block mb-1 font-mono tracking-widest uppercase">Signal_Logged</span>
                {item.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="mt-8 border-t border-white/10 pt-8 relative z-10">
          <h3 className="text-yellow-500 font-black text-xs mb-5 tracking-widest flex items-center gap-3 uppercase"><Trophy className="w-4 h-4"/> TOP TARGETS</h3>
          <div className="space-y-3">
             {leaderboard.map((l, i) => (
               <div key={l.id} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-4">
                   <span className="text-gray-600 font-black text-xl">#{i+1}</span>
                   <span className="text-xs font-black text-white uppercase tracking-widest">{l.alias}</span>
                 </div>
                 <span className="text-xs text-green-500 font-black tracking-widest flex items-center gap-1.5"><Flame className="w-4 h-4"/> {l.score}</span>
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* THE MAIN VIRTUALIZED GRID */}
      {/* -------------------------------------------------------------------------- */}
      {/* FIXED: Increased pt-32 to push cards further down so they clear the absolute header */}
      <div className="flex-1 flex flex-col relative z-10 p-0 md:p-10 h-full overflow-hidden justify-center items-center pt-28 md:pt-32">
        
        {/* ====================================================================== */}
        {/* RESTRUCTURED DESKTOP HEADER (ABSOLUTE CENTER FIX)                      */}
        {/* ====================================================================== */}
        <div className="hidden md:flex justify-between items-start w-full absolute top-8 px-8 lg:px-12 z-[200] pointer-events-none">
           
           {/* Left Config */}
           <div className="flex flex-col gap-3 items-start pointer-events-auto">
             <Link href="/" className="group flex items-center gap-2 lg:gap-3 text-[10px] lg:text-xs font-black text-gray-400 hover:text-white transition-all uppercase tracking-widest bg-white/5 px-4 lg:px-6 py-3 rounded-full border border-white/10 backdrop-blur-md shadow-xl">
               <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK TO BASE
             </Link>
             <Link href="/dashboard" className="flex items-center gap-2 text-[9px] lg:text-[10px] font-bold text-gray-500 hover:text-pink-400 uppercase tracking-widest bg-black/40 px-4 py-2 rounded-full border border-white/5 backdrop-blur-md transition-colors ml-0 lg:ml-2">
               <Terminal className="w-3 h-3 shrink-0" /> 
               <span className="hidden xl:inline">To edit profile, head to dashboard</span>
               <span className="xl:hidden">Edit Profile</span> 
               <ArrowUpRight className="w-3 h-3 shrink-0" />
             </Link>
           </div>
           
           {/* Center Logo - Absolutely positioned to prevent squishing */}
           <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center mt-[-5px]">
             <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(219,39,119,0.5)] leading-none">
               MINDER<span className="text-pink-600">_</span>
             </h1>
             <p className="text-[8px] lg:text-[10px] font-black text-pink-500 uppercase tracking-[0.4em] bg-pink-900/20 px-3 lg:px-4 py-1.5 rounded-full border border-pink-500/20 mt-2 lg:mt-3 backdrop-blur-md shadow-inner">
               LAWSUIT PROTOCOL ACTIVE
             </p>
           </div>

           {/* Right Action */}
           <div className="flex flex-col items-end pointer-events-auto">
             <Link href="/minder/enroll">
               <button className="bg-pink-600 text-white text-[9px] lg:text-[10px] xl:text-xs font-black tracking-widest uppercase hover:bg-pink-500 transition-all shadow-[0_0_40px_rgba(219,39,119,0.4)] flex items-center justify-center gap-2 lg:gap-3 px-5 lg:px-8 py-3 lg:py-4 rounded-full border border-pink-400 active:scale-95">
                 <Zap className="w-4 h-4 fill-current" /> INJECT DOSSIER
               </button>
             </Link>
           </div>
        </div>

        {/* TINDER-GRADE VIEWPORT */}
        <div className="relative w-full h-[100dvh] md:h-[750px] md:max-w-[420px] flex items-center justify-center md:my-0 mt-0 pb-10 md:pb-0">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-6">
              <Radar className="w-16 h-16 animate-spin opacity-50 text-pink-600" />
              <div className="text-xs uppercase tracking-[0.5em] font-black animate-pulse">Decrypting Grid...</div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center w-[90%] md:w-full bg-[#050505] p-12 border border-white/10 rounded-3xl backdrop-blur-2xl shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
               <Crosshair className="w-16 h-16 mx-auto mb-6 text-gray-700 animate-pulse" />
               <p className="text-2xl uppercase tracking-widest font-black text-white relative z-10">GRID CLEARED.</p>
               <p className="text-[10px] text-gray-500 mt-4 uppercase tracking-widest font-bold">No active signals remaining.</p>
            </div>
          ) : (
            <div className="relative w-[95%] md:w-full h-[82dvh] md:h-full max-h-[800px] flex items-center justify-center">
              <AnimatePresence>
                {/* WE ONLY RENDER THE 3 CARDS IN THE DOM SLICE */}
                {visibleCards.map((card) => (
                  <SwipeCard 
                    key={card.target.id}
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
        .will-change-transform { will-change: transform; transform: translateZ(0); }
      `}</style>
    </div>
  );
}

// ============================================================================
// NATIVE SWIPE CARD (PREMIUM FRONTEND)
// ============================================================================
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, isOwnCard, existingSwipe, onExecuteSwipe }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  const { score: redFlagScore, loading: scoreLoading } = useHybridRedFlag(target);
  
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.04);
  const yOffset = isTop ? 0 : depthIndex * 16;
  
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

  const processPhysicalSwipe = async (direction) => {
    if (isOwnCard && direction !== 'dismiss') return;

    const exitX = direction === 'right' ? window.innerWidth + 200 : direction === 'left' ? -(window.innerWidth + 200) : 0;
    const exitY = direction === 'dismiss' ? -(window.innerHeight + 200) : 0;
    const exitRotate = direction === 'right' ? 30 : direction === 'left' ? -30 : 0;
    
    await controls.start({ 
      x: exitX, 
      y: exitY, 
      rotate: exitRotate, 
      opacity: 0, 
      transition: { duration: 0.25, ease: "easeOut" } 
    });
    
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
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  const safeBio = String(target?.bio || "");
  const safeAlias = String(target?.alias || "UNKNOWN");
  const safeInsta = String(target?.instagram_id || "");

  return (
    <motion.div
      style={{ x, rotate, scale, y: isOwnCard && isTop ? 0 : yOffset, zIndex: 50 - depthIndex }}
      animate={controls}
      drag={isTop && !isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { scale: 0.98 } : {}}
      className={`absolute inset-0 md:inset-auto md:w-full md:h-full rounded-[2.5rem] md:rounded-[3rem] bg-[#050505] shadow-2xl overflow-hidden flex flex-col will-change-transform ${!isTop && 'opacity-80'} ${isOwnCard && isTop ? 'border border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.2)]' : 'border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)]'}`}
    >
      <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none z-10 rounded-[2.5rem] md:rounded-[3rem]" />
      
      <img src={target?.image_url || ''} alt={safeAlias} draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none z-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent h-32 pointer-events-none z-0" />

      {isOwnCard && isTop && (
        <div className="absolute top-8 left-0 w-full bg-yellow-500 text-black py-2 font-black text-center tracking-[0.4em] text-[10px] uppercase z-30 shadow-2xl">
          <User className="w-4 h-4 inline mr-2 stroke-[3px]" /> MATCH_RECOGNIZED: THIS IS YOU
        </div>
      )}

      {existingSwipe && isTop && !isOwnCard && (
        <div className={`absolute top-8 left-0 w-full ${existingSwipe === 'SMASH' ? 'bg-green-500 text-black' : 'bg-red-600 text-white'} py-2 font-black text-center tracking-[0.3em] text-[9px] uppercase z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex justify-center items-center gap-2`}>
          {existingSwipe === 'SMASH' ? <Heart className="w-3 h-3 fill-current" /> : <ThumbsDown className="w-3 h-3 fill-current" />}
          PREVIOUSLY {existingSwipe}ED
        </div>
      )}

      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-28 left-6 md:left-10 border-8 border-green-500 text-green-400 font-black text-6xl md:text-7xl px-8 py-2 rounded-3xl rotate-[-15deg] uppercase z-20 bg-black/40 backdrop-blur-md shadow-[0_0_80px_rgba(34,197,94,0.6)] drop-shadow-[0_0_15px_rgba(34,197,94,1)] pointer-events-none">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-28 right-6 md:right-10 border-8 border-red-600 text-red-500 font-black text-6xl md:text-7xl px-8 py-2 rounded-3xl rotate-[15deg] uppercase z-20 bg-black/40 backdrop-blur-md shadow-[0_0_80px_rgba(220,38,38,0.6)] drop-shadow-[0_0_15px_rgba(220,38,38,1)] pointer-events-none">PASS</motion.div>
        </>
      )}

      <div className="mt-auto w-full p-6 md:p-8 flex flex-col gap-5 z-20 shrink-0 pointer-events-auto pb-10 md:pb-8 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="flex justify-between items-end gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tighter drop-shadow-2xl flex items-center gap-3 truncate">
              {safeAlias} <span className="text-2xl text-gray-400 font-normal">{target?.age || '?'}</span>
            </h2>
            
            {session ? (
              <div className="text-xs font-black text-white bg-white/10 backdrop-blur-xl w-fit px-4 py-2 mt-3 rounded-xl shadow-lg flex items-center gap-2 border border-white/20">
                <Terminal className="w-3 h-3 text-pink-500" /> @{safeInsta}
              </div>
            ) : (
              <div className="text-[9px] font-black text-red-400 bg-red-950/80 w-fit px-3 py-1.5 mt-3 border border-red-900/50 rounded-lg flex items-center gap-2 uppercase tracking-widest shadow-lg">
                <Lock className="w-3 h-3" /> SECURE COORDS
              </div>
            )}
          </div>

          <div className="text-center bg-[#050505] p-3 md:p-4 rounded-2xl border border-white/10 backdrop-blur-xl shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col items-center min-w-[75px] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            <div className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1 leading-none relative z-10">FLAG</div>
            <div className={`text-3xl font-black leading-none relative z-10 ${scoreLoading ? 'text-pink-500' : redFlagScore > 60 ? 'text-red-500 drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]' : redFlagScore > 30 ? 'text-yellow-500' : 'text-green-500'}`}>
              {scoreLoading ? <Activity className="w-6 h-6 animate-spin my-1" /> : `${redFlagScore}%`}
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-pink-600/50 rounded-full" />
          <p className="text-xs md:text-sm text-gray-300 font-medium leading-relaxed bg-white/5 p-4 md:p-5 rounded-2xl border border-white/10 shadow-inner italic line-clamp-3">
            {session ? `"${safeBio}"` : <span className="flex items-center opacity-50"><EyeOff className="w-4 h-4 text-red-500 mr-2" />{safeBio.split(' ').map((w, i) => i % 2 === 0 ? '████' : w).join(' ')}</span>}
          </p>
        </div>

        {isTop && (
          <div className="mt-2 flex gap-3" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button onClick={() => processPhysicalSwipe('dismiss')} className="w-full bg-yellow-500 text-black py-4 md:py-5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.4em] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-95 transition-transform"><X className="w-5 h-5 stroke-[4px]" /> DISMISS DOSSIER</button>
             ) : (
               <>
                 <button onClick={() => processPhysicalSwipe('left')} className="flex-1 bg-black border border-red-600/50 text-red-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-red-950/40 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"><ThumbsDown className="w-5 h-5"/> {existingSwipe === 'PASS' ? 'PASSED' : 'PASS'}</button>
                 <button onClick={() => processPhysicalSwipe('right')} className="flex-1 bg-black border border-green-500/50 text-green-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-green-950/40 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"><Heart className="w-5 h-5"/> {existingSwipe === 'SMASH' ? 'SMASHED' : 'SMASH'}</button>
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
// HYBRID AI HOOK 
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
        const timeoutId = setTimeout(() => controller.abort(), 6000); 

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
        // Fallback silently
      }

      let score = 10; 
      const bioLower = String(target.bio || "").toLowerCase();
      
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

      const safeId = String(target.id || "0");
      const variance = (safeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 15) - 7;
      let finalScore = Math.round(score + variance);
      finalScore = Math.min(Math.max(finalScore, 1), 99);

      if (isMounted) setData({ score: finalScore, loading: false });
    };

    calculateScore();

    return () => { isMounted = false; };
  }, [target]);

  return data;
}
