import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Image as ImageIcon, Video as VideoIcon, Download, Search, X, Activity, BookOpen, Clock } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

interface FilterButtonProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

function FilterButton({ label, count, active, onClick, variant = 'primary' }: FilterButtonProps) {
  if (variant === 'primary') {
    return (
      <button 
        onClick={onClick}
        className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all active:scale-95 ${active ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'bg-white text-slate-500 border border-slate-100 hover:border-slate-200'}`}
      >
        {label} ({count})
      </button>
    );
  }

  return (
    <button 
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 ${active ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-900'}`}
    >
      {label} ({count})
    </button>
  );
}

export default function History({ onNavigateToSmileTool }: { onNavigateToSmileTool: () => void }) {
  const { user } = useAuth();
  const [generations, setGenerations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'smile' | 'radiology'>('all');

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "generations"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGenerations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredGenerations = generations.filter(g => filter === 'all' || g.type === filter);

  const handleDownload = async (url: string, prefix: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${prefix}_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Gagal mendownload gambar.');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Dark Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-10">
        <div className="bg-[#1a1a1a] rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-14 lg:p-20 relative overflow-hidden">
          <div className="space-y-4 relative z-10 text-center sm:text-left">
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none">ARCHIVE</p>
            <h1 className="text-3xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
              History AI <span className="text-white/40">Anda.</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-lg max-w-lg leading-relaxed mx-auto sm:mx-0">
              Semua hasil transformasi Smile Tool dan analisa Radiology AI tersimpan aman di sini.
            </p>
          </div>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12 space-y-10">
        <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
          <FilterButton 
            label="Semua" 
            count={generations.length} 
            active={filter === 'all'} 
            onClick={() => setFilter('all')} 
          />
          <FilterButton 
            label="Smile Tool" 
            count={generations.filter(g => g.type === 'smile').length} 
            active={filter === 'smile'} 
            onClick={() => setFilter('smile')} 
          />
          <FilterButton 
            label="Radiology AI" 
            count={generations.filter(g => g.type === 'radiology').length} 
            active={filter === 'radiology'} 
            onClick={() => setFilter('radiology')} 
          />
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-500 rounded-full animate-spin" />
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Memuat Riwayat...</p>
          </div>
        ) : filteredGenerations.length === 0 ? (
          <div className="bg-white/50 rounded-[2.5rem] sm:rounded-[3.5rem] p-20 sm:p-32 border border-slate-200/50 flex flex-col items-center justify-center text-center space-y-8">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-300">
               <ImageIcon size={32} />
            </div>
            <div className="space-y-8">
              <p className="text-slate-500 font-medium text-lg">Belum ada riwayat {filter !== 'all' ? filter : ''}</p>
              <button 
                onClick={onNavigateToSmileTool}
                className="bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2 mx-auto"
              >
                Coba GIMU Sekarang <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGenerations.map((item) => (
              <motion.div 
                key={item.id}
                layoutId={item.id}
                onClick={() => setSelectedItem(item)}
                className="bg-white rounded-[2rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
              >
                <div className="aspect-[4/3] relative overflow-hidden bg-slate-900">
                  <img 
                    src={item.type === 'smile' ? (item.afterUrl || item.beforeUrl) : (item.imageUrl)} 
                    alt="Result" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-[8px] font-black text-white uppercase tracking-widest border border-white/10">
                      {item.type === 'smile' ? 'Smile Tool' : 'Radiology'}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-900 shadow-2xl scale-50 group-hover:scale-100 transition-transform">
                      <Search size={20} />
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                   <div className="flex items-center gap-2 text-slate-400">
                     <Clock size={12} />
                     <span className="text-[10px] font-bold uppercase tracking-widest">
                       {item.createdAt?.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                     </span>
                   </div>
                   <p className="text-sm font-bold text-slate-900 line-clamp-1">
                     {item.type === 'smile' ? item.prompt : 'Radiology Analysis Report'}
                   </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
            >
              <div 
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
                onClick={() => setSelectedItem(null)}
              />
              <motion.div 
                layoutId={selectedItem.id}
                className="relative w-full max-w-4xl bg-white rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col md:flex-row h-full max-h-[85vh]"
              >
                <div className="flex-1 bg-slate-900 relative min-h-[300px] md:min-h-0">
                  <img 
                    src={selectedItem.type === 'smile' ? selectedItem.afterUrl : selectedItem.imageUrl} 
                    alt="Detail" 
                    className="w-full h-full object-contain" 
                  />
                  <div className="absolute top-6 left-6 flex gap-2">
                    <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                      Enhanced Result
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-6 right-6 w-10 h-10 bg-white/10 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="w-full md:w-[400px] p-8 sm:p-10 flex flex-col bg-white border-l border-slate-100">
                  <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${selectedItem.type === 'smile' ? 'bg-brand-50 text-brand-600' : 'bg-slate-50 text-slate-900'}`}>
                          {selectedItem.type === 'smile' ? <Sparkles size={20} /> : <Activity size={20} />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedItem.type} Tool</p>
                          <p className="text-lg font-black text-slate-900">Transformation Details</p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2 font-bold uppercase tracking-widest">
                        <Clock size={12} />
                        {selectedItem.createdAt?.toDate().toLocaleString('id-ID')}
                      </p>
                    </div>

                    <div className="space-y-6">
                      {selectedItem.type === 'smile' ? (
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">AI Feedback</p>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm italic text-slate-600 leading-relaxed">
                            "{selectedItem.feedback}"
                          </div>
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Original Prompt</p>
                          <p className="text-sm font-bold text-slate-700">{selectedItem.prompt}</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Radiology Report</p>
                          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] leading-relaxed text-slate-700 markdown-body h-64 overflow-y-auto no-scrollbar">
                             <ReactMarkdown>{selectedItem.report}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 mt-auto">
                    <button 
                      onClick={() => handleDownload(selectedItem.type === 'smile' ? selectedItem.afterUrl : selectedItem.imageUrl, selectedItem.type)}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
                    >
                      <Download size={16} /> Download Result
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
