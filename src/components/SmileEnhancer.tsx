import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, ImageIcon, Sparkles, ArrowRight, Check, Download, Share2, Loader2, RefreshCw, Lock, Coins } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { enhanceSmile, analyzeSmileFeedback } from '../lib/gemini';
import { useAuth } from '../contexts/AuthContext';

interface ComparisonProps {
  before: string;
  after: string;
}

const ImageComparison = ({ before, after }: ComparisonProps) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const position = ((x - rect.left) / rect.width) * 100;
    setSliderPos(Math.max(0, Math.min(100, position)));
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-square w-full max-w-2xl mx-auto rounded-[2.5rem] overflow-hidden cursor-ew-resize select-none shadow-2xl border-4 border-white/80 bg-white/20 backdrop-blur-md"
      onMouseMove={handleMove}
      onTouchMove={handleMove}
    >
      <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
      <div 
        className="absolute inset-0 overflow-hidden" 
        style={{ width: `${sliderPos}%` }}
      >
        <img src={before} alt="Before" className="absolute inset-0 h-full object-cover" style={{ width: `${100 / (sliderPos / 100)}%`, maxWidth: 'none' }} referrerPolicy="no-referrer" />
      </div>
      
      {/* Slider Line */}
      <div 
        className="absolute top-0 bottom-0 w-1 bg-white/80 shadow-lg pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white/40 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-2xl border border-white/60">
          <div className="flex gap-1">
            <div className="w-1 h-3 bg-brand-600 rounded-full opacity-80" />
            <div className="w-1 h-3 bg-brand-600 rounded-full opacity-80" />
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 bg-black/40 backdrop-blur-xl px-4 py-1.5 rounded-full text-white text-[10px] font-bold tracking-widest uppercase">Original</div>
      <div className="absolute bottom-6 right-6 bg-brand-600/60 backdrop-blur-xl px-4 py-1.5 rounded-full text-white text-[10px] font-bold tracking-widest uppercase">Enhanced</div>
    </div>
  );
};

