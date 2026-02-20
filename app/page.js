"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  Lock, Activity, Terminal, ChevronLeft, Radar, Zap, User, X, 
  Crosshair, Check, EyeOff, Trophy, Flame, ArrowUpRight, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================================
// THE FLAGSHIP ENGINE (v15.0 - CRASH PROOF & B2C SAAS UI)
// ============================================================================
export default function MinderHub() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [feed, setFeed] = useState([]);
  const [userSwipes, setUserSwipes] = useState(new Map());
  const [loading, setLoading] = useState(true);

  // 1. DATA INGESTION
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

      setUserSwipes(swipeMap);
      setProfiles(unswipedDeck);
      setCurrentIndex(0);
    } catch (err) {
      console.error("DATA LAYER FAILED:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 2. SYSTEM BOOT
  useEffect(() => {
    let channel;
    const boot = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      await loadBatch(activeSession);

      channel = supabase.channel(`minder_live_${Date.now()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           if (payload.new.swiper_id === activeSession?.user?.id) return;
           const action = payload.new.action === 'SMASH' ? 'ENDORSED' : 'REDACTED';
           setFeed(prev => [{ id: payload.new.id, text: `> ASSET ${action} BY EXTERNAL NODE`, color: action === 'ENDORSED' ? 'text-green-500' : 'text-gray-500' }, ...prev].slice(0, 5));
        }).subscribe();
    };
    boot();
    return () => { if (channel) supabase.removeChannel(channel); };
  }, [supabase, loadBatch]);

  // 3. SWIPE HANDLER
  const executeSwipe = useCallback((direction, targetId, isOwnCard) => {
    if (!session && !isOwnCard) return router.push("/login?next=/minder");
    
    setCurrentIndex(prev => (prev + 1 >= profiles.length ? 0 : prev + 1));
    if (isOwnCard || direction === 'dismiss') return;

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    setUserSwipes(prev => new Map(prev).set(targetId, action));
    
    supabase.from('minder_swipes').upsert(
      { swiper_id: session.user.id, target_id: targetId, action },
      { onConflict: 'swiper_id, target_id' }
    );
  }, [profiles.length, session, supabase, router]);

  const visibleCards = profiles.slice(currentIndex, currentIndex + 3).map((target, idx) => ({
    target,
    relativeIndex: idx, 
    isTop: idx === 0
  })).reverse(); 

  return (
    <div className="h-[100dvh] bg-[#020202] text-white flex flex-col font-sans overflow-hidden">
      
      {/* 60FPS BG LAYER */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent z-10" />
      </div>

      {/* --- RE-ARCHITECTED HEADER (FLEX FLOW, NO COLLISIONS) --- */}
      <header className="w-full shrink-0 flex flex-col md:flex-row justify-between items-center px-6 py-6 z-50 border-b border-white/5 bg-[#020202]/80 backdrop-blur-xl relative">
        
        {/* Left Side Navigation */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start mb-4 md:mb-0">
          <Link href="/" className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
            <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to Base</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 bg-black/40 border border-white/5 px-4 py-2.5 rounded-full text-[10px] text-gray-400 uppercase tracking-widest hover:text-white transition-colors">
            <Terminal className="w-3 h-3" /> <span className="hidden lg:inline">Update Biometrics</span> <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Center Logo */}
        <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none hidden md:flex">
          <h1 className="text-4xl lg:text-5xl font-black italic tracking-tighter text-white">MINDER<span className="text-pink-600">_</span></h1>
        </div>

        {/* Right Side Actions */}
        <div className="w-full md:w-auto flex justify-end">
          <Link href="/minder/enroll">
            <button className="bg-white text-black text-[10px] font-black tracking-widest uppercase hover:scale-105 transition-transform px-6 py-3 rounded-full active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2">
              <Zap className="w-4 h-4 fill-current" /> Inject Dossier
            </button>
          </Link>
        </div>
      </header>

      {/* --- LIVE TELEMETRY FEED (DESKTOP) --- */}
      <div className="absolute left-6 top-32 hidden xl:flex flex-col gap-3 z-40 w-64">
        <div className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity className="w-3 h-3 animate-pulse" /> Live Telemetry</div>
        {feed.map((f) => (
           <div key={f.id} className={`${f.color} text-[9px] font-mono bg-black/40 border border-white/5 p-3 rounded-lg backdrop-blur-md`}>{f.text}</div>
        ))}
      </div>

      {/* --- THE MAIN VIEWPORT --- */}
      <main className="flex-1 relative flex items-center justify-center w-full p-4 md:p-10 z-10 overflow-hidden">
        <div className="relative w-[95%] md:w-[400px] h-[75vh] md:h-[650px] flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4 text-pink-500">
               <Radar className="w-12 h-12 animate-spin opacity-50" />
               <div className="text-[10px] font-mono uppercase tracking-[0.3em] animate-pulse">Decrypting Matrix...</div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center w-full bg-[#050505] p-10 border border-white/10 rounded-[2rem] shadow-2xl">
               <Crosshair className="w-12 h-12 mx-auto mb-4 text-gray-700 animate-pulse" />
               <p className="text-xl uppercase tracking-widest font-black text-white">GRID CLEARED.</p>
               <p className="text-[10px] text-gray-500 mt-2 uppercase tracking-widest">No active candidates remaining.</p>
            </div>
          ) : (
            <AnimatePresence>
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
          )}
        </div>
      </main>

      {/* --- DISCLAIMER WATERMARK --- */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none opacity-40">
        <p className="text-[8px] font-mono text-white uppercase tracking-widest bg-black/80 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-emerald-500" /> ENTERTAINMENT EXPERIENCE. 18+ ONLY.
        </p>
      </div>

    </div>
  );
}

// ============================================================================
// MEMOIZED 60FPS SWIPE CARD (B2C SAAS DESIGN)
// ============================================================================
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, isOwnCard, existingSwipe, onExecuteSwipe }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.05);
  const yOffset = isTop ? 0 : depthIndex * 20;
  
  // FIX: Added optional chaining to prevent TypeError crashes if target unmounts oddly
  const { score: redFlagScore } = useHybridRedFlag(target?.bio || "", target?.id || "0");

  const processSwipe = async (direction) => {
    if (isOwnCard && direction !== 'dismiss') return;
    const exitX = direction === 'right' ? window.innerWidth : direction === 'left' ? -window.innerWidth : 0;
    await controls.start({ x: exitX, opacity: 0, transition: { duration: 0.25, ease: "easeOut" } });
    onExecuteSwipe(direction);
  };

  return (
    <motion.div
      style={{ x, rotate, scale, y: yOffset, zIndex: 50 - depthIndex }}
      animate={controls}
      drag={isTop && !isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, info) => {
        if (Math.abs(info.offset.x) > 100 || Math.abs(info.velocity.x) > 500) {
          processSwipe(info.offset.x > 0 ? 'right' : 'left');
        } else {
          controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
        }
      }}
      className={`absolute inset-0 w-full h-full rounded-[2.5rem] bg-[#050505] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col will-change-transform border border-white/10 ${!isTop && 'opacity-60 pointer-events-none'}`}
    >
      <img src={target?.image_url} alt={target?.alias} className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" draggable={false} />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent pointer-events-none" />

      {/* SAAS STYLE "PREVIOUSLY PASSED" BADGE */}
      {existingSwipe && isTop && !isOwnCard && (
        <div className={`absolute top-6 right-6 px-4 py-2 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest z-30 shadow-2xl backdrop-blur-md flex items-center gap-2 ${existingSwipe === 'SMASH' ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
          {existingSwipe === 'SMASH' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          [ RECORD: {existingSwipe === 'SMASH' ? 'ENDORSED' : 'REDACTED'} ]
        </div>
      )}

      {isOwnCard && isTop && (
        <div className="absolute top-6 right-6 bg-yellow-500 text-black px-4 py-2 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest z-30 shadow-2xl">
          <User className="w-3 h-3 inline mr-2" /> YOUR DOSSIER
        </div>
      )}

      {/* SWIPE OVERLAYS */}
      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: useTransform(x, [50, 150], [0, 1]) }} className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-green-500 text-green-400 font-black text-4xl px-6 py-2 rounded-2xl rotate-[-10deg] uppercase z-20 bg-black/60 backdrop-blur-md pointer-events-none tracking-widest">ENDORSE</motion.div>
          <motion.div style={{ opacity: useTransform(x, [-50, -150], [0, 1]) }} className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-red-600 text-red-500 font-black text-4xl px-6 py-2 rounded-2xl rotate-[10deg] uppercase z-20 bg-black/60 backdrop-blur-md pointer-events-none tracking-widest">REDACT</motion.div>
        </>
      )}

      {/* CONTENT BLOCK */}
      <div className="mt-auto w-full p-6 md:p-8 flex flex-col gap-4 z-20 bg-gradient-to-t from-black via-black/95 to-transparent pb-10">
        
        <div className="flex justify-between items-end">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-3xl md:text-4xl font-black uppercase text-white tracking-tighter truncate">
              {target?.alias} <span className="text-xl text-gray-500 font-normal ml-2">{target?.age}</span>
            </h2>
            
            {session ? (
              <div className="text-[10px] font-mono text-gray-400 bg-white/5 w-fit px-3 py-1.5 mt-3 rounded-md border border-white/10 flex items-center gap-2">
                <Terminal className="w-3 h-3 text-emerald-500" /> @{target?.instagram_id}
              </div>
            ) : (
              <div className="text-[9px] font-black text-red-400 bg-red-950/80 w-fit px-3 py-1.5 mt-3 border border-red-900/50 rounded-md flex items-center gap-2 uppercase tracking-widest">
                <Lock className="w-3 h-3" /> ENCRYPTED
              </div>
            )}
          </div>

          <div className="text-center bg-[#050505] p-3 rounded-xl border border-white/10 shadow-2xl min-w-[60px]">
            <div className="text-[7px] text-gray-500 font-mono uppercase tracking-widest mb-1">RISK_VAR</div>
            <div className={`text-xl font-black ${redFlagScore > 60 ? 'text-red-500' : redFlagScore > 30 ? 'text-yellow-500' : 'text-green-500'}`}>
              {redFlagScore}%
            </div>
          </div>
        </div>

        <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5 mt-2">
          <p className="text-xs text-gray-300 font-medium leading-relaxed italic line-clamp-3">
            {session ? `"${target?.bio}"` : <span className="flex items-center opacity-50"><EyeOff className="w-4 h-4 text-red-500 mr-2" /> DATA REDACTED</span>}
          </p>
        </div>

        {isTop && (
          <div className="mt-2 flex gap-3">
             {isOwnCard ? (
               <button onClick={() => processSwipe('dismiss')} className="w-full bg-white text-black py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl">Close Preview</button>
             ) : (
               <>
                 <button onClick={() => processSwipe('left')} className="flex-1 bg-[#050505] border border-white/10 text-gray-400 hover:text-red-500 hover:border-red-500/50 font-black py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase"><X className="w-4 h-4"/> Redact</button>
                 <button onClick={() => processSwipe('right')} className="flex-1 bg-white text-black hover:bg-emerald-500 hover:text-white font-black py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-[10px] tracking-widest uppercase"><Check className="w-4 h-4"/> Endorse</button>
               </>
             )}
          </div>
        )}
      </div>
    </motion.div>
  );
});

SwipeCard.displayName = "SwipeCard";

// AI ENGINE (Crash-Proofed)
function useHybridRedFlag(bioStr, targetId) {
  return React.useMemo(() => {
    let score = 10; 
    const bioLower = String(bioStr).toLowerCase();
    const wordCount = bioLower.split(/\s+/).length;
    
    if (wordCount < 4) score += 20; 
    if (wordCount > 60) score += 10; 
    if (/(no drama|drama free|toxic|fake people|trust issues)/.test(bioLower)) score += 25;
    if (/(cashapp|venmo|paypal|spoil me|sugar|generous)/.test(bioLower)) score += 40;
    if (/(alpha|sigma|king|queen|boss bitch)/.test(bioLower)) score += 15;

    const safeId = String(targetId);
    const variance = (safeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 15) - 7;
    return { score: Math.min(Math.max(Math.round(score + variance), 1), 99) };
  }, [bioStr, targetId]);
}
