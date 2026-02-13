"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, useAnimation, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Crosshair, Lock, Activity, Terminal, ChevronRight, X, Check, ArrowRight
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

  // 1. SYSTEM INITIALIZATION & PAGINATION LOGIC
  const fetchTargets = useCallback(async (currentOffset = 0, currentSession = session) => {
    setFetchingMore(true);
    const limit = 10;
    
    let query = supabase
      .from('minder_targets')
      .select('*')
      .order('created_at', { ascending: false })
      .range(currentOffset, currentOffset + limit - 1);
    
    if (currentSession) {
      const { data: swiped } = await supabase
        .from('minder_swipes')
        .select('target_id')
        .eq('swiper_id', currentSession.user.id);
        
      const swipedIds = swiped?.map(s => s.target_id) || [];
      if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`).neq('user_id', currentSession.user.id);
      } else {
        query = query.neq('user_id', currentSession.user.id);
      }
    }

    const { data, error } = await query;
    
    if (data && data.length > 0) {
      // Reverse data so the newest in the batch is at the top of the visual stack
      setTargets(prev => [...data.reverse(), ...prev]);
      setPageOffset(currentOffset + limit);
    }
    
    setLoading(false);
    setFetchingMore(false);
  }, [session, supabase]);

  useEffect(() => {
    const initializeData = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      setSession(activeSession);
      await fetchTargets(0, activeSession);

      // LIVE RADAR LISTENER
// LIVE SYSTEM UPLINK (RADAR & NEW TARGETS)
      const channel = supabase.channel('minder-system')
        
        // Listener 1: The Radar Feed (Swipes)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_swipes' }, async (payload) => {
           const { data: t } = await supabase.from('minder_targets').select('alias').eq('id', payload.new.target_id).single();
           const alias = t?.alias || 'UNKNOWN';
           const action = payload.new.action;
           const color = action === 'SMASH' ? 'text-green-500' : action === 'PASS' ? 'text-red-500' : 'text-purple-500';
           
           setFeed(prev => [{ id: payload.new.id, text: `> AGENT_*** ${action}ED [${alias}]`, color }, ...prev].slice(0, 20));
        })
        
        // Listener 2: Grid Auto-Injector (New Targets)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_targets' }, (payload) => {
           const newTarget = payload.new;
           
           // SECURITY: Don't show the user their own newly created profile
           if (activeSession?.user?.id !== newTarget.user_id) {
               // Inject the new target at the BEGINNING of the array.
               // Because our physics stack maps the end of the array to the "Top" card,
               // putting this at the beginning slides it silently into the bottom of the deck.
               setTargets(prev => [newTarget, ...prev]);
               
               // Optional: Trigger a radar alert that new meat arrived
               setFeed(prev => [{ 
                 id: `new-${newTarget.id}`, 
                 text: `> NEW TARGET ENTERED GRID: [${newTarget.alias}]`, 
                 color: 'text-yellow-500' 
               }, ...prev].slice(0, 20));
           }
        })
        .subscribe();
  // 2. SWIPE MUTATION LOGIC
  const processSwipe = async (direction, targetId) => {
    if (!session) {
      triggerLoginWarning();
      return false; 
    }

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    
    // Remove the top card from state locally to ensure UI speed
    setTargets(prev => {
      const newDeck = [...prev];
      newDeck.pop(); // Remove the last item (which is visually the top card)
      
      // Auto-fetch trigger: If deck is getting low, fetch more silently
      if (newDeck.length < 3 && !fetchingMore) {
        fetchTargets(pageOffset, session);
      }
      return newDeck;
    });

    // Asynchronous database write
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
    <div className="min-h-screen bg-[#050510] text-white overflow-hidden flex flex-col md:flex-row font-mono">
      
      {/* GLOBAL BACKGROUND EFFECTS */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%]" />
      </div>

      {/* LEFT PANEL: LIVE RADAR */}
      <div className="hidden md:flex flex-col w-72 bg-black border-r border-green-900/30 p-4 z-10 shadow-[20px_0_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between mb-6 border-b border-green-900/50 pb-4">
          <div className="flex items-center gap-2 text-green-500">
            <Activity className="w-5 h-5 animate-pulse" />
            <h2 className="font-black tracking-widest uppercase text-sm">LIVE RADAR</h2>
          </div>
          <div className="text-[10px] text-gray-600 bg-gray-900 px-2 py-1 rounded">GLOBAL</div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 text-[11px] custom-scrollbar pr-2">
          <AnimatePresence>
            {feed.length === 0 && <div className="text-gray-600 animate-pulse font-bold mt-4">AWAITING SYSTEM UPLINK...</div>}
            {feed.map((item) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, x: -20, height: 0 }}
                animate={{ opacity: 1, x: 0, height: "auto" }}
                className={`${item.color} font-bold border-l-2 border-current pl-2 py-1 bg-white/5`}
              >
                {item.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="pt-4 border-t border-green-900/30 mt-4">
           <Link href="/minder/enroll">
             <button className="w-full py-3 bg-green-900/20 border border-green-500/50 text-green-500 text-xs font-black tracking-widest hover:bg-green-500 hover:text-black transition-all shadow-[0_0_15px_rgba(34,197,94,0.2)]">
               + ENTER THE GRID
             </button>
           </Link>
        </div>
      </div>

      {/* CENTER PANEL: THE GRID */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-4 w-full">
        
        {/* Mobile Header */}
        <div className="absolute top-6 left-6 right-6 flex justify-between items-center md:hidden">
           <h1 className="text-2xl font-black italic tracking-tighter">MINDER<span className="text-red-600">.LOL</span></h1>
           <Link href="/minder/enroll"><button className="text-[10px] bg-white text-black px-3 py-1.5 font-bold tracking-widest">ENTER GRID</button></Link>
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
        <div className="relative w-full max-w-[380px] h-[600px] flex items-center justify-center mt-10 md:mt-0">
          {loading ? (
            <div className="text-green-500 flex flex-col items-center gap-4 animate-pulse">
              <Terminal className="w-10 h-10" />
              <div className="text-xs uppercase tracking-widest font-bold">DECRYPTING TARGET SECTOR...</div>
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center text-gray-500 bg-black/50 p-8 border border-gray-800 rounded-xl backdrop-blur-sm">
               <Crosshair className="w-16 h-16 mx-auto mb-6 opacity-20" />
               <p className="text-sm uppercase tracking-widest font-bold text-gray-300">NO TARGETS REMAINING.</p>
               <p className="text-[10px] mt-2 text-gray-600 leading-relaxed">YOU HAVE CLEARED THIS SECTOR.<br/>CHECK BACK LATER OR ADD YOURSELF TO THE GRID.</p>
            </div>
          ) : (
            targets.map((target, index) => {
              // Calculate explicit positions to create the 3D stacking effect
              const isTop = index === targets.length - 1;
              const positionFromTop = targets.length - 1 - index;
              
              // Only render the top 3 cards to save DOM nodes
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

        {/* CONTROLS GUIDE */}
        {targets.length > 0 && (
          <div className="hidden md:flex items-center gap-8 mt-12 text-[10px] font-bold text-gray-600 tracking-widest">
            <span className="flex items-center gap-2"><div className="px-2 py-1 bg-gray-900 rounded border border-gray-800 text-white">←</div> PASS</span>
            <span className="flex items-center gap-2"><div className="px-2 py-1 bg-gray-900 rounded border border-gray-800 text-white">→</div> SMASH</span>
          </div>
        )}

        {/* MOBILE LIVE FEED COMPONENT */}
        <div className="md:hidden absolute bottom-6 w-[calc(100%-3rem)] max-w-[380px] bg-black/80 backdrop-blur-md border border-green-900/50 p-3 rounded-lg z-20">
          <div className="text-[10px] text-green-500 mb-2 font-bold flex items-center gap-2 tracking-widest"><Activity className="w-3 h-3 animate-pulse"/> SECURE UPLINK</div>
          <div className="h-5 overflow-hidden">
            <AnimatePresence mode="popLayout">
              {feed.length > 0 ? (
                <motion.div 
                  key={feed[0].id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-[10px] font-bold truncate text-gray-300"
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
    </div>
  );
}

// ------------------------------------------------------------------
// ADVANCED PHYSICS CARD COMPONENT (Memoized for High Performance)
// ------------------------------------------------------------------
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, onSwipe, onForceMatch }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  // 3D Visual Mathematics
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.05);
  const yOffset = isTop ? 0 : depthIndex * 15;
  
  // Dynamic Opacity Interpolation based on drag distance
  const smashOpacity = useTransform(x, [10, 100], [0, 1]);
  const passOpacity = useTransform(x, [-10, -100], [0, 1]);
  const glitchOffset = useTransform(x, [-150, 150], [-10, 10]);

  // Keyboard Navigation Bindings
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

  // Animation Execution Logic
  const triggerSwipeAnimation = async (direction) => {
    const isAllowed = await onSwipe(direction);
    if (!isAllowed) {
      // Security rejection: Snap back to center
      controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 300, damping: 20 } });
      return;
    }

    // Velocity-based exit trajectory
    const exitX = direction === 'right' ? 500 : -500;
    const exitRotate = direction === 'right' ? 20 : -20;
    
    await controls.start({
      x: exitX,
      rotate: exitRotate,
      opacity: 0,
      transition: { duration: 0.3, ease: "easeOut" }
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
      // Spring back physics if threshold not met
      controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 400, damping: 25 } });
    }
  };

  // Logic: Predictable random hash for Red Flag Score
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
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      whileTap={isTop ? { cursor: "grabbing", scale: 1.02 } : {}}
      className={`absolute w-full h-full rounded-2xl bg-[#0a0a0a] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden border ${isTop ? 'border-gray-700 cursor-grab hover:border-gray-500' : 'border-gray-900 pointer-events-none opacity-80'} transition-colors duration-300`}
    >
      {/* BACKGROUND IMAGE RENDERER */}
      <div 
        className="absolute inset-0 bg-cover bg-center" 
        style={{ backgroundImage: `url(${target.image_url})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      </div>

      {/* CHROMATIC ABERRATION DRAG EFFECTS */}
      {isTop && (
        <>
          <motion.div 
            className="absolute inset-0 bg-red-600 mix-blend-screen pointer-events-none"
            style={{ opacity: passOpacity, x: glitchOffset }}
          />
          <motion.div 
            className="absolute inset-0 bg-green-600 mix-blend-screen pointer-events-none"
            style={{ opacity: smashOpacity, x: glitchOffset }}
          />
        </>
      )}

      {/* INTERACTIVE STAMPS */}
      {isTop && (
        <>
          <motion.div 
            style={{ opacity: smashOpacity }} 
            className="absolute top-12 left-8 border-4 border-green-500 text-green-500 font-black text-5xl px-6 py-2 rounded-xl rotate-[-12deg] uppercase tracking-widest z-20 backdrop-blur-sm bg-black/20"
          >
            SMASH
          </motion.div>
          <motion.div 
            style={{ opacity: passOpacity }} 
            className="absolute top-12 right-8 border-4 border-red-500 text-red-500 font-black text-5xl px-6 py-2 rounded-xl rotate-[12deg] uppercase tracking-widest z-20 backdrop-blur-sm bg-black/20"
          >
            PASS
          </motion.div>
        </>
      )}

      {/* DATA HUD */}
      <div className="absolute bottom-0 w-full p-6 flex flex-col gap-3">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-black uppercase text-white drop-shadow-[0_2px_10px_rgba(0,0,0,1)] flex items-center gap-2">
              {target.alias} <span className="text-xl text-gray-400 font-normal">{target.age}</span>
            </h2>
            
            {/* CONDITIONAL INTELLIGENCE GATHERING */}
            {session ? (
              <div className="text-sm font-bold text-white bg-pink-600 w-fit px-3 py-1 mt-2 rounded shadow-[0_0_15px_rgba(219,39,119,0.5)] flex items-center gap-2">
                @{target.instagram_id}
              </div>
            ) : (
              <div className="text-[10px] font-bold text-red-400 bg-red-950/80 w-fit px-3 py-1 mt-2 border border-red-900 flex items-center gap-2 backdrop-blur-md">
                <Lock className="w-3 h-3" /> INTEL LOCKED. LOG IN.
              </div>
            )}
          </div>

          <div className="text-center bg-black/60 p-2 rounded border border-white/10 backdrop-blur-md">
            <div className="text-[9px] text-red-500 font-black uppercase tracking-widest">Red Flag</div>
            <div className="text-xl font-black text-white">{redFlagScore}%</div>
          </div>
        </div>

        {/* SECURE BIO RENDERER */}
        <p className="text-xs text-gray-200 mt-2 font-medium leading-relaxed bg-black/60 p-3 rounded border border-white/10 backdrop-blur-md">
          {session ? target.bio : target.bio.split(' ').map((word, i) => i % 3 === 0 ? '██████' : word).join(' ')}
        </p>

        {/* TACTICAL ACTION BUTTON */}
        {isTop && (
          <div className="mt-4" onPointerDown={(e) => e.stopPropagation()}>
             <button 
               onClick={() => onForceMatch()} 
               className="w-full bg-white text-black py-4 rounded-lg text-sm font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-3 group shadow-[0_0_20px_rgba(255,255,255,0.2)]"
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
