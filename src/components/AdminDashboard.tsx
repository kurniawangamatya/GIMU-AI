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
  serverTimestamp,
  updateDoc,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface LicenseKey {
  code: string;
  value: number;
  isUsed: boolean;
  usedBy?: string;
  usedAt?: any;
}

interface ManualPayment {
  id: string;
  userId: string;
  userEmail: string;
  packageName: string;
  tokens: number;
  amount: number;
  senderName: string;
  senderBank: string;
  receiptUrl: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: any;
}

export default function AdminDashboard() {
  const [keys, setKeys] = useState<LicenseKey[]>([]);
  const [payments, setPayments] = useState<ManualPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newValue, setNewValue] = useState(10);
  const [activeTab, setActiveTab] = useState<'keys' | 'payments'>('keys');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const qKeys = query(collection(db, 'licenseKeys'));
    const unsubscribeKeys = onSnapshot(qKeys, (snapshot) => {
      const keysData = snapshot.docs.map(doc => doc.data() as LicenseKey);
      setKeys(keysData.sort((a, b) => (a.isUsed === b.isUsed ? 0 : a.isUsed ? 1 : -1)));
      setLoading(false);
    });

    const qPayments = query(collection(db, 'manual_payments'));
    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      const paymentsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ManualPayment));
      setPayments(paymentsData.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      }));
    });

    return () => {
      unsubscribeKeys();
      unsubscribePayments();
    };
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

  const approvePayment = async (paymentId: string, userId: string, tokens: number) => {
    if (confirm(`Approve payment and award ${tokens} credits to user?`)) {
      setProcessingId(paymentId);
      try {
        await runTransaction(db, async (transaction) => {
          const paymentRef = doc(db, 'manual_payments', paymentId);
          const userRef = doc(db, 'users', userId);

          const paymentSnap = await transaction.get(paymentRef);
          if (!paymentSnap.exists()) {
            throw new Error("Payment record not found");
          }

          const paymentData = paymentSnap.data();
          if (paymentData.status !== 'pending') {
            throw new Error("Payment is already processed");
          }

          const userSnap = await transaction.get(userRef);
          const currentCredits = userSnap.exists() ? (userSnap.data()?.credits || 0) : 0;

          // 1. Credit the user
          transaction.set(userRef, {
            credits: currentCredits + tokens,
            updatedAt: serverTimestamp()
          }, { merge: true });

          // 2. Complete payment record
          transaction.update(paymentRef, {
            status: 'completed',
            approvedAt: serverTimestamp()
          });
        });
        alert("Pembayaran manual berhasil disetujui! Kredit telah ditambahkan ke pengguna.");
      } catch (error: any) {
        console.error("Failed to approve payment", error);
        alert("Gagal menyetujui pembayaran: " + error.message);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const rejectPayment = async (paymentId: string) => {
    if (confirm("Reject this manual payment confirmation?")) {
      setProcessingId(paymentId);
      try {
        const paymentRef = doc(db, 'manual_payments', paymentId);
        await updateDoc(paymentRef, {
          status: 'rejected',
          rejectedAt: serverTimestamp()
        });
        alert("Konfirmasi pembayaran ditolak.");
      } catch (error: any) {
        console.error("Failed to reject payment", error);
        alert("Gagal menolak pembayaran: " + error.message);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied!');
  };

  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <LayoutDashboard className="text-brand-600" /> Admin Dashboard
            </h1>
            <p className="text-slate-500 mt-2 font-medium">Manage license keys, manual bank transfers, and user credits.</p>
          </div>
          {activeTab === 'keys' && (
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
          )}
        </header>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 mb-8 gap-6">
          <button
            onClick={() => setActiveTab('keys')}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'keys' 
                ? 'border-brand-600 text-brand-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            License Keys ({keys.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-4 px-2 text-sm font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'payments' 
                ? 'border-brand-600 text-brand-600' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Manual Payments
            {pendingPaymentsCount > 0 && (
              <span className="px-2 py-0.5 text-[9px] bg-amber-500 text-white rounded-full font-black animate-pulse">
                {pendingPaymentsCount} PENDING
              </span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Column */}
          <div className="lg:col-span-1 space-y-6">
            {activeTab === 'keys' ? (
              <>
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
              </>
            ) : (
              <>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                    <Loader2 className="animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{pendingPaymentsCount}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Approval</p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{payments.filter(p => p.status === 'completed').length}</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Completed Transfers</p>
                </div>
              </>
            )}
          </div>

          {/* Main Table Content */}
          <div className="lg:col-span-2">
            {activeTab === 'keys' ? (
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
            ) : (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50">
                  <h2 className="text-lg font-bold text-slate-900">Manual Payment Confirmations</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">Sender Info</th>
                        <th className="px-6 py-4">Package / Price</th>
                        <th className="px-6 py-4">Receipt</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {payments.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                            No manual payments submitted yet.
                          </td>
                        </tr>
                      ) : (
                        payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/50 transition-colors align-top">
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-900">{p.senderName}</p>
                                <p className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded inline-block">{p.senderBank}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{p.userEmail}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="text-xs font-bold text-slate-900">{p.packageName}</p>
                                <p className="text-xs font-black text-emerald-600">Rp {p.amount?.toLocaleString('id-ID')}</p>
                                <p className="text-[10px] font-bold text-slate-400">+{p.tokens} Credits</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {p.receiptUrl && p.receiptUrl !== "https://placeholder.com/receipt.jpg" ? (
                                <a 
                                  href={p.receiptUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                                >
                                  View Receipt
                                </a>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">No Upload</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {p.status === 'pending' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-[9px] font-black text-amber-600 uppercase tracking-widest animate-pulse">
                                  Pending
                                </span>
                              ) : p.status === 'completed' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-[9px] font-black text-green-600 uppercase tracking-widest">
                                  Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-[9px] font-black text-rose-600 uppercase tracking-widest">
                                  Rejected
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {p.status === 'pending' && (
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => approvePayment(p.id, p.userId, p.tokens)}
                                    disabled={processingId !== null}
                                    className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors flex items-center gap-1"
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => rejectPayment(p.id)}
                                    disabled={processingId !== null}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
