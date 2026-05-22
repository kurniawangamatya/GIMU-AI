import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Ticket, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RedeemTokenProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RedeemToken({ isOpen, onClose }: RedeemTokenProps) {
  const { redeemToken } = useAuth();
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setStatus('loading');
    const result = await redeemToken(token.trim());
    
    if (result.success) {
      setStatus('success');
      setToken('');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 2000);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                    <Ticket size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Redeem Credit Token</h3>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <p className="text-sm text-slate-500 mb-4">
                    Enter the license key you purchased to add credits to your account.
                  </p>
                  <input 
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value.toUpperCase())}
                    placeholder="GIMU.AI-XXXX-XXXX"
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-brand-500 focus:bg-white rounded-2xl outline-none transition-all font-mono font-bold text-lg text-slate-900 placeholder:text-slate-300"
                  />
                </div>

                {status === 'error' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-rose-50 text-rose-600 rounded-2xl text-sm font-medium"
                  >
                    <AlertCircle size={18} />
                    {message}
                  </motion.div>
                )}

                {status === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 p-4 bg-emerald-50 text-emerald-600 rounded-2xl text-sm font-medium"
                  >
                    <CheckCircle2 size={18} />
                    Credits added successfully!
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : 'Redeem Now'}
                </button>
              </form>
            </div>
            
            <div className="bg-slate-50 p-6 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Don't have a token? <button className="text-brand-600 hover:underline">Contact sales</button>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
