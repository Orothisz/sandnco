"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  DollarSign, 
  Terminal, 
  Search, 
  Check, 
  X, 
  Eye, 
  Lock, 
  RefreshCw,
  Send,
  FileText,
  AlertTriangle,
  Ban,
  Smartphone,
  Mail
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ------------------------------------------------------------------
// COMPONENT: ADMIN DASHBOARD (GOD MODE)
// ------------------------------------------------------------------

export default function AdminDashboard() {
  const supabase = createClientComponentClient();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0, pending: 0 });
  const [filter, setFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null); // For the Dossier Panel
  const [adminLog, setAdminLog] = useState([]); // Local log of admin actions

  // 1. DATA INGESTION
  const fetchIntel = async () => {
    setLoading(true);
    // Fetch requests joined with profiles to get usernames/phones if needed
    // (Assuming simple join or just fetching requests for now)
    const { data, error } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) {
      setRequests(data);
      calculateStats(data);
    }
    setLoading(false);
  };

  // 2. REALTIME SURVEILLANCE
  useEffect(() => {
    fetchIntel();
    const channel = supabase
      .channel('god-mode-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
        addLog(`SIGNAL DETECTED: DB UPDATE ON ID #${payload.new.id || payload.old.id}`);
        fetchIntel();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 3. LOGIC KERNEL
  const calculateStats = (data) => {
    const active = data.filter(r => r.status === 'ACTIVE').length;
    const pending = data.filter(r => r.status === 'PENDING').length;
    const revenue = data.reduce((acc, curr) => {
      let price = 0;
      if (curr.service_type?.includes('breakup')) price = 999;
      if (curr.service_type?.includes('patchup')) price = 1499;
      if (curr.service_type?.includes('matchup')) price = 1999;
      if (curr.service_type?.includes('vip')) price = 2700;
      return acc + price;
    }, 0);

    setStats({ total: data.length, active, pending, revenue });
  };

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString('en-GB');
    setAdminLog(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
  };

  // 4. COMMAND EXECUTION
  const updateStatus = async (id, newStatus, e) => {
    if (e) e.stopPropagation(); // Prevent opening the drawer
    await supabase.from("requests").update({ status: newStatus }).eq("id", id);
    addLog(`COMMAND EXECUTED: ID #${id} STATUS -> ${newStatus}`);
  };

  const sendIntelUpdate = async (id, message) => {
    // Appends to the log history in 'additional_details' or updates 'latest_update'
    // Here we update 'latest_update' for the "Live Intel" box on user dashboard
    const { error } = await supabase
        .from("requests")
        .update({ latest_update: message })
        .eq("id", id);
    
    if (!error) addLog(`INTEL SENT TO AGENT #${id}: "${message}"`);
  };

  // 5. FILTERING
  const filteredRequests = requests.filter(r => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-6 selection:bg-green-900 selection:text-white overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-green-900/50 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-3 glitch-text">
            <ShieldAlert className="w-8 h-8 animate-pulse text-red-600" />
            GOD_MODE // <span className="text-white">OVERWATCH</span>
          </h1>
          <p className="text-xs text-gray-500 mt-2 font-bold tracking-widest">
            SECURE CONNECTION ESTABLISHED: ADMIN@SANDNCO.LOL
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
             <span className="text-[10px] text-gray-600">SERVER TIME</span>
             <span className="text-xs font-bold text-white">{new Date().toLocaleTimeString()}</span>
          </div>
          <button onClick={fetchIntel} className="p-3 border border-green-900/30 hover:bg-green-900/20 rounded transition-all active:scale-95">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="bg-red-900/10 text-red-500 px-4 py-2 rounded text-xs font-bold border border-red-500/30 animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" /> LIVE
          </div>
        </div>
      </header>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard label="TOTAL DOSSIERS" value={stats.total} icon={<Users className="w-5 h-5" />} />
        <StatsCard label="PENDING REVIEW" value={stats.pending} icon={<AlertTriangle className="w-5 h-5 text-yellow-500" />} color="text-yellow-500" />
        <StatsCard label="ACTIVE MISSIONS" value={stats.active} icon={<Activity className="w-5 h-5 text-red-500" />} color="text-red-500" />
        <StatsCard label="REVENUE (WAIVED)" value={`₹${stats.revenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
      </div>

      {/* MAIN CONSOLE AREA */}
      <div className="flex-1 flex gap-6 overflow-hidden relative">
        
        {/* LEFT PANEL: TABLE */}
        <div className={`flex-1 bg-[#050505] border border-green-900/30 rounded-lg overflow-hidden flex flex-col transition-all duration-300 ${selectedRequest ? 'w-2/3 hidden md:flex' : 'w-full'}`}>
          
          {/* TOOLBAR */}
          <div className="p-4 border-b border-green-900/30 flex flex-wrap gap-4 items-center justify-between bg-green-900/5">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {["ALL", "PENDING", "ACTIVE", "COMPLETED", "REJECTED"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase rounded border transition-all whitespace-nowrap ${
                    filter === f 
                      ? "bg-green-500 text-black border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" 
                      : "bg-transparent border-green-900/50 text-gray-500 hover:border-green-500/50 hover:text-green-400"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
              <input 
                type="text" 
                placeholder="SEARCH ID..." 
                className="bg-black border border-green-900/30 pl-10 pr-4 py-1.5 text-xs text-green-500 focus:outline-none focus:border-green-500 w-40 md:w-64 rounded placeholder:text-gray-800"
              />
            </div>
          </div>

          {/* DATA TABLE */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-green-900/10 text-gray-400 uppercase tracking-widest sticky top-0 backdrop-blur-sm z-10">
                <tr>
                  <th className="p-4">Status</th>
                  <th className="p-4">ID / Created</th>
                  <th className="p-4">Operative</th>
                  <th className="p-4">Target / Obj</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-900/20">
                {filteredRequests.map((req) => (
                  <motion.tr 
                    key={req.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => setSelectedRequest(req)}
                    className={`cursor-pointer transition-colors group ${selectedRequest?.id === req.id ? 'bg-green-900/20 border-l-2 border-green-500' : 'hover:bg-green-900/5 border-l-2 border-transparent'}`}
                  >
                    <td className="p-4">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="p-4 font-mono text-gray-500">
                      <span className="text-white font-bold">#{req.id}</span>
                      <div className="text-[10px] mt-1">{new Date(req.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-300 font-bold truncate max-w-[120px]">{req.user_email?.split('@')[0] || "Unknown"}</div>
                      <div className="text-[10px] text-gray-600 truncate max-w-[100px]">Agent</div>
                    </td>
                    <td className="p-4">
                      <div className="text-white font-bold uppercase truncate max-w-[150px]">{req.target_name}</div>
                      <div className="text-[10px] text-gray-500 uppercase">{req.service_type}</div>
                    </td>
                    <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {req.status === 'PENDING' && (
                          <>
                            <ActionButton onClick={(e) => updateStatus(req.id, 'ACTIVE', e)} icon={<Check className="w-3 h-3" />} color="text-green-500" bg="bg-green-900/20" border="border-green-500/50" />
                            <ActionButton onClick={(e) => updateStatus(req.id, 'REJECTED', e)} icon={<X className="w-3 h-3" />} color="text-red-500" bg="bg-red-900/20" border="border-red-500/50" />
                          </>
                        )}
                        <ActionButton onClick={() => setSelectedRequest(req)} icon={<Eye className="w-3 h-3" />} color="text-blue-400" bg="bg-blue-900/20" border="border-blue-500/50" />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <div className="p-20 text-center text-gray-600 font-mono flex flex-col items-center">
                <Search className="w-12 h-12 mb-4 opacity-20" />
                NO DATA FOUND IN THIS SECTOR.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: DOSSIER INSPECTOR (SLIDE-OVER) */}
        <AnimatePresence>
          {selectedRequest && (
            <motion.div 
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-full md:w-[450px] bg-[#080808] border border-green-900/50 rounded-lg flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)] absolute md:relative inset-0 z-20"
            >
              {/* DOSSIER HEADER */}
              <div className="p-6 border-b border-green-900/30 flex justify-between items-start bg-green-900/5">
                <div>
                   <h2 className="text-xl font-black text-white uppercase flex items-center gap-2">
                     <FileText className="w-5 h-5 text-green-500" />
                     MISSION #{selectedRequest.id}
                   </h2>
                   <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase">
                     SECURE FILE // {selectedRequest.service_type}
                   </p>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* DOSSIER BODY */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* 1. STATUS CONTROL */}
                <div className="bg-black border border-gray-800 p-4 rounded">
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-3">Mission Status</label>
                  <div className="grid grid-cols-2 gap-2">
                     {['PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED'].map(s => (
                       <button 
                         key={s}
                         onClick={() => updateStatus(selectedRequest.id, s)}
                         className={`text-xs py-2 px-2 border rounded font-bold transition-all ${selectedRequest.status === s ? 'bg-white text-black border-white' : 'bg-transparent text-gray-600 border-gray-800 hover:border-gray-500'}`}
                       >
                         {s}
                       </button>
                     ))}
                  </div>
                </div>

                {/* 2. TARGET INTEL */}
                <div>
                   <label className="text-[10px] text-green-500 uppercase font-bold tracking-widest block mb-2 border-b border-green-900/30 pb-1">Target Intelligence</label>
                   <div className="space-y-4">
                      <div>
                        <span className="text-xs text-gray-500 block">TARGET NAME</span>
                        <span className="text-lg text-white font-bold">{selectedRequest.target_name}</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 block">BRIEFING NOTES</span>
                        <p className="text-sm text-gray-300 font-mono bg-gray-900/50 p-3 rounded border border-gray-800 leading-relaxed">
                          "{selectedRequest.additional_details || "No additional intelligence provided."}"
                        </p>
                      </div>
                   </div>
                </div>

                {/* 3. OPERATIVE DATA */}
                <div>
                   <label className="text-[10px] text-green-500 uppercase font-bold tracking-widest block mb-2 border-b border-green-900/30 pb-1">Operative Details</label>
                   <div className="grid grid-cols-1 gap-3">
                      <div className="flex items-center gap-3 p-2 bg-gray-900/30 rounded border border-gray-800/50">
                         <Mail className="w-4 h-4 text-gray-500" />
                         <span className="text-xs text-gray-300">{selectedRequest.user_email || "Encrypted"}</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-900/30 rounded border border-gray-800/50">
                         <Smartphone className="w-4 h-4 text-gray-500" />
                         <span className="text-xs text-gray-300">{selectedRequest.phone || "No Burner Phone"}</span>
                      </div>
                      <button className="text-xs text-red-500 flex items-center gap-2 hover:underline mt-2">
                        <Ban className="w-3 h-3" /> DISAVOW AGENT (BAN)
                      </button>
                   </div>
                </div>

                {/* 4. LIVE COMMS */}
                <div>
                   <label className="text-[10px] text-green-500 uppercase font-bold tracking-widest block mb-2 border-b border-green-900/30 pb-1">Direct Comms Uplink</label>
                   <div className="bg-black border border-green-900/50 rounded p-3">
                      <textarea 
                        id="intel-box"
                        className="w-full bg-transparent text-xs text-green-400 font-mono focus:outline-none resize-none placeholder:text-green-900"
                        rows="3"
                        placeholder="TYPE INTEL UPDATE FOR AGENT..."
                      ></textarea>
                      <div className="flex justify-between items-center mt-2 border-t border-green-900/30 pt-2">
                        <span className="text-[10px] text-green-700 animate-pulse">● SECURE LINE OPEN</span>
                        <button 
                          onClick={() => {
                            const msg = document.getElementById('intel-box').value;
                            if(msg) {
                              sendIntelUpdate(selectedRequest.id, msg);
                              document.getElementById('intel-box').value = "";
                            }
                          }}
                          className="bg-green-600 hover:bg-green-500 text-black text-xs font-bold px-4 py-1 rounded flex items-center gap-2"
                        >
                          TRANSMIT <Send className="w-3 h-3" />
                        </button>
                      </div>
                   </div>
                   <p className="text-[10px] text-gray-600 mt-2 italic">
                     * This message will appear instantly on the agent's dashboard.
                   </p>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* FOOTER TERMINAL */}
      <div className="mt-4 bg-black border-t border-green-900/30 pt-2 h-24 overflow-hidden flex flex-col">
        <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-2">
           <Terminal className="w-3 h-3" /> SYSTEM LOGS
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-green-900/80 space-y-1">
           {adminLog.map((log, i) => (
             <div key={i} className="hover:text-green-500 transition-colors cursor-default">{log}</div>
           ))}
           <div className="text-green-500/30 animate-pulse">_ AWAITING INPUT...</div>
        </div>
      </div>

    </div>
  );
}

// ------------------------------------------------------------------
// SUB-COMPONENTS
// ------------------------------------------------------------------

const StatsCard = ({ label, value, icon, color = "text-green-500" }) => (
  <div className="bg-[#050505] border border-green-900/30 p-4 md:p-6 rounded relative overflow-hidden group hover:border-green-500/30 transition-all">
    <div className="absolute right-4 top-4 opacity-50 grayscale group-hover:grayscale-0 transition-all group-hover:scale-110">
      {icon}
    </div>
    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{label}</div>
    <div className={`text-2xl md:text-3xl font-black ${color} tracking-tighter`}>{value}</div>
    <div className="absolute bottom-0 left-0 h-1 bg-green-900/20 w-full">
      <div className={`h-full ${color.replace('text', 'bg')} opacity-20 w-[60%]`}></div>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    PENDING: "bg-yellow-900/10 text-yellow-500 border-yellow-500/20",
    ACTIVE: "bg-red-900/10 text-red-500 border-red-500/20 animate-pulse",
    COMPLETED: "bg-green-900/10 text-green-500 border-green-500/20",
    REJECTED: "bg-gray-800 text-gray-500 border-gray-700",
  };
  return (
    <span className={`px-2 py-1 rounded border text-[10px] font-bold uppercase tracking-widest ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
};

const ActionButton = ({ onClick, icon, color, bg, border }) => (
  <button 
    onClick={onClick} 
    className={`p-2 rounded border transition-all hover:scale-105 active:scale-95 ${bg} ${color} ${border} hover:opacity-100`}
  >
    {icon}
  </button>
);
