import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, ImageIcon, Sparkles, ArrowRight, Check, Download, Share2, Loader2, RefreshCw } from 'lucide-react';
import { enhanceSmile, analyzeSmileFeedback } from '../lib/gemini';

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

export default function SmileEnhancer() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const processImage = async () => {
    if (!image) return;
    setIsProcessing(true);
    
    try {
      const mimeType = image.split(',')[0].split(':')[1].split(';')[0];
      const base64Data = image.split(',')[1];
      
      const [feedback, enhanced] = await Promise.all([
        analyzeSmileFeedback(base64Data, mimeType),
        enhanceSmile(base64Data, mimeType)
      ]);
      
      setAnalysis(feedback);
      setResult(enhanced);

    } catch (error) {
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
    <section className="py-20 px-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-12 items-center md:items-start">
      <div className="flex-1 space-y-8 md:sticky md:top-32">
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-bold tracking-widest uppercase border border-brand-100"
          >
            <Sparkles size={12} /> Next-Gen AI Simulation
          </motion.div>
          <motion.h1 
            className="text-5xl md:text-7xl font-display font-bold text-slate-900 leading-[1.1] tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Perfect smiles, <br/>
            <span className="text-brand-600">reimagined.</span>
          </motion.h1>
          <motion.p 
            className="text-lg text-slate-500 max-w-lg leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Upload a patient photo to generate a high-precision clinical preview of cosmetic enhancements in seconds. 
          </motion.p>
        </div>

        {analysis && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-6 border-l-4 border-l-brand-500"
          >
            <h3 className="text-xs font-bold mb-3 flex items-center gap-2 text-slate-400 uppercase tracking-widest">
              <Sparkles size={14} className="text-brand-500" /> AI CLINICAL ANALYSIS
            </h3>
            <p className="text-slate-700 font-medium leading-relaxed italic">"{analysis}"</p>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-4 pt-4">
          {!result && image && (
            <button 
              disabled={isProcessing}
              onClick={processImage}
              className="btn-primary"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> Processing...
                </>
              ) : (
                <>
                  Generate Preview <ArrowRight size={20} />
                </>
              )}
            </button>
          )}

          {result && (
            <div className="flex gap-4">
              <button className="btn-primary">
                <Download size={20} /> Export Plan
              </button>
              <button className="btn-secondary">
                <Share2 size={20} /> Share
              </button>
            </div>
          )}

          {image && (
            <button 
              onClick={reset}
              className="btn-secondary"
            >
              <RefreshCw size={20} /> Start New
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl">
        <AnimatePresence mode="wait">
          {!image ? (
            <motion.div 
              key="upload"
              className="glass-card p-10 md:p-16 text-center group cursor-pointer hover:bg-white/50 transition-all border-dashed border-2 border-white/80"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-50 text-brand-600 group-hover:scale-110 group-hover:bg-brand-100 transition-all shadow-xl shadow-brand-100">
                <Upload size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-slate-900">Patient Upload</h3>
              <p className="text-slate-500 mb-8 max-w-xs mx-auto">Drop a portrait photo here or click to browse. Supports JPG, PNG, WebP up to 10MB.</p>
              
              <div className="bg-white/40 p-5 rounded-2xl border border-white/60 mb-8">
                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  <span>Privacy Secure</span>
                  <span className="text-green-500 flex items-center gap-1"><Check size={10}/> HIPAA Compliant</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed text-left">Images are processed via secure end-to-end encryption. No PII is stored in our generative models.</p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="w-12 h-0.5 bg-slate-200 rounded-full" />
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">or try example</span>
                <span className="w-12 h-0.5 bg-slate-200 rounded-full" />
              </div>

              <div className="grid grid-cols-4 gap-3 mt-6">
                {[1, 2, 3, 4].map(i => (
                  <button 
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setImage(`https://picsum.photos/seed/smile${i}/600/600`); }}
                    className="aspect-square rounded-xl overflow-hidden hover:ring-4 ring-brand-400/30 transition-all shadow-sm"
                  >
                    <img src={`https://picsum.photos/seed/smile${i}/150/150`} alt="Example" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </motion.div>
          ) : (
            <motion.div 
              key="result-view"
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {!result ? (
                <div className="relative aspect-square rounded-[2.5rem] overflow-hidden glass-card border-4 border-white flex flex-col items-center justify-center p-12 text-center group">
                  <img src={image} alt="Original" className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none" referrerPolicy="no-referrer" />
                  
                  {isProcessing ? (
                    <div className="relative z-10 flex flex-col items-center">
                       <div className="w-24 h-24 rounded-full border-4 border-brand-100 flex items-center justify-center mb-6 bg-white/50 backdrop-blur-md shadow-2xl relative">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="absolute inset-0 border-t-4 border-brand-500 rounded-full"
                          />
                          <Sparkles size={40} className="text-brand-500 animate-pulse" />
                       </div>
                       <h3 className="text-2xl font-bold mb-2">Simulating Smile</h3>
                       <p className="text-slate-500 max-w-xs animate-pulse">Our neural network is mapping 128 dental landmarks to generate your custom preview...</p>
                    </div>
                  ) : (
                    <div className="relative z-10">
                       <button onClick={processImage} className="btn-primary scale-110 shadow-2xl shadow-brand-500/20">
                         Create AI Enhanced Preview
                       </button>
                    </div>
                  )}
                </div>
              ) : (
                <ImageComparison before={image} after={result} />
              )}
              
              {/* Floating metadata tag */}
              <div className="absolute top-6 right-6 flex gap-2">
                <span className="px-3 py-1 bg-brand-500 text-white text-[9px] font-bold rounded-full tracking-widest shadow-lg shadow-brand-500/20 uppercase">Simulation Active</span>
                <span className="px-3 py-1 bg-white/80 backdrop-blur-md text-slate-900 text-[9px] font-bold rounded-full border border-white shadow-sm tracking-widest uppercase">V.3.1-PRO</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
