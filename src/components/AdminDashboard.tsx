import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Key, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Loader2, 
  LayoutDashboard,
  Users,
  Coins
} from 'lucide-react';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LicenseKey {
  code: string;
  value: number;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: any;
}

export default function AdminDashboard() {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newValue, setNewValue] = useState(10);

  useEffect(() => {
    const q = query(collection(db, 'licenseKeys'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const keysData = snapshot.docs.map(doc => doc.data() as LicenseKey);
      setKeys(keysData.sort((a, b) => (a.isUsed === b.isUsed ? 0 : a.isUsed ? 1 : -1)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const generateKey = async () => {
    setIsGenerating(true);
    const randomCode = `GIMU.AI-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    try {
      await setDoc(doc(db, 'licenseKeys', randomCode), {
        code: randomCode,
        value: newValue,
        isUsed: false,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Failed to generate key", error);
      alert("Permission denied. Ensure you are registered as an admin in Firestore.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Code copied!');
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="text-brand-600" /> Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage license keys and platform usage.</p>
          </div>
          <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
            <input 
              type="number" 
              value={newValue}
              onChange={(e) => setNewValue(parseInt(e.target.value))}
              placeholder="Credits"
              className="w-24 px-4 py-2 rounded-xl bg-slate-50 border-none outline-none font-bold text-slate-900"
            />
            <button 
              onClick={generateKey}
              disabled={isGenerating}
              className="px-6 py-2.5 bg-brand-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand-700 transition-all flex items-center gap-2 shadow-lg shadow-brand-200"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
              Generate Key
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <CheckCircle />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{keys.filter(k => k.isUsed).length}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Tokens Redeemed</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-4">
                <Key />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">{keys.filter(k => !k.isUsed).length}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active Tokens Available</p>
            </div>
          </div>

          {/* Table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 border-b border-slate-50">
                <h2 className="text-lg font-bold text-slate-900">License Keys</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-4">Key Code</th>
                      <th className="px-8 py-4">Value</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center">
                          <Loader2 className="animate-spin mx-auto text-slate-300" size={32} />
                        </td>
                      </tr>
                    ) : keys.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-medium">
                          No license keys generated yet.
                        </td>
                      </tr>
                    ) : (
                      keys.map((key) => (
                        <tr key={key.code} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-2">
                              <code className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded">{key.code}</code>
                              <button onClick={() => copyToClipboard(key.code)} className="text-slate-300 hover:text-brand-600">
                                <Copy size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-xs font-bold text-slate-600">{key.value} Credits</span>
                          </td>
                          <td className="px-8 py-4">
                            {key.isUsed ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                <XCircle size={10} /> Redeemed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
                                <CheckCircle size={10} /> Active
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-4 text-right">
                             {/* Delete usually disabled for used keys or for audit logs */}
                             {!key.isUsed && (
                               <button 
                                onClick={async () => {
                                  if(confirm('Delete this key?')) await deleteDoc(doc(db, 'licenseKeys', key.code));
                                }}
                                className="text-slate-300 hover:text-rose-600"
                               >
                                 <Trash2 size={16} />
                               </button>
                             )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
