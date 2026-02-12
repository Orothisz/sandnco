"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal, LogOut, Plus, Activity, Clock, 
  CheckCircle, XCircle, AlertTriangle, Search, 
  HeartCrack, Heart, Lock, ChevronRight, User, Shield 
} from "lucide-react";
import Link from "next/link";

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [greeting, setGreeting] = useState("INITIALIZING...");

  // 1. FETCH DATA & AUTH CHECK
  useEffect(() => {
    const getData = async () => {
      // Check Session
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setGreeting(getTimeBasedGreeting());

      // Fetch User's Missions
      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching missions:", error);
      else setRequests(data || []);
      
      setLoading(false);
    };

    getData();
  }, [router]);

  // 2. LOGOUT HANDLER
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // 3. HELPER: Dynamic Greeting
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "GOOD MORNING, OPERATIVE.";
    if (hour < 18) return "GOOD AFTERNOON, AGENT.";
    return "EVENING SHIFT ACTIVE.";
  };

  // 4. HELPER: Status Badge Styles
  const getStatusBadge = (status) => {
    switch (status) {
      case "PENDING": 
        return { color: "text-yellow-400", border: "border-yellow-500/30", bg: "bg-yellow-500/10", icon: <Clock className="w-3 h-3"/>, label: "AWAITING REVIEW" };
      case "ACTIVE": 
        return { color: "text-green-400", border: "border-green-500/50", bg: "bg-green-500/10", icon: <Activity className="w-3 h-3 animate-pulse"/>, label: "MISSION ACTIVE" };
      case "COMPLETED": 
        return { color: "text-blue-400", border: "border-blue-500/30", bg: "bg-blue-500/10", icon: <CheckCircle className="w-3 h-3"/>, label: "MISSION SUCCESS" };
      case "REJECTED": 
        return { color: "text-red-500", border: "border-red-500/30", bg: "bg-red-500/10", icon: <XCircle className="w-3 h-3"/>, label: "MISSION ABORTED" };
      default: 
        return { color: "text-gray-400", border: "border-gray-500", bg: "bg-gray-500/10", icon: <AlertTriangle className="w-3 h-3"/>, label: "UNKNOWN STATUS" };
    }
  };

  // 5. HELPER: Service Icons
  const getServiceIcon = (type) => {
    switch(type) {
      case 'breakup': return <HeartCrack className="w-5 h-5 text-red-500"/>;
      case 'patchup': return <Heart className="w-5 h-5 text-blue-500"/>;
      case 'matchup': return <Search className="w-5 h-5 text-emerald-500"/>;
      default: return <Lock className="w-5 h-5 text-purple-500"/>;
    }
  };

  // --- LOADING STATE ---
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center font-mono text-green-500 text-xs">
        <Terminal className="w-8 h-8 mb-4 animate-pulse"/>
        <div className="flex items-center gap-2">
           <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce"/>
           ESTABLISHING SECURE UPLINK...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] text-gray-200 font-sans selection:bg-red-500 selection:text-black pb-20">
      
      {/* HEADER / NAV */}
      <nav className="border-b border-white/5 bg-[#050510]/80 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/">
            <span className="font-black italic text-xl tracking-tighter">SANDNCO<span className="text-red-600">.LOL</span></span>
          </Link>
          <div className="hidden md:flex px-2 py-0.5 bg-green-900/20 border border-green-500/30 rounded text-[10px] font-mono text-green-400 items-center gap-2">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> ONLINE
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-mono text-gray-500 uppercase">Logged in as</p>
            <p className="text-xs font-bold text-gray-300">{user?.email}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-white transition-colors border border-red-500/20 px-3 py-1.5 rounded hover:bg-red-600 hover:border-transparent"
          >
            <LogOut className="w-3 h-3"/> Abort Session
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto mt-12 px-4">
        
        {/* WELCOME BANNER */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-white/5 pb-8">
          <div>
            <h1 className="text-sm font-mono text-green-500 mb-2 flex items-center gap-2">
               <Terminal className="w-4 h-4"/> {greeting}
            </h1>
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white tracking-tighter">
              Mission <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600">Control</span>
            </h2>
          </div>
          
          <Link href="/request">
            <button className="mt-8 md:mt-0 flex items-center gap-3 bg-white text-black px-8 py-4 font-black text-sm uppercase hover:bg-red-600 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] group">
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Initiate New Protocol
            </button>
          </Link>
        </div>

        {/* --- STATS OVERVIEW (Optional Polish) --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
           <div className="bg-white/5 border border-white/5 p-4 rounded">
              <p className="text-[10px] text-gray-500 font-mono uppercase">Total Missions</p>
              <p className="text-2xl font-black text-white">{requests.length}</p>
           </div>
           <div className="bg-white/5 border border-white/5 p-4 rounded">
              <p className="text-[10px] text-gray-500 font-mono uppercase">Active</p>
              <p className="text-2xl font-black text-green-500">
                {requests.filter(r => r.status === 'ACTIVE').length}
              </p>
           </div>
           <div className="bg-white/5 border border-white/5 p-4 rounded">
              <p className="text-[10px] text-gray-500 font-mono uppercase">Pending</p>
              <p className="text-2xl font-black text-yellow-500">
                {requests.filter(r => r.status === 'PENDING').length}
              </p>
           </div>
           <div className="bg-white/5 border border-white/5 p-4 rounded">
              <p className="text-[10px] text-gray-500 font-mono uppercase">Completed</p>
              <p className="text-2xl font-black text-blue-500">
                {requests.filter(r => r.status === 'COMPLETED').length}
              </p>
           </div>
        </div>

        {/* --- REQUESTS GRID --- */}
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4"/> Operational Log
        </h3>

        {requests.length === 0 ? (
          
          /* EMPTY STATE */
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-24 border border-dashed border-white/10 rounded-lg bg-[#0a0a15]"
          >
             <Shield className="w-16 h-16 text-gray-700 mx-auto mb-6"/>
             <h3 className="text-2xl font-bold text-gray-400 uppercase mb-2">No Active Operations</h3>
             <p className="text-xs font-mono text-gray-600 mb-8 max-w-sm mx-auto">
               You have not initiated any relationship protocols yet. The system is waiting for your command.
             </p>
             <Link href="/request">
               <button className="text-red-500 hover:text-white border-b border-red-500 hover:border-white pb-1 text-xs font-bold uppercase transition-all">
                 START YOUR FIRST MISSION &rarr;
               </button>
             </Link>
          </motion.div>

        ) : (
          
          /* LIST OF REQUESTS */
          <div className="space-y-4">
            {requests.map((req, i) => {
              const badge = getStatusBadge(req.status);
              
              return (
                <motion.div 
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group bg-[#0a0a15] border border-white/10 p-6 md:p-8 rounded-lg hover:border-white/20 transition-all relative overflow-hidden"
                >
                  {/* Status Color Bar (Left) */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${badge.bg.replace('/10', '')}`} />

                  <div className="flex flex-col md:flex-row justify-between gap-6">
                    
                    {/* LEFT COLUMN: MAIN INFO */}
                    <div className="flex gap-6">
                      {/* Icon Box */}
                      <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 bg-white/5 rounded border border-white/5 group-hover:bg-white/10 transition-colors">
                        {getServiceIcon(req.service_type)}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-gray-500">ID: #{req.id}</span>
                          <span className={`text-[9px] px-2 py-0.5 border rounded uppercase font-bold tracking-widest flex items-center gap-1 ${badge.color} ${badge.border} ${badge.bg}`}>
                             {badge.icon} {badge.label}
                          </span>
                        </div>
                        
                        <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
                          OPERATION: {req.service_type}
                        </h3>
                        
                        <div className="flex flex-wrap gap-4 text-xs font-mono text-gray-400">
                          <span className="flex items-center gap-1">
                             <User className="w-3 h-3"/> TARGET: <span className="text-white">{req.target_name || "ALGORITHM"}</span>
                          </span>
                          <span className="flex items-center gap-1">
                             <Clock className="w-3 h-3"/> INITIATED: {new Date(req.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: UPDATES & DETAILS */}
                    <div className="md:w-1/3 flex flex-col justify-between">
                       
                       {/* LATEST UPDATE (Admin Message) */}
                       {req.latest_update ? (
                         <div className="bg-blue-900/10 border border-blue-500/20 p-3 rounded mb-4">
                           <div className="flex items-center gap-2 mb-1">
                             <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"/>
                             <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">New Intel Received</p>
                           </div>
                           <p className="text-xs text-blue-100 font-mono leading-relaxed">
                             "{req.latest_update}"
                           </p>
                         </div>
                       ) : (
                         <div className="bg-white/5 p-3 rounded mb-4 opacity-50">
                           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status Log</p>
                           <p className="text-xs text-gray-600 font-mono">No new updates from field agents.</p>
                         </div>
                       )}
                       
                       {/* Action Footer */}
                       <div className="flex justify-end items-center gap-2 text-[10px] text-gray-600 uppercase font-bold tracking-widest group-hover:text-gray-400 transition-colors">
                         Encrypted Data <Lock className="w-3 h-3"/>
                       </div>
                    </div>

                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

      </main>
    </div>
  );
}