export default function SmileEnhancer({ onOpenShop }: { onOpenShop?: () => void }) {
  const { user, userData, login, deductCredit } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = [
    { name: 'Natural Enhance', icon: '✨' },
    { name: 'Hollywood', icon: '🎬' },
    { name: 'Straighten', icon: '📏' },
    { name: 'Veneer Preview', icon: '⭐', special: true },
    { name: 'Whitening', icon: '🦷' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        setResult(null);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    try {
      const response = await fetch(result);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `SMILE_${new Date().getTime()}.png`;
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

  const saveGeneration = async (beforeUrl: string, afterUrl: string, feedback: string) => {
    if (!user) return;
    try {
      // Downscale images before saving to Firestore (1MB limit)
      const [smallBefore, smallAfter] = await Promise.all([
        ensureImageSize(beforeUrl),
        ensureImageSize(afterUrl)
      ]);

      await addDoc(collection(db, 'generations'), {
        userId: user.uid,
        type: 'smile',
        beforeUrl: smallBefore,
        afterUrl: smallAfter,
        prompt: prompt || 'Natural Enhance',
        feedback: feedback,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving generation:', error);
    }
  };

  const processImage = async () => {
    if (!image) return;
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

    setIsProcessing(true);
    
    try {
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
      const base64Data = image.split(',')[1];
      
      const success = await deductCredit(1);
      if (!success) {
        throw new Error("Credit deduction failed");
      }

      const [feedback, enhanced] = await Promise.all([
        analyzeSmileFeedback(base64Data, mimeType),
        enhanceSmile(base64Data, mimeType)
      ]);
      
      setAnalysis(feedback);
      setResult(enhanced);
      
      // Save to history
      await saveGeneration(image, enhanced, feedback);

    } catch (error) {
      console.error(error);
      alert("Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setImage(null);
    setResult(null);
    setAnalysis(null);
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Dark Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-10">
        <div className="bg-[#1a1a1a] rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-12 lg:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 space-y-4 sm:space-y-8 relative z-10 w-full text-center lg:text-left">
            <div className="space-y-3 sm:space-y-4">
              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest">SMILE TOOL · STEP 1 / 3</p>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                Transform a smile <br className="hidden sm:block"/> in seconds.
              </h1>
              <p className="text-slate-400 text-sm sm:text-lg max-w-md mx-auto lg:mx-0">
                Upload a patient photo, pick a direction, and keep every detail that matters.
              </p>
            </div>
            
            <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-6 text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Check size={12} className="text-emerald-500" />
                Photos never train models
              </div>
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-brand-400" />
                Under 20 seconds
              </div>
            </div>
          </div>

          <div className="w-full max-w-md lg:max-w-xl relative shrink-0">
            <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-800 relative group">
               <img src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=1200" alt="Before/After Preview" className="w-full h-full object-cover opacity-80" />
               <div className="absolute inset-0 flex">
                  <div className="flex-1 relative border-r border-white/20">
                    <span className="absolute top-4 left-4 bg-black/60 backdrop-blur px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">BEFORE</span>
                  </div>
                  <div className="flex-1 relative">
                    <span className="absolute top-4 right-4 bg-black/60 backdrop-blur px-2 py-1 rounded text-[8px] font-black text-white uppercase tracking-widest">AFTER</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left: Upload Workspace */}
          <div className="lg:col-span-7">
            <div className={`bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-12 h-full flex flex-col items-center justify-center text-center border border-slate-100 shadow-sm relative overflow-hidden min-h-[400px] sm:min-h-[500px] cursor-pointer hover:border-brand-200 transition-colors ${image ? 'p-4' : ''}`} onClick={() => !image && fileInputRef.current?.click()}>
              {!image ? (
                <>
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 mb-8">
                    <ImageIcon size={32} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Drop a smiling photo</h3>
                  <p className="text-slate-500 text-sm mb-10">PNG or JPG · up to 20 MB · 1:1 or portrait works best</p>
                  
                  <button className="bg-slate-900 text-white px-8 py-3.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all active:scale-95">
                    <Upload size={18} />
                    Browse files
                  </button>
                </>
              ) : (
                <div className="w-full h-full relative rounded-2xl overflow-hidden">
                   {result ? (
                     <>
                        <ImageComparison before={image} after={result} />
                        <div className="absolute bottom-6 right-6 flex gap-2 z-30">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDownload(); }} 
                            className="bg-brand-600 hover:bg-brand-500 text-white p-4 rounded-full shadow-2xl transition-all active:scale-90 flex items-center gap-2 group"
                          >
                            <Download size={20} />
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-[10px] font-black uppercase tracking-widest">Download Hasil</span>
                          </button>
                        </div>
                     </>
                   ) : (
                     <div className="w-full h-full flex items-center justify-center relative">
                        <img src={image} alt="Original" className="w-full h-full object-contain" />
                        {isProcessing && (
                          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-8">
                            <Loader2 className="animate-spin mb-4" size={40} />
                            <p className="text-lg font-bold">Transforming Smile...</p>
                            <p className="text-white/60 text-sm mt-2">Our AI is applying professional dental adjustments</p>
                          </div>
                        )}
                        {!isProcessing && (
                          <button onClick={(e) => { e.stopPropagation(); reset(); }} className="absolute top-4 right-4 bg-white/20 backdrop-blur text-white p-2 rounded-full hover:bg-white/40 transition-colors">
                            <RefreshCw size={20} />
                          </button>
                        )}
                     </div>
                   )}
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
            </div>
          </div>

          {/* Right: Controls */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-8 sm:p-10 border border-slate-100 shadow-sm space-y-10">
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">STEP 2</p>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">Pick a direction.</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Describe the smile you want</label>
                    <button className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-colors">
                      <Sparkles size={11} /> Tips
                    </button>
                  </div>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask GIMU to make a subtle bright confident smile..."
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-100 rounded-2xl resize-none text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all font-medium text-sm"
                  />
                </div>

                <div className="space-y-4">
                   <p className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Quick presets</p>
                   <div className="flex flex-wrap gap-3">
                      {presets.map((preset) => (
                        <button 
                          key={preset.name}
                          onClick={() => setPrompt(`Apply ${preset.name} treatment`)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 ${preset.special ? 'border-brand-100 bg-brand-50 text-brand-700 hover:bg-brand-100' : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'}`}
                        >
                          {preset.special && <Sparkles size={12} className="text-brand-500" />}
                          {preset.name}
                        </button>
                      ))}
                   </div>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  disabled={!image || isProcessing}
                  onClick={processImage}
                  className={`w-full py-4 sm:py-5 rounded-full font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${!image || isProcessing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200'}`}
                >
                  <Sparkles size={18} />
                  {isProcessing ? 'Transforming...' : 'Transform smile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transformations Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-16 sm:mt-24">
        <div className="bg-slate-100/50 rounded-[2.5rem] sm:rounded-[3rem] p-10 sm:p-16 border border-slate-200/40">
           <div className="flex items-center justify-between mb-12">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">RECENT · SMILE TOOL</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">Your last transformations</h3>
              </div>
              <button className="flex items-center gap-2 text-xs font-bold text-slate-900 hover:opacity-70 transition-opacity uppercase tracking-widest">
                See all <ArrowRight size={16} />
              </button>
           </div>

           <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 space-y-6">
              <div className="w-16 h-16 bg-slate-200/50 rounded-2xl flex items-center justify-center">
                <ImageIcon size={32} />
              </div>
              <p className="text-sm font-medium">No smile transformations yet</p>
           </div>
        </div>
      </div>
    </div>
  );
}
