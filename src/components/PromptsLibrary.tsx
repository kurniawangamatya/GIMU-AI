import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight, BookOpen, MessageSquare, Megaphone, ClipboardList, Mail, Check, RefreshCw } from 'lucide-react';

interface CollectionCardProps {
  number: string;
  title: string;
  description: string;
  count: string;
  icon: React.ReactNode;
  mostUsed?: boolean;
}

function CollectionCard({ number, title, description, count, icon, mostUsed }: CollectionCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm flex flex-col h-full cursor-pointer group hover:border-brand-200 transition-colors"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
          {icon}
        </div>
        {mostUsed && (
           <span className="flex items-center gap-1.5 text-[9px] font-black text-brand-600 uppercase tracking-widest">
             <Sparkles size={10} /> Most used
           </span>
        )}
      </div>

      <div className="space-y-4 flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{number} / 04</p>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="mt-10 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-none">
          {count} prompts
        </span>
        <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:bg-brand-600 transition-colors">
          <ArrowRight size={18} />
        </div>
      </div>
    </motion.div>
  );
}

export default function PromptsLibrary() {
  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Dark Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-10">
        <div className="bg-[#1a1a1a] rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-14 lg:p-20 relative overflow-hidden">
          <div className="max-w-2xl space-y-6 sm:space-y-8 relative z-10 text-center sm:text-left">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none">LIBRARY · 25 PROMPTS · 4 CATEGORIES</p>
              <h1 className="text-3xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                Prompts that already work in practice.
              </h1>
              <p className="text-slate-400 text-sm sm:text-lg max-w-lg leading-relaxed mx-auto sm:mx-0">
                Battle-tested AI prompts, written by dentists, for dentists — copy one, plug in your patient, send it.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Check size={12} className="text-emerald-500" />
                Works on ChatGPT, Gemini, Claude
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Left Guide */}
          <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 shrink-0">
              <BookOpen size={28} />
            </div>
            <div className="space-y-6 flex-1">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GUIDE · 4 MIN READ</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">First time prompting? Start here.</h2>
                <p className="text-slate-500 text-sm leading-relaxed">The 5 moves that make prompts easier to reuse.</p>
              </div>
              <button className="bg-slate-900 text-white px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all mx-auto md:ml-0">
                Read the guide <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Right Request Card */}
          <div className="bg-[#f2e6d9] rounded-[2.5rem] p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
             {/* Subtle overlay effect */}
             <div className="absolute inset-0 bg-white/10 pointer-events-none"></div>
             
             <div className="space-y-2 relative z-10">
                <span className="inline-block px-3 py-1 bg-[#e6d5c3] text-[#a67c52] rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-2">WE READ EVERY REQUEST</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Tell us what prompt to add next.</h2>
                <p className="text-slate-700/60 text-sm leading-relaxed font-medium">Have a patient case, admin task, or marketing idea? Send it in seconds.</p>
             </div>
             
             <button className="bg-slate-900 text-white px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all relative z-10">
                <MessageSquare size={16} /> Ask for a prompt
             </button>
          </div>
        </div>
      </div>

      {/* Collections Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-20 sm:mt-28">
        <div className="space-y-12">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">BROWSE BY PURPOSE</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Four handcrafted collections.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <CollectionCard 
              number="01"
              title="Patient communication"
              description="Help patients understand treatments and feel comfortable"
              count="6"
              icon={<MessageSquare size={24} />}
            />
            <CollectionCard 
              number="02"
              title="Marketing & social"
              description="Attract and engage patients with compelling content"
              count="6"
              icon={<Megaphone size={24} />}
            />
            <CollectionCard 
              number="03"
              title="Admin & office"
              description="Streamline operations and internal communication"
              count="6"
              icon={<ClipboardList size={24} />}
            />
            <CollectionCard 
              number="04"
              title="Email templates"
              description="Professional emails for common patient communications"
              count="7"
              icon={<Mail size={24} />}
              mostUsed
            />
          </div>
        </div>
      </div>
    </div>
  );
}
