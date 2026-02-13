"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Camera, Upload, AlertTriangle, CheckCircle, ChevronLeft, User, 
  Hash, AlignLeft, Instagram, Loader, ScanFace 
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
    const file = e.target.files[0];
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

  // Submit to the Gemini API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image) {
      return setMessage({ type: "error", text: "BIOMETRIC SCAN REQUIRED. UPLOAD IMAGE." });
    }

    setLoading(true);
    setMessage({ type: "success", text: "INITIATING BIOMETRIC SCAN... STANDBY." });

    try {
      const formData = new FormData();
      formData.append("alias", alias);
      formData.append("age", age);
      formData.append("bio", bio);
      formData.append("instagram_id", instagram.replace('@', '')); // Strip @ if they added it
      formData.append("image", image);

      const response = await fetch("/api/minder/enroll", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: "error", text: data.error || "UPLOAD FAILED." });
        setLoading(false);
      } else {
        setMessage({ type: "success", text: "TARGET ACCEPTED. ADDED TO GRID." });
        // Redirect back to the grid after a short delay
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
    <div className="min-h-screen bg-[#050510] text-gray-200 font-mono flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* BACKGROUND SCANS */}
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
         <div className="w-full h-full bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <Link href="/minder">
           <button className="flex items-center gap-2 text-xs text-gray-500 hover:text-green-500 mb-6 transition-colors uppercase tracking-widest">
             <ChevronLeft className="w-4 h-4" /> Return to Radar
           </button>
        </Link>

        <div className="bg-black border border-green-900/50 shadow-[0_0_40px_rgba(0,255,0,0.1)] overflow-hidden rounded-lg">
           
           {/* HEADER */}
           <div className="bg-green-900/20 px-4 py-3 border-b border-green-900/50 flex justify-between items-center">
             <div className="flex items-center gap-3">
               <ScanFace className="w-5 h-5 text-green-500 animate-pulse" />
               <h1 className="text-sm font-black text-green-500 uppercase tracking-widest">ENTER THE GRID</h1>
             </div>
             <div className="text-[10px] text-green-700 font-bold uppercase">UPLINK: SECURE</div>
           </div>

           <div className="p-6 md:p-8">
             <AnimatePresence>
               {message && (
                 <motion.div 
                   initial={{ opacity: 0, y: -10 }} 
                   animate={{ opacity: 1, y: 0 }} 
                   exit={{ opacity: 0, height: 0 }} 
                   className={`mb-6 p-3 text-xs border-l-2 flex items-start gap-3 ${message.type === 'error' ? 'bg-red-900/20 border-red-500 text-red-400' : 'bg-green-900/20 border-green-500 text-green-400'}`}
                 >
                   {message.type === 'error' ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <Loader className="w-4 h-4 shrink-0 mt-0.5 animate-spin" />}
                   <p className="leading-relaxed">{message.text}</p>
                 </motion.div>
               )}
             </AnimatePresence>

             <form onSubmit={handleSubmit} className="space-y-6">
               
               {/* IMAGE UPLOAD (THE HONEYTRAP) */}
               <div className="flex flex-col items-center">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-48 h-48 md:w-56 md:h-56 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group ${preview ? 'border-green-500 bg-black' : 'border-gray-700 bg-gray-900/50 hover:border-green-500 hover:bg-green-900/10'}`}
                  >
                     {preview ? (
                       <>
                         <img src={preview} alt="Target Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                         {/* Fake Scanning Overlay */}
                         <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/20 to-transparent h-[200%] animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />
                         <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="bg-black/80 text-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/20">CHANGE IMAGE</span>
                         </div>
                       </>
                     ) : (
                       <>
                         <Camera className="w-8 h-8 text-gray-500 mb-2 group-hover:text-green-500 transition-colors" />
                         <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest group-hover:text-green-500">UPLOAD VISUAL</span>
                       </>
                     )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    accept="image/jpeg, image/png, image/webp" 
                    className="hidden" 
                  />
                  <p className="text-[9px] text-gray-600 mt-3 text-center uppercase tracking-widest max-w-xs">
                    * ALL IMAGES SUBJECT TO AI BIOMETRIC SCAN. INANIMATE OBJECTS WILL BE REJECTED.
                  </p>
               </div>

               {/* INTEL FIELDS */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2"><User className="w-3 h-3 text-green-600" /> Target Alias</label>
                   <input type="text" required maxLength={20} value={alias} onChange={(e) => setAlias(e.target.value)} className="w-full bg-black border border-gray-800 p-3 text-sm text-white focus:outline-none focus:border-green-500 focus:bg-green-900/10 transition-all placeholder:text-gray-700" placeholder="Codename" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2"><Hash className="w-3 h-3 text-green-600" /> Age</label>
                   <input type="number" required min={18} max={99} value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-black border border-gray-800 p-3 text-sm text-white focus:outline-none focus:border-green-500 focus:bg-green-900/10 transition-all placeholder:text-gray-700" placeholder="18+" />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2"><Instagram className="w-3 h-3 text-pink-600" /> Instagram Handle</label>
                 <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 font-bold">@</span>
                   <input type="text" required value={instagram} onChange={(e) => setInstagram(e.target.value)} className="w-full bg-black border border-gray-800 py-3 pl-8 pr-3 text-sm text-white focus:outline-none focus:border-pink-500 focus:bg-pink-900/10 transition-all placeholder:text-gray-700" placeholder="username" />
                 </div>
               </div>

               <div className="space-y-1">
                 <label className="text-[10px] uppercase text-gray-500 tracking-widest flex items-center gap-2"><AlignLeft className="w-3 h-3 text-green-600" /> Briefing (Bio)</label>
                 <textarea required maxLength={150} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-black border border-gray-800 p-3 text-sm text-white focus:outline-none focus:border-green-500 focus:bg-green-900/10 transition-all placeholder:text-gray-700 resize-none custom-scrollbar" placeholder="Give them a reason to swipe... (Max 150 chars)" />
                 <div className="text-right text-[9px] text-gray-600">{bio.length}/150</div>
               </div>

               <button 
                 type="submit" 
                 disabled={loading} 
                 className="w-full bg-green-600 text-black font-black uppercase py-4 tracking-widest hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
               >
                 {loading ? <><Loader className="w-4 h-4 animate-spin" /> UPLOADING TO GRID...</> : <><Upload className="w-4 h-4" /> INJECT PROFILE</>}
               </button>
             </form>
           </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(50%); }
          100% { transform: translateY(-100%); }
        }
      `}</style>
    </div>
  );
}
