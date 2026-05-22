import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Zap, ShieldCheck, Star, Ticket, X, Check, ArrowRight, Loader2, CreditCard, Banknote, Upload, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface TokenShopProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRedeem: () => void;
}

const PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    tokens: 10,
    priceLabel: 'Rp 50rb',
    priceValue: 50000,
    perToken: 'Rp 5rb',
    description: 'Cocok untuk klinik kecil yang baru mencoba.',
    features: ['10 Smile Enhancements', 'High-res exports', 'Standard Support'],
    color: 'slate',
    icon: Zap
  },
  {
    id: 'pro',
    name: 'Professional',
    tokens: 50,
    priceLabel: 'Rp 200rb',
    priceValue: 200000,
    perToken: 'Rp 4rb',
    description: 'Paling populer untuk praktik estetika yang sibuk.',
    features: ['50 Smile Enhancements', 'Ultra-res exports', 'Priority Support', 'No Watermark'],
    color: 'brand',
    popular: true,
    icon: Star
  },
  {
    id: 'clinic',
    name: 'Clinic Enterprise',
    tokens: 250,
    priceLabel: 'Rp 750rb',
    priceValue: 750000,
    perToken: 'Rp 3rb',
    description: 'Kredit massal untuk jaringan klinik gigi volume tinggi.',
    features: ['250 Smile Enhancements', 'Team accounts', 'Dedicated Account Manager', 'Custom Branding'],
    color: 'rose',
    icon: ShieldCheck
  }
];

const BANK_ACCOUNTS = [
  { bank: 'BCA', number: '1234567890', owner: 'Admin GIMU AI' },
  { bank: 'Mandiri', number: '0987654321', owner: 'Admin GIMU AI' }
];

