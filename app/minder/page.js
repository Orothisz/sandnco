"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useAnimation, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  Lock, Activity, Terminal, ChevronLeft, Radar, Zap, User, X, 
  Crosshair, Heart, ThumbsDown, EyeOff, Trophy, Flame, ArrowUpRight, Edit2,
  ArrowLeft, ArrowRight
} from "lucide-react";
import Link from "next/link";

// ============================================================================
// MOBILE-FIRST INSTANT RENDER ENGINE (v17.0 - EXCITING ANIMATIONS)
// ============================================================================

// Device detection
const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export default function MinderHub() {
  const supabase = createClientComponentClient();
  const isMobile = useRef(isMobileDevice());
  
  // CORE STATE
  const [session, setSession] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSwipes, setUserSwipes] = useState(new Map());
  
  // DEFERRED STATE
  const [feed, setFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardUpdating, setLeaderboardUpdating] = useState(false);
  
  // UI STATE
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(false);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [mobileLeaderboardOpen, setMobileLeaderboardOpen] = useState(false);
  
  // ANIMATION STATE
  const [showInstructions, setShowInstructions] = useState(true);
  const [swipeFeedback, setSwipeFeedback] = useState(null); // { action: 'SMASH' | 'PASS', id: string }
  
  // Hydration flags
  const hydrationStarted = useRef(false);
  const mounted = useRef(true);

  // Hide instructions after 3 seconds or first swipe
  useEffect(() => {
    const timer = setTimeout(() => setShowInstructions(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // --------------------------------------------------------------------------
  // CRITICAL PATH: Load ONLY what's needed for first paint
  // --------------------------------------------------------------------------
  const loadCriticalData = useCallback(async (activeSession) => {
    try {
      const limit = 5; // Reduced for instant mobile load
      
      const { data: rawProfiles, error } = await supabase
        .from('minder_targets')
        .select('id, alias, age, bio, image_url, instagram_id, user_id, redflag_score')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      if (!rawProfiles || !mounted.current) return;

      // Fetch swipes in parallel (non-blocking)
      let swipeMap = new Map();
      if (activeSession?.user?.id) {
        supabase
          .from('minder_swipes')
          .select('target_id, action')
          .eq('swiper_id', activeSession.user.id)
          .then(({ data: swipes }) => {
            if (swipes && mounted.current) {
              swipes.forEach(s => swipeMap.set(s.target_id, s.action));
              setUserSwipes(swipeMap);
            }
          });
      }

      setProfiles(rawProfiles);
      setLoading(false);
      
    } catch (err) {
      console.error("Critical load failed:", err);
      setLoading(false);
    }
  }, [supabase]);

  // --------------------------------------------------------------------------
  // REFRESH LEADERBOARD FUNCTION (for real-time updates)
  // --------------------------------------------------------------------------
  const refreshLeaderboard = useCallback(async () => {
    if (!mounted.current) return;
    
    setLeaderboardUpdating(true);
    
    try {
      // Use the same logic as initial load
      const { data: allSmashes } = await supabase
        .from('minder_swipes')
        .select('target_id')
        .eq('action', 'SMASH');
      
      if (!allSmashes || allSmashes.length === 0 || !mounted.current) {
        console.log('No smashes for leaderboard update');
        setLeaderboardUpdating(false);
        return;
      }
      
      const counts = {};
      allSmashes.forEach(s => {
        if (s.target_id) counts[s.target_id] = (counts[s.target_id] || 0) + 1;
      });
      
      const topIds = Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([id]) => id);
      
      if (topIds.length === 0) {
        setLeaderboardUpdating(false);
        return;
      }
      
      const { data: targets } = await supabase
        .from('minder_targets')
        .select('id, alias, image_url')
        .in('id', topIds);
      
      if (targets && mounted.current) {
        const leaderboardData = targets
          .map(t => ({ ...t, score: counts[t.id] }))
          .sort((a, b) => b.score - a.score);
        
        console.log('📊 Leaderboard updated:', leaderboardData);
        setLeaderboard(leaderboardData);
        
        // Keep the updating indicator visible for a moment
        setTimeout(() => {
          if (mounted.current) setLeaderboardUpdating(false);
        }, 800);
      }
    } catch (error) {
      console.error('Error refreshing leaderboard:', error);
      setLeaderboardUpdating(false);
    }
  }, [supabase]);

  // --------------------------------------------------------------------------
  // DEFERRED HYDRATION: Everything else loads after paint
  // --------------------------------------------------------------------------
  const hydrateSecondaryData = useCallback(async () => {
    if (hydrationStarted.current || !mounted.current) return;
    hydrationStarted.current = true;

    const runHydration = () => {
      Promise.all([
        // Feed
        supabase
          .from('minder_targets')
          .select('id, alias')
          .order('created_at', { ascending: false })
          .limit(10)
          .then(({ data }) => {
            if (data && mounted.current) {
              setFeed(data.map(t => ({ 
                id: `init-${t.id}`, 
                text: `> DOSSIER: [${t.alias}]`, 
                color: 'text-gray-500' 
              })));
            }
          }),
        
        // LEADERBOARD: Single optimized query with JOIN
        supabase
          .rpc('get_leaderboard', {})
          .then(({ data, error }) => {
            if (error) {
              console.error('Leaderboard RPC error:', error);
              // Fallback to manual query
              return supabase
                .from('minder_swipes')
                .select(`
                  target_id,
                  minder_targets!inner (
                    id,
                    alias,
                    image_url
                  )
                `)
                .eq('action', 'SMASH');
            }
            return { data, error: null };
          })
          .then(async ({ data, error }) => {
            if (error) {
              console.error('Leaderboard fallback error:', error);
              
              // Last resort: manual aggregation
              const { data: allSmashes } = await supabase
                .from('minder_swipes')
                .select('target_id')
                .eq('action', 'SMASH');
              
              if (!allSmashes || allSmashes.length === 0 || !mounted.current) {
                console.log('No smashes found');
                return;
              }
              
              const counts = {};
              allSmashes.forEach(s => {
                if (s.target_id) counts[s.target_id] = (counts[s.target_id] || 0) + 1;
              });
              
              const topIds = Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3)
                .map(([id]) => id);
              
              if (topIds.length === 0) return;
              
              const { data: targets } = await supabase
                .from('minder_targets')
                .select('id, alias, image_url')
                .in('id', topIds);
              
              if (targets && mounted.current) {
                const leaderboardData = targets
                  .map(t => ({ ...t, score: counts[t.id] }))
                  .sort((a, b) => b.score - a.score);
                
                console.log('Leaderboard (manual):', leaderboardData);
                setLeaderboard(leaderboardData);
              }
              return;
            }
            
            if (!data || !mounted.current) return;
            
            // If RPC worked, data is already aggregated
            if (Array.isArray(data) && data.length > 0) {
              console.log('Leaderboard (RPC):', data);
              setLeaderboard(data.slice(0, 3));
            } else {
              // Process JOIN result
              const counts = {};
              data.forEach(item => {
                const targetId = item.target_id;
                if (targetId) counts[targetId] = (counts[targetId] || 0) + 1;
              });
              
              const topEntries = Object.entries(counts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 3);
              
              if (topEntries.length === 0) return;
              
              // Get unique target data
              const seenTargets = new Map();
              data.forEach(item => {
                if (item.minder_targets && !seenTargets.has(item.target_id)) {
                  seenTargets.set(item.target_id, item.minder_targets);
                }
              });
              
              const leaderboardData = topEntries
                .map(([targetId, count]) => {
                  const target = seenTargets.get(targetId);
                  if (!target) return null;
                  return {
                    id: targetId,
                    alias: target.alias,
                    image_url: target.image_url,
                    score: count
                  };
                })
                .filter(Boolean);
              
              console.log('Leaderboard (JOIN):', leaderboardData);
              if (mounted.current) setLeaderboard(leaderboardData);
            }
          })
      ]);

      // Real-time subscription
      setTimeout(() => {
        if (!mounted.current) return;
        
        const channel = supabase
          .channel(`minder_live_${Date.now()}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'minder_swipes' 
          }, async (payload) => {
            if (!mounted.current) return;
            
            const { data: t } = await supabase
              .from('minder_targets')
              .select('alias')
              .eq('id', payload.new.target_id)
              .single();
            
            const action = payload.new.action;
            
            // Update feed
            setFeed(prev => [{
              id: payload.new.id,
              text: `> AGENT ${action}ED [${t?.alias || 'ANON'}]`,
              color: action === 'SMASH' ? 'text-green-500' : 'text-red-500'
            }, ...prev].slice(0, 15));
            
            // Real-time leaderboard update on SMASH
            if (action === 'SMASH') {
              console.log('🔥 Real-time SMASH detected, updating leaderboard...');
              refreshLeaderboard();
            }
          })
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'minder_swipes'
          }, async (payload) => {
            if (!mounted.current) return;
            
            console.log('🔄 Swipe UPDATE detected:', payload.new);
            
            // Get target info for feed
            const { data: t } = await supabase
              .from('minder_targets')
              .select('alias')
              .eq('id', payload.new.target_id)
              .single();
            
            // Update feed to show the change
            setFeed(prev => [{
              id: `update-${payload.new.id}-${Date.now()}`,
              text: `> AGENT CHANGED TO ${payload.new.action} [${t?.alias || 'ANON'}]`,
              color: payload.new.action === 'SMASH' ? 'text-green-500' : 'text-red-500'
            }, ...prev].slice(0, 15));
            
            // Refresh leaderboard
            console.log('🔄 Refreshing leaderboard after update...');
            refreshLeaderboard();
          })
          .on('postgres_changes', {
            event: 'DELETE',
            schema: 'public',
            table: 'minder_swipes'
          }, async (payload) => {
            if (!mounted.current) return;
            console.log('🗑️ Swipe deleted, refreshing leaderboard...');
            refreshLeaderboard();
          })
          .subscribe();
      }, 2000);
    };

    if ('requestIdleCallback' in window) {
      requestIdleCallback(runHydration, { timeout: 2000 });
    } else {
      setTimeout(runHydration, 100);
    }
  }, [supabase]);

  // --------------------------------------------------------------------------
  // BOOT SEQUENCE
  // --------------------------------------------------------------------------
  useEffect(() => {
    mounted.current = true;

    const boot = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (mounted.current) setSession(activeSession);
      
      await loadCriticalData(activeSession);
      hydrateSecondaryData();
    };
    
    boot();

    return () => {
      mounted.current = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // INTERACTION HANDLER - FIXED FOR REAL
  // --------------------------------------------------------------------------
  const executeSwipe = useCallback(async (direction, targetId, isOwnCard, existingSwipe) => {
    if (!session && !isOwnCard) {
      setAuthModal(true);
      return;
    }

    if (isOwnCard || direction === 'dismiss') {
      setCurrentIndex(prev => prev + 1 >= profiles.length ? 0 : prev + 1);
      return;
    }

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    const targetAlias = profiles[currentIndex]?.alias || 'TARGET';
    const isChanging = existingSwipe && existingSwipe !== action;
    const isKeeping = existingSwipe && existingSwipe === action;

    console.log('🎯 Swipe:', { action, existingSwipe, isChanging, isKeeping });

    setShowInstructions(false);

    // Feedback
    setSwipeFeedback({ action, id: `feedback-${Date.now()}` });
    setTimeout(() => setSwipeFeedback(null), 1200);

    // Haptic
    if ('vibrate' in navigator) {
      navigator.vibrate(action === 'SMASH' ? [10, 5, 10] : 15);
    }

    // Update state FIRST before any async operations
    setUserSwipes(prev => new Map(prev).set(targetId, action));
    setFeed(prev => [{ 
      id: `local-${Date.now()}`, 
      text: `> YOU ${isChanging ? 'CHANGED TO' : ''} ${action}ED [${targetAlias}]`, 
      color: action === 'SMASH' ? 'text-green-500' : 'text-red-500' 
    }, ...prev].slice(0, 15));

    // Advance card for new swipes or keeping same
    // Don't advance if changing - let user see the update
    if (!isChanging) {
      setCurrentIndex(prev => prev + 1 >= profiles.length ? 0 : prev + 1);
    }

    // Save to database
    try {
      const { error } = await supabase.from('minder_swipes').upsert(
        { 
          swiper_id: session.user.id, 
          target_id: targetId, 
          action
        },
        { onConflict: 'swiper_id,target_id' }
      );

      if (error) {
        console.error('❌ Save failed:', error);
        // Revert on error
        setUserSwipes(prev => {
          const newMap = new Map(prev);
          if (existingSwipe) newMap.set(targetId, existingSwipe);
          else newMap.delete(targetId);
          return newMap;
        });
      } else {
        console.log('✅ Saved:', action);
      }
    } catch (err) {
      console.error('❌ Exception:', err);
    }

  }, [currentIndex, profiles, session, supabase]);

  const visibleCards = profiles
    .slice(currentIndex, currentIndex + 3)
    .map((target, idx) => ({
      target,
      relativeIndex: idx, 
      isTop: idx === 0
    }))
    .reverse();

  return (
    <div className="h-[100dvh] bg-[#000000] text-white overflow-hidden flex flex-col md:flex-row font-mono relative touch-none select-none">
      
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {!isMobile.current && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-pink-600/5 rounded-full blur-[150px]" />
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black" />
      </div>

      {/* ====================================================================== */}
      {/* SUBTLE SWIPE INSTRUCTIONS */}
      {/* ====================================================================== */}
      <AnimatePresence>
        {showInstructions && !loading && profiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-32 md:bottom-auto md:top-32 left-1/2 -translate-x-1/2 z-[400] pointer-events-none"
          >
            {/* Mobile Instructions */}
            <div className="md:hidden flex items-center gap-4 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
              <div className="flex items-center gap-2 text-red-400">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-xs font-bold">PASS</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2 text-green-400">
                <span className="text-xs font-bold">SMASH</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Desktop Instructions */}
            <div className="hidden md:flex items-center gap-6 bg-black/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/20">
              <div className="flex items-center gap-2 text-red-400">
                <div className="text-xs font-mono bg-red-950/50 px-2 py-1 rounded border border-red-500/30">←</div>
                <span className="text-xs font-bold">PASS</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-2 text-green-400">
                <span className="text-xs font-bold">SMASH</span>
                <div className="text-xs font-mono bg-green-950/50 px-2 py-1 rounded border border-green-500/30">→</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====================================================================== */}
      {/* SUBTLE SWIPE FEEDBACK */}
      {/* ====================================================================== */}
      <AnimatePresence>
        {swipeFeedback && (
          <motion.div
            key={swipeFeedback.id}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-24 md:top-32 left-1/2 -translate-x-1/2 z-[1300] pointer-events-none"
          >
            {swipeFeedback.action === 'SMASH' ? (
              <div className="flex items-center gap-3 bg-green-500/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg">
                <Heart className="w-5 h-5 text-white fill-white" />
                <span className="text-sm font-black text-white uppercase tracking-wider">Smashed</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-red-500/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg">
                <ThumbsDown className="w-5 h-5 text-white fill-white" />
                <span className="text-sm font-black text-white uppercase tracking-wider">Passed</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {authModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/90"
          >
            <motion.div 
              initial={{ scale: 0.95 }} 
              animate={{ scale: 1 }}
              className="w-full max-w-sm bg-[#050505] border border-red-500/50 rounded-3xl p-8 shadow-2xl"
            >
              <Lock className="w-12 h-12 text-red-500 mb-6 mx-auto" />
              <h2 className="text-2xl font-black uppercase text-white mb-2 text-center">ACCESS DENIED</h2>
              <p className="text-xs text-gray-400 font-medium mb-8 text-center">Authentication required</p>
              <Link href="/login?next=/minder" className="block w-full">
                <button className="w-full py-4 bg-red-600 text-white text-xs font-black uppercase rounded-xl hover:bg-red-500 transition-colors active:scale-95 flex items-center justify-center gap-3">
                  <User className="w-4 h-4" /> AUTHENTICATE
                </button>
              </Link>
              <button 
                onClick={() => setAuthModal(false)}
                className="mt-6 text-xs text-gray-500 hover:text-white w-full text-center"
              >
                DISMISS
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full z-[500] bg-gradient-to-b from-black to-transparent pt-5 pb-10 px-5 pointer-events-none">
        <div className="flex justify-between items-center w-full pointer-events-auto mb-4">
          <Link href="/" className="bg-white/5 border border-white/10 p-3 rounded-full active:scale-90 transition-transform">
            <ChevronLeft className="w-5 h-5 text-gray-300" />
          </Link>
          <h1 className="text-2xl font-black italic text-white tracking-tighter">
            MINDER<span className="text-pink-500">_</span>
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={() => { setMobileLeaderboardOpen(true); hydrateSecondaryData(); }}
              className="bg-black/60 border border-white/10 p-3 rounded-full text-yellow-500 active:scale-90 transition-transform"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setMobileHudOpen(true); hydrateSecondaryData(); }}
              className="bg-black/60 border border-white/10 p-3 rounded-full text-emerald-400 active:scale-90 transition-transform"
            >
              <Activity className="w-4 h-4" />
            </button>
            <Link href="/minder/enroll">
              <button className="bg-pink-600 border border-pink-400 p-3 rounded-full active:scale-90 transition-transform">
                <Zap className="w-4 h-4 text-white" />
              </button>
            </Link>
          </div>
        </div>
        <div className="flex justify-center pointer-events-auto w-full">
          <Link href="/dashboard" className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
            <Edit2 className="w-3 h-3" /> Edit Profile <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Mobile Slideovers */}
      <AnimatePresence>
        {mobileHudOpen && (
          <motion.div 
            initial={{ x: "100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[1000] bg-black md:hidden p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
              <h3 className="text-emerald-400 font-black text-2xl uppercase">LIVE FEED</h3>
              <button onClick={() => setMobileHudOpen(false)} className="bg-white/10 p-3 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
              {feed.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-10">Loading...</p>
              ) : (
                feed.map(item => (
                  <div key={item.id} className={`${item.color} text-xs font-bold border-l-2 border-current pl-4 py-3 bg-white/5 rounded-r`}>
                    {item.text}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
        
        {mobileLeaderboardOpen && (
          <motion.div 
            initial={{ x: "-100%" }} 
            animate={{ x: 0 }} 
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-0 z-[1000] bg-black md:hidden p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-yellow-500 font-black text-2xl uppercase flex items-center gap-3">
                  <Trophy className="w-6 h-6"/> TRENDING
                </h3>
                {leaderboardUpdating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/30"
                  >
                    <Zap className="w-3 h-3 text-yellow-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-yellow-500 uppercase">Live</span>
                  </motion.div>
                )}
              </div>
              <button onClick={() => setMobileLeaderboardOpen(false)} className="bg-white/10 p-3 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 space-y-5">
              {leaderboard.length === 0 ? (
                <p className="text-gray-500 text-sm text-center mt-20">Loading...</p>
              ) : (
                leaderboard.map((leader, i) => (
                  <div key={leader.id} className="flex items-center gap-5 bg-white/10 p-5 rounded-3xl border border-white/10">
                    <h1 className="text-4xl font-black text-gray-700 w-10">#{i + 1}</h1>
                    <img 
                      src={leader.image_url} 
                      alt={leader.alias}
                      className="w-16 h-16 rounded-full object-cover border-2 border-yellow-500/50"
                      loading="lazy"
                    />
                    <div>
                      <h4 className="font-black text-white uppercase text-lg">{leader.alias}</h4>
                      <p className="text-xs text-green-500 font-black flex items-center gap-2 mt-1">
                        <Flame className="w-4 h-4"/> {leader.score} SMASHES
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-[450px] lg:w-[480px] bg-[#050505]/80 border-r border-white/5 p-12 z-[100] h-full">
        <div className="flex items-center gap-6 text-emerald-400 mb-10 pb-8 border-b border-white/10 pt-4">
          <div className="p-4 bg-emerald-900/20 rounded-2xl border border-emerald-500/30">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-black uppercase text-2xl">GLOBAL FEED</h2>
            <p className="text-xs text-emerald-600 font-bold mt-2">Encrypted Uplink</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-4 pr-5">
          {feed.length === 0 ? (
            <p className="text-gray-500 text-sm text-center mt-10">Loading...</p>
          ) : (
            feed.map((item) => (
              <div key={item.id} className={`${item.color} font-bold border-l-2 border-current pl-5 py-4 bg-white/5 rounded-r text-xs`}>
                {item.text}
              </div>
            ))
          )}
        </div>
        
        <div className="mt-8 border-t border-white/10 pt-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-yellow-500 font-black text-xs uppercase flex items-center gap-3">
              <Trophy className="w-4 h-4"/> TOP TARGETS
            </h3>
            {leaderboardUpdating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 bg-yellow-500/20 px-2 py-1 rounded-full border border-yellow-500/30"
              >
                <Zap className="w-3 h-3 text-yellow-500 animate-pulse" />
                <span className="text-[8px] font-bold text-yellow-500 uppercase tracking-wider">Live</span>
              </motion.div>
            )}
          </div>
          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <p className="text-gray-500 text-xs text-center">Loading...</p>
            ) : (
              leaderboard.map((l, i) => (
                <motion.div 
                  key={l.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-gray-600 font-black text-xl">#{i+1}</span>
                    <span className="text-xs font-black text-white uppercase">{l.alias}</span>
                  </div>
                  <span className="text-xs text-green-500 font-black flex items-center gap-1.5">
                    <Flame className="w-4 h-4"/> {l.score}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 flex flex-col relative z-10 p-0 md:p-10 h-full overflow-hidden justify-center items-center pt-28 md:pt-32">
        
        {/* Desktop Header */}
        <div className="hidden md:flex justify-between items-start w-full absolute top-8 px-8 lg:px-12 z-[200] pointer-events-none">
          <div className="flex flex-col gap-3 items-start pointer-events-auto">
            <Link href="/" className="group flex items-center gap-2 lg:gap-3 text-xs font-black text-gray-400 hover:text-white uppercase bg-white/5 px-4 lg:px-6 py-3 rounded-full border border-white/10">
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> BACK TO BASE
            </Link>
            <Link href="/dashboard" className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-pink-400 uppercase bg-black/40 px-4 py-2 rounded-full border border-white/5">
              <Terminal className="w-3 h-3" /> 
              <span className="hidden xl:inline">Edit Profile</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-black italic text-white">
              MINDER<span className="text-pink-600">_</span>
            </h1>
            <p className="text-[10px] font-black text-pink-500 uppercase bg-pink-900/20 px-4 py-1.5 rounded-full border border-pink-500/20 mt-3">
              INSTANT PROTOCOL
            </p>
          </div>

          <div className="flex flex-col items-end pointer-events-auto">
            <Link href="/minder/enroll">
              <button className="bg-pink-600 text-white text-xs font-black uppercase hover:bg-pink-500 transition-colors flex items-center gap-3 px-8 py-4 rounded-full border border-pink-400 active:scale-95">
                <Zap className="w-4 h-4" /> INJECT DOSSIER
              </button>
            </Link>
          </div>
        </div>

        {/* Card Viewport */}
        <div className="relative w-full h-[100dvh] md:h-[750px] md:max-w-[420px] flex items-center justify-center pb-10 md:pb-0">
          {loading ? (
            <div className="text-pink-500 flex flex-col items-center gap-6">
              <Radar className="w-16 h-16 animate-spin opacity-50" />
              <div className="text-xs uppercase font-black">LOADING...</div>
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center w-[90%] md:w-full bg-[#050505] p-12 border border-white/10 rounded-3xl">
              <Crosshair className="w-16 h-16 mx-auto mb-6 text-gray-700" />
              <p className="text-2xl uppercase font-black text-white">GRID CLEARED</p>
              <p className="text-xs text-gray-500 mt-4">No active signals</p>
            </div>
          ) : (
            <div className="relative w-[95%] md:w-full h-[82dvh] md:h-full max-h-[800px] flex items-center justify-center">
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
                    onExecuteSwipe={(dir) => executeSwipe(dir, card.target.id, session?.user?.id === card.target.user_id, userSwipes.get(card.target.id))}
                    isMobile={isMobile.current}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SWIPE CARD WITH ENHANCED VISUAL FEEDBACK
// ============================================================================
const SwipeCard = React.memo(({ target, isTop, depthIndex, session, isOwnCard, existingSwipe, onExecuteSwipe, isMobile }) => {
  const x = useMotionValue(0);
  const controls = useAnimation();
  
  const redFlagScore = target.redflag_score || calculateFallbackScore(target);
  
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const scale = isTop ? 1 : 1 - (depthIndex * 0.04);
  const yOffset = isTop ? 0 : depthIndex * 16;
  
  // Dynamic opacity based on swipe direction
  const smashOpacity = useTransform(x, [0, 100], [0, 1]);
  const passOpacity = useTransform(x, [0, -100], [0, 1]);
  
  // Text opacity - only show when actually swiping
  const smashTextOpacity = useTransform(x, [30, 100], [0, 1]);
  const passTextOpacity = useTransform(x, [-30, -100], [0, 1]);

  useEffect(() => {
    if (!isTop || isOwnCard) return;
    const handleKeyDown = async (e) => {
      if (e.key === 'ArrowRight') await processSwipe('right');
      else if (e.key === 'ArrowLeft') await processSwipe('left');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTop, isOwnCard]);

  const processSwipe = async (direction) => {
    if (isOwnCard && direction !== 'dismiss') return;

    const exitX = direction === 'right' ? window.innerWidth + 200 : direction === 'left' ? -(window.innerWidth + 200) : 0;
    const exitY = direction === 'dismiss' ? -(window.innerHeight + 200) : 0;
    const exitRotate = direction === 'right' ? 30 : direction === 'left' ? -30 : 0;
    
    await controls.start({ 
      x: exitX, 
      y: exitY, 
      rotate: exitRotate, 
      opacity: 0, 
      transition: { duration: 0.3, ease: "easeOut" } 
    });
    
    onExecuteSwipe(direction);
  };

  const handleDragEnd = async (event, info) => {
    if (isOwnCard) return;
    const threshold = 80;
    const velocity = 350;
    
    if (info.offset.x > threshold || info.velocity.x > velocity) {
      await processSwipe('right');
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      await processSwipe('left');
    } else {
      controls.start({ x: 0, y: 0, rotate: 0, transition: { type: "spring", stiffness: 400, damping: 30 } });
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
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      whileTap={isTop && !isOwnCard ? { scale: 0.98 } : {}}
      className={`absolute inset-0 md:inset-auto md:w-full md:h-full rounded-[2.5rem] md:rounded-[3rem] bg-[#050505] overflow-hidden flex flex-col ${!isTop && 'opacity-80'} ${isOwnCard && isTop ? 'border border-yellow-500' : 'border border-white/10'}`}
      style={{ willChange: isTop ? 'transform' : 'auto' }}
    >
      {!isMobile && (
        <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none z-10 rounded-[2.5rem] md:rounded-[3rem]" />
      )}
      
      <img 
        src={target?.image_url || ''} 
        alt={safeAlias} 
        draggable={false}
        loading={isTop ? "eager" : "lazy"}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" 
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent h-32 pointer-events-none" />

      {isOwnCard && isTop && (
        <div className="absolute top-8 left-0 w-full bg-yellow-500 text-black py-2 font-black text-center text-[10px] uppercase z-30">
          <User className="w-4 h-4 inline mr-2" /> THIS IS YOU
        </div>
      )}

      {existingSwipe && isTop && !isOwnCard && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`absolute top-8 left-0 w-full ${existingSwipe === 'SMASH' ? 'bg-green-500 text-black' : 'bg-red-600 text-white'} py-2 font-black text-center text-[10px] uppercase z-30 flex justify-center items-center gap-2 shadow-lg`}
        >
          {existingSwipe === 'SMASH' ? <Heart className="w-4 h-4 fill-current" /> : <ThumbsDown className="w-4 h-4 fill-current" />}
          PREVIOUSLY {existingSwipe}ED
        </motion.div>
      )}

      {isTop && !isOwnCard && (
        <>
          {/* Right swipe indicator - SMASH */}
          <motion.div 
            style={{ opacity: smashOpacity }} 
            className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-green-500/40 pointer-events-none z-20"
          />
          <motion.div
            style={{ opacity: smashTextOpacity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div className="flex flex-col items-center gap-4">
              <Heart className="w-20 h-20 md:w-24 md:h-24 text-green-500 fill-green-500 drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]" />
              <div className="text-4xl md:text-5xl font-black text-green-500 uppercase tracking-wider drop-shadow-[0_0_20px_rgba(34,197,94,0.8)]">
                SMASH
              </div>
              <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                <ArrowRight className="w-5 h-5" />
                <span>Swipe Right</span>
              </div>
            </div>
          </motion.div>

          {/* Left swipe indicator - PASS */}
          <motion.div 
            style={{ opacity: passOpacity }} 
            className="absolute inset-0 bg-gradient-to-l from-transparent via-red-500/20 to-red-500/40 pointer-events-none z-20"
          />
          <motion.div
            style={{ opacity: passTextOpacity }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div className="flex flex-col items-center gap-4">
              <ThumbsDown className="w-20 h-20 md:w-24 md:h-24 text-red-500 fill-red-500 drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]" />
              <div className="text-4xl md:text-5xl font-black text-red-500 uppercase tracking-wider drop-shadow-[0_0_20px_rgba(220,38,38,0.8)]">
                PASS
              </div>
              <div className="flex items-center gap-2 text-red-400 text-sm font-bold">
                <span>Swipe Left</span>
                <ArrowLeft className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        </>
      )}

      <div className="mt-auto w-full p-6 md:p-8 flex flex-col gap-5 z-20 pb-10 md:pb-8 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="flex justify-between items-end gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-4xl md:text-5xl font-black uppercase text-white flex items-center gap-3 truncate">
              {safeAlias} <span className="text-2xl text-gray-400 font-normal">{target?.age || '?'}</span>
            </h2>
            
            {session ? (
              <div className="text-xs font-black text-white bg-white/10 w-fit px-4 py-2 mt-3 rounded-xl flex items-center gap-2 border border-white/20">
                <Terminal className="w-3 h-3 text-pink-500" /> @{safeInsta}
              </div>
            ) : (
              <div className="text-[9px] font-black text-red-400 bg-red-950/80 w-fit px-3 py-1.5 mt-3 border border-red-900/50 rounded-lg flex items-center gap-2 uppercase">
                <Lock className="w-3 h-3" /> SECURE
              </div>
            )}
          </div>

          <div className="text-center bg-[#050505] p-3 md:p-4 rounded-2xl border border-white/10 flex flex-col items-center min-w-[75px]">
            <div className="text-[8px] text-gray-500 font-black uppercase mb-1">FLAG</div>
            <div className={`text-3xl font-black ${redFlagScore > 60 ? 'text-red-500' : redFlagScore > 30 ? 'text-yellow-500' : 'text-green-500'}`}>
              {redFlagScore}%
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-0 w-1 h-full bg-pink-600/50 rounded-full" />
          <p className="text-xs md:text-sm text-gray-300 font-medium leading-relaxed bg-white/5 p-4 md:p-5 rounded-2xl border border-white/10 italic line-clamp-3">
            {session ? `"${safeBio}"` : (
              <span className="flex items-center opacity-50">
                <EyeOff className="w-4 h-4 text-red-500 mr-2" />
                {safeBio.split(' ').map((w, i) => i % 2 === 0 ? '████' : w).join(' ')}
              </span>
            )}
          </p>
        </div>

        {isTop && (
          <div className="mt-2 flex gap-3" onPointerDown={(e) => e.stopPropagation()}>
            {isOwnCard ? (
              <button 
                onClick={() => processSwipe('dismiss')}
                className="w-full bg-yellow-500 text-black py-4 md:py-5 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                <X className="w-5 h-5" /> DISMISS
              </button>
            ) : existingSwipe ? (
              // User has already swiped - show keep or change buttons
              existingSwipe === 'SMASH' ? (
                <>
                  <button 
                    onClick={() => processSwipe('right')}
                    className="flex-1 bg-green-900 border-2 border-green-500 text-green-400 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-green-800 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                  >
                    <Heart className="w-5 h-5 fill-current"/> KEEP SMASH
                  </button>
                  <button 
                    onClick={() => processSwipe('left')}
                    className="flex-1 bg-black border-2 border-red-600/50 text-red-400 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-red-950/40 hover:border-red-500 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                  >
                    <ThumbsDown className="w-5 h-5"/> CHANGE TO PASS
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={() => processSwipe('left')}
                    className="flex-1 bg-red-900 border-2 border-red-500 text-red-400 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-red-800 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                  >
                    <ThumbsDown className="w-5 h-5 fill-current"/> KEEP PASS
                  </button>
                  <button 
                    onClick={() => processSwipe('right')}
                    className="flex-1 bg-black border-2 border-green-500/50 text-green-400 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-green-950/40 hover:border-green-500 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                  >
                    <Heart className="w-5 h-5"/> CHANGE TO SMASH
                  </button>
                </>
              )
            ) : (
              // Fresh profile - show normal buttons
              <>
                <button 
                  onClick={() => processSwipe('left')}
                  className="flex-1 bg-black border-2 border-red-600/50 text-red-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-red-950/40 hover:border-red-500 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                >
                  <ThumbsDown className="w-5 h-5"/> PASS
                </button>
                <button 
                  onClick={() => processSwipe('right')}
                  className="flex-1 bg-black border-2 border-green-500/50 text-green-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-green-950/40 hover:border-green-500 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
                >
                  <Heart className="w-5 h-5"/> SMASH
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

// ============================================================================
// FALLBACK SCORE CALCULATOR
// ============================================================================
function calculateFallbackScore(target) {
  let score = 10;
  const bioLower = String(target.bio || "").toLowerCase();
  
  const wordCount = bioLower.split(/\s+/).length;
  if (wordCount < 4) score += 20;
  if (wordCount > 60) score += 10;

  if (/(no drama|drama free|toxic|fake people|trust issues)/.test(bioLower)) score += 25;
  if (/(cashapp|venmo|paypal|spoil me|sugar|generous)/.test(bioLower)) score += 40;
  
  const pronounCount = (bioLower.match(/\b(i|me|my|mine)\b/g) || []).length;
  if (wordCount > 10 && (pronounCount / wordCount) > 0.15) score += 10;
  
  if (/(alpha|sigma|king|queen|boss)/.test(bioLower)) score += 15;
  
  const demandCount = (bioLower.match(/\b(must|should|never|require|need to)\b/g) || []).length;
  score += (demandCount * 8);

  if (/(nice guy|good girl)/.test(bioLower)) score += 20;

  const variance = (String(target.id || "0").split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 15) - 7;
  return Math.min(Math.max(Math.round(score + variance), 1), 99);
}
