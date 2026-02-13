"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Crosshair, Lock, Activity, Terminal, ChevronRight, X, Check, 
  ArrowRight, ChevronLeft, Radar, Zap, User, Menu, Info, Layers
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
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [fetchingMore, setFetchingMore] = useState(false);

  // 1. REINFORCED DATA INGESTION ENGINE
  const fetchTargets = useCallback(async (currentOffset = 0, currentSession = session) => {
    setFetchingMore(true);
    const limit = 20; 
    
    try {
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
          
        if (swipeError) console.error("RADAR_ERROR: History link failed.");

        const swipedIds = swiped?.map(s => s.target_id).filter(id => !!id) || [];
        
        // CRITICAL FIX: Only apply the SQL exclusion if there is actually data to exclude
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
      console.error("🚨 SYSTEM_SYNC_FAILURE:", err.message);
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

      // LIVE SYSTEM UPLINK (GLOBAL FEED)
      const channel = supabase.channel('minder-system')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const alias = t?.alias || 'ANON_OBJ';
           const action = payload.new.action;
           const color = action === 'SMASH' ? 'text-green-500' : action === 'PASS' ? 'text-red-500' : 'text-purple-500';
           
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT_*** ${action}ED [${alias}]`, color }, ...prev].slice(0, 40));
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_targets' }, (payload) => {
           const newTarget = payload.new;
           setTargets(prev => [newTarget, ...prev]);
           setFeed(prev => [{ 
             id: `new-${newTarget.id}`, 
             text: `> NEW TARGET ENTERED GRID: [${newTarget.alias}]`, 
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
    <div className="min-h-screen bg-[#020205] text-white overflow-hidden flex flex-col md:flex-row font-mono relative">
      
      {/* --- BACKGROUND ENGINE --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden perspective-[1200px]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.6)_50%),linear-gradient(90deg,rgba(255,0,255,0.02),rgba(0,255,255,0.01),rgba(255,255,255,0.02))] bg-[length:100%_4px,3px_100%]" />
        <div className="absolute bottom-[-50%] left-[-50%] right-[-50%] h-[150%] bg-[linear-gradient(transparent_95%,rgba(219,39,119,0.15)_100%),linear-gradient(90deg,transparent_95%,rgba(219,39,119,0.15)_100%)] bg-[size:50px_50px] [transform:rotateX(80deg)] animate-[grid-move_12s_linear_infinite] opacity-40" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#020205]/80 to-[#020205] z-10" />
      </div>

      {/* --- MOBILE HUD TRIGGER --- */}
      <button 
        onClick={() => setMobileHudOpen(true)}
        className="md:hidden fixed top-6 right-6 z-[60] w-14 h-14 bg-pink-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(219,39,119,0.6)] border-2 border-pink-400 active:scale-90 transition-transform"
      >
        <Activity className="w-6 h-6 text-white animate-pulse" />
      </button>

      {/* --- MOBILE TACTICAL HUD OVERLAY --- */}
      <AnimatePresence>
        {mobileHudOpen && (
          <motion.div 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl md:hidden p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-10">
               <div>
                 <h3 className="text-pink-500 font-black tracking-[0.3em] uppercase text-xl">TACTICAL HUD</h3>
                 <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">Session: Operational</p>
               </div>
               <button onClick={() => setMobileHudOpen(false)} className="bg-white/10 p-3 rounded-full"><X className="w-8 h-8" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-10 custom-scrollbar pr-2">
               <div className="text-[10px] text-pink-700 font-black tracking-widest border-b border-pink-900/30 pb-3 flex items-center gap-2">
                 <Activity className="w-4 h-4" /> LIVE INTELLIGENCE FEED
               </div>
               {feed.map(item => (
                 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} key={item.id} className={`${item.color} text-[11px] font-bold border-l-2 border-current pl-4 py-2 bg-white/5 backdrop-blur-md rounded-r`}>
                   {item.text}
                 </motion.div>
               ))}
               {feed.length === 0 && <div className="text-gray-700 font-bold text-xs animate-pulse italic">SCANNING FOR NETWORK ACTIVITY...</div>}
            </div>

            <Link href="/minder/enroll" onClick={() => setMobileHudOpen(false)}>
              <button className="w-full py-6 bg-pink-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_40px_rgba(219,39,119,0.5)] flex items-center justify-center gap-4 text-sm border-b-4 border-pink-800">
                <Zap className="w-6 h-6 fill-current" /> INJECT NEW DOSSIER
              </button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DESKTOP NAVIGATION --- */}
      <nav className="fixed top-0 w-full p-4 md:p-8 flex justify-between items-center z-50">
        <Link href="/" className="group flex items-center gap-4 text-xs font-black text-gray-400 hover:text-white transition-all uppercase tracking-tighter bg-black/80 px-6 py-3 rounded-full border border-white/10 backdrop-blur-xl shadow-2xl pointer-events-auto">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" /> RETURN TO BASE
        </Link>
        
        <div className="hidden md:flex flex-col items-end gap-1 text-right">
           <h1 className="text-5xl font-black italic tracking-tighter drop-shadow-[0_0_30px_rgba(219,39,119,0.7)]">
             MINDER<span className="text-pink-600">_</span>
           </h1>
           <p className="text-[9px] font-bold text-pink-500 uppercase tracking-[0.2em] bg-pink-900/20 px-3 py-1 rounded-full border border-pink-500/30">
             COULDN'T ADD THE 'T', CAN'T AFFORD LAWSUITS.
           </p>
        </div>
      </nav>

      {/* --- PROMINENT GLOBAL FEED SIDEBAR (DESKTOP) --- */}
      <div className="hidden md:flex flex-col w-[450px] bg-black/90 backdrop-blur-3xl border-r border-pink-600/30 p-10 z-10 shadow-[50px_0_150px_rgba(0,0,0,1)] pt-40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-pink-500/5 via-transparent to-transparent animate-[scan_8s_linear_infinite] pointer-events-none" />

        <div className="flex items-center gap-5 text-pink-500 mb-10 pb-8 border-b border-pink-900/50 relative z-10">
          <div className="p-3 bg-pink-900/20 rounded-xl border border-pink-500/40 shadow-[0_0_20px_rgba(219,39,119,0.4)]">
            <Activity className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <h2 className="font-black tracking-tighter uppercase text-2xl leading-none">GLOBAL FEED</h2>
            <p className="text-xs text-pink-700 font-bold mt-2 tracking-[0.3em]">SECURE UPLINK // LIVE</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-4 relative z-10">
          <AnimatePresence mode="popLayout">
            {feed.length === 0 && <div className="text-gray-800 animate-pulse font-black text-sm tracking-[0.4em] mt-20 text-center">DECRYPTING GRID TRAFFIC...</div>}
            {feed.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -40, filter: "blur(10px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                className={`${item.color} font-black border-l-4 border-current pl-6 py-4 bg-gradient-to-r from-white/5 to-transparent rounded-r shadow-lg relative group overflow-hidden`}
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-current animate-pulse" />
                <span className="text-[10px] opacity-40 block mb-2 font-mono tracking-[0.4em] uppercase">Signal_Received</span>
                <span className="text-sm tracking-tight leading-tight">{item.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="pt-10 border-t border-pink-600/30 mt-8 relative z-10">
           <Link href="/minder/enroll">
             <button className="w-full py-6 bg-pink-600 text-white text-base font-black tracking-[0.2em] hover:bg-pink-500 transition-all shadow-[0_0_60px_rgba(219,39,119,0.5)] group flex items-center justify-center gap-4 rounded-2xl border-b-4 border-pink-800 active:border-b-0 active:translate-y-1">
               <Zap className="w-6 h-6 group-hover:rotate-12 transition-transform fill-current" /> INJECT NEW DOSSIER
             </button>
           </Link>
        </div>
      </div>

      {/* --- MAIN GRID CENTER --- */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-8 pt-32 md:pt-0">
        
        {/* Mobile Header Branding */}
        <div className="flex flex-col items-center justify-center md:hidden mb-12 w-full">
           <h1 className="text-5xl font-black italic tracking-tighter drop-shadow-[0_0_20px_rgba(219,39,119,0.8)]">
             MINDER<span className="text-pink-600">_</span>
           </h1>
           <p className="text-[10px] text-pink-400 font-black bg-pink-900/30 px-4 py-1 rounded-full border border-pink-500/20 mt-3 uppercase tracking-widest">
             LAWSUIT PROTOCOL ACTIVE
           </p>
        </div>

        <AnimatePresence>
          {loginWarning && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute top-32 bg-red-600 text-white px-10 py-6 rounded-2xl border-2 border-red-900 font-black uppercase tracking-[0.2em] z-[110] flex items-center gap-5 shadow-[0_0_80px_rgba(220,38,38,0.8)] text-sm"
            >
              <Lock className="w-7 h-7 animate-pulse" /> ACCESS DENIED: LOG IN REQUIRED
            </motion.div>
          )}
        </AnimatePresence>

        {/* TARGET VIEWPORT STACK */}
        <div className="relative w-full max-w-[450px] h-[650px] md:h-[750px] flex items-center justify-center">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-8">
              <div className="relative">
                <Radar className="w-24 h-24 animate-spin opacity-40 text-pink-600" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-12 h-12 border-2 border-pink-500 rounded-full animate-ping" />
                </div>
              </div>
              <div className="text-sm uppercase tracking-[0.5em] font-black animate-pulse">Scanning Grid...</div>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center w-full bg-black/80 p-16 border-2 border-pink-600/40 rounded-[3rem] backdrop-blur-3xl relative overflow-hidden shadow-[0_0_100px_rgba(219,39,119,0.2)] border-dashed group">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                  <div className="w-80 h-80 border-2 border-pink-500 rounded-full animate-ping" />
               </div>
               <Crosshair className="w-20 h-20 mx-auto mb-10 text-pink-500 opacity-60 group-hover:rotate-90 transition-transform duration-1000" />
               <p className="text-2xl uppercase tracking-tighter font-black text-white leading-none">NO BIOMETRICS DETECTED.</p>
               <p className="text-[11px] mt-8 text-pink-400 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
                 SECTOR NEUTRALIZED. GRID SYNC COMPLETE.<br/><br/>AWAITING FRESH INTEL DEPLOYMENTS.
               </p>
               <Link href="/minder/enroll" className="mt-12 block relative z-10">
                 <button className="text-xs bg-white text-black px-10 py-5 font-black tracking-[0.3em] rounded-xl flex items-center justify-center gap-4 mx-auto hover:bg-pink-600 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.4)] uppercase active:scale-95">
                   <Zap className="w-5 h-5 fill-current" /> REPOPULATE SECTOR
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
      </div>

      <style jsx global>{`
        @keyframes grid-move { 0% { background-position: 0 0; } 100% { background-position: 0 50px; } }
        @keyframes scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
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
  
  const rotate = useTransform(x, [-250, 250], [-15, 15]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.06);
  const opacity = useTransform(x, [-250, -150, 0, 150, 250], [0, 1, 1, 1, 0]);
  const yOffset = isTop ? 0 : depthIndex * 25;
  
  const smashOpacity = useTransform(x, [30, 180], [0, 1]);
  const passOpacity = useTransform(x, [-30, -180], [0, 1]);

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
      controls.start({ x: 0, transition: { type: "spring", stiffness: 450, damping: 15 } });
      return;
    }
    const exitX = direction === 'right' ? 1200 : direction === 'left' ? -1200 : 0;
    const exitY = direction === 'dismiss' ? -1500 : 0;
    const exitRotate = direction === 'right' ? 60 : direction === 'left' ? -60 : 0;
    await controls.start({ x: exitX, y: exitY, rotate: exitRotate, opacity: 0, transition: { duration: 0.6, ease: "circOut" } });
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return; 
    const threshold = 150;
    const velocityThreshold = 700;
    if (info.offset.x > threshold || info.velocity.x > velocityThreshold) await triggerSwipeAnimation('right');
    else if (info.offset.x < -threshold || info.velocity.x < -velocityThreshold) await triggerSwipeAnimation('left');
    else controls.start({ x: 0, transition: { type: "spring", stiffness: 500, damping: 20 } });
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
      dragElastic={1.2}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { cursor: "grabbing", scale: 1.04 } : {}}
      className={`absolute w-full h-full rounded-[3rem] bg-[#0a0a12] shadow-[0_50px_120px_rgba(0,0,0,1)] overflow-hidden border-2 ${isTop && !isOwnCard ? 'border-white/10 hover:border-white/20' : isOwnCard && isTop ? 'border-yellow-500 shadow-[0_0_60px_rgba(234,179,8,0.3)]' : 'border-white/5 opacity-40'} transition-all duration-500`}
    >
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${target.image_url})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#020205] via-[#020205]/30 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020205]/70 via-transparent to-transparent h-64" />
      </div>

      {isOwnCard && isTop && (
        <div className="absolute top-12 left-0 w-full bg-yellow-500 text-black py-3 font-black text-center tracking-[0.4em] text-[10px] uppercase z-30 shadow-2xl flex items-center justify-center gap-4">
          <User className="w-5 h-5 stroke-[3px]" /> MATCH_RECOGNIZED: THIS IS YOU
        </div>
      )}

      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-32 left-12 border-[12px] border-green-500 text-green-500 font-black text-8xl px-12 py-5 rounded-[2rem] rotate-[-15deg] uppercase z-20 backdrop-blur-md bg-black/30 shadow-[0_0_100px_rgba(34,197,94,0.8)] pointer-events-none">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-32 right-12 border-[12px] border-red-500 text-red-500 font-black text-8xl px-12 py-5 rounded-[2rem] rotate-[15deg] uppercase z-20 backdrop-blur-md bg-black/30 shadow-[0_0_100px_rgba(239,68,68,0.8)] pointer-events-none">PASS</motion.div>
          <motion.div className="absolute inset-0 bg-green-500/10 pointer-events-none mix-blend-screen" style={{ opacity: smashOpacity }} />
          <motion.div className="absolute inset-0 bg-red-500/10 pointer-events-none mix-blend-screen" style={{ opacity: passOpacity }} />
        </>
      )}

      <div className="absolute bottom-0 w-full p-10 flex flex-col gap-6 bg-gradient-to-t from-[#020205] via-[#020205]/95 to-transparent">
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0 pr-6">
            <h2 className="text-5xl font-black uppercase text-white tracking-tighter drop-shadow-2xl flex items-center gap-4 truncate">
              {target.alias} <span className="text-3xl text-gray-500 font-normal">{target.age}</span>
            </h2>
            
            {session ? (
              <div className="text-base font-black text-white bg-pink-600 w-fit px-5 py-2 mt-4 rounded-xl shadow-[0_0_40px_rgba(219,39,119,1)] flex items-center gap-4 border border-pink-400/50 group-hover:scale-105 transition-transform">
                <Terminal className="w-5 h-5" /> @{target.instagram_id}
              </div>
            ) : (
              <div className="text-xs font-black text-red-400 bg-red-950/80 w-fit px-5 py-2 mt-4 border border-red-900/60 rounded-xl flex items-center gap-4 backdrop-blur-2xl uppercase tracking-[0.2em]">
                <Lock className="w-4 h-4" /> COORDINATES LOCKED
              </div>
            )}
          </div>

          <div className="text-center bg-black/95 p-4 rounded-3xl border border-white/10 backdrop-blur-3xl shadow-3xl flex flex-col items-center min-w-[100px]">
            <div className="text-[9px] text-red-500 font-black uppercase tracking-[0.3em] mb-2 leading-none">RED_FLAG</div>
            <div className="text-4xl font-black text-white leading-none">{redFlagScore}%</div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-pink-600/50 rounded-full" />
          <p className="text-sm md:text-base text-gray-300 font-bold leading-relaxed bg-white/5 p-6 rounded-[1.5rem] border border-white/5 backdrop-blur-sm shadow-inner italic">
            {session ? `"${target.bio}"` : target.bio.split(' ').map((word, i) => i % 2 === 0 ? '████' : word).join(' ')}
          </p>
        </div>

        {isTop && (
          <div className="mt-6" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button 
                 onClick={() => triggerSwipeAnimation('dismiss')} 
                 className="w-full bg-yellow-500 text-black py-6 rounded-2xl text-xs font-black uppercase tracking-[0.5em] hover:bg-white transition-all flex items-center justify-center gap-5 shadow-3xl active:scale-95"
               >
                 <X className="w-6 h-6 stroke-[4px]" /> DISMISS DOSSIER
               </button>
             ) : (
               <button 
                 onClick={() => onForceMatch()} 
                 className="w-full bg-white text-black py-6 rounded-2xl text-xs font-black uppercase tracking-[0.5em] hover:bg-pink-600 hover:text-white transition-all flex items-center justify-center gap-5 shadow-[0_0_60px_rgba(255,255,255,0.4)] group active:scale-95 border-b-4 border-gray-300 hover:border-pink-800"
               >
                 <Crosshair className="w-6 h-6 group-hover:scale-150 transition-transform stroke-[4px]" /> INITIATE FORCE MATCH
               </button>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";
