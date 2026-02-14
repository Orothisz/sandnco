"use client";

import { useState, useEffect, useRef } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { 
  ShieldAlert, Activity, Users, DollarSign, Terminal, Search, Check, X, Eye, 
  RefreshCw, Send, FileText, Crosshair, Upload, Image as ImageIcon, 
  PlusSquare, Database, Trash2, Edit2, AlertCircle, HardDrive
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminDashboard() {
  const supabase = createClientComponentClient();
  const fileInputRef = useRef(null);
  
  // ==========================================
  // GLOBAL STATE
  // ==========================================
  const [activeTab, setActiveTab] = useState("MISSIONS"); // 'MISSIONS' or 'MINDER'
  const [adminLog, setAdminLog] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, revenue: 0, pending: 0, grid_count: 0 });

  // ==========================================
  // MISSIONS STATE
  // ==========================================
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [commsMessage, setCommsMessage] = useState("");
  const [sendingComms, setSendingComms] = useState(false);

  // ==========================================
  // MINDER GRID STATE (CRUD)
  // ==========================================
  const [minderTargets, setMinderTargets] = useState([]);
  const [gridFilter, setGridFilter] = useState("");
  const [injecting, setInjecting] = useState(false);
  const [editingId, setEditingId] = useState(null); // Null = Insert, ID = Update
  
  const initialFormState = { alias: "", age: "", bio: "", instagram_id: "", file: null, preview: null, image_url: null };
  const [minderForm, setMinderForm] = useState(initialFormState);

  // --------------------------------------------------------------------------
  // 1. DATA INGESTION
  // --------------------------------------------------------------------------
  const fetchIntel = async () => {
    // 1. Fetch Missions
    const { data: reqData, error: reqError } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    // 2. Fetch Minder Targets (For Grid Management)
    const { data: targetsData, error: targetError } = await supabase
      .from("minder_targets")
      .select("*")
      .order("created_at", { ascending: false });

    if (!reqError && !targetError) {
      setRequests(reqData || []);
      setMinderTargets(targetsData || []);
      calculateStats(reqData || [], targetsData?.length || 0);
      
      // Keep selected request updated if data changes
      if (selectedRequest) {
        const updatedSelected = reqData.find(r => r.id === selectedRequest.id);
        if (updatedSelected) setSelectedRequest(updatedSelected);
      }
    } else {
      sysLog("ERR", "FATAL: INTEL FETCH FAILED. CHECK UPLINK.");
    }
    setLoading(false);
  };

  // --------------------------------------------------------------------------
  // 2. REALTIME SURVEILLANCE
  // --------------------------------------------------------------------------
  useEffect(() => {
    fetchIntel();
    sysLog("SYS", "SECURE OVERWATCH TERMINAL INITIALIZED.");

    const channel = supabase
      .channel('god-mode-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, (payload) => {
          sysLog("NET", `MISSION DATA MUTATED: ID #${payload.new.id || payload.old.id}`);
          fetchIntel(); 
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'minder_targets' }, (payload) => {
          sysLog("NET", `GRID ARCHITECTURE MUTATED. REFRESHING.`);
          fetchIntel();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [supabase]);

  // --------------------------------------------------------------------------
  // 3. LOGIC KERNEL & TERMINAL
  // --------------------------------------------------------------------------
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

  const sysLog = (type, msg) => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' });
    let colorClass = "text-gray-500";
    if (type === "ERR") colorClass = "text-red-500";
    if (type === "CMD") colorClass = "text-emerald-400";
    if (type === "NET") colorClass = "text-blue-400";
    if (type === "SYS") colorClass = "text-gray-300";

    setAdminLog(prev => [{ id: Date.now()+Math.random(), time: timestamp, type, msg, colorClass }, ...prev].slice(0, 50));
  };

  // --------------------------------------------------------------------------
  // 4. MISSIONS COMMAND EXECUTION
  // --------------------------------------------------------------------------
  const updateStatus = async (id, newStatus, e) => {
    if (e) e.stopPropagation();
    
    // Optimistic UI
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    if (selectedRequest?.id === id) setSelectedRequest(prev => ({ ...prev, status: newStatus }));

    const { error } = await supabase.from("requests").update({ status: newStatus }).eq("id", id);
    if (error) {
        sysLog("ERR", `COMMAND OVERRIDE FAILED ON ID #${id}`);
        fetchIntel(); 
    } else {
        sysLog("CMD", `STATUS OVERRIDE EXECUTED: ID #${id} -> ${newStatus}`);
    }
  };

  const sendIntelUpdate = async () => {
    if (!commsMessage.trim() || !selectedRequest) return;
    setSendingComms(true);

    const { error } = await supabase.from("requests").update({ latest_update: commsMessage }).eq("id", selectedRequest.id);
    
    if (!error) {
        sysLog("CMD", `ENCRYPTED COMMS TRANSMITTED TO AGENT #${selectedRequest.id}`);
        setCommsMessage(""); 
    } else {
        sysLog("ERR", `TRANSMISSION FAILED: ${error.message}`);
    }
    setSendingComms(false);
  };

  // --------------------------------------------------------------------------
  // 5. MINDER GRID MANAGEMENT (CRUD)
  // --------------------------------------------------------------------------
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) setMinderForm({ ...minderForm, file: file, preview: URL.createObjectURL(file) });
  };

  const initiateEdit = (target) => {
    setEditingId(target.id);
    setMinderForm({
      alias: target.alias,
      age: target.age.toString(),
      bio: target.bio,
      instagram_id: target.instagram_id,
      file: null,
      preview: target.image_url,
      image_url: target.image_url
    });
    sysLog("SYS", `EDIT MODE LOCKED ON DOSSIER: ${target.alias}`);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMinderForm(initialFormState);
    sysLog("SYS", "EDIT MODE DISENGAGED. REVERTED TO INSERT PROTOCOL.");
  };

  const handlePurgeTarget = async (id, alias) => {
    const confirm = window.confirm(`WARNING: PURGING DOSSIER [${alias}]. THIS IRREVERSIBLY ALTERS THE GRID. PROCEED?`);
    if (!confirm) return;

    sysLog("CMD", `INITIATING PURGE SEQUENCE FOR ID: ${id}`);
    const { error } = await supabase.from('minder_targets').delete().eq('id', id);
    
    if (error) {
      sysLog("ERR", `PURGE FAILED: ${error.message}`);
    } else {
      sysLog("CMD", `DOSSIER [${alias}] PERMANENTLY PURGED FROM GRID.`);
      fetchIntel();
      if (editingId === id) cancelEdit();
    }
  };

  const handleUpsertTarget = async (e) => {
    e.preventDefault();
    if ((!minderForm.file && !minderForm.image_url) || !minderForm.alias || !minderForm.age) {
      return sysLog("ERR", "INCOMPLETE INTEL. INJECTION ABORTED.");
    }

    setInjecting(true);
    sysLog("CMD", editingId ? `INITIATING OVERRIDE ON DOSSIER: ${minderForm.alias}` : "COMPILING NEW DOSSIER FOR GRID INJECTION...");

    try {
      let finalImageUrl = minderForm.image_url;

      // 1. Upload new image if provided
      if (minderForm.file) {
        const fileExt = minderForm.file.name.split('.').pop();
        const fileName = `admin-inject-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage.from('minder_assets').upload(fileName, minderForm.file);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from('minder_assets').getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const payload = {
        alias: minderForm.alias,
        age: parseInt(minderForm.age),
        bio: minderForm.bio,
        instagram_id: minderForm.instagram_id.replace('@', ''),
        image_url: finalImageUrl,
        entity_type: 'human'
      };

      // 2. Insert or Update
      if (editingId) {
        const { error } = await supabase.from('minder_targets').update(payload).eq('id', editingId);
        if (error) throw error;
        sysLog("SUCCESS", `DOSSIER [${minderForm.alias}] OVERWRITTEN SUCCESSFULLY.`);
      } else {
        const { error } = await supabase.from('minder_targets').insert([payload]);
        if (error) throw error;
        sysLog("SUCCESS", `DOSSIER [${minderForm.alias}] INJECTED INTO LIVE GRID.`);
      }

      setMinderForm(initialFormState);
      setEditingId(null);
      fetchIntel();

    } catch (err) {
      sysLog("ERR", `OPERATION FAILED: ${err.message}`);
    }
    setInjecting(false);
  };

  // --------------------------------------------------------------------------
  // RENDER HELPERS
  // --------------------------------------------------------------------------
  const filteredRequests = requests.filter(r => filter === "ALL" || r.status === filter);
  const searchedTargets = minderTargets.filter(t => t.alias.toLowerCase().includes(gridFilter.toLowerCase()) || t.instagram_id.toLowerCase().includes(gridFilter.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#050505] text-[#ededed] font-mono selection:bg-emerald-900 selection:text-white flex flex-col">
      
      {/* --------------------------------------------------------------------- */}
      {/* TOP COMMAND BAR */}
      {/* --------------------------------------------------------------------- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center px-6 py-5 border-b border-white/10 bg-[#0a0a0a] gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-[0.2em] flex items-center gap-3 text-white">
            <Terminal className="w-6 h-6 text-emerald-500" /> OVERWATCH_TERMINAL
          </h1>
          <p className="text-[10px] text-gray-500 mt-1 font-bold tracking-widest flex items-center gap-2">
            <Lock className="w-3 h-3" /> SECURE ROOT ACCESS: ADMIN@SANDNCO.LOL
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:flex-none flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-sm">
             <button onClick={() => setActiveTab("MISSIONS")} className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === 'MISSIONS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-gray-500 hover:text-white border border-transparent'}`}>
               MISSIONS
             </button>
             <button onClick={() => setActiveTab("MINDER")} className={`flex-1 md:flex-none px-6 py-2 text-[10px] font-black tracking-widest uppercase transition-colors ${activeTab === 'MINDER' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30' : 'text-gray-500 hover:text-white border border-transparent'}`}>
               MINDER GRID
             </button>
          </div>
          <button onClick={fetchIntel} className="p-2 border border-white/10 hover:bg-white/5 transition-all text-gray-400 hover:text-white flex shrink-0">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {/* --------------------------------------------------------------------- */}
      {/* STATS STRIP */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-white/10 shrink-0 bg-[#080808]">
        <StatBlock label="TOTAL DOSSIERS" value={stats.total} />
        <StatBlock label="ACTIVE MISSIONS" value={stats.active} accent="text-amber-400" />
        <StatBlock label="EST. REVENUE (WAIVED)" value={`₹${stats.revenue}`} />
        <StatBlock label="GRID POPULATION" value={stats.grid_count} accent="text-pink-400" />
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* WORKSPACE AREA */}
      {/* --------------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* ========================================================= */}
        {/* TAB 1: MISSIONS CONSOLE                                   */}
        {/* ========================================================= */}
        {activeTab === "MISSIONS" && (
          <div className="flex-1 flex overflow-hidden">
            
            {/* MISSIONS DATATABLE */}
            <div className={`flex-1 border-r border-white/10 flex flex-col bg-[#050505] transition-all duration-300 ${selectedRequest ? 'hidden lg:flex lg:w-2/3' : 'w-full'}`}>
              <div className="p-3 border-b border-white/10 bg-[#0a0a0a] flex gap-2 overflow-x-auto no-scrollbar">
                {["ALL", "PENDING", "ACTIVE", "COMPLETED", "REJECTED"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-[9px] font-bold uppercase border transition-colors whitespace-nowrap ${filter === f ? "bg-white text-black border-white" : "bg-transparent border-white/10 text-gray-500 hover:text-white"}`}>
                    {f}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-[10px]">
                  <thead className="bg-[#0a0a0a] text-gray-500 uppercase tracking-widest sticky top-0 z-10 border-b border-white/10 shadow-sm">
                    <tr>
                      <th className="p-4 font-normal">Status</th>
                      <th className="p-4 font-normal">Ident / Timestamp</th>
                      <th className="p-4 font-normal">Operative</th>
                      <th className="p-4 font-normal">Objective</th>
                      <th className="p-4 font-normal text-right">Execute</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredRequests.map((req) => (
                      <motion.tr 
                        key={req.id} 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        onClick={() => setSelectedRequest(req)}
                        className={`cursor-pointer transition-colors group ${selectedRequest?.id === req.id ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}
                      >
                        <td className="p-4"><StatusIndicator status={req.status} /></td>
                        <td className="p-4 font-mono text-gray-500">
                          <span className="text-gray-300">#{req.id.split('-')[0]}</span><br/>
                          <span className="text-[8px] opacity-50">{new Date(req.created_at).toLocaleDateString()}</span>
                        </td>
                        <td className="p-4 text-gray-400 truncate max-w-[120px]">{req.user_email?.split('@')[0] || "Unknown"}</td>
                        <td className="p-4">
                          <div className="text-gray-200 uppercase font-bold truncate max-w-[150px]">{req.target_name}</div>
                          <div className="text-[9px] text-gray-600 uppercase mt-0.5">{req.service_type}</div>
                        </td>
                        <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                            {req.status === 'PENDING' && (
                              <>
                                <ActionIcon onClick={(e) => updateStatus(req.id, 'ACTIVE', e)} icon={<Check className="w-3 h-3" />} hover="hover:text-emerald-400 hover:bg-emerald-400/10" />
                                <ActionIcon onClick={(e) => updateStatus(req.id, 'REJECTED', e)} icon={<X className="w-3 h-3" />} hover="hover:text-red-400 hover:bg-red-400/10" />
                              </>
                            )}
                            <ActionIcon onClick={() => setSelectedRequest(req)} icon={<Eye className="w-3 h-3" />} hover="hover:text-blue-400 hover:bg-blue-400/10" />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
                {filteredRequests.length === 0 && <div className="p-20 text-center text-gray-700 text-xs font-bold tracking-widest uppercase">NO DATA IN SECTOR.</div>}
              </div>
            </div>

            {/* MISSION INSPECTOR PANEL */}
            <AnimatePresence>
              {selectedRequest && (
                <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="w-full lg:w-[400px] bg-[#080808] flex flex-col absolute lg:relative inset-0 z-20">
                  <div className="p-5 border-b border-white/10 flex justify-between items-start bg-[#0a0a0a]">
                    <div>
                       <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                         <FileText className="w-4 h-4 text-gray-500" /> DOSSIER #{selectedRequest.id.split('-')[0]}
                       </h2>
                       <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest">{selectedRequest.service_type}</p>
                    </div>
                    <button onClick={() => setSelectedRequest(null)} className="text-gray-500 hover:text-white p-1"><X className="w-4 h-4" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar text-xs">
                    {/* Status Controller */}
                    <div>
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-3 border-b border-white/10 pb-2">Mission Status</label>
                      <div className="grid grid-cols-2 gap-2">
                         {['PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED'].map(s => (
                           <button key={s} onClick={() => updateStatus(selectedRequest.id, s)} className={`py-2 px-2 text-[9px] font-black uppercase tracking-widest border transition-all ${selectedRequest.status === s ? 'bg-white text-black border-white' : 'bg-transparent text-gray-500 border-white/10 hover:border-white/30 hover:text-gray-300'}`}>
                             {s}
                           </button>
                         ))}
                      </div>
                    </div>

                    {/* Comms Panel */}
                    <div>
                       <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-3 border-b border-white/10 pb-2 flex items-center gap-2">
                          <Terminal className="w-3 h-3" /> Secure Comms Uplink
                       </label>
                       {selectedRequest.latest_update && (
                         <div className="mb-4 bg-emerald-500/5 border border-emerald-500/20 p-3 text-[10px] text-emerald-400 font-mono">
                            <span className="block text-[8px] text-emerald-600 mb-1">LATEST TRANSMISSION:</span>
                            {selectedRequest.latest_update}
                         </div>
                       )}
                       <div className="bg-[#050505] border border-white/10 p-1 flex flex-col focus-within:border-emerald-500/50 transition-colors">
                          <textarea 
                            value={commsMessage} onChange={(e) => setCommsMessage(e.target.value)}
                            className="w-full bg-transparent text-[10px] text-gray-300 p-2 focus:outline-none resize-none placeholder:text-gray-700 custom-scrollbar"
                            rows="4" placeholder="Enter status update to transmit to operative..."
                          />
                          <button onClick={sendIntelUpdate} disabled={sendingComms || !commsMessage.trim()} className="self-end m-1 bg-white hover:bg-gray-200 text-black text-[9px] font-black tracking-widest px-4 py-2 disabled:opacity-50 flex items-center gap-2">
                            {sendingComms ? 'UPLOADING...' : 'TRANSMIT'} <Send className="w-3 h-3" />
                          </button>
                       </div>
                    </div>

                    {/* Target Intel */}
                    <div>
                       <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest block mb-3 border-b border-white/10 pb-2">Target Intelligence</label>
                       <div className="space-y-4">
                          <div>
                            <span className="text-[9px] text-gray-600 block tracking-widest uppercase">Target Name</span>
                            <span className="text-sm text-gray-200 font-bold tracking-wider">{selectedRequest.target_name}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-600 block tracking-widest uppercase mb-1">Briefing Notes</span>
                            <p className="text-[10px] text-gray-400 bg-white/5 p-3 border border-white/5 leading-relaxed break-words">
                              {selectedRequest.additional_details || "No additional intel provided."}
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
        {/* TAB 2: MINDER GRID MANAGEMENT (CRUD)                        */}
        {/* ========================================================= */}
        {activeTab === "MINDER" && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#050505]">
            
            {/* LEFT: GRID DATABASE VIEWER */}
            <div className="flex-1 border-r border-white/10 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-[#0a0a0a] flex items-center gap-3">
                <Database className="w-4 h-4 text-pink-500" />
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">GRID DATABASE</h2>
                <div className="ml-auto relative flex items-center">
                  <Search className="w-3 h-3 absolute left-3 text-gray-600" />
                  <input type="text" value={gridFilter} onChange={e => setGridFilter(e.target.value)} placeholder="Search alias or ID..." className="bg-white/5 border border-white/10 py-1.5 pl-8 pr-3 text-[10px] text-white focus:outline-none focus:border-pink-500/50 w-48 transition-all placeholder:text-gray-700" />
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {searchedTargets.map(target => (
                    <div key={target.id} className={`bg-[#0a0a0a] border p-4 flex flex-col gap-4 relative group transition-all ${editingId === target.id ? 'border-pink-500/50 shadow-[0_0_20px_rgba(219,39,119,0.1)]' : 'border-white/10 hover:border-white/30'}`}>
                      <div className="flex items-center gap-4">
                        <img src={target.image_url} className="w-12 h-12 rounded-full object-cover border border-white/20 grayscale group-hover:grayscale-0 transition-all" alt="Target" />
                        <div className="flex-1 min-w-0">
                           <h3 className="text-sm font-black text-gray-200 uppercase truncate">{target.alias} <span className="text-gray-600 text-xs font-normal">{target.age}</span></h3>
                           <p className="text-[9px] text-pink-500 tracking-widest font-bold truncate">@{target.instagram_id}</p>
                        </div>
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2 italic">"{target.bio}"</p>
                      <div className="mt-auto pt-3 border-t border-white/5 flex justify-end gap-2">
                        <button onClick={() => initiateEdit(target)} className="text-gray-500 hover:text-white text-[9px] font-bold tracking-widest flex items-center gap-1 uppercase p-1"><Edit2 className="w-3 h-3"/> Edit</button>
                        <button onClick={() => handlePurgeTarget(target.id, target.alias)} className="text-gray-600 hover:text-red-500 text-[9px] font-bold tracking-widest flex items-center gap-1 uppercase p-1"><Trash2 className="w-3 h-3"/> Purge</button>
                      </div>
                    </div>
                  ))}
                  {searchedTargets.length === 0 && <div className="col-span-full py-20 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">NO RECORDS MATCH QUERY.</div>}
                </div>
              </div>
            </div>

            {/* RIGHT: INJECTION / EDIT FORM */}
            <div className="w-full md:w-[400px] bg-[#080808] flex flex-col shrink-0 overflow-y-auto custom-scrollbar border-t md:border-t-0 border-white/10 relative">
              <div className="p-5 border-b border-white/10 bg-[#0a0a0a] sticky top-0 z-10 flex justify-between items-center">
                 <div>
                   <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                     <Crosshair className={`w-4 h-4 ${editingId ? 'text-blue-500' : 'text-pink-500'}`} /> 
                     {editingId ? 'DOSSIER OVERRIDE' : 'NEW INJECTION'}
                   </h2>
                 </div>
                 {editingId && <button onClick={cancelEdit} className="text-gray-500 hover:text-white"><X className="w-4 h-4"/></button>}
              </div>

              <form onSubmit={handleUpsertTarget} className="p-6 space-y-6">
                
                {/* Image Upload Area */}
                <div className="flex flex-col items-center">
                   <div onClick={() => fileInputRef.current?.click()} className={`w-32 h-32 md:w-40 md:h-40 bg-[#050505] border flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group ${minderForm.preview ? (editingId ? 'border-blue-500/50' : 'border-pink-500/50') : 'border-white/10 hover:border-white/30'}`}>
                     {minderForm.preview ? (
                       <img src={minderForm.preview} className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" alt="Preview" />
                     ) : (
                       <div className="flex flex-col items-center text-gray-600 group-hover:text-white transition-colors">
                         <Upload className="w-5 h-5 mb-2" />
                         <span className="text-[8px] font-black tracking-widest uppercase">UPLOAD ASSET</span>
                       </div>
                     )}
                   </div>
                   <input type="file" ref={fileInputRef} onChange={handleImageSelect} className="hidden" accept="image/*" />
                   {editingId && !minderForm.file && <p className="text-[8px] text-gray-500 mt-2 text-center uppercase tracking-widest">CURRENT ASSET RETAINED. CLICK TO REPLACE.</p>}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[9px] uppercase text-gray-500 font-bold tracking-widest mb-1 block">Target Alias</label>
                    <input type="text" required value={minderForm.alias} onChange={e => setMinderForm({...minderForm, alias: e.target.value})} className="w-full bg-[#050505] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors placeholder:text-gray-800" placeholder="Codename" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9px] uppercase text-gray-500 font-bold tracking-widest mb-1 block">Age</label>
                      <input type="number" required min={18} value={minderForm.age} onChange={e => setMinderForm({...minderForm, age: e.target.value})} className="w-full bg-[#050505] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors" placeholder="18+" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase text-gray-500 font-bold tracking-widest mb-1 block">Instagram</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-700 font-black text-xs">@</span>
                        <input type="text" required value={minderForm.instagram_id} onChange={e => setMinderForm({...minderForm, instagram_id: e.target.value})} className="w-full bg-[#050505] border border-white/10 py-3 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors placeholder:text-gray-800" placeholder="username" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] uppercase text-gray-500 font-bold tracking-widest mb-1 block">Briefing Notes</label>
                    <textarea required rows={4} maxLength={200} value={minderForm.bio} onChange={e => setMinderForm({...minderForm, bio: e.target.value})} className="w-full bg-[#050505] border border-white/10 p-3 text-xs text-white focus:outline-none focus:border-pink-500/50 transition-colors resize-none custom-scrollbar placeholder:text-gray-800" placeholder="Target bio logic..." />
                  </div>
                </div>

                <button type="submit" disabled={injecting || (!editingId && !minderForm.file)} className={`w-full text-black font-black uppercase py-4 text-xs tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${editingId ? 'bg-blue-500 hover:bg-blue-400' : 'bg-pink-600 hover:bg-pink-500'}`}>
                  {injecting ? <RefreshCw className="w-4 h-4 animate-spin" /> : (editingId ? <HardDrive className="w-4 h-4" /> : <PlusSquare className="w-4 h-4" />)}
                  {injecting ? 'PROCESSING...' : (editingId ? 'OVERWRITE RECORD' : 'EXECUTE INJECTION')}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* GLOBAL TERMINAL LOG (PINNED BOTTOM)                                   */}
      {/* --------------------------------------------------------------------- */}
      <div className="h-40 bg-[#050505] border-t border-white/10 flex flex-col shrink-0">
        <div className="px-4 py-2 border-b border-white/5 bg-[#0a0a0a] text-[9px] text-gray-500 uppercase tracking-widest font-black flex items-center gap-2">
           <Terminal className="w-3 h-3" /> SYSTEM STDOUT
        </div>
        <div className="flex-1 overflow-y-auto p-4 font-mono text-[10px] space-y-1.5 custom-scrollbar flex flex-col-reverse">
           <div className="text-gray-600 animate-pulse flex items-center gap-2"><span>_</span> AWAITING KERNEL INPUT...</div>
           {adminLog.map((log) => (
             <div key={log.id} className="flex gap-4 hover:bg-white/5 px-2 py-0.5 rounded transition-colors">
               <span className="text-gray-600 shrink-0 w-16">{log.time}</span>
               <span className={`${log.colorClass} shrink-0 w-8`}>[{log.type}]</span>
               <span className="text-gray-300 break-all">{log.msg}</span>
             </div>
           ))}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #050505; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #222; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #333; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

// --------------------------------------------------------------------------
// SUB-COMPONENTS
// --------------------------------------------------------------------------
const StatBlock = ({ label, value, accent = "text-white" }) => (
  <div className="p-6 border-r border-b border-white/10 flex flex-col justify-between group relative overflow-hidden">
    <div className="absolute -inset-10 bg-white/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity pointer-events-none" />
    <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2 block">{label}</span>
    <span className={`text-2xl md:text-3xl font-black ${accent} tracking-tighter`}>{value}</span>
  </div>
);

const StatusIndicator = ({ status }) => {
  const config = {
    PENDING: { color: "text-amber-400", border: "border-amber-400/20", bg: "bg-amber-400/10" },
    ACTIVE: { color: "text-emerald-400", border: "border-emerald-400/20", bg: "bg-emerald-400/10", pulse: true },
    COMPLETED: { color: "text-blue-400", border: "border-blue-400/20", bg: "bg-blue-400/10" },
    REJECTED: { color: "text-gray-500", border: "border-gray-500/20", bg: "bg-gray-500/10" },
  };
  const style = config[status] || config.PENDING;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-sm border ${style.border} ${style.bg}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${style.color.replace('text-', 'bg-')} ${style.pulse ? 'animate-ping absolute' : ''}`} />
      <div className={`w-1.5 h-1.5 rounded-full ${style.color.replace('text-', 'bg-')} relative`} />
      <span className={`text-[8px] font-black uppercase tracking-widest ${style.color}`}>{status}</span>
    </div>
  );
};

const ActionIcon = ({ onClick, icon, hover }) => (
  <button onClick={onClick} className={`p-2 rounded-sm text-gray-500 transition-all ${hover}`}>
    {icon}
  </button>
);
