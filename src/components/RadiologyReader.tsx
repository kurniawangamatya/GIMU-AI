import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Activity, Shield, Zap, Info, FileText, Download, Share2, Search, BrainCircuit, Check, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { analyzeRadiology } from '../lib/gemini';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';

export default function RadiologyReader({ onOpenShop }: { onOpenShop?: () => void }) {
  const { user, userData, login, deductCredit } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownload = async () => {
    if (!image) return;
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `XRAY_${new Date().getTime()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Gagal mendownload gambar. Silakan coba lagi.');
    }
  };

  const ensureImageSize = (base64: string, maxDimension = 800): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height *= maxDimension / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width *= maxDimension / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Use jpeg with 0.6 quality to keep size small for Firestore
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const saveGeneration = async (imgUrl: string, report: string) => {
    if (!user) return;
    try {
      // Downscale image before saving to Firestore (1MB limit)
      const smallImg = await ensureImageSize(imgUrl);
      
      await addDoc(collection(db, 'generations'), {
        userId: user.uid,
        type: 'radiology',
        imageUrl: smallImg,
        report: report,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving generation:', error);
    }
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setImage(loadEvent.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!user) {
      login();
      return;
    }

    if ((userData?.credits ?? 0) < 1) {
      if (onOpenShop) {
        onOpenShop();
      } else {
        alert("Sisa koin Anda habis. Silakan beli koin untuk melanjutkan.");
      }
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      const mimeType = image!.split(',')[0].split(':')[1].split(';')[0];
      const base64Data = image!.split(',')[1];

      const success = await deductCredit(1);
      if (!success) {
        throw new Error("Credit deduction failed");
      }
      
      const result = await analyzeRadiology(base64Data, mimeType);
      setAnalysisResult(result);

      // Save to history
      await saveGeneration(image, result);
    } catch (error: any) {
      console.error(error);
      alert("Failed to process analysis: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-10">
        <div className="bg-[#1a1a1a] rounded-[2.5rem] sm:rounded-[3.5rem] p-8 sm:p-14 lg:p-20 relative overflow-hidden">
          <div className="max-w-2xl space-y-6 sm:space-y-8 relative z-10 text-center sm:text-left">
            <div className="space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-500/10 border border-brand-500/20 rounded-full text-brand-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest">
                <BrainCircuit size={14} /> AI Powered
              </div>
              <h1 className="text-3xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                Radiology <span className="text-white/40">Reader.</span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-lg max-w-lg leading-relaxed mx-auto sm:mx-0">
                Instant AI-driven detection for caries, bone loss, and periapical lesions. Precision analysis in seconds.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-emerald-500" />
                HIPAA Compliant
              </div>
              <div className="flex items-center gap-2">
                <Zap size={12} className="text-amber-500" />
                98.2% Accuracy
              </div>
            </div>
          </div>

          {/* Abstract DNA/Tech Background Pattern */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
            <svg viewBox="0 0 100 100" className="w-full h-full text-brand-500">
              <path d="M10,50 Q25,10 40,50 T70,50 T100,50" fill="none" stroke="currentColor" strokeWidth="0.5" />
              <path d="M10,60 Q25,20 40,60 T70,60 T100,60" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Upload / View Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
              {!image ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex flex-col items-center justify-center p-12 border-4 border-dashed border-slate-50 m-6 rounded-[2rem] cursor-pointer hover:bg-slate-50 transition-colors group"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:bg-brand-50 group-hover:text-brand-600 transition-all mb-6">
                    <Upload size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Panoramic or Bitewing</h3>
                  <p className="text-slate-500 text-sm mb-8">Drag and drop file or click to browse</p>
                  <div className="flex gap-4">
                    <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">PNG</div>
                    <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">JPG</div>
                    <div className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest">DICOM</div>
                  </div>
                </div>
              ) : (
                <div className="relative flex-1 bg-black overflow-hidden group">
                  <img src={image} alt="Radiograph" className="w-full h-full object-contain opacity-80" />
                  
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ top: 0 }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-brand-500 shadow-[0_0_20px_rgba(var(--brand-rgb),0.5)] z-20"
                    />
                  )}

                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
                    <button 
                      onClick={() => { setImage(null); setAnalysisResult(null); }}
                      className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      Remove
                    </button>
                    {!isAnalyzing && (
                      <button 
                        onClick={startAnalysis}
                        className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-brand-900/20"
                      >
                        {analysisResult ? 'Re-Analyze' : 'Analyze Now'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Info/Report */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Analysis Report</h2>
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-900">
                  <FileText size={18} />
                </div>
              </div>

              {!image ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto">
                    <Search size={20} />
                  </div>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed px-4">
                    Upload a radiograph to begin AI clinical discovery.
                  </p>
                </div>
              ) : isAnalyzing ? (
                <div className="py-12 space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative w-12 h-12">
                       <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-2 border-slate-100 border-t-brand-500 rounded-full"
                       />
                       <Search className="absolute inset-0 m-auto text-brand-500" size={20} />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-900 font-bold mb-1">Scanning Pixels...</p>
                      <p className="text-slate-400 text-[10px] uppercase font-black tracking-widest">Neural Network Active</p>
                    </div>
                  </div>
                </div>
              ) : analysisResult ? (
                <div className="space-y-6">
                  <div className="prose prose-slate prose-sm max-w-none">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-[13px] leading-relaxed text-slate-700 markdown-body">
                       <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex gap-2">
                    <button 
                      onClick={handleDownload}
                      className="flex-1 bg-slate-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all"
                    >
                      <Download size={14} /> Download
                    </button>
                    <button className="flex-1 bg-white border border-slate-200 text-slate-900 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all">
                      <Share2 size={14} /> Share
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <button 
                      onClick={startAnalysis}
                      className="bg-brand-600 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-500 transition-all"
                    >
                      Process Analysis
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div className="bg-slate-200/50 rounded-2xl p-6">
              <p className="text-[10px] leading-relaxed text-slate-500 font-medium italic">
                * AI analysis is a clinical aid only. Final diagnosis must be performed by a licensed practitioner.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
