"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Crosshair, Lock, Activity, Terminal, ChevronLeft, 
  Radar, Zap, User, X, Heart, ThumbsDown, EyeOff 
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================================
// THE EXCLUSIVE GRID ENGINE (v_FINAL - CRASH PROOF)
// ============================================================================
export default function MinderHub() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  
  const [session, setSession] = useState(null);
  const [targets, setTargets] = useState([]);
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(false);

  // --------------------------------------------------------------------------
  // 1. BULLETPROOF DATA INGESTION
  // --------------------------------------------------------------------------
  const loadGrid = useCallback(async () => {
    setLoading(true);
    try {
      // Get auth
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);

      // Fetch ALL targets safely
      const { data: allTargets, error: targetError } = await supabase
        .from('minder_targets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (targetError) throw targetError;

      let validDeck = allTargets || [];

      // Filter out previously swiped cards if logged in
      if (activeSession?.user?.id) {
        const { data: swipes } = await supabase
          .from('minder_swipes')
          .select('target_id')
          .eq('swiper_id', activeSession.user.id);
          
        const swipedSet = new Set(swipes?.map(s => s.target_id) || []);
        validDeck = validDeck.filter(t => !swipedSet.has(t?.id));
      }

      // Populate Grid
      setTargets(validDeck);

      // Populate Initial Feed Safely
      setFeed((allTargets || []).slice(0, 10).map(t => ({
        id: `init-${t?.id || Math.random()}`,
        text: `> SYSTEM LOGGED: [${t?.alias || 'UNKNOWN'}]`,
        color: 'text-gray-500'
      })));

    } catch (err) {
      console.error("GRID INITIALIZATION FAILED:", err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // --------------------------------------------------------------------------
  // 2. REALTIME UPLINK
  // --------------------------------------------------------------------------
  useEffect(() => {
    loadGrid();

    const channel = supabase.channel('minder_global_feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
         const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
         const action = payload.new.action;
         setFeed(prev => [{ 
           id: `rt-${Date.now()}`, 
           text: `> AGENT ${action}ED [${t?.alias || 'ANON'}]`, 
           color: action === 'SMASH' ? 'text-green-500' : 'text-red-500' 
         }, ...prev].slice(0, 20));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [loadGrid, supabase]);

  // --------------------------------------------------------------------------
  // 3. SECURE SWIPE HANDLER
  // --------------------------------------------------------------------------
  const handleSwipe = async (direction, targetId, isOwnCard) => {
    if (!session && !isOwnCard) {
      setAuthModal(true);
      return;
    }

    const swipedTarget = targets.find(t => t.id === targetId);
    
    // 1. Optimistic UI: Instantly remove card from screen
    setTargets(prev => prev.filter(t => t.id !== targetId));

    if (isOwnCard || direction === 'dismiss') return;

    const action = direction === 'right' ? 'SMASH' : 'PASS';

    // 2. Inject to local feed instantly
    setFeed(prev => [{ 
      id: `opt-${Date.now()}`, 
      text: `> YOU ${action}ED [${swipedTarget?.alias || 'TARGET'}]`, 
      color: action === 'SMASH' ? 'text-green-500' : 'text-red-500' 
    }, ...prev].slice(0, 20));

    // 3. Save to database
    try {
      await supabase.from('minder_swipes').insert({
        swiper_id: session.user.id,
        target_id: targetId,
        action: action
      });
    } catch (e) {
      console.error("SWIPE SAVE FAILED:", e);
    }
  };

  return (
    <div className="h-[100dvh] bg-[#050505] text-white overflow-hidden flex font-mono relative select-none">
      
      {/* PREMIUM BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0)_50%,rgba(0,0,0,0.8)_50%),linear-gradient(90deg,rgba(255,0,255,0.01),rgba(0,255,255,0.01))] bg-[length:100%_4px,3px_100%]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#050505]/90 to-[#050505] z-10" />
      </div>

      {/* SECURE AUTH MODAL */}
      <AnimatePresence>
        {authModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-sm bg-[#0a0a0c] border border-red-600/30 rounded-3xl p-8 shadow-[0_0_80px_rgba(220,38,38,0.2)] flex flex-col items-center text-center">
              <Lock className="w-12 h-12 text-red-500 mb-6 animate-pulse" />
              <h2 className="text-2xl font-black uppercase text-white mb-2">ACCESS DENIED</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-8 leading-relaxed">System requires authentication to log biometric decisions.</p>
              <Link href="/login?next=/minder" className="w-full">
                <button className="w-full py-4 bg-red-600/90 text-white font-black uppercase tracking-widest rounded-xl hover:bg-red-500 transition-all flex items-center justify-center gap-3"><User className="w-4 h-4" /> LOGIN / ENROLL</button>
              </Link>
              <button onClick={() => setAuthModal(false)} className="mt-6 text-[10px] text-gray-500 uppercase font-black hover:text-white transition-colors">DISMISS WARNING</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DESKTOP EXCLUSIVE SIDEBAR */}
      <div className="hidden md:flex flex-col w-[400px] lg:w-[450px] bg-black/40 backdrop-blur-2xl border-r border-white/5 p-10 z-[100] h-full shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4 text-pink-500 mb-10 pb-6 border-b border-white/10 mt-6">
          <Activity className="w-8 h-8 animate-pulse" />
          <div><h2 className="font-black tracking-widest uppercase text-xl">LIVE UPLINK</h2><p className="text-[10px] text-gray-500 tracking-[0.3em] uppercase mt-1">Encrypted Feed</p></div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-4">
          <AnimatePresence mode="popLayout">
            {feed.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className={`${item.color} font-black border-l-2 border-current pl-4 py-3 bg-white/5 rounded-r text-[11px] tracking-widest shadow-sm`}>{item.text}</motion.div>
            ))}
          </AnimatePresence>
        </div>
        <Link href="/minder/enroll" className="mt-8">
           <button className="w-full py-5 bg-pink-600 text-white text-xs font-black tracking-widest hover:bg-pink-500 transition-all rounded-xl flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(219,39,119,0.3)]"><Zap className="w-4 h-4 fill-current" /> INJECT NEW DOSSIER</button>
        </Link>
      </div>

      {/* MAIN EXCLUSIVE GRID CENTER */}
      <div className="flex-1 flex flex-col relative z-10 p-0 md:p-8 h-full w-full justify-center items-center">
        
        {/* RESPONSIVE TOP NAV */}
        <div className="absolute top-0 left-0 w-full p-6 md:px-10 md:top-6 flex justify-between items-start z-[200]">
           <Link href="/" className="flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-white transition-all uppercase tracking-widest bg-white/5 px-4 py-2.5 rounded-full border border-white/10 backdrop-blur-md">
             <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">BACK TO BASE</span>
           </Link>
           <div className="flex flex-col items-end pointer-events-none">
             <h1 className="text-3xl md:text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_30px_rgba(219,39,119,0.5)]">MINDER<span className="text-pink-600">_</span></h1>
             <p className="text-[8px] md:text-[9px] font-black text-pink-500 uppercase tracking-[0.3em] bg-pink-900/20 px-3 py-1 rounded-full border border-pink-500/20 mt-2 backdrop-blur-md">LAWSUIT PROTOCOL</p>
           </div>
        </div>

        {/* THE TINDER-GRADE TARGET VIEWPORT */}
        <div className="relative w-full h-[100dvh] md:h-[750px] md:max-w-[420px] flex items-center justify-center md:my-0 mt-8">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-6">
              <Radar className="w-16 h-16 animate-spin opacity-50 text-pink-600" />
              <div className="text-xs uppercase tracking-[0.5em] font-black animate-pulse">Decrypting Grid...</div>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center w-[90%] md:w-full bg-black/60 p-10 border border-white/5 rounded-3xl backdrop-blur-xl shadow-2xl">
               <Crosshair className="w-12 h-12 mx-auto mb-6 text-gray-600" />
               <p className="text-xl uppercase tracking-widest font-black text-white">GRID CLEARED.</p>
               <p className="text-[10px] mt-4 text-gray-400 font-bold uppercase tracking-widest leading-relaxed">No active signals in sector.</p>
               <button onClick={loadGrid} className="mt-8 w-full bg-white/10 text-white px-6 py-4 font-black tracking-widest rounded-xl text-xs uppercase hover:bg-white/20 transition-all"><Activity className="w-4 h-4 inline mr-2" /> RESCAN SECTOR</button>
               <Link href="/minder/enroll" className="mt-4 block"><button className="w-full bg-pink-600 text-white px-6 py-4 font-black tracking-widest rounded-xl text-xs uppercase hover:bg-pink-500 transition-all"><Zap className="w-4 h-4 inline mr-2 fill-current" /> INJECT PROFILE</button></Link>
            </div>
          ) : (
            <div className="relative w-[95%] md:w-full h-[75dvh] md:h-[90%] max-h-[800px] flex items-center justify-center">
              <AnimatePresence>
                {/* SAFE ARRAY RENDERING: Map through targets safely */}
                {targets.slice(0, 3).map((target, index) => {
                  // The LAST item in the sliced array is visually on TOP
                  const isTop = index === Math.min(targets.length - 1, 2);
                  const isOwnCard = session?.user?.id === target?.user_id;
                  
                  return (
                    <SwipeCard 
                      key={target?.id || index} 
                      target={target} 
                      isTop={isTop} 
                      index={index}
                      session={session}
                      isOwnCard={isOwnCard}
                      onSwipe={(dir) => handleSwipe(dir, target?.id, isOwnCard)}
                    />
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      
      {/* Mobile Action Button Fallback */}
      <div className="md:hidden fixed bottom-6 left-0 w-full px-6 z-[150] flex justify-center">
        <Link href="/minder/enroll" className="w-full max-w-[300px]">
           <button className="w-full bg-black/80 border border-white/10 backdrop-blur-xl text-white py-4 rounded-full text-[10px] font-black uppercase tracking-[0.3em] flex justify-center items-center gap-2 shadow-2xl">
             <Zap className="w-4 h-4 text-pink-500 fill-current" /> INJECT DOSSIER
           </button>
        </Link>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ============================================================================
// EXCLUSIVE SWIPE CARD COMPONENT
// ============================================================================
const SwipeCard = React.memo(({ target, isTop, index, session, isOwnCard, onSwipe }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // Safe algorithm wrapper prevents null crashes
  const redFlagScore = useSafeRedFlag(target);
  
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  // Calculate depth scale (index 2 is top = scale 1, index 0 is bottom = scale 0.9)
  const scale = isTop ? 1 : 0.95 - ((2 - index) * 0.05);
  const yOffset = isTop ? 0 : (2 - index) * -20;
  
  const smashOpacity = useTransform(x, [50, 150], [0, 1]);
  const passOpacity = useTransform(x, [-50, -150], [0, 1]);

  const triggerAnimation = async (dir) => {
    if (isOwnCard && dir !== 'dismiss') return;
    const exitX = dir === 'right' ? window.innerWidth : dir === 'left' ? -window.innerWidth : 0;
    const exitY = dir === 'dismiss' ? -window.innerHeight : 0;
    const exitRotate = dir === 'right' ? 30 : dir === 'left' ? -30 : 0;
    
    await controls.start({ x: exitX, y: exitY, rotate: exitRotate, opacity: 0, transition: { duration: 0.3, ease: "circOut" } });
    onSwipe(dir);
  };

  const handleDragEnd = async (e, info) => {
    if (isOwnCard) return; 
    const threshold = 100;
    const velocity = 500;
    
    if (info.offset.x > threshold || info.velocity.x > velocity) {
      await triggerAnimation('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      await triggerAnimation('left');
    } else {
      controls.start({ x: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  // Safe variables
  const imgUrl = target?.image_url || '';
  const alias = target?.alias || 'UNKNOWN';
  const age = target?.age || '?';
  const insta = target?.instagram_id || '';
  const bio = target?.bio || 'No intel provided.';

  return (
    <motion.div
      style={{ x, rotate, scale, y: isOwnCard && isTop ? 0 : yOffset, zIndex: index * 10 }}
      animate={controls}
      drag={isTop && !isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { scale: 0.98 } : {}}
      className={`absolute w-full h-full rounded-[2rem] bg-[#0a0a0c] shadow-[0_30px_60px_rgba(0,0,0,0.8)] overflow-hidden border border-white/5 flex flex-col will-change-transform touch-none ${!isTop && 'opacity-60'} ${isOwnCard && isTop && 'border-yellow-500/50 shadow-[0_0_40px_rgba(234,179,8,0.2)]'}`}
    >
      {/* IMAGE */}
      <img src={imgUrl} alt={alias} draggable="false" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent pointer-events-none" />

      {/* OWN CARD WARNING */}
      {isOwnCard && isTop && (
        <div className="absolute top-6 left-0 w-full bg-yellow-500 text-black py-2 font-black text-center tracking-widest text-[9px] uppercase z-30 shadow-lg flex items-center justify-center gap-2">
          <User className="w-3 h-3 stroke-[3px]" /> MATCH: YOU
        </div>
      )}

      {/* OVERLAYS */}
      {isTop && !isOwnCard && (
        <>
          <motion.div style={{ opacity: smashOpacity }} className="absolute top-16 left-6 border-4 border-green-500 text-green-500 font-black text-4xl px-6 py-2 rounded-xl rotate-[-15deg] uppercase z-20 bg-black/60 backdrop-blur-md shadow-2xl pointer-events-none">SMASH</motion.div>
          <motion.div style={{ opacity: passOpacity }} className="absolute top-16 right-6 border-4 border-red-500 text-red-500 font-black text-4xl px-6 py-2 rounded-xl rotate-[15deg] uppercase z-20 bg-black/60 backdrop-blur-md shadow-2xl pointer-events-none">PASS</motion.div>
        </>
      )}

      {/* DATA HUD */}
      <div className="mt-auto w-full p-6 flex flex-col gap-4 z-10 shrink-0 pointer-events-auto bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pb-10 md:pb-6">
        <div className="flex justify-between items-end gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl md:text-4xl font-black uppercase text-white tracking-tighter drop-shadow-lg flex items-center gap-2 truncate">
              {alias} <span className="text-xl text-gray-500 font-normal">{age}</span>
            </h2>
            
            {session ? (
              <div className="text-[10px] md:text-xs font-black text-white bg-white/10 backdrop-blur-md w-fit px-4 py-2 mt-2 rounded-lg border border-white/10 flex items-center gap-2">
                <Terminal className="w-3 h-3" /> @{insta}
              </div>
            ) : (
              <div className="text-[9px] font-black text-red-400 bg-red-950/80 w-fit px-3 py-1.5 mt-2 border border-red-900/50 rounded-md flex items-center gap-2 uppercase tracking-widest">
                <Lock className="w-3 h-3" /> ENCRYPTED
              </div>
            )}
          </div>

          <div className="text-center bg-black/80 p-3 rounded-2xl border border-white/5 backdrop-blur-xl shadow-xl min-w-[70px]">
            <div className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-1 leading-none">FLAG_SCORE</div>
            <div className={`text-2xl font-black leading-none tracking-tighter ${redFlagScore > 60 ? 'text-red-500' : redFlagScore > 30 ? 'text-yellow-500' : 'text-green-500'}`}>{redFlagScore}%</div>
          </div>
        </div>

        <p className="text-xs text-gray-300 font-medium leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 shadow-inner italic line-clamp-3">
          {session ? `"${bio}"` : <span className="flex items-center opacity-50"><EyeOff className="w-3 h-3 text-red-500 mr-2" />{bio.split(' ').map((w, i) => i % 2 === 0 ? '██' : w).join(' ')}</span>}
        </p>

        {/* BUTTONS */}
        {isTop && (
          <div className="mt-2 flex gap-3" onPointerDown={(e) => e.stopPropagation()}>
             {isOwnCard ? (
               <button onClick={() => triggerAnimation('dismiss')} className="w-full bg-white/10 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-all"><X className="w-4 h-4" /> DISMISS PROFILE</button>
             ) : (
               <>
                 <button onClick={() => triggerAnimation('left')} className="flex-1 bg-black/60 border border-red-500/30 text-red-500 font-black text-xs py-4 rounded-xl hover:bg-red-900/50 transition-all flex items-center justify-center gap-2"><ThumbsDown className="w-4 h-4"/> PASS</button>
                 <button onClick={() => triggerAnimation('right')} className="flex-1 bg-black/60 border border-green-500/30 text-green-500 font-black text-xs py-4 rounded-xl hover:bg-green-900/50 transition-all flex items-center justify-center gap-2"><Heart className="w-4 h-4"/> SMASH</button>
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
// SAFE FALLBACK RED FLAG ALGORITHM
// ============================================================================
function useSafeRedFlag(target) {
  return useMemo(() => {
    if (!target) return 0;
    
    let score = 0;
    const bio = target?.bio?.toLowerCase() || '';
    
    if (bio.length < 15) score += 20; 
    if (bio.length > 250) score += 15;
    
    const flags = ['drama', 'toxic', 'alpha', 'boss', 'crypto', 'nft', 'sugar', 'venmo', 'cashapp', 'nice guy'];
    score += flags.filter(kw => bio.includes(kw)).length * 15;
    
    const base = Math.min(Math.max(score, 5), 99);
    const safeIdStr = String(target?.id || 'default');
    const hash = safeIdStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 15;
    
    return Math.min(Math.max(base + hash, 1), 99);
  }, [target]);
}
