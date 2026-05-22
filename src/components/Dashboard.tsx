import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Image as ImageIcon, BookOpen, Layers, Check, Banknote, Clock, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

interface UtilityCardProps {
  number: string;
  title: string;
  description: string;
  image?: string;
  actionLabel: string;
  onClick: () => void;
  comingSoon?: boolean;
}

function UtilityCard({ number, title, description, image, actionLabel, onClick, comingSoon }: UtilityCardProps) {
  return (
    <motion.div 
      whileHover={!comingSoon ? { y: -5 } : {}}
      className={`relative group bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm flex flex-col h-full ${comingSoon ? 'opacity-80 bg-slate-50/50' : 'cursor-pointer'}`}
      onClick={!comingSoon ? onClick : undefined}
    >
      {image && (
        <div className="aspect-[16/9] relative overflow-hidden bg-slate-100">
          <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {title === 'Smile Enhancer' && (
             <div className="absolute inset-0 flex">
               <div className="flex-1 relative border-r border-white/10">
                 <span className="absolute top-3 left-3 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded text-[7px] font-black text-white uppercase tracking-widest">BEFORE</span>
               </div>
               <div className="flex-1 relative">
                 <span className="absolute top-3 right-3 bg-black/40 backdrop-blur px-1.5 py-0.5 rounded text-[7px] font-black text-white uppercase tracking-widest">AFTER</span>
               </div>
            </div>
          )}
        </div>
      )}
      
      {!image && comingSoon && (
        <div className="aspect-[16/9] flex items-center justify-center bg-slate-100/50 text-slate-300">
           {/* Empty spacer or icon */}
        </div>
      )}

      <div className="p-8 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{number} / 04</p>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <span className={`text-[10px] font-black uppercase tracking-widest ${comingSoon ? 'text-slate-400' : 'text-slate-900 group-hover:text-brand-600 transition-colors'}`}>
            {comingSoon ? 'Coming Soon' : actionLabel}
          </span>
          {!comingSoon && (
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-brand-600 transition-colors">
              <ArrowRight size={18} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard({ 
  onNavigateToSmileTool, 
  onNavigateToPrompts, 
  onNavigateToHistory,
  onNavigateToRadiology
}: { 
  onNavigateToSmileTool: () => void; 
  onNavigateToPrompts: () => void; 
  onNavigateToHistory: () => void;
  onNavigateToRadiology: () => void;
}) {
  const { user, userData, isAdmin } = useAuth();
  const [manualPayments, setManualPayments] = useState<any[]>([]);
  
  const firstName = user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Member';
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase();

  useEffect(() => {
    if (!user) return;

    // Admin sees everything, normal user only sees theirs
    const q = isAdmin 
      ? query(collection(db, "manual_payments"), orderBy("createdAt", "desc"))
      : query(collection(db, "manual_payments"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setManualPayments(data);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  const pendingPayments = manualPayments.filter(p => p.status === 'pending');

  const handleApprovePayment = async (payment: any) => {
    if (!isAdmin) return;
    try {
      const userRef = doc(db, 'users', payment.userId);
      const paymentRef = doc(db, 'manual_payments', payment.id);

      // Perform updates
      await updateDoc(userRef, {
        credits: increment(payment.tokens),
        updatedAt: serverTimestamp()
      });

      await updateDoc(paymentRef, {
        status: 'completed',
        completedAt: serverTimestamp()
      });

      alert(`Sukses! ${payment.tokens} koin ditambahkan ke user ${payment.userEmail}`);
    } catch (error: any) {
      console.error(error);
      alert("Gagal approve: " + error.message);
    }
  };

  const handleRejectPayment = async (payment: any) => {
    if (!isAdmin) return;
    if (!confirm("Apakah Anda yakin ingin menolak pembayaran ini?")) return;
    try {
      const paymentRef = doc(db, 'manual_payments', payment.id);
      await updateDoc(paymentRef, {
        status: 'failed',
        failedAt: serverTimestamp(),
        reason: 'Rejected by admin'
      });
    } catch (error: any) {
      console.error(error);
      alert("Gagal reject: " + error.message);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Editorial Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-10">
        {isAdmin && manualPayments.filter(p => p.status === 'pending').length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 text-white overflow-hidden relative shadow-2xl"
          >
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 bg-brand-500 rounded-full text-[10px] font-black uppercase tracking-widest">Admin Panel</div>
                <h2 className="text-2xl font-black">Verifikasi Pembayaran Manual</h2>
              </div>
              
              <div className="grid gap-4">
                {manualPayments.filter(p => p.status === 'pending').map(p => (
                  <div key={p.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-white/10 transition-all hover:bg-white/15">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{p.userEmail}</p>
                        <span className="px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded text-[9px] font-bold uppercase">{p.packageName}</span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {p.senderName} ({p.senderBank}) · Rp {p.amount?.toLocaleString('id-ID')} · {p.tokens} tokens
                      </p>
                      {p.receiptUrl && (
                        <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-[10px] text-brand-400 hover:underline font-bold flex items-center gap-1 cursor-pointer">
                          <ImageIcon size={10} /> Lihat Bukti Bayar
                        </a>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleRejectPayment(p)}
                        className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button 
                        onClick={() => handleApprovePayment(p)}
                        className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-500/20 cursor-pointer"
                      >
                        Terima & Tambah Koin
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Abstract Background Element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 blur-[100px] rounded-full -mr-32 -mt-32" />
          </motion.div>
        )}

        <div className="bg-[#1a1a1a] rounded-[2.5rem] sm:rounded-[3.5rem] p-10 sm:p-14 lg:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center gap-12 sm:gap-20">
          {/* Noise/Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          
          <div className="flex-1 space-y-8 relative z-10">
            <div className="space-y-4">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{currentDate}</p>
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white leading-[1.05] tracking-tight">
                Good evening, <br />
                <span className="text-white/40">{firstName}.</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-sm font-medium">
                Your GIMU.AI toolkit, ready when you are.
              </p>
            </div>
            
            <button 
              onClick={onNavigateToSmileTool}
              className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 px-6 py-3 rounded-full text-white text-xs font-bold uppercase tracking-widest border border-white/10 transition-all active:scale-95"
            >
              Open Smile Tool 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm lg:max-w-md shrink-0 relative z-10 space-y-4"
          >
            {/* Pending Payments Alert */}
            <AnimatePresence>
              {pendingPayments.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 shadow-sm flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={20} className="animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Pembayaran Diproses</p>
                    <p className="text-xs font-bold text-amber-900 leading-tight">
                      {pendingPayments.length} Konfirmasi transfer sedang diverifikasi admin.
                    </p>
                    <p className="text-[9px] text-amber-700 font-medium">Estimasi koin masuk: 1x24 jam.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden group">
               <div className="space-y-8 relative z-10">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generations Left</p>
                    <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-widest">Monthly limit</span>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold text-slate-900 leading-tight">
                        You have {userData?.credits ?? 0} image generations left.
                      </h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-2">Resets June 1</p>
                  </div>
               </div>
               
               {/* Abstract background shape */}
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-brand-50 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Your Toolkit Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-20 sm:mt-28">
        <div className="space-y-10">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">YOUR TOOLKIT</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Four handcrafted AI utilities</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <UtilityCard 
              number="01"
              title="Smile Enhancer"
              description="Transform patient smiles with high-precision AI simulation."
              image="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=800"
              actionLabel="Open tool"
              onClick={onNavigateToSmileTool}
            />
            <UtilityCard 
              number="02"
              title="Radiology Reader"
              description="Automated dental X-ray analysis for faster clinical discovery."
              image="https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=800"
              actionLabel="Open reader"
              onClick={onNavigateToRadiology}
            />
            <UtilityCard 
              number="03"
              title="Prompt Library"
              description="Battle-tested AI prompts for clinical instructions, ready to send."
              image="https://images.unsplash.com/photo-1586762523044-802ca999912f?auto=format&fit=crop&q=80&w=800"
              actionLabel="Open library"
              onClick={onNavigateToPrompts}
            />
            <UtilityCard 
              number="04"
              title="Substrate Selector"
              description="Pick the right adhesive for any case with smart logic."
              actionLabel="Coming Soon"
              comingSoon
              onClick={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Recent Transformations (Duplicate from Smile Tool but adjusted) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-20 sm:mt-28">
        <div className="bg-white/50 rounded-[2.5rem] sm:rounded-[3.5rem] p-12 sm:p-20 border border-slate-200/50 shadow-sm">
           <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-16">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">RECENT WORK</p>
                <h3 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Your last transformations</h3>
              </div>
              <button 
                onClick={onNavigateToHistory}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
              >
                Open history <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>

           <div className="flex flex-col items-center justify-center py-16 text-center space-y-8">
              <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
                <ImageIcon size={32} />
              </div>
              <div className="space-y-6">
                <p className="text-slate-500 font-medium text-lg">No transformations yet</p>
                <button 
                  onClick={onNavigateToSmileTool}
                  className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2 mx-auto"
                >
                  Try Smile Enhancer <ArrowRight size={16} />
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
