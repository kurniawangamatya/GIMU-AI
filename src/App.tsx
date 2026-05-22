import { Sparkles, LogOut, User as UserIcon, Coins, Ticket, LayoutDashboard, Home, ShoppingCart, Plus, Share2, ChevronDown, Activity, Layers, BookOpen, Settings as SettingsIcon, Key, X, Info, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import SmileEnhancer from './components/SmileEnhancer';
import Dashboard from './components/Dashboard';
import PromptsLibrary from './components/PromptsLibrary';
import History from './components/History';
import RadiologyReader from './components/RadiologyReader';
import RedeemToken from './components/RedeemToken';
import AdminDashboard from './components/AdminDashboard';
import TokenShop from './components/TokenShop';
import { useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase';
import { doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';

function Header({ 
  onToggleAdmin, 
  isAdminView, 
  isShopOpen, 
  setIsShopOpen,
  activeView,
  onViewChange
}: { 
  onToggleAdmin: () => void; 
  isAdminView: boolean; 
  isShopOpen: boolean; 
  setIsShopOpen: (open: boolean) => void;
  activeView: string;
  onViewChange: (view: string) => void;
}) {
  const { user, userData, isAdmin, login, logout } = useAuth();
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <>
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center text-white md:hidden">
                <Sparkles size={16} />
              </div>
              <span className="font-display font-bold text-base sm:text-xl tracking-tight text-slate-900">
                GIMU.AI
              </span>
            </div>

          {/* Center Pill Nav - Desktop Only */}
          <nav className="hidden md:flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200/50">
            <button 
              onClick={() => onViewChange('dashboard')}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${activeView === 'dashboard' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => onViewChange('smile-tool')}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${activeView === 'smile-tool' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Smile Tool
            </button>
            <button 
              onClick={() => onViewChange('radiology')}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${activeView === 'radiology' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Radiology
            </button>
            <button 
              onClick={() => onViewChange('prompts')}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${activeView === 'prompts' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Prompts
            </button>
            <button 
              onClick={() => onViewChange('history')}
              className={`px-5 py-1.5 rounded-full text-xs font-medium transition-all ${activeView === 'history' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              History
            </button>
          </nav>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button className="hidden lg:flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              <Share2 size={14} className="text-slate-400" />
              Feedback
            </button>

            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-1.5 p-0.5 pr-2 rounded-full hover:bg-slate-50 transition-all select-none"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-tighter overflow-hidden ring-2 ring-slate-100">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user.email?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <ChevronDown size={14} className={`text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Profile Dropdown */}
                <AnimatePresence>
                  {isProfileOpen && (
                    <>
                      {/* Invisible backdrop to catch clicks outside */}
                      <div 
                        className="fixed inset-0 z-[60]" 
                        onClick={() => setIsProfileOpen(false)}
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[70] overflow-hidden"
                      >
                         <div className="px-4 py-3 border-b border-slate-50 mb-2">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Signed in as</p>
                           <p className="text-xs font-semibold text-slate-900 truncate">{user.email}</p>
                         </div>
                         <div className="space-y-1">
                           <button 
                            onClick={() => {
                              setIsShopOpen(true);
                              setIsProfileOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-3 text-xs font-bold text-brand-600 hover:bg-brand-50 rounded-xl transition-colors cursor-pointer text-left uppercase tracking-widest"
                           >
                             <div className="flex items-center gap-2">
                               <ShoppingCart size={16} /> Beli Koin
                             </div>
                             <span className="text-[10px] px-2 py-0.5 bg-brand-100 rounded-full">Top Up</span>
                           </button>
                           <button 
                            onClick={() => {
                              setIsRedeemOpen(true);
                              setIsProfileOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-left uppercase tracking-widest"
                           >
                             <Ticket size={16} /> Redeem Token
                           </button>
                           <div className="h-px bg-slate-50 my-1 mx-2" />
                           <button 
                            onClick={() => {
                              logout();
                              setIsProfileOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer text-left uppercase tracking-widest"
                           >
                             <LogOut size={16} /> Sign Out
                           </button>
                         </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
                <button 
                  onClick={login}
                  className="px-3 sm:px-6 py-2 sm:py-2.5 bg-slate-900 text-white rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg flex items-center gap-1.5 sm:gap-2"
                >
                  <Sparkles size={12} className="sm:hidden" />
                  <Sparkles size={14} className="hidden sm:block" />
                  <span>Clinic Access</span>
                </button>
              )}
            </div>
          </div>
        </header>
    <RedeemToken isOpen={isRedeemOpen} onClose={() => setIsRedeemOpen(false)} />
    <TokenShop isOpen={isShopOpen} onClose={() => setIsShopOpen(false)} onOpenRedeem={() => setIsRedeemOpen(true)} />
    </>
  );
}

function Footer() {
  return (
    <footer className="bg-white/30 backdrop-blur-md border-t border-white/40 py-16 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="col-span-1">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
              <Sparkles size={18} />
            </div>
            <span className="font-display font-bold text-xl tracking-tight text-slate-900">
              GIMU.AI
            </span>
          </div>
          <p className="text-slate-500 max-w-sm mb-8 leading-relaxed">
            Leading AI-powered smile transformation platform for dental clinics. 
            One-time purchase, lifetime professional utility.
          </p>
        </div>
        
        <div className="flex justify-end gap-12">
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-[10px]">Product</h4>
            <ul className="space-y-4 text-slate-600 text-sm font-medium">
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-brand-600 transition-colors cursor-pointer">Enhancer</button></li>
              <li><button onClick={() => alert('Security: All data is encrypted and HIPAA-compliant.')} className="hover:text-brand-600 transition-colors cursor-pointer">Security</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-[10px]">Company</h4>
            <ul className="space-y-4 text-slate-600 text-sm font-medium">
              <li><button onClick={() => alert('Support: help@gimu.ai')} className="hover:text-brand-600 transition-colors cursor-pointer">Support</button></li>
              <li><button onClick={() => alert('Terms of Service: Standard B2B licensing applies.')} className="hover:text-brand-600 transition-colors cursor-pointer">Terms</button></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/40 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">
        <p>© 2026 GIMU.AI. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-8">
          <button onClick={() => alert('Privacy Policy: No data is shared with third parties.')} className="hover:text-slate-900 transition-colors cursor-pointer">Privacy Policy</button>
          <button onClick={() => alert('Clinic Terms: Professional license required for clinical use.')} className="hover:text-slate-900 transition-colors cursor-pointer">Clinic Terms</button>
        </div>
      </div>
    </footer>
  );
}

  const PACKAGES = [
  {
    id: 'starter',
    tokens: 10,
  },
  {
    id: 'pro',
    tokens: 50,
  },
  {
    id: 'clinic',
    tokens: 250,
  }
];

export default function App() {
  const { user } = useAuth();
  const [isAdminView, setIsAdminView] = useState(false);
  const [activeView, setActiveView] = useState<'dashboard' | 'smile-tool' | 'prompts' | 'history' | 'radiology'>('dashboard');
  const [isShopOpen, setIsShopOpen] = useState(false);

  // Check for payment success status on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status');

    if (status === 'success') {
      alert("Pembayaran Terdeteksi! Kredit Anda akan segera diperbarui secara otomatis. Silakan cek saldo Anda dalam beberapa saat.");
      // Clean up URL
      window.history.replaceState({}, document.title, "/");
    }
  }, []);

  return (
    <div className="min-h-screen relative bg-white">
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header 
          onToggleAdmin={() => setIsAdminView(!isAdminView)} 
          isAdminView={isAdminView} 
          isShopOpen={isShopOpen} 
          setIsShopOpen={setIsShopOpen}
          activeView={activeView}
          onViewChange={(v) => setActiveView(v as 'dashboard' | 'smile-tool' | 'prompts' | 'history' | 'radiology')}
        />
        <main className="flex-1">
          {isAdminView ? (
            <AdminDashboard />
          ) : activeView === 'dashboard' ? (
            <Dashboard 
              onNavigateToSmileTool={() => setActiveView('smile-tool')} 
              onNavigateToPrompts={() => setActiveView('prompts')}
              onNavigateToHistory={() => setActiveView('history')}
              onNavigateToRadiology={() => setActiveView('radiology')}
            />
          ) : activeView === 'prompts' ? (
            <PromptsLibrary />
          ) : activeView === 'radiology' ? (
            <RadiologyReader onOpenShop={() => setIsShopOpen(true)} />
          ) : activeView === 'history' ? (
            <History onNavigateToSmileTool={() => setActiveView('smile-tool')} />
          ) : (
            <SmileEnhancer onOpenShop={() => setIsShopOpen(true)} />
          )}
        </main>
        
        <Footer />
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 border-t border-slate-800/50 flex items-center justify-around p-2 pb-safe-offset-4 z-[999] shadow-[0_-8px_30px_rgba(0,0,0,0.3)]">
        <button 
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all ${activeView === 'dashboard' ? 'text-white' : 'text-slate-500'}`}
        >
          <LayoutDashboard size={20} className={activeView === 'dashboard' ? 'scale-110' : ''} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Dashboard</span>
        </button>
        <button 
          onClick={() => setActiveView('smile-tool')}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all ${activeView === 'smile-tool' ? 'text-white' : 'text-slate-500'}`}
        >
          <Sparkles size={20} className={activeView === 'smile-tool' ? 'scale-110' : ''} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Smile</span>
        </button>
        <button 
          onClick={() => setActiveView('radiology')}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all ${activeView === 'radiology' ? 'text-white' : 'text-slate-500'}`}
        >
          <Activity size={20} className={activeView === 'radiology' ? 'scale-110' : ''} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Radiology</span>
        </button>
        <button 
          onClick={() => setActiveView('prompts')}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all ${activeView === 'prompts' ? 'text-white' : 'text-slate-500'}`}
        >
          <BookOpen size={20} className={activeView === 'prompts' ? 'scale-110' : ''} />
          <span className="text-[8px] font-bold uppercase tracking-widest">Prompt</span>
        </button>
        <button 
          onClick={() => setActiveView('history')}
          className={`flex flex-col items-center gap-1.5 p-2 transition-all ${activeView === 'history' ? 'text-white' : 'text-slate-500'}`}
        >
          <Layers size={20} className={activeView === 'history' ? 'scale-110' : ''} />
          <span className="text-[8px] font-bold uppercase tracking-widest">History</span>
        </button>
      </nav>

      {/* Mobile Floating Top Up Button */}
      {!isAdminView && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsShopOpen(true)}
          className="fixed bottom-24 right-4 md:hidden z-[998] w-14 h-14 bg-brand-600 text-white rounded-2xl shadow-2xl flex flex-col items-center justify-center gap-0.5 border border-white/20"
        >
          <Plus size={18} />
          <span className="text-[7px] font-black uppercase tracking-widest">Beli</span>
        </motion.button>
      )}
    </div>
  );
}

