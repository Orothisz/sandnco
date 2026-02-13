"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Activity, Users, DollarSign, Terminal, Search, Check, X, Eye, Lock, 
  RefreshCw, Send, FileText, AlertTriangle, Ban, Smartphone, Mail, MessageSquare,
  Crosshair, Upload, Image as ImageIcon, PlusSquare, Database
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const supabase = createClientComponentClient();
  const fileInputRef = useRef(null);
  
  // GLOBAL STATE
  const [activeTab, setActiveTab] = useState("MISSIONS"); // 'MISSIONS' or 'MINDER'
  const [adminLog, setAdminLog] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0, pending: 0, grid_count: 0 });

  // MISSIONS STATE
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [commsMessage, setCommsMessage] = useState("");
  const [sendingComms, setSendingComms] = useState(false);

  // MINDER INJECTION STATE
  const [injecting, setInjecting] = useState(false);
  const [minderForm, setMinderForm] = useState({
    alias: "",
    age: "",
    bio: "",
    instagram_id: "",
    file: null,
    preview: null
  });

  // 1. DATA INGESTION
  const fetchIntel = async () => {
    // Fetch Requests
    const { data: reqData, error: reqError } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch Minder Grid Count
    const { count: gridCount } = await supabase
      .from("minder_targets")
      .select("*", { count: 'exact', head: true });

    if (!reqError) {
      setRequests(reqData);
      calculateStats(reqData, gridCount || 0);
      
      if (selectedRequest) {
        const updatedSelected = reqData.find(r => r.id === selectedRequest.id);
        if (updatedSelected) setSelectedRequest(updatedSelected);
      }
    } else {
      console.error("Intel Fetch Failed:", reqError);
    }
    setLoading(false);
  };

  // 2. REALTIME SURVEILLANCE
  useEffect(() => {
    fetchIntel();

    const channel = supabase
      .channel('god-mode-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
          addLog(`SIGNAL: REQUEST UPDATE ON ID #${payload.new.id || payload.old.id}`);
          fetchIntel(); 
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'minder_targets' }, (payload) => {
          addLog(`SIGNAL: NEW TARGET ADDED TO MINDER GRID [${payload.new.alias}]`);
          fetchIntel();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [supabase]);

  // 3. LOGIC KERNEL
  const calculateStats = (data, gridCount) => {
    const active = data.filter(r => r.status === 'ACTIVE').length;
    const pending = data.filter(r => r.status === 'PENDING').length;
    const revenue = data.reduce((acc, curr) => {
      let price = 0;
      const type = curr.service_type?.toLowerCase() || '';
      if (type.includes('breakup')) price = 999;
      if (type.includes('patchup')) price = 1499;
      if (type.includes('matchup')) price = 1999;
      if (type.includes('vip')) price = 2700;
      return acc + price;
    }, 0);

    setStats({ total: data.length, active, pending, revenue, grid_count: gridCount });
  };

  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString('en-GB');
    setAdminLog(prev => [`[${timestamp}] ${msg}`, ...prev].slice(0, 50));
  };

  // 4. MISSIONS: COMMAND EXECUTION
  const updateStatus = async (id, newStatus, e) => {
    if (e) e.stopPropagation();
    
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (selectedRequest?.id === id) setSelectedRequest(prev => ({ ...prev, status: newStatus }));

    const { error } = await supabase.from("requests").update({ status: newStatus }).eq("id", id);
    
    if (error) {
        addLog(`ERROR: COMMAND FAILED ON ID #${id}`);
        fetchIntel(); 
    } else {
        addLog(`COMMAND EXECUTED: ID #${id} STATUS -> ${newStatus}`);
    }
  };

  const sendIntelUpdate = async () => {
    if (!commsMessage.trim() || !selectedRequest) return;
    setSendingComms(true);

    const { error } = await supabase
        .from("requests")
        .update({ latest_update: commsMessage })
        .eq("id", selectedRequest.id);
    
    if (!error) {
        addLog(`INTEL TRANSMITTED TO AGENT #${selectedRequest.id}`);
        setCommsMessage(""); 
    } else {
        addLog(`TRANSMISSION FAILED: ${error.message}`);
    }
    setSendingComms(false);
  };

  // 5. MINDER: GRID INJECTION LOGIC
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMinderForm({
        ...minderForm,
        file: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const handleInjectTarget = async (e) => {
    e.preventDefault();
    if (!minderForm.file || !minderForm.alias || !minderForm.age) {
      return addLog("ERROR: INCOMPLETE INTEL FOR GRID INJECTION.");
    }

    setInjecting(true);
    addLog("UPLOADING ASSET TO MINDER BUCKET...");

    try {
      // 1. Upload Image (Admin Bypasses Gemini)
      const fileExt = minderForm.file.name.split('.').pop();
      const fileName = `admin-inject-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('minder_assets')
        .upload(fileName, minderForm.file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('minder_assets')
        .getPublicUrl(fileName);

      // 2. Insert Record
      const { error: dbError } = await supabase.from('minder_targets').insert([{
        alias: minderForm.alias,
        age: parseInt(minderForm.age),
        bio: minderForm.bio,
        instagram_id: minderForm.instagram_id.replace('@', ''),
        image_url: publicUrlData.publicUrl,
        entity_type: 'human' // Can be anything, Admin has God Mode
      }]);

      if (dbError) throw dbError;

      addLog(`SUCCESS: TARGET [${minderForm.alias}] INJECTED INTO LIVE GRID.`);
      
      // Reset Form
      setMinderForm({ alias: '', age: '', bio: '', instagram_id: '', file: null, preview: null });
      fetchIntel();

    } catch (err) {
      console.error(err);
      addLog(`INJECTION FAILED: ${err.message}`);
    }
    setInjecting(false);
  };

  const filteredRequests = requests.filter(r => filter === "ALL" || r.status === filter);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4 md:p-6 selection:bg-green-900 selection:text-white overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-green-900/50 pb-6 gap-4">
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
          <button onClick={fetchIntel} className="p-3 border border-green-900/30 hover:bg-green-900/20 rounded transition-all active:scale-95 group">
            <RefreshCw className={`w-5 h-5 group-hover:rotate-180 transition-transform ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="bg-red-900/10 text-red-500 px-4 py-2 rounded text-xs font-bold border border-red-500/30 animate-pulse flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" /> LIVE FEED
          </div>
        </div>
      </header>

      {/* TACTICAL TAB SWITCHER */}
      <div className="flex gap-4 mb-6">
         <button 
           onClick={() => setActiveTab("MISSIONS")}
           className={`px-6 py-2 text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'MISSIONS' ? 'bg-green-600 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-green-900/10 text-green-600 border border-green-900/50 hover:bg-green-900/30'}`}
         >
           <FileText className="w-4 h-4" /> MISSIONS
         </button>
         <button 
           onClick={() => setActiveTab("MINDER")}
           className={`px-6 py-2 text-xs font-black tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'MINDER' ? 'bg-pink-600 text-white shadow-[0_0_15px_rgba(219,39,119,0.4)]' : 'bg-pink-900/10 text-pink-600 border border-pink-900/50 hover:bg-pink-900/30'}`}
         >
           <Database className="w-4 h-4" /> MINDER GRID
         </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatsCard label="TOTAL DOSSIERS" value={stats.total} icon={<Users className="w-5 h-5" />} />
        <StatsCard label="ACTIVE MISSIONS" value={stats.active} icon={<Activity className="w-5 h-5 text-red-500" />} color="text-red-500" />
        <StatsCard label="REVENUE (WAIVED)" value={`₹${stats.revenue.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        <StatsCard label="MINDER TARGETS" value={stats.grid_count} icon={<Crosshair className="w-5 h-5 text-pink-500" />} color="text-pink-500" />
      </div>

      {/* ========================================================= */}
      {/* TAB 1: MISSIONS CONSOLE                                   */}
      {/* ========================================================= */}
      {activeTab === "MISSIONS" && (
        <div className="flex-1 flex gap-6 overflow-hidden relative min-h-[500px]">
          
          {/* LEFT PANEL: TABLE */}
          <div className={`flex-1 bg-[#050505] border border-green-900/30 rounded-lg overflow-hidden flex flex-col transition-all duration-300 ${selectedRequest ? 'w-2/3 hidden md:flex' : 'w-full'}`}>
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
            </div>

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
                      <td className="p-4"><StatusBadge status={req.status} /></td>
                      <td className="p-4 font-mono text-gray-500">
                        <span className="text-white font-bold">#{req.id}</span>
                        <div className="text-[10px] mt-1">{new Date(req.created_at).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-gray-300 font-bold truncate max-w-[120px]">{req.user_email?.split('@')[0] || "Unknown"}</div>
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

          {/* RIGHT PANEL: DOSSIER INSPECTOR */}
          <AnimatePresence>
            {selectedRequest && (
              <motion.div 
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-full md:w-[450px] bg-[#080808] border border-green-900/50 rounded-lg flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)] absolute md:relative inset-0 z-20"
              >
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

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                  {/* STATUS */}
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

                  {/* COMMS */}
                  <div>
                     <label className="text-[10px] text-green-500 uppercase font-bold tracking-widest block mb-2 border-b border-green-900/30 pb-1 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> Direct Comms Uplink
                     </label>
                     {selectedRequest.latest_update && (
                       <div className="mb-4 bg-green-900/10 border border-green-500/20 p-3 rounded text-xs text-green-400 font-mono">
                          <span className="block text-[10px] text-green-600 mb-1 opacity-70">LATEST TRANSMISSION:</span>
                          "{selectedRequest.latest_update}"
                       </div>
                     )}
                     <div className="bg-black border border-green-900/50 rounded p-3">
                        <textarea 
                          value={commsMessage}
                          onChange={(e) => setCommsMessage(e.target.value)}
                          className="w-full bg-transparent text-xs text-green-400 font-mono focus:outline-none resize-none placeholder:text-green-900"
                          rows="3"
                          placeholder="TYPE INTEL UPDATE FOR AGENT..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendIntelUpdate();
                            }
                          }}
                        ></textarea>
                        <div className="flex justify-between items-center mt-2 border-t border-green-900/30 pt-2">
                          <span className="text-[10px] text-green-700 animate-pulse">● SECURE LINE OPEN</span>
                          <button 
                            onClick={sendIntelUpdate}
                            disabled={sendingComms || !commsMessage.trim()}
                            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-black text-xs font-bold px-4 py-1 rounded flex items-center gap-2"
                          >
                            {sendingComms ? 'SENDING...' : 'TRANSMIT'} <Send className="w-3 h-3" />
                          </button>
                        </div>
                     </div>
                  </div>

                  {/* TARGET INTEL */}
                  <div>
                     <label className="text-[10px] text-green-500 uppercase font-bold tracking-widest block mb-2 border-b border-green-900/30 pb-1">Target Intelligence</label>
                     <div className="space-y-4">
                        <div>
                          <span className="text-xs text-gray-500 block">TARGET NAME</span>
                          <span className="text-lg text-white font-bold">{selectedRequest.target_name}</span>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 block">BRIEFING NOTES</span>
                          <p className="text-sm text-gray-300 font-mono bg-gray-900/50 p-3 rounded border border-gray-800 leading-relaxed break-words">
                            "{selectedRequest.additional_details || "No additional intelligence provided."}"
                          </p>
                        </div>
                     </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: MINDER GRID INJECTION                              */}
      {/* ========================================================= */}
      {activeTab === "MINDER" && (
        <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-[500px]">
          
          {/* LEFT: INJECTION FORM */}
          <div className="flex-1 bg-[#050505] border border-pink-900/30 rounded-lg overflow-y-auto p-6 custom-scrollbar">
            <div className="flex items-center gap-3 mb-6 border-b border-pink-900/30 pb-4">
              <Crosshair className="w-6 h-6 text-pink-500" />
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-widest">GRID INJECTION</h2>
                <p className="text-[10px] text-pink-500 font-mono">WARNING: ADMIN OVERRIDE ENGAGED. BIOMETRIC SCANS BYPASSED.</p>
              </div>
            </div>

            <form onSubmit={handleInjectTarget} className="space-y-6 max-w-xl">
              
              {/* IMAGE UPLOAD */}
              <div className="flex items-end gap-4">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className={`w-32 h-32 rounded border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${minderForm.preview ? 'border-pink-500 bg-black' : 'border-gray-700 hover:border-pink-500 hover:bg-pink-900/10'}`}
                 >
                   {minderForm.preview ? (
                     <img src={minderForm.preview} className="w-full h-full object-cover opacity-80" alt="Preview" />
                   ) : (
                     <>
                       <ImageIcon className="w-6 h-6 text-gray-500 mb-2" />
                       <span className="text-[9px] font-bold text-gray-500">UPLOAD INTEL</span>
                     </>
                   )}
                 </div>
                 <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
                 <div className="flex-1 space-y-2">
                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Target Alias</label>
                    <input 
                      type="text" required value={minderForm.alias} 
                      onChange={e => setMinderForm({...minderForm, alias: e.target.value})}
                      className="w-full bg-black border border-gray-800 p-3 text-sm text-white focus:outline-none focus:border-pink-500" 
                      placeholder="e.g. Operation Honeypot" 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Age</label>
                    <input 
                      type="number" required min={18} value={minderForm.age} 
                      onChange={e => setMinderForm({...minderForm, age: e.target.value})}
                      className="w-full bg-black border border-gray-800 p-3 text-sm text-white focus:outline-none focus:border-pink-500" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Instagram ID</label>
                    <input 
                      type="text" required value={minderForm.instagram_id} 
                      onChange={e => setMinderForm({...minderForm, instagram_id: e.target.value})}
                      className="w-full bg-black border border-gray-800 p-3 text-sm text-white focus:outline-none focus:border-pink-500" 
                      placeholder="@username"
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Briefing (Bio)</label>
                 <textarea 
                   required rows={3} maxLength={150} value={minderForm.bio} 
                   onChange={e => setMinderForm({...minderForm, bio: e.target.value})}
                   className="w-full bg-black border border-gray-800 p-3 text-sm text-white focus:outline-none focus:border-pink-500 resize-none" 
                   placeholder="Admin generated bio..."
                 />
              </div>

              <button 
                type="submit" 
                disabled={injecting || !minderForm.file}
                className="w-full bg-pink-600 text-white font-black uppercase py-4 tracking-widest hover:bg-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(219,39,119,0.3)]"
              >
                {injecting ? 'INJECTING...' : <><PlusSquare className="w-5 h-5" /> PUSH TO GRID</>}
              </button>
            </form>
          </div>

          {/* RIGHT: HOLOGRAPHIC PREVIEW */}
          <div className="w-full md:w-[350px] bg-[#050505] border border-pink-900/30 rounded-lg flex flex-col items-center justify-center p-6 relative">
             <div className="absolute top-4 left-4 text-[10px] text-pink-500 font-bold tracking-widest animate-pulse">
               LIVE HOLOGRAPHIC PREVIEW
             </div>
             
             {/* Mini Swipe Card Replica */}
             <div className="w-full aspect-[3/4] bg-black border border-gray-800 rounded-xl relative overflow-hidden mt-8 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
                {minderForm.preview ? (
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${minderForm.preview})` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center flex-col text-gray-700 gap-2">
                    <Crosshair className="w-12 h-12 opacity-20" />
                    <span className="text-[10px] font-mono uppercase">AWAITING INTEL</span>
                  </div>
                )}

                <div className="absolute bottom-0 w-full p-4 flex flex-col gap-2 z-10">
                  <h2 className="text-2xl font-black uppercase text-white drop-shadow-lg flex items-center gap-2">
                    {minderForm.alias || "ALIAS"} <span className="text-lg text-gray-300 font-normal">{minderForm.age || "00"}</span>
                  </h2>
                  <div className="text-[10px] font-bold text-white bg-pink-600 w-fit px-2 py-0.5 rounded border border-pink-500/50">
                    @{minderForm.instagram_id || "instagram"}
                  </div>
                  <p className="text-[10px] text-gray-300 mt-1 font-medium bg-black/40 p-2 rounded backdrop-blur-sm border border-white/10 break-words">
                    {minderForm.bio || "Intel briefing will appear here."}
                  </p>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FOOTER: SYSTEM TERMINAL                                   */}
      {/* ========================================================= */}
      <div className="mt-4 bg-black border-t border-green-900/30 pt-2 h-32 overflow-hidden flex flex-col shrink-0">
        <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 flex items-center gap-2 px-2">
           <Terminal className="w-3 h-3" /> SYSTEM LOGS
        </div>
        <div className="flex-1 overflow-y-auto font-mono text-[10px] text-green-900/80 space-y-1 px-2 custom-scrollbar">
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
