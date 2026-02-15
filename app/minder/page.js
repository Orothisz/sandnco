"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  Lock, Activity, Terminal, ChevronLeft, Radar, Zap, User, X, 
  Crosshair, Heart, ThumbsDown, EyeOff, Trophy, Flame, ArrowUpRight, Edit2,
  ArrowLeft, ArrowRight
} from "lucide-react";
import Link from "next/link";

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
};

export default function MinderHub() {
  const supabase = createClientComponentClient();
  const isMobile = useRef(isMobileDevice());
  
  // CORE STATE
  const [session, setSession] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userSwipes, setUserSwipes] = useState(new Map());
  
  // SECONDARY STATE
  const [feed, setFeed] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardUpdating, setLeaderboardUpdating] = useState(false);
  
  // UI STATE
  const [loading, setLoading] = useState(true);
  const [authModal, setAuthModal] = useState(false);
  const [mobileHudOpen, setMobileHudOpen] = useState(false);
  const [mobileLeaderboardOpen, setMobileLeaderboardOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [swipeFeedback, setSwipeFeedback] = useState(null);
  
  const mounted = useRef(true);
  const loadingMore = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowInstructions(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // --------------------------------------------------------------------------
  // LOAD PROFILES (INFINITE)
  // --------------------------------------------------------------------------
  const loadProfiles = useCallback(async (append = false) => {
    if (loadingMore.current) return;
    loadingMore.current = true;

    try {
      const { data: rawProfiles, error } = await supabase
        .from('minder_targets')
        .select('id, alias, age, bio, image_url, instagram_id, user_id, redflag_score')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      if (!rawProfiles || !mounted.current) return;

      if (append) {
        setAllProfiles(prev => [...prev, ...rawProfiles]);
      } else {
        setAllProfiles(rawProfiles);
      }
      
      setLoading(false);
    } catch (err) {
      console.error("Load failed:", err);
      setLoading(false);
    } finally {
      loadingMore.current = false;
    }
  }, [supabase]);

  // --------------------------------------------------------------------------
  // LOAD USER SWIPES
  // --------------------------------------------------------------------------
  const loadUserSwipes = useCallback(async (userId) => {
    if (!userId) return;

    try {
      const { data: swipes } = await supabase
        .from('minder_swipes')
        .select('target_id, action')
        .eq('swiper_id', userId);
      
      if (swipes && mounted.current) {
        const swipeMap = new Map();
        swipes.forEach(s => swipeMap.set(s.target_id, s.action));
        setUserSwipes(swipeMap);
      }
    } catch (err) {
      console.error("Failed to load swipes:", err);
    }
  }, [supabase]);

  // --------------------------------------------------------------------------
  // REFRESH LEADERBOARD
  // --------------------------------------------------------------------------
  const refreshLeaderboard = useCallback(async () => {
    if (!mounted.current || leaderboardUpdating) return;
    
    setLeaderboardUpdating(true);
    
    try {
      const { data: allSmashes } = await supabase
        .from('minder_swipes')
        .select('target_id')
        .eq('action', 'SMASH');
      
      if (!allSmashes || allSmashes.length === 0 || !mounted.current) {
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
        
        setLeaderboard(leaderboardData);
        setTimeout(() => {
          if (mounted.current) setLeaderboardUpdating(false);
        }, 800);
      }
    } catch (error) {
      console.error('Leaderboard error:', error);
      setLeaderboardUpdating(false);
    }
  }, [supabase, leaderboardUpdating]);

  // --------------------------------------------------------------------------
  // SETUP REALTIME FEED
  // --------------------------------------------------------------------------
  const setupRealtimeFeed = useCallback(() => {
    if (!mounted.current) return;

    // Initial feed
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
      });

    // Realtime subscription
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
        
        setFeed(prev => [{
          id: payload.new.id,
          text: `> AGENT ${action}ED [${t?.alias || 'ANON'}]`,
          color: action === 'SMASH' ? 'text-green-500' : 'text-red-500'
        }, ...prev].slice(0, 15));
        
        if (action === 'SMASH') {
          refreshLeaderboard();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'minder_swipes'
      }, async (payload) => {
        if (!mounted.current) return;
        
        const { data: t } = await supabase
          .from('minder_targets')
          .select('alias')
          .eq('id', payload.new.target_id)
          .single();
        
        setFeed(prev => [{
          id: `update-${payload.new.id}-${Date.now()}`,
          text: `> AGENT CHANGED TO ${payload.new.action} [${t?.alias || 'ANON'}]`,
          color: payload.new.action === 'SMASH' ? 'text-green-500' : 'text-red-500'
        }, ...prev].slice(0, 15));
        
        refreshLeaderboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, refreshLeaderboard]);

  // --------------------------------------------------------------------------
  // INITIALIZE
  // --------------------------------------------------------------------------
  useEffect(() => {
    mounted.current = true;

    const init = async () => {
      const { data: { session: activeSession } } = await supabase.auth.getSession();
      if (mounted.current) setSession(activeSession);
      
      await loadProfiles(false);
      
      if (activeSession?.user?.id) {
        await loadUserSwipes(activeSession.user.id);
      }

      setTimeout(() => {
        if (mounted.current) {
          refreshLeaderboard();
          setupRealtimeFeed();
        }
      }, 1000);
    };
    
    init();

    return () => {
      mounted.current = false;
    };
  }, []);

  // --------------------------------------------------------------------------
  // INFINITE LOOP - ADVANCE TO NEXT CARD
  // --------------------------------------------------------------------------
  const advanceToNext = useCallback(() => {
    setCurrentIndex(prev => {
      const nextIndex = prev + 1;
      
      // If we're near the end, load more profiles
      if (nextIndex >= allProfiles.length - 3) {
        loadProfiles(true);
      }
      
      // Loop back to start if we somehow reach the end
      if (nextIndex >= allProfiles.length) {
        return 0;
      }
      
      return nextIndex;
    });
  }, [allProfiles.length, loadProfiles]);

  // --------------------------------------------------------------------------
  // HANDLE SWIPE
  // --------------------------------------------------------------------------
  const handleSwipe = useCallback(async (targetId, direction, isOwnCard, existingSwipe) => {
    if (!session && !isOwnCard) {
      setAuthModal(true);
      return;
    }

    if (isOwnCard || direction === 'dismiss') {
      advanceToNext();
      return;
    }

    const action = direction === 'right' ? 'SMASH' : 'PASS';
    const target = allProfiles.find(p => p.id === targetId);
    const targetAlias = target?.alias || 'TARGET';
    const isChanging = existingSwipe && existingSwipe !== action;

    console.log('🎯 Swipe:', { action, existingSwipe, isChanging });

    setShowInstructions(false);

    // Feedback
    setSwipeFeedback({ action, id: `feedback-${Date.now()}` });
    setTimeout(() => setSwipeFeedback(null), 1200);

    // Haptic
    if ('vibrate' in navigator) {
      navigator.vibrate(action === 'SMASH' ? [10, 5, 10] : 15);
    }

    // Update local state immediately
    setUserSwipes(prev => new Map(prev).set(targetId, action));
    setFeed(prev => [{ 
      id: `local-${Date.now()}`, 
      text: `> YOU ${isChanging ? 'CHANGED TO' : ''} ${action}ED [${targetAlias}]`, 
      color: action === 'SMASH' ? 'text-green-500' : 'text-red-500' 
    }, ...prev].slice(0, 15));

    // Advance to next card
    advanceToNext();

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
        console.error('❌ Database save failed:', error);
        // Revert on error
        setUserSwipes(prev => {
          const newMap = new Map(prev);
          if (existingSwipe) {
            newMap.set(targetId, existingSwipe);
          } else {
            newMap.delete(targetId);
          }
          return newMap;
        });
      } else {
        console.log(`✅ Database ${isChanging ? 'updated' : 'saved'}:`, action, 'on', targetAlias);
        
        if (action === 'SMASH' || isChanging) {
          refreshLeaderboard();
        }
      }
    } catch (err) {
      console.error('❌ Database exception:', err);
    }

  }, [session, allProfiles, supabase, refreshLeaderboard, advanceToNext]);

  // Get current card
  const currentCard = allProfiles[currentIndex];
  const hasCards = allProfiles.length > 0;

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

      {/* SWIPE INSTRUCTIONS */}
      <AnimatePresence>
        {showInstructions && !loading && hasCards && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-32 md:bottom-auto md:top-32 left-1/2 -translate-x-1/2 z-[400] pointer-events-none"
          >
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

      {/* SWIPE FEEDBACK */}
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
              onClick={() => { setMobileLeaderboardOpen(true); }}
              className="bg-black/60 border border-white/10 p-3 rounded-full text-yellow-500 active:scale-90 transition-transform"
            >
              <Trophy className="w-4 h-4" />
            </button>
            <button 
              onClick={() => { setMobileHudOpen(true); }}
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

      {/* Main Area */}
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
              INFINITE LOOP
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
          ) : !hasCards ? (
            <div className="text-pink-500 flex flex-col items-center gap-6">
              <Radar className="w-16 h-16 animate-spin opacity-50" />
              <div className="text-xs uppercase font-black">LOADING MORE...</div>
            </div>
          ) : (
            <div className="relative w-[95%] md:w-full h-[82dvh] md:h-full max-h-[800px]">
              <AnimatePresence mode="wait">
                {currentCard && (
                  <SwipeCard
                    key={currentCard.id}
                    target={currentCard}
                    session={session}
                    isOwnCard={session?.user?.id === currentCard.user_id}
                    existingSwipe={userSwipes.get(currentCard.id)}
                    onSwipe={(dir) => handleSwipe(currentCard.id, dir, session?.user?.id === currentCard.user_id, userSwipes.get(currentCard.id))}
                    isMobile={isMobile.current}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SWIPE CARD COMPONENT
// ============================================================================
const SwipeCard = ({ target, session, isOwnCard, existingSwipe, onSwipe, isMobile }) => {
  const [exitX, setExitX] = useState(0);

  const redFlagScore = target.redflag_score || calculateFallbackScore(target);

  const handleDragEnd = (event, info) => {
    if (isOwnCard) return;
    
    const threshold = 100;
    if (info.offset.x > threshold) {
      setExitX(800);
      setTimeout(() => onSwipe('right'), 50);
    } else if (info.offset.x < -threshold) {
      setExitX(-800);
      setTimeout(() => onSwipe('left'), 50);
    }
  };

  const handleButton = (direction) => {
    if (isOwnCard && direction !== 'dismiss') return;
    
    setExitX(direction === 'right' ? 800 : direction === 'left' ? -800 : 0);
    setTimeout(() => onSwipe(direction), 50);
  };

  useEffect(() => {
    if (isOwnCard) return;
    
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') handleButton('right');
      else if (e.key === 'ArrowLeft') handleButton('left');
    };
    
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOwnCard]);

  const safeBio = String(target?.bio || "");
  const safeAlias = String(target?.alias || "UNKNOWN");
  const safeInsta = String(target?.instagram_id || "");

  return (
    <motion.div
      drag={!isOwnCard ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, x: 0 }}
      exit={{ 
        x: exitX,
        opacity: 0,
        scale: 0.8,
        rotate: exitX > 0 ? 20 : exitX < 0 ? -20 : 0,
        transition: { duration: 0.3 }
      }}
      className={`absolute inset-0 rounded-[2.5rem] md:rounded-[3rem] bg-[#050505] overflow-hidden flex flex-col ${isOwnCard ? 'border border-yellow-500' : 'border border-white/10'} shadow-2xl`}
    >
      <img 
        src={target?.image_url || ''} 
        alt={safeAlias} 
        draggable={false}
        loading="eager"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" 
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-transparent h-32" />

      {isOwnCard && (
        <div className="absolute top-8 left-0 w-full bg-yellow-500 text-black py-2 font-black text-center text-[10px] uppercase z-30">
          <User className="w-4 h-4 inline mr-2" /> THIS IS YOU
        </div>
      )}

      {existingSwipe && !isOwnCard && (
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className={`absolute top-8 left-0 w-full ${existingSwipe === 'SMASH' ? 'bg-green-500 text-black' : 'bg-red-600 text-white'} py-2 font-black text-center text-[10px] uppercase z-30 flex justify-center items-center gap-2 shadow-lg`}
        >
          {existingSwipe === 'SMASH' ? <Heart className="w-4 h-4 fill-current" /> : <ThumbsDown className="w-4 h-4 fill-current" />}
          PREVIOUSLY {existingSwipe}ED
        </motion.div>
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

        <div className="mt-2 flex gap-3">
          {isOwnCard ? (
            <button 
              onClick={() => handleButton('dismiss')}
              className="w-full bg-yellow-500 text-black py-4 md:py-5 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-3 active:scale-95 transition-transform"
            >
              <X className="w-5 h-5" /> DISMISS
            </button>
          ) : existingSwipe ? (
            existingSwipe === 'SMASH' ? (
              <>
                <button 
                  onClick={() => handleButton('right')}
                  className="flex-1 bg-green-900 border-2 border-green-500 text-green-400 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-green-800 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Heart className="w-5 h-5 fill-current"/> KEEP SMASH
                </button>
                <button 
                  onClick={() => handleButton('left')}
                  className="flex-1 bg-black border-2 border-red-600/50 text-red-400 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-red-950/40 hover:border-red-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ThumbsDown className="w-5 h-5"/> CHANGE TO PASS
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleButton('left')}
                  className="flex-1 bg-red-900 border-2 border-red-500 text-red-400 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-red-800 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <ThumbsDown className="w-5 h-5 fill-current"/> KEEP PASS
                </button>
                <button 
                  onClick={() => handleButton('right')}
                  className="flex-1 bg-black border-2 border-green-500/50 text-green-400 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-green-950/40 hover:border-green-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Heart className="w-5 h-5"/> CHANGE TO SMASH
                </button>
              </>
            )
          ) : (
            <>
              <button 
                onClick={() => handleButton('left')}
                className="flex-1 bg-black border-2 border-red-600/50 text-red-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-red-950/40 hover:border-red-500 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <ThumbsDown className="w-5 h-5"/> PASS
              </button>
              <button 
                onClick={() => handleButton('right')}
                className="flex-1 bg-black border-2 border-green-500/50 text-green-500 font-black text-xs md:text-sm py-4 md:py-5 rounded-2xl hover:bg-green-950/40 hover:border-green-500 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Heart className="w-5 h-5"/> SMASH
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// FALLBACK RED FLAG SCORE
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
