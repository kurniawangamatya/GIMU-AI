import { motion } from 'motion/react';
import { Sparkles, Menu } from 'lucide-react';
import SmileEnhancer from './components/SmileEnhancer';

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/30 backdrop-blur-md border-b border-white/40">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-brand-200">
            <Sparkles size={22} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-slate-900">
            GIMU<span className="text-brand-600">.AI</span>
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          <a href="#" className="text-brand-600">Enhancer</a>
          <a href="#" className="hover:text-brand-600 transition-colors">Safety</a>
          <a href="#" className="hover:text-brand-600 transition-colors">Support</a>
        </nav>
        
        <div className="flex items-center gap-4">
          <button className="px-5 py-2.5 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
            Clinic Access
          </button>
        </div>
      </div>
    </header>
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
              GIMU<span className="text-brand-600">.AI</span>
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
              <li><a href="#" className="hover:text-brand-600 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-[10px]">Company</h4>
            <ul className="space-y-4 text-slate-600 text-sm font-medium">
              <li><a href="#" className="hover:text-brand-600 transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-brand-600 transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/40 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-center">
        <p>© 2026 GIMU.AI TECHNOLOGIES. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Clinic Terms</a>
        </div>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background blurs */}
      <div className="fixed top-20 left-1/4 w-96 h-96 bg-brand-300 rounded-full blur-[140px] opacity-10 pointer-events-none z-0" />
      <div className="fixed bottom-20 right-1/4 w-96 h-96 bg-rose-300 rounded-full blur-[140px] opacity-10 pointer-events-none z-0" />
      
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <SmileEnhancer />
        </main>
        <Footer />
      </div>
    </div>
  );
}

