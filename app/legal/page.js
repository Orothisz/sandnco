"use client";

import { motion } from "framer-motion";
import { ShieldAlert, FileWarning, Scale, ArrowLeft, Lock, Database } from "lucide-react";
import Link from "next/link";

export default function Legal() {
  return (
    <div className="min-h-screen bg-[#020205] text-gray-300 font-mono p-6 md:p-12 selection:bg-red-900 selection:text-white">
      
      {/* HEADER */}
      <nav className="fixed top-0 left-0 w-full bg-[#020205]/90 backdrop-blur-md border-b border-white/5 px-6 py-4 flex justify-between items-center z-50">
        <Link href="/">
           <span className="font-black italic text-xl text-white">SANDNCO<span className="text-red-600">.LOL</span></span>
        </Link>
        <Link href="/">
           <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
             <ArrowLeft className="w-3 h-3"/> Return to Base
           </button>
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto mt-20">
        
        {/* TITLE SECTION */}
        <div className="text-center mb-16">
           <div className="inline-flex items-center gap-2 px-3 py-1 border border-red-500/30 bg-red-900/10 rounded mb-6">
             <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
             <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest">
               CLASSIFIED: EYES ONLY
             </span>
           </div>
           <h1 className="text-4xl md:text-6xl font-black text-white uppercase mb-4 tracking-tighter">
             Liability <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900">Waiver</span>
           </h1>
           <p className="text-xs text-gray-500 max-w-lg mx-auto">
             BY ACCESSING THIS TERMINAL, YOU AGREE TO THE FOLLOWING TERMS. 
             IF YOU DO NOT AGREE, CLOSE THIS TAB IMMEDIATELY AND THROW YOUR DEVICE INTO THE YAMUNA RIVER.
           </p>
        </div>

        {/* DOCUMENT BODY */}
        <div className="space-y-12 relative">
           
           {/* DECORATIVE LINE */}
           <div className="absolute left-4 top-0 bottom-0 w-px bg-white/10 md:block hidden" />

           {/* SECTION 1 */}
           <section className="relative pl-0 md:pl-12">
             <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-3">
               <span className="text-red-500">01.</span> The "We Don't Exist" Clause
             </h2>
             <div className="p-6 bg-[#0a0a15] border border-white/10 rounded text-xs leading-relaxed text-gray-400">
               <p className="mb-4">
                 <strong className="text-white">1.1</strong> SandNCo.lol is an <span className="bg-white/10 px-1 text-white">entertainment service</span> operating for satirical and novelty purposes only. We are not licensed therapists, private investigators, or hitmen (unfortunately).
               </p>
               <p>
                 <strong className="text-white">1.2</strong> You agree that any "Agents," "Operatives," or "Missions" referenced on this site are fictional constructs. If you actually believe we are a paramilitary relationship organization, please seek professional help.
               </p>
             </div>
           </section>

           {/* SECTION 2 */}
           <section className="relative pl-0 md:pl-12">
             <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-3">
               <span className="text-red-500">02.</span> Psychological Warfare & Damages
             </h2>
             <div className="p-6 bg-[#0a0a15] border border-white/10 rounded text-xs leading-relaxed text-gray-400">
               <p className="mb-4">
                 <strong className="text-white">2.1</strong> You acknowledge that requesting a "Breakup" or "Patchup" service may result in <span className="bg-red-900/20 text-red-400 px-1">unintended emotional casualties</span>.
               </p>
               <p className="mb-4">
                 <strong className="text-white">2.2</strong> SandNCo.lol is <span className="underline decoration-red-500 underline-offset-2 text-white">NOT LIABLE</span> for:
               </p>
               <ul className="list-disc pl-5 space-y-1 mb-4 text-gray-500">
                 <li>Your ex slashing your tires.</li>
                 <li>Public humiliation on Instagram Reels.</li>
                 <li>Getting blocked by everyone you know.</li>
                 <li>Accidental marriages resulting from our "Matchup" algorithm.</li>
               </ul>
             </div>
           </section>

           {/* SECTION 3 */}
           <section className="relative pl-0 md:pl-12">
             <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-3">
               <span className="text-red-500">03.</span> Refunds & The "No Backsies" Rule
             </h2>
             <div className="p-6 bg-[#0a0a15] border border-white/10 rounded text-xs leading-relaxed text-gray-400">
               <p className="mb-4">
                 <strong className="text-white">3.1</strong> Once a "Mission" status changes to <span className="text-green-500">ACTIVE</span> on your dashboard, the operation cannot be aborted. 
               </p>
               <p>
                 <strong className="text-white">3.2</strong> Refunds are only processed if our agents fail to execute the protocol within 30 days, or if we get arrested. (Whichever comes first).
               </p>
             </div>
           </section>

           {/* SECTION 4 */}
           <section className="relative pl-0 md:pl-12">
             <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-3">
               <span className="text-red-500">04.</span> Indemnification
             </h2>
             <div className="p-6 bg-red-900/5 border border-red-500/20 rounded text-xs leading-relaxed text-gray-400">
               <p className="mb-4 flex gap-4">
                 <FileWarning className="w-8 h-8 text-red-500 flex-shrink-0" />
                 <span>
                   You agree to indemnify, defend, and hold harmless SandNCo.lol, its anonymous founders, and its server host from any claims, legal actions, or subpoenas arising from your use of this service.
                 </span>
               </p>
               <p className="text-red-400 font-bold uppercase tracking-widest text-center mt-6">
                 BASICALLY: IF YOU GET CAUGHT, WE DON'T KNOW YOU.
               </p>
             </div>
           </section>

           {/* SECTION 5: DATA PRIVACY (NEW) */}
           <section className="relative pl-0 md:pl-12">
             <h2 className="text-xl font-bold text-white uppercase mb-4 flex items-center gap-3">
               <span className="text-red-500">05.</span> The "Black Box" Data Policy
             </h2>
             <div className="p-6 bg-[#0a0a15] border border-white/10 rounded text-xs leading-relaxed text-gray-400">
               <div className="flex items-start gap-4 mb-4">
                  <Database className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="mb-4">
                      <strong className="text-white">5.1 Data Acquisition:</strong> Yes, we collect your data. We collect your target's data. We probably know what you ate for lunch. This intel is used solely for <span className="text-white font-bold">Mission Execution</span> and refining our "Matchup" algorithms.
                    </p>
                    <p className="mb-4">
                      <strong className="text-white">5.2 The Vault:</strong> Your photos, chat logs, and payment proofs are stored in encrypted silos (Supabase RLS). We do not sell your data to third parties because <span className="bg-red-900/20 text-red-400 px-1">selling data leaves a paper trail</span>, and we hate paper trails.
                    </p>
                    <p className="mb-4">
                      <strong className="text-white">5.3 Burn Notice:</strong> Upon request (or if a Mission goes FUBAR), you may request a "Data Purge." We will wipe your dossier from our servers. However, we cannot wipe the memories of the operatives who saw your cringe pickup lines.
                    </p>
                  </div>
               </div>
             </div>
           </section>

        </div>

        {/* FOOTER ACTION */}
        <div className="mt-20 text-center">
          <p className="text-[10px] text-gray-600 font-mono mb-6">
            LAST UPDATED: {new Date().toLocaleDateString()} // SECTOR 16 HQ
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
             <Link href="/request">
               <button className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg">
                 I Accept The Risks
               </button>
             </Link>
             <Link href="https://google.com">
               <button className="px-8 py-4 bg-transparent border border-white/10 text-gray-500 font-bold uppercase tracking-widest hover:bg-white/5 hover:text-white transition-all">
                 I am scared (Exit)
               </button>
             </Link>
          </div>
        </div>

      </main>
    </div>
  );
}
