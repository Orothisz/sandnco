"use client";

import { useEffect, useState, useCallback } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, LogOut, Plus, Activity, Clock, 
  CheckCircle, XCircle, AlertTriangle, Search, 
  HeartCrack, Heart, Lock, ChevronRight, User, Shield,
  Database, Crosshair, Zap, Trash2, Flame
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [minderProfile, setMinderProfile] = useState(null);
  const [greeting, setGreeting] = useState("INITIALIZING...");
  const [activeTab, setActiveTab] = useState("MISSIONS"); // 'MISSIONS' or 'MINDER'
  const [purging, setPurging] = useState(false);

  // --- AUDIO NOTIFICATION LOGIC ---
  const playNotificationSound = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.type = "square";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio blocked by browser policy until user interaction.");
    }
  }, []);

  // --- INITIAL DATA FETCH ---
  const fetchIntel = useCallback(async (sessionUser) => {
    const [reqRes, minderRes] = await Promise.all([
      supabase.from("requests").select("*").eq("user_id", sessionUser.id).order("created_at", { ascending: false }),
      supabase.from("minder_targets").select("*").eq("user_id", sessionUser.id).maybeSingle()
    ]);

    if (reqRes.error) console.error("Error fetching missions:", reqRes.error);
    else setRequests(reqRes.data || []);

    if (minderRes.error && minderRes.error.code !== 'PGRST116') console.error("Error fetching minder:", minderRes.error);
    else setMinderProfile(minderRes.data || null);

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setUser(session.user);
      setGreeting(getTimeBasedGreeting());
      await fetchIntel(session.user);
    };

    initData();
  }, [router, supabase, fetchIntel]);

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-missions-feed')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests', filter: `user_id=eq.${user.id}` }, (payload) => {
          playNotificationSound();
          setRequests((current) => current.map((req) => (req.id === payload.new.id ? payload.new : req)));
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'minder_targets', filter: `user_id=eq.${user.id}` }, () => {
          fetchIntel(user);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user, supabase, playNotificationSound, fetchIntel]);

  // --- ACTIONS ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handlePurgeMinder = async () => {
    if (!minderProfile) return;
    const confirm = window.confirm("WARNING: PURGING DOSSIER IS IRREVERSIBLE. YOU WILL BE REMOVED FROM THE GRID. PROCEED?");
    if (!confirm) return;

    setPurging(true);
    const { error } = await supabase.from('minder_targets').delete().eq('id', minderProfile.id);
    if (!error) {
      setMinderProfile(null);
      playNotificationSound();
    }
    setPurging(false);
  };

  // --- HELPERS ---
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "GOOD MORNING, OPERATIVE.";
    if (hour < 18) return "GOOD AFTERNOON, AGENT.";
    return "EVENING SHIFT ACTIVE.";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING": return { color: "text-amber-400", border: "border-amber-400/30", bg: "bg-amber-400/10", icon: <Clock className="w-3 h-3"/>, label: "AWAITING REVIEW" };
      case "ACTIVE": return { color: "text-emerald-400", border: "border-emerald-500/50", bg: "bg-emerald-500/10", icon: <Activity className="w-3 h-3 animate-pulse"/>, label: "MISSION ACTIVE" };
      case "COMPLETED": return { color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", icon: <CheckCircle className="w-3 h-3"/>, label: "MISSION SUCCESS" };
      case "REJECTED": return { color: "text-gray-500", border: "border-gray-500/30", bg: "bg-gray-500/10", icon: <XCircle className="w-3 h-3"/>, label: "MISSION ABORTED" };
      default: return { color: "text-red-500", border: "border-red-500/30", bg: "bg-red-500/10", icon: <AlertTriangle className="w-3 h-3"/>, label: "UNKNOWN STATUS" };
    }
  };

  const getServiceIcon = (type) => {
    const t = String(type || '').toLowerCase();
    if (t.includes('breakup')) return <HeartCrack className="w-5 h-5 text-red-500"/>;
    if (t.includes('patchup')) return <Heart className="w-5 h-5 text-blue-500"/>;
    if (t.includes('matchup')) return <Search className="w-5 h-5 text-emerald-500"/>;
    return <Lock className="w-5 h-5 text-purple-500"/>;
  };

  // --- ANIMATION VARIANTS ---
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#050505] flex flex-col items-center justify-center font-mono text-emerald-500 text-xs">
        <Terminal className="w-8 h-8 mb-4 animate-pulse"/>
        <div className="flex items-center gap-2 tracking-widest uppercase font-black">
           <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"/>
           DECRYPTING DASHBOARD...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#050505] text-[#ededed] font-sans selection:bg-red-900 selection:text-white flex flex-col relative overflow-hidden">
      
      {/* FLAGSHIP BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [transform:perspective(1000px)_rotateX(60deg)_translateY(-100px)_translateZ(-200px)] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
      </div>

      {/* TOP NAVIGATION */}
      <nav className="border-b border-white/10 bg-[#0a0a0a]/90 backdrop-blur-xl px-6 py-5 flex flex-wrap justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-black italic text-2xl tracking-tighter drop-shadow-md text-white">SANDNCO<span className="text-red-600">.LOL</span></span>
          </Link>
          <div className="hidden md:flex px-3 py-1 bg-emerald-900/20 border border-emerald-500/30 rounded-full text-[9px] font-black tracking-widest text-emerald-400 items-center gap-2 uppercase">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/> UPLINK ACTIVE
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[9px] font-black tracking-widest text-gray-500 uppercase">Authenticated As</p>
            <p className="text-xs font-bold text-gray-300 tracking-wide">{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-white transition-colors border border-red-500/30 px-4 py-2 rounded hover:bg-red-600 flex items-center gap-2">
            <LogOut className="w-3 h-3"/> <span className="hidden sm:inline">ABORT SESSION</span>
          </button>
        </div>
      </nav>

      <main className="max-w-[1200px] w-full mx-auto mt-12 px-6 relative z-10 pb-20">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-8 gap-6">
          <div>
            <h1 className="text-xs font-black tracking-widest uppercase text-emerald-500 mb-3 flex items-center gap-2">
               <Terminal className="w-4 h-4"/> {greeting}
            </h1>
            <h2 className="text-5xl md:text-6xl font-black uppercase text-white tracking-tighter">
              AGENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">DASHBOARD</span>
            </h2>
          </div>
          
          <Link href="/request">
            <button className="w-full md:w-auto flex items-center justify-center gap-3 bg-white text-black px-8 py-4 font-black text-xs tracking-widest uppercase hover:bg-red-600 hover:text-white transition-all group shadow-[0_0_30px_rgba(255,255,255,0.2)] rounded-xl">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> INITIATE NEW PROTOCOL
            </button>
          </Link>
        </div>

        {/* TACTICAL TAB SWITCHER */}
        <div className="flex gap-2 mb-10 overflow-x-auto no-scrollbar pb-2">
           <button 
             onClick={() => setActiveTab("MISSIONS")}
             className={`px-8 py-3 text-[10px] md:text-xs font-black tracking-widest uppercase transition-all flex items-center gap-3 rounded-full border ${activeTab === 'MISSIONS' ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-[#0a0a0a] text-gray-500 border-white/10 hover:border-white/30 hover:text-white'}`}
           >
             <Shield className="w-4 h-4" /> ACTIVE MISSIONS
           </button>
           <button 
             onClick={() => setActiveTab("MINDER")}
             className={`px-8 py-3 text-[10px] md:text-xs font-black tracking-widest uppercase transition-all flex items-center gap-3 rounded-full border ${activeTab === 'MINDER' ? 'bg-pink-600 text-white border-pink-500 shadow-[0_0_20px_rgba(219,39,119,0.4)]' : 'bg-[#0a0a0a] text-pink-500/50 border-pink-500/20 hover:border-pink-500/50 hover:text-pink-400'}`}
           >
             <Crosshair className="w-4 h-4" /> MINDER DOSSIER
           </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: MISSIONS */}
        {/* ========================================================= */}
        {activeTab === "MISSIONS" && (
          <motion.div variants={containerVars} initial="hidden" animate="show" className="space-y-6">
            
            {/* Quick Stats */}
            <motion.div variants={itemVars} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 font-mono">
               <StatBox label="Total Dossiers" value={requests.length} color="text-white" />
               <StatBox label="Field Active" value={requests.filter(r => r.status === 'ACTIVE').length} color="text-emerald-400" />
               <StatBox label="Reviewing" value={requests.filter(r => r.status === 'PENDING').length} color="text-amber-400" />
               <StatBox label="Completed" value={requests.filter(r => r.status === 'COMPLETED').length} color="text-blue-400" />
            </motion.div>

            {requests.length === 0 ? (
              <motion.div variants={itemVars} className="text-center py-32 border border-dashed border-white/10 rounded-3xl bg-[#0a0a0a]/50 backdrop-blur-md">
                 <Shield className="w-16 h-16 text-gray-700 mx-auto mb-6 opacity-50"/>
                 <h3 className="text-2xl font-black text-gray-400 uppercase tracking-widest mb-3">No Active Operations</h3>
                 <p className="text-xs font-mono text-gray-600 mb-8 max-w-sm mx-auto">Establish mission parameters to begin surveillance and field operations.</p>
                 <Link href="/request">
                   <button className="text-red-500 hover:text-white border-b border-red-500 hover:border-white pb-1 text-[10px] font-black tracking-widest uppercase transition-all">
                     START FIRST MISSION &rarr;
                   </button>
                 </Link>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => {
                  const badge = getStatusBadge(req.status);
                  return (
                    <motion.div 
                      variants={itemVars}
                      key={req.id}
                      className="group bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-2xl hover:border-white/30 transition-all relative overflow-hidden shadow-lg"
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${badge.color.replace('text-', 'bg-')}`} />

                      <div className="flex flex-col md:flex-row justify-between gap-6">
                        <div className="flex gap-6 items-center md:items-start">
                          <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 bg-white/5 rounded-xl border border-white/10 shrink-0 shadow-inner">
                            {getServiceIcon(req.service_type)}
                          </div>

                          <div className="space-y-3 w-full">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">UPLINK: #{String(req.id).split('-')[0]}</span>
                              <span className={`text-[8px] px-2.5 py-1 border rounded uppercase font-black tracking-widest flex items-center gap-1.5 ${badge.color} ${badge.border} ${badge.bg}`}>
                                 {badge.icon} {badge.label}
                              </span>
                            </div>
                            
                            <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                              {req.service_type} <span className="text-gray-600 italic font-normal">Protocol</span>
                            </h3>
                            
                            <div className="flex flex-wrap gap-4 text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest bg-black/50 p-3 rounded border border-white/5 w-fit">
                              <span className="flex items-center gap-2">
                                 <User className="w-3 h-3 text-gray-400"/> TARGET: <span className="text-gray-200">{req.target_name || "ALGORITHM"}</span>
                              </span>
                              <span className="flex items-center gap-2 border-l border-gray-800 pl-4">
                                 <Clock className="w-3 h-3 text-gray-400"/> {new Date(req.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="md:w-[300px] shrink-0">
                           <AnimatePresence mode="wait">
                             {req.latest_update ? (
                               <motion.div 
                                 key={req.latest_update}
                                 initial={{ opacity: 0, scale: 0.95 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 className="bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl shadow-inner h-full"
                               >
                                 <div className="flex items-center gap-2 mb-2">
                                   <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                                   <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">DIRECT INTEL UPDATE</p>
                                 </div>
                                 <p className="text-xs text-emerald-100 font-mono italic leading-relaxed">"{req.latest_update}"</p>
                               </motion.div>
                             ) : (
                               <div className="bg-white/5 p-4 rounded-xl opacity-50 border border-white/5 h-full flex flex-col justify-center">
                                 <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">STATUS LOG</p>
                                 <p className="text-xs text-gray-600 font-mono italic">Awaiting operative field report...</p>
                               </div>
                             )}
                           </AnimatePresence>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: MINDER DOSSIER */}
        {/* ========================================================= */}
        {activeTab === "MINDER" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center">
             {!minderProfile ? (
               <div className="text-center p-12 md:p-20 border border-pink-500/20 bg-[#0a0a0f] rounded-[3rem] max-w-2xl w-full shadow-[0_0_50px_rgba(219,39,119,0.1)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                  <Crosshair className="w-16 h-16 text-pink-600 mx-auto mb-6 opacity-80" />
                  <h3 className="text-3xl font-black uppercase text-white mb-3 tracking-tighter">NO DOSSIER FOUND</h3>
                  <p className="text-xs text-gray-400 mb-10 tracking-widest uppercase font-bold leading-relaxed max-w-sm mx-auto">
                    You are currently a ghost on the Minder Grid. Inject your dossier to become an active target.
                  </p>
                  <Link href="/minder/enroll">
                    <button className="bg-pink-600 text-white font-black text-xs uppercase px-10 py-5 tracking-[0.3em] hover:bg-pink-500 transition-all shadow-[0_0_40px_rgba(219,39,119,0.4)] rounded-full hover:scale-105 active:scale-95 flex items-center justify-center gap-3 mx-auto">
                      <Zap className="w-4 h-4 fill-current" /> INJECT DOSSIER NOW
                    </button>
                  </Link>
               </div>
             ) : (
               <div className="flex flex-col md:flex-row gap-10 items-center md:items-start max-w-4xl w-full">
                 
                 {/* ID CARD REPLICA */}
                 <div className="w-full max-w-[320px] aspect-[3/4] rounded-[2.5rem] bg-black border-2 border-pink-500/50 relative overflow-hidden shadow-[0_0_60px_rgba(219,39,119,0.2)] group shrink-0">
                    <img src={minderProfile.image_url} className="w-full h-full object-cover" alt="Profile" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent pointer-events-none" />
                    <div className="absolute top-6 left-0 w-full bg-pink-600 text-white py-2 font-black text-center tracking-[0.4em] text-[9px] uppercase z-30 shadow-lg flex items-center justify-center gap-2">
                      <Database className="w-3 h-3" /> ACTIVE GRID TARGET
                    </div>
                    
                    <div className="absolute bottom-0 w-full p-6 bg-gradient-to-t from-black to-transparent z-20">
                       <h2 className="text-3xl font-black uppercase text-white tracking-tighter drop-shadow-lg flex items-center gap-2 truncate">
                         {minderProfile.alias} <span className="text-lg text-gray-400 font-normal">{minderProfile.age}</span>
                       </h2>
                       <div className="text-[10px] font-black text-white bg-pink-900/80 w-fit px-3 py-1.5 mt-2 rounded border border-pink-500/50 flex items-center gap-2">
                         <Terminal className="w-3 h-3 text-pink-400" /> @{minderProfile.instagram_id}
                       </div>
                       <p className="text-xs text-gray-300 mt-4 font-medium leading-relaxed italic bg-black/60 p-3 rounded-xl border border-white/10 backdrop-blur-md line-clamp-3">
                         "{minderProfile.bio}"
                       </p>
                    </div>
                 </div>

                 {/* MANAGEMENT CONTROLS */}
                 <div className="flex-1 w-full space-y-6">
                    <div className="bg-[#0a0a0f] border border-white/10 p-8 rounded-3xl relative overflow-hidden">
                       <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2 flex items-center gap-3">
                         <Shield className="w-5 h-5 text-gray-500" /> DOSSIER MANAGEMENT
                       </h3>
                       <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-8">Current Status: Visibile on Grid</p>
                       
                       <div className="space-y-4">
                         <Link href="/minder/enroll" className="block">
                           <button className="w-full bg-white/5 border border-white/10 text-white font-black text-xs uppercase px-6 py-4 tracking-[0.2em] hover:bg-white/10 transition-all rounded-xl flex items-center justify-center gap-3 active:scale-95">
                             <Zap className="w-4 h-4 text-pink-500" /> UPDATE INTEL (OVERWRITE)
                           </button>
                         </Link>
                         <button 
                           onClick={handlePurgeMinder}
                           disabled={purging}
                           className="w-full bg-red-950/30 border border-red-500/50 text-red-500 font-black text-xs uppercase px-6 py-4 tracking-[0.2em] hover:bg-red-900/50 transition-all rounded-xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                         >
                           {purging ? <Activity className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} 
                           {purging ? 'PURGING...' : 'PURGE DOSSIER PERMANENTLY'}
                         </button>
                       </div>
                    </div>

                    <div className="bg-pink-950/20 border border-pink-500/20 p-6 rounded-2xl">
                      <p className="text-[10px] text-pink-400 font-mono uppercase tracking-widest leading-relaxed flex items-start gap-3">
                        <Flame className="w-4 h-4 shrink-0 mt-0.5" />
                        By maintaining this dossier, you consent to the Smash/Pass doctrine. Your profile is currently being rendered to other operatives globally.
                      </p>
                    </div>
                 </div>

               </div>
             )}
          </motion.div>
        )}

      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

// Sub-component for quick stats
function StatBox({ label, value, color }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/10 p-5 rounded-2xl flex flex-col justify-between hover:border-white/30 transition-colors">
       <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-3">{label}</span>
       <span className={`text-3xl font-black tracking-tighter ${color}`}>{value}</span>
    </div>
  );
}
