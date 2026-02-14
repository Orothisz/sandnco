"use client";

import { motion } from "framer-motion";
import { 
  ShieldAlert, FileWarning, Scale, ArrowLeft, Lock, 
  Database, BrainCircuit, Crosshair, Ghost, ScrollText
} from "lucide-react";
import Link from "next/link";
import Head from "next/head";

// ============================================================================
// CINEMATIC OVERLAYS
// ============================================================================
const NoiseOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-[5] opacity-[0.03] mix-blend-overlay will-change-transform">
    <svg className="w-full h-full">
      <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#n)" />
    </svg>
  </div>
);

const Scanlines = () => (
  <div className="fixed inset-0 pointer-events-none z-[6] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,3px_100%] will-change-transform" />
);

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: "blur(5px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 100, damping: 20 } }
};

export default function Legal() {
  return (
    <>
      <Head>
        <title>CLASSIFIED | Liability Waiver</title>
      </Head>

      <div className="min-h-[100dvh] bg-[#020205] text-gray-300 font-mono selection:bg-red-900 selection:text-white relative overflow-hidden">
        
        <NoiseOverlay />
        <Scanlines />
        
        {/* BACKGROUND GLOW */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-red-900/10 rounded-full blur-[150px] pointer-events-none z-0" />

        {/* HEADER */}
        <nav className="fixed top-0 left-0 w-full bg-[#020205]/90 backdrop-blur-xl border-b border-white/5 px-6 py-5 flex justify-between items-center z-50 shadow-2xl">
          <Link href="/">
             <span className="font-black italic text-xl text-white drop-shadow-[0_0_10px_rgba(220,38,38,0.5)]">
               SANDNCO<span className="text-red-600">.LOL</span>
             </span>
          </Link>
          <Link href="/">
             <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10">
               <ArrowLeft className="w-3 h-3"/> RETURN TO BASE
             </button>
          </Link>
        </nav>

        <main className="max-w-4xl mx-auto mt-32 mb-32 px-6 relative z-10">
          
          {/* TITLE SECTION */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
             <div className="inline-flex items-center gap-3 px-4 py-1.5 border border-red-500/50 bg-red-950/30 rounded-full mb-8 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
               <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
               <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.3em]">
                 CLASSIFIED: EYES ONLY
               </span>
             </div>
             <h1 className="text-5xl md:text-7xl font-black text-white uppercase mb-6 tracking-tighter drop-shadow-lg">
               Liability <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-900">Waiver</span>
             </h1>
             <p className="text-xs md:text-sm text-gray-400 max-w-2xl mx-auto font-bold uppercase tracking-widest leading-relaxed border-t border-b border-white/10 py-4 bg-black/40">
               BY ACCESSING THIS TERMINAL, YOU AGREE TO THE FOLLOWING TERMS OF ENGAGEMENT. 
               IF YOU DO NOT AGREE, CLOSE THIS TAB IMMEDIATELY AND THROW YOUR DEVICE INTO THE YAMUNA RIVER.
             </p>
          </motion.div>

          {/* DOCUMENT BODY */}
          <motion.div 
            variants={containerVariants} 
            initial="hidden" 
            animate="show" 
            className="space-y-12 relative"
          >
             {/* DECORATIVE TRACKER LINE */}
             <div className="absolute left-[27px] top-4 bottom-4 w-px bg-gradient-to-b from-red-600/50 via-white/10 to-transparent md:block hidden" />

             {/* CLAUSE 01 */}
             <Clause 
               num="01" title="OPERATIONAL DENIABILITY" icon={<Ghost className="w-5 h-5" />}
               content={
                 <>
                   <p className="mb-4">
                     <strong className="text-white">1.1</strong> SandNCo.lol is an <span className="bg-red-950/50 border border-red-500/30 px-1.5 text-red-300 rounded">entertainment service</span> operating for satirical and novelty purposes only. We are not licensed therapists, private investigators, or hitmen (unfortunately).
                   </p>
                   <p>
                     <strong className="text-white">1.2</strong> You agree that any "Agents," "Operatives," or "Missions" referenced on this site are fictional constructs. If you actually believe we are a paramilitary relationship organization, please seek professional psychiatric help immediately.
                   </p>
                 </>
               }
             />

             {/* CLAUSE 02 */}
             <Clause 
               num="02" title="PSYCHOLOGICAL CASUALTIES" icon={<Skull className="w-5 h-5" />}
               content={
                 <>
                   <p className="mb-4">
                     <strong className="text-white">2.1</strong> You acknowledge that requesting a "Breakup" or "Patchup" service may result in <span className="underline decoration-red-500 underline-offset-4 text-white">unintended emotional casualties</span>.
                   </p>
                   <p className="mb-4">
                     <strong className="text-white">2.2</strong> SandNCo.lol is <span className="text-red-500 font-black">NOT LIABLE</span> for:
                   </p>
                   <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-400 font-bold">
                     <li>Your ex slashing your tires.</li>
                     <li>Public humiliation on Instagram Reels.</li>
                     <li>Getting blocked by everyone you have ever known.</li>
                     <li>Accidental marriages resulting from our "Matchup" algorithm over-performing.</li>
                   </ul>
                 </>
               }
             />

             {/* CLAUSE 03 (NEW AI CLAUSE) */}
             <Clause 
               num="03" title="NEURAL PROFILING & BIOMETRICS" icon={<BrainCircuit className="w-5 h-5" />}
               content={
                 <>
                   <p className="mb-4">
                     <strong className="text-white">3.1</strong> By uploading imagery or text to this terminal, you submit to analysis by our proprietary <span className="text-pink-400 font-black tracking-widest">V-SMART NEURAL ENGINE</span>. 
                   </p>
                   <p className="mb-4">
                     <strong className="text-white">3.2 Algorithmic Judgement:</strong> Our systems will mathematically profile you for narcissism, transactional behavior, and "drama paradoxes." You agree that the machine's "Red Flag Score" is final. <strong className="text-red-500">You cannot appeal the machine's verdict.</strong> If the algorithm decides you are toxic, you are toxic.
                   </p>
                   <p>
                     <strong className="text-white">3.3</strong> Do not upload inanimate objects to the biometric scanner. The neural net finds it insulting.
                   </p>
                 </>
               }
             />

             {/* CLAUSE 04 (NEW MINDER GRID CLAUSE) */}
             <Clause 
               num="04" title="THE MEAT MARKET (MINDER GRID)" icon={<Crosshair className="w-5 h-5" />}
               content={
                 <>
                   <p className="mb-4">
                     <strong className="text-white">4.1 Consent to Target Acquisition:</strong> By actively injecting your dossier into the <span className="text-white font-black bg-white/10 px-2 rounded">MINDER GRID</span>, you surrender your digital anonymity. You consent to becoming a "Target."
                   </p>
                   <p>
                     <strong className="text-white">4.2 The Smash/Pass Doctrine:</strong> You acknowledge that other operatives will judge your uploaded dossier. SandNCo.lol is not responsible for any damage to your ego resulting from a high "PASS" ratio on the global leaderboards.
                   </p>
                 </>
               }
             />

             {/* CLAUSE 05 */}
             <Clause 
               num="05" title="THE 'BLACK BOX' DATA POLICY" icon={<Database className="w-5 h-5" />}
               content={
                 <>
                   <p className="mb-4">
                     <strong className="text-white">5.1 Data Hoarding:</strong> Yes, we collect your data. We scrape the provided Instagram handles. We probably know what you ate for lunch. This intel is used solely for <span className="text-white font-bold">Mission Execution</span>.
                   </p>
                   <p className="mb-4">
                     <strong className="text-white">5.2 The Vault:</strong> Your photos, chat logs, and dossiers are stored in encrypted silos (AES-256). We do not sell your data to third parties because <span className="text-red-400 font-bold bg-red-950/30 px-1 border border-red-500/20">selling data leaves a paper trail</span>, and we despise paper trails.
                   </p>
                   <p>
                     <strong className="text-white">5.3 Burn Notice:</strong> If a Mission goes FUBAR, you may request a "Data Purge." We will wipe your dossier from our servers. However, we cannot wipe the memories of the operatives who witnessed your cringe pickup lines.
                   </p>
                 </>
               }
             />

             {/* CLAUSE 06 */}
             <Clause 
               num="06" title="REFUNDS & INDEMNIFICATION" icon={<Scale className="w-5 h-5" />}
               content={
                 <>
                   <p className="mb-4">
                     <strong className="text-white">6.1 No Backsies:</strong> Once a "Mission" status reaches <span className="text-green-500 font-black">ACTIVE</span> on the terminal, the operation cannot be aborted. 
                   </p>
                   <p className="mb-6 flex gap-4 bg-red-950/20 border border-red-500/20 p-4 rounded-xl items-center mt-4">
                     <FileWarning className="w-8 h-8 text-red-500 flex-shrink-0" />
                     <span>
                       <strong className="text-white">6.2 Indemnification:</strong> You agree to hold harmless SandNCo.lol and its anonymous founders from any legal actions arising from your use of this service.
                     </span>
                   </p>
                   <div className="bg-white text-black p-4 text-center font-black uppercase tracking-[0.3em] rounded shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                     BASICALLY: IF YOU GET CAUGHT, WE DON'T KNOW YOU.
                   </div>
                 </>
               }
             />

          </motion.div>

          {/* FOOTER ACTIONS */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-32 text-center relative z-20"
          >
            <div className="inline-flex items-center gap-2 mb-8 bg-black/50 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md">
               <ScrollText className="w-4 h-4 text-gray-500" />
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                 DOCUMENT LAST UPDATED: {new Date().toLocaleDateString()} // SECTOR 16 HQ
               </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
               <Link href="/request" className="w-full md:w-auto">
                 <button className="w-full px-12 py-6 bg-red-600 text-white font-black text-sm uppercase tracking-[0.3em] hover:bg-white hover:text-black hover:scale-105 active:scale-95 transition-all shadow-[0_0_40px_rgba(220,38,38,0.4)] rounded-xl border border-red-500">
                   I Accept The Risks
                 </button>
               </Link>
               <Link href="https://google.com" className="w-full md:w-auto">
                 <button className="w-full px-10 py-6 bg-[#0a0a0f] border border-white/10 text-gray-400 font-bold text-sm uppercase tracking-widest hover:bg-white/5 hover:text-white hover:border-white/30 transition-all rounded-xl">
                   I Am Compromised (Abort)
                 </button>
               </Link>
            </div>
          </motion.div>

        </main>
      </div>
    </>
  );
}

// ============================================================================
// CLAUSE SUB-COMPONENT
// ============================================================================
function Clause({ num, title, icon, content }) {
  return (
    <motion.section variants={itemVariants} className="relative pl-0 md:pl-16">
      
      {/* Number Badge (Desktop) */}
      <div className="hidden md:flex absolute left-0 top-0 w-14 h-14 bg-[#0a0a0f] border border-white/10 rounded-xl items-center justify-center text-red-500 font-black text-xl shadow-lg z-10">
        {num}
      </div>

      <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl overflow-hidden shadow-2xl group hover:border-white/20 transition-colors">
        <div className="bg-white/[0.02] border-b border-white/5 px-6 py-4 flex items-center gap-4">
           {/* Number Badge (Mobile Fallback) */}
           <div className="md:hidden w-8 h-8 bg-black border border-white/10 rounded-lg flex items-center justify-center text-red-500 font-black text-sm shrink-0">
             {num}
           </div>
           <div className="text-gray-500 group-hover:text-red-400 transition-colors">{icon}</div>
           <h2 className="text-lg md:text-xl font-black text-white uppercase tracking-wider">
             {title}
           </h2>
        </div>
        <div className="p-6 md:p-8 text-xs md:text-sm leading-relaxed text-gray-400 font-medium">
          {content}
        </div>
      </div>
    </motion.section>
  );
}