export default function TokenShop({ isOpen, onClose, onOpenRedeem }: TokenShopProps) {
  const { user, userData } = useAuth();
  const [loadingPkgId, setLoadingPkgId] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<typeof PACKAGES[0] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'auto' | 'manual' | null>(null);
  const [manualStep, setManualStep] = useState<'instructions' | 'form' | 'success'>('instructions');
  
  // Manual Form States
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('');
  const [receiptUrl, setReceiptUrl] = useState(''); // Normally would be a file upload to Storage
  const [submittingManual, setSubmittingManual] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState<any>(null);

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const res = await fetch("/api/health/firestore");
      const data = await res.json();
      setHealthResult(data);
    } catch (err: any) {
      setHealthResult({ status: "error", message: err.message });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const resetState = () => {
    setSelectedPkg(null);
    setPaymentMethod(null);
    setManualStep('instructions');
    setSenderName('');
    setSenderBank('');
    setReceiptUrl('');
    setLoadingPkgId(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleBuyAuto = async (pkg: typeof PACKAGES[0]) => {
    if (!user) {
      alert("Silakan login terlebih dahulu.");
      return;
    }

    setLoadingPkgId(pkg.id);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          amount: pkg.priceValue,
          tokens: pkg.tokens,
          userId: user.uid,
          customerDetails: {
            first_name: user.displayName || user.email?.split('@')[0],
            email: user.email,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (data.url) {
        // Redirect to Midtrans payment page
        window.location.href = data.url;
      } else {
        throw new Error("Gagal membuat link pembayaran");
      }
    } catch (error: any) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setLoadingPkgId(null);
    }
  };

  const handleManualSubmit = async () => {
    if (!user || !selectedPkg || !senderName || !senderBank) {
      alert("Mohon lengkapi semua data konfirmasi.");
      return;
    }

    setSubmittingManual(true);
    try {
      await addDoc(collection(db, "manual_payments"), {
        userId: user.uid,
        userEmail: user.email,
        packageName: selectedPkg.name,
        tokens: selectedPkg.tokens,
        amount: selectedPkg.priceValue,
        senderName,
        senderBank,
        receiptUrl: receiptUrl || "https://placeholder.com/receipt.jpg", // Placeholder if no file upload logic yet
        status: "pending",
        createdAt: serverTimestamp()
      });
      setManualStep('success');
    } catch (error: any) {
      console.error(error);
      alert("Gagal mengirim konfirmasi: " + error.message);
    } finally {
      setSubmittingManual(false);
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
            onClick={handleClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 40 }}
            className="relative w-full max-w-5xl bg-white rounded-[40px] lg:rounded-[40px] shadow-2xl overflow-hidden max-h-[100dvh] lg:max-h-[90vh] h-full lg:h-auto flex flex-col m-0 lg:m-4"
          >
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
              {/* Sidebar / Info */}
              <div className="lg:w-80 bg-slate-50 p-5 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100 shrink-0">
                <div className="flex items-center gap-4 lg:block">
                  <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white rounded-xl lg:rounded-2xl shadow-sm flex items-center justify-center text-brand-600 lg:mb-6 shrink-0 text-center">
                    {selectedPkg ? (
                      <button onClick={resetState} className="p-2 hover:bg-slate-100 rounded-full transition-colors mx-auto">
                        <ArrowRight className="rotate-180" size={20} />
                      </button>
                    ) : (
                      <>
                        <ShoppingCart size={20} className="lg:hidden mx-auto" />
                        <ShoppingCart size={24} className="hidden lg:block mx-auto" />
                      </>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl lg:text-3xl font-black text-slate-900 leading-tight">
                      {selectedPkg ? 'Konfirmasi' : 'Beli'} <span className="text-brand-600">{selectedPkg ? 'Bayar' : 'Koin'}</span>
                    </h2>
                    <p className="text-slate-500 hidden lg:block mt-4 text-sm font-medium leading-relaxed">
                      {selectedPkg 
                        ? `Selesaikan pembayaran untuk paket ${selectedPkg.name} (${selectedPkg.tokens} koin).`
                        : 'Beli token lisensi untuk membuka fitur smile enhancement berbasis AI yang lebih canggih.'
                      }
                    </p>
                  </div>
                </div>

                <div className="hidden lg:block space-y-4">
                  {!selectedPkg && (
                    <div className="p-4 bg-white rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sudah punya kode?</p>
                      <button 
                        onClick={() => {
                          handleClose();
                          onOpenRedeem();
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-brand-600 hover:gap-3 transition-all cursor-pointer"
                      >
                        <Ticket size={14} /> Tukar Token <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 font-medium">
                    {paymentMethod === 'manual' 
                      ? 'Lakukan transfer ke rekening di atas dan upload bukti bayar.'
                      : 'Pembayaran ditangani dengan aman melalui gerbang pembayaran Midtrans.'}
                  </p>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
                <div className="flex justify-between items-center mb-6 lg:mb-10">
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                      {selectedPkg ? `Paket: ${selectedPkg.name}` : 'Tersedia di Indonesia'}
                    </span>
                    <button 
                      onClick={checkHealth}
                      disabled={isCheckingHealth}
                      className="text-[9px] text-slate-400 hover:text-slate-600 underline uppercase tracking-tight font-bold"
                    >
                      {isCheckingHealth ? "Checking..." : "Debug"}
                    </button>
                  </div>
                  <button 
                    onClick={handleClose}
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                {healthResult && (
                  <div className={`mb-6 p-4 rounded-3xl text-[10px] font-mono overflow-auto max-h-48 border ${healthResult.status === 'ok' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-black uppercase tracking-widest">Connection Diagnostics:</div>
                      <button onClick={() => setHealthResult(null)} className="underline font-bold">DISMISS</button>
                    </div>
                    <pre className="whitespace-pre-wrap">{JSON.stringify(healthResult, null, 2)}</pre>
                  </div>
                )}

                {!selectedPkg ? (
                  /* Package Selection Selection */
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {PACKAGES.map((pkg) => (
                      <motion.div 
                        key={pkg.id}
                        whileHover={{ y: -8 }}
                        className={`relative p-6 lg:p-8 rounded-[32px] border-2 transition-all flex flex-col ${
                          pkg.popular 
                          ? 'border-brand-500 bg-brand-50/20 shadow-xl shadow-brand-100' 
                          : 'border-slate-100 bg-white hover:border-slate-200 shadow-sm'
                        }`}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                            Paling Hemat
                          </div>
                        )}
                        
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-6 ${
                          pkg.color === 'brand' ? 'bg-brand-500 text-white' : 
                          pkg.color === 'rose' ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'
                        }`}>
                          <pkg.icon size={20} />
                        </div>

                        <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                        <div className="flex items-baseline gap-1 mt-2">
                          <span className="text-3xl font-black text-slate-900">{pkg.priceLabel}</span>
                          <span className="text-slate-400 text-xs font-bold font-mono">/ {pkg.tokens} tokens</span>
                        </div>
                        <p className="text-[9px] font-black text-emerald-600 mt-1 uppercase tracking-widest">
                          Hanya {pkg.perToken} per generate
                        </p>
                        
                        <p className="text-xs text-slate-500 mt-4 font-medium mb-6 flex-1">
                          {pkg.description}
                        </p>

                        <ul className="space-y-3 mb-8">
                          {pkg.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                              <Check size={14} className="text-emerald-500 shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>

                        <button 
                          onClick={() => setSelectedPkg(pkg)}
                          className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                            pkg.popular 
                            ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-100' 
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                          }`}
                        >
                          Beli Sekarang
                        </button>
                      </motion.div>
                    ))}
                  </div>
                ) : !paymentMethod ? (
                  /* Payment Method Selection */
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="text-center space-y-2">
                      <h3 className="text-2xl font-black text-slate-900">Pilih Metode Pembayaran</h3>
                      <p className="text-slate-500 text-sm font-medium">Berapa koin: {selectedPkg.tokens} · Total: {selectedPkg.priceLabel}</p>
                    </div>

                    <div className="grid gap-4">
                      <button 
                        onClick={() => handleBuyAuto(selectedPkg)}
                        disabled={loadingPkgId !== null}
                        className="p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-brand-500 transition-all text-left flex items-center gap-4 group cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center group-hover:bg-brand-500 group-hover:text-white transition-colors">
                          {loadingPkgId ? <Loader2 className="animate-spin" size={24} /> : <CreditCard size={24} />}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">Pembayaran Otomatis</h4>
                          <p className="text-xs text-slate-500">QRIS, Virtual Account, & E-Wallet (Instan)</p>
                        </div>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-brand-500 transition-all" />
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('manual')}
                        className="p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-slate-900 transition-all text-left flex items-center gap-4 group cursor-pointer"
                      >
                        <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-colors">
                          <Banknote size={24} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-900">Transfer Manual</h4>
                          <p className="text-xs text-slate-500">Transfer antar bank & upload bukti bayar</p>
                        </div>
                        <ArrowRight size={18} className="text-slate-300 group-hover:text-slate-900 transition-all" />
                      </button>
                    </div>

                    <button onClick={resetState} className="w-full py-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                      Ganti Paket
                    </button>
                  </div>
                ) : paymentMethod === 'manual' ? (
                  /* Manual Payment Steps */
                  <div className="max-w-xl mx-auto">
                    {manualStep === 'instructions' && (
                      <div className="space-y-6">
                        <div className="text-center space-y-2">
                          <h3 className="text-2xl font-black text-slate-900">Instruksi Transfer</h3>
                          <p className="text-slate-500 text-sm font-medium">Silakan transfer tepat senilai <span className="text-slate-900 font-bold">{selectedPkg.priceLabel}</span></p>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-6 space-y-4">
                          {BANK_ACCOUNTS.map(acc => (
                            <div key={acc.number} className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{acc.bank}</p>
                                <p className="text-lg font-black text-slate-900 tracking-wider">{acc.number}</p>
                                <p className="text-xs font-bold text-slate-500">a/n {acc.owner}</p>
                              </div>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(acc.number);
                                  alert("Nomor rekening disalin!");
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-colors"
                              >
                                Salin
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 mt-4">
                          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                          <p className="text-[11px] text-amber-700 leading-relaxed">
                            Simpan struk atau screenshot bukti transfer Anda. Admin akan melakukan pengecekan secara manual (estimasi 1x24 jam).
                          </p>
                        </div>

                        <button 
                          onClick={() => setManualStep('form')}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                        >
                          Saya Sudah Transfer <ArrowRight size={14} />
                        </button>
                      </div>
                    )}

                    {manualStep === 'form' && (
                      <div className="space-y-6">
                        <div className="text-center space-y-2">
                          <h3 className="text-2xl font-black text-slate-900">Konfirmasi Transfer</h3>
                          <p className="text-slate-500 text-sm font-medium">Bantu kami verifikasi transaksi Anda lebih cepat.</p>
                        </div>

                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nama Pengirim</label>
                            <input 
                              type="text" 
                              placeholder="Nama SESUAI di rekening"
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bank Pengirim</label>
                            <input 
                              type="text" 
                              placeholder="Contoh: BCA, Mandiri, Jenius"
                              value={senderBank}
                              onChange={(e) => setSenderBank(e.target.value)}
                              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Bukti Transfer (Opsional URL)</label>
                            <div className="relative">
                              <input 
                                type="text" 
                                placeholder="Link gambar bukti transfer"
                                value={receiptUrl}
                                onChange={(e) => setReceiptUrl(e.target.value)}
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white outline-none transition-all"
                              />
                              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Upload size={18} className="text-slate-400" />
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium ml-1">Tips: Gunakan link imgbb/drive jika ada.</p>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button 
                            onClick={() => setManualStep('instructions')}
                            className="flex-1 py-4 border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all cursor-pointer"
                          >
                            Kembali
                          </button>
                          <button 
                            onClick={handleManualSubmit}
                            disabled={submittingManual}
                            className="flex-[2] py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            {submittingManual ? <Loader2 className="animate-spin" size={14} /> : null}
                            {submittingManual ? 'Mengirim...' : 'Konfirmasi Sekarang'}
                          </button>
                        </div>
                      </div>
                    )}

                    {manualStep === 'success' && (
                      <div className="text-center space-y-6 py-10">
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto scale-110">
                          <Check size={40} />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-3xl font-black text-slate-900">Laporan Terkirim!</h3>
                          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                            Terima kasih. Kami akan memverifikasi pembayaran Anda sesegera mungkin. Koin akan ditambahkan secara otomatis setelah verifikasi.
                          </p>
                        </div>
                        <button 
                          onClick={handleClose}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg cursor-pointer"
                        >
                          Kembali ke Aplikasi
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
