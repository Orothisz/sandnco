"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, AlertTriangle, CheckCircle, ChevronLeft, User, 
  Hash, AlignLeft, Instagram, Loader, ScanFace, Fingerprint, Shield
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EnrollGrid() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  
  // Form State
  const [alias, setAlias] = useState("");
  const [age, setAge] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);

  // Handle Image Selection & Preview
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "FILE TOO LARGE. MAX 5MB." });
        return;
      }
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setMessage(null);
    }
  };

  // Submit to the Minder API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      return setMessage({ type: "error", text: "BIOMETRIC SCAN REQUIRED. UPLOAD IMAGE." });
    }

    setLoading(true);
    setMessage({ type: "info", text: "INITIATING AI BIOMETRIC SCAN... STANDBY." });

    try {
      const formData = new FormData();
      formData.append("alias", alias);
      formData.append("age", age);
      formData.append("bio", bio);
      formData.append("instagram_id", instagram.replace('@', ''));
      formData.append("image", image);

      const response = await fetch("/api/minder/enroll", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Enhanced error messages
        if (data.error === "BIOMETRIC_SCAN_FAILED") {
          setMessage({ 
            type: "error", 
            text: `SCAN REJECTED: ${data.details || data.reason}`,
            subtext: data.method_used ? `Detection method: ${data.method_used}` : null
          });
        } else {
          setMessage({ type: "error", text: data.error || "UPLOAD FAILED." });
        }
        setLoading(false);
      } else {
        // Show detection method used
        const detectionInfo = data.detection 
          ? `Verified by ${data.detection.method === 'gemini_ai' ? 'Gemini AI' : 'Custom Algorithm'} (${Math.round(data.detection.confidence * 100)}% confidence)`
          : '';
        
        setMessage({ 
          type: "success", 
          text: "TARGET ACCEPTED. ADDING TO GRID...",
          subtext: detectionInfo
        });
        
        setTimeout(() => {
          router.push("/minder");
        }, 2000);
      }
    } catch (error) {
      console.error("Transmission error:", error);
      setMessage({ type: "error", text: "NETWORK FAILURE. UPLINK DROPPED." });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#020205] text-gray-200 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* FLAGSHIP BACKGROUND ENGINE */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.8)_50%),linear-gradient(90deg,rgba(0,255,0,0.02),rgba(0,255,255,0.01))] bg-[length:100%_4px,3px_100%]" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-transparent via-[#020205]/90 to-[#020205] z-10" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        
        {/* TOP NAVIGATION */}
        <Link href="/minder" className="inline-block mb-8">
           <button className="group flex items-center gap-3 text-xs font-black text-gray-400 hover:text-white transition-all uppercase tracking-[0.2em] bg-white/5 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-xl shadow-xl">
             <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> CANCEL UPLINK
           </button>
        </Link>

        {/* MAIN TERMINAL CARD */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.5, ease: "circOut" }}
          className="bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_0_80px_rgba(34,197,94,0.15)] overflow-hidden rounded-[2.5rem] relative"
        >
           {/* DECORATIVE TOP BAR */}
           <div className="bg-gradient-to-r from-green-900/40 via-green-600/10 to-transparent px-8 py-5 border-b border-white/5 flex justify-between items-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50" />
             <div className="flex items-center gap-4">
               <div className="p-2 bg-green-500/20 rounded-xl border border-green-500/30">
                 <Fingerprint className="w-6 h-6 text-green-500 animate-pulse" />
               </div>
               <div>
                 <h1 className="text-xl font-black text-white uppercase tracking-widest">INJECT DOSSIER</h1>
                 <div className="text-[9px] text-green-500 font-bold uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> AI-POWERED VERIFICATION
                 </div>
               </div>
             </div>
           </div>

           <div className="p-8">
             <AnimatePresence mode="wait">
               {message && (
                 <motion.div 
                   key={message.text}
                   initial={{ opacity: 0, y: -10, scale: 0.95 }} 
                   animate={{ opacity: 1, y: 0, scale: 1 }} 
                   exit={{ opacity: 0, height: 0, scale: 0.95 }} 
                   className={`mb-8 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest border shadow-xl ${
                     message.type === 'error' 
                       ? 'bg-red-950/50 border-red-500/50 text-red-400' 
                       : message.type === 'info'
                       ? 'bg-blue-950/50 border-blue-500/50 text-blue-400'
                       : 'bg-green-950/50 border-green-500/50 text-green-400'
                   }`}
                 >
                   <div className="flex items-start gap-4">
                     {message.type === 'error' ? (
                       <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                     ) : message.type === 'info' ? (
                       <Loader className="w-5 h-5 shrink-0 animate-spin mt-0.5" />
                     ) : (
                       <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                     )}
                     <div className="flex-1">
                       <p className="leading-relaxed">{message.text}</p>
                       {message.subtext && (
                         <p className="text-[9px] mt-2 opacity-70 font-normal tracking-wide">
                           {message.subtext}
                         </p>
                       )}
                     </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>

             <form onSubmit={handleSubmit} className="space-y-8">
               
               {/* TACTICAL IMAGE UPLOAD */}
               <div className="flex flex-col items-center">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-48 h-48 md:w-56 md:h-56 rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-500 group ${preview ? 'shadow-[0_0_50px_rgba(34,197,94,0.2)]' : 'bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-green-500/50'}`}
                  >
                     {/* Cyberpunk corner brackets */}
                     <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-green-500/50 rounded-tl-lg pointer-events-none transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
                     <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-green-500/50 rounded-tr-lg pointer-events-none transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                     <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-green-500/50 rounded-bl-lg pointer-events-none transition-transform group-hover:-translate-x-1 group-hover:translate-y-1" />
                     <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-green-500/50 rounded-br-lg pointer-events-none transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />

                     {preview ? (
                       <>
                         <img src={preview} alt="Target Preview" className="w-full h-full object-cover opacity-90 group-hover:opacity-40 transition-opacity duration-300" />
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/30 to-transparent h-[200%] animate-[scan_2.5s_ease-in-out_infinite] pointer-events-none mix-blend-overlay" />
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                            <span className="bg-black/80 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] border border-white/20 flex items-center gap-2">
                              <Camera className="w-3 h-3" /> RETARGET
                            </span>
                         </div>
                       </>
                     ) : (
                       <motion.div whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-3">
                         <ScanFace className="w-10 h-10 text-gray-500 group-hover:text-green-400 transition-colors duration-300" />
                         <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] group-hover:text-green-400 text-center">INITIALIZE<br/>SCAN</span>
                       </motion.div>
                     )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    accept="image/jpeg, image/png, image/webp" 
                    className="hidden" 
                  />
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-green-500">
                      <Shield className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">
                        AI VERIFICATION ACTIVE
                      </span>
                    </div>
                    <p className="text-[8px] text-gray-500 text-center uppercase tracking-[0.2em] max-w-xs leading-relaxed font-bold">
                      * GEMINI AI + FALLBACK DETECTION. INANIMATE OBJECTS REJECTED.
                    </p>
                  </div>
               </div>

               {/* INTEL FIELDS */}
               <div className="space-y-6 pt-4">
                 
                 <div className="grid grid-cols-2 gap-5">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2 ml-1">
                       <User className="w-3 h-3 text-green-500" /> ALIAS
                     </label>
                     <input type="text" required maxLength={20} value={alias} onChange={(e) => setAlias(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-green-500/50 focus:bg-green-950/20 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-700 shadow-inner" placeholder="Codename" />
                   </div>
                   
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2 ml-1">
                       <Hash className="w-3 h-3 text-green-500" /> AGE
                     </label>
                     <input type="number" required min={13} max={99} value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-green-500/50 focus:bg-green-950/20 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-700 shadow-inner" placeholder="13+" />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2 ml-1">
                     <Instagram className="w-3 h-3 text-pink-500" /> INSTAGRAM
                   </label>
                   <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-black">@</span>
                     <input type="text" required value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-pink-500/50 focus:bg-pink-950/20 focus:ring-4 focus:ring-pink-500/10 transition-all placeholder:text-gray-700 shadow-inner" placeholder="username" />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <div className="flex justify-between items-end ml-1 mr-1">
                     <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] flex items-center gap-2">
                       <AlignLeft className="w-3 h-3 text-green-500" /> BRIEFING (BIO)
                     </label>
                     <span className={`text-[9px] font-bold ${bio.length >= 150 ? 'text-red-500' : 'text-gray-600'}`}>{bio.length}/150</span>
                   </div>
                   <textarea required maxLength={150} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-green-500/50 focus:bg-green-950/20 focus:ring-4 focus:ring-green-500/10 transition-all placeholder:text-gray-700 resize-none custom-scrollbar shadow-inner" placeholder="Provide target background intel..." />
                 </div>

                 <div className="pt-2">
                   <button 
                     type="submit" 
                     disabled={loading} 
                     className="w-full relative group overflow-hidden bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase py-5 tracking-[0.3em] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:border-green-500/50"
                   >
                     {/* Button Hover Effect */}
                     <div className="absolute inset-0 bg-green-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-0" />
                     <div className="absolute inset-0 bg-green-500/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-0 delay-75" />
                     
                     <span className="relative z-10 flex items-center gap-3 text-xs">
                       {loading ? (
                         <><Loader className="w-4 h-4 animate-spin" /> VERIFYING & UPLOADING...</>
                       ) : (
                         <><Upload className="w-4 h-4" /> SUBMIT DOSSIER</>
                       )}
                     </span>
                   </button>
                 </div>

               </div>
             </form>
           </div>
        </motion.div>
      </div>

      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(50%); }
          100% { transform: translateY(-100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}
