import React from 'react';
import { View, Language } from '../types';

interface SidebarProps {
  onClose: () => void;
  onNavigate: (view: View) => void;
  currentLang: Language;
  onLangChange: (lang: Language) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, onNavigate, currentLang, onLangChange }) => {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-hb-blueblack/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-80 h-full bg-hb-bg shadow-[25px_0_50px_-12px_rgba(0,0,0,0.15)] flex flex-col slide-in-left">
        <div className="bg-hb-brand-grey p-10 text-white relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 rounded-[2rem] bg-white/10 p-1.5 mb-5 shadow-inner border border-white/5">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=HB" className="w-full h-full rounded-[1.8rem]" alt="pfp" />
            </div>
            <div className="font-black text-2xl tracking-tight italic uppercase">Bingo Pro</div>
            <div className="text-[11px] font-black uppercase opacity-60 tracking-widest mt-1">Master Tier Player</div>
          </div>
          <i className="fas fa-certificate absolute -right-8 -top-8 text-white/5 text-[14rem] rotate-45"></i>
        </div>

        <div className="flex-1 overflow-y-auto py-10 px-8 no-scrollbar">
          <div className="mb-10">
            <h4 className="text-[11px] font-black text-hb-muted uppercase tracking-[0.2em] mb-6">Navigation</h4>
            <div className="space-y-2">
              <SidebarLink 
                icon="fa-home" 
                color="text-hb-blue" 
                bg="bg-blue-50 group-hover:bg-hb-blue" 
                label="Dashboard Home" 
                onClick={() => onNavigate('home')} 
              />
              <SidebarLink 
                icon="fa-th" 
                color="text-hb-gold" 
                bg="bg-orange-50 group-hover:bg-hb-gold" 
                label="Card Gallery" 
                onClick={() => onNavigate('all-cards')} 
              />
              <SidebarLink 
                icon="fa-user-circle" 
                color="text-hb-emerald" 
                bg="bg-emerald-50 group-hover:bg-hb-emerald" 
                label="Profile Settings" 
                onClick={() => onNavigate('profile')} 
              />
              <SidebarLink 
                icon="fa-bullhorn" 
                color="text-hb-gold" 
                bg="bg-orange-50 group-hover:bg-hb-gold" 
                label="Promo Creator" 
                onClick={() => onNavigate('promo')} 
              />
               <SidebarLink 
                icon="fa-cog" 
                color="text-purple-600" 
                bg="bg-purple-50 group-hover:bg-purple-600" 
                label="App Settings" 
                onClick={() => onNavigate('settings')} 
              />
              <SidebarLink 
                icon="fa-headset" 
                color="text-hb-navy" 
                bg="bg-slate-200 group-hover:bg-hb-navy" 
                label="Support Center" 
                onClick={() => alert("Connecting to Support...")} 
              />
            </div>
          </div>
          
          <div>
            <h4 className="text-[11px] font-black text-hb-muted uppercase tracking-[0.2em] mb-6">Language</h4>
            <div className="grid grid-cols-1 gap-3">
              <LangBtn active={currentLang === Language.ENGLISH} onClick={() => onLangChange(Language.ENGLISH)}>English (US)</LangBtn>
              <LangBtn active={currentLang === Language.AMHARIC} onClick={() => onLangChange(Language.AMHARIC)}>አማርኛ (Amharic)</LangBtn>
              <LangBtn active={currentLang === Language.OROMOO} onClick={() => onLangChange(Language.OROMOO)}>Afaan Oromoo</LangBtn>
              <LangBtn active={currentLang === Language.TIGRINYA} onClick={() => onLangChange(Language.TIGRINYA)}>ትግርኛ (Tigrinya)</LangBtn>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-gray-100 flex flex-col gap-4 bg-slate-50/50">
           <div className="flex items-center justify-between">
             <button 
               onClick={() => onNavigate('home')}
               className="flex items-center gap-2 bg-hb-brand-grey text-white px-4 py-2.5 rounded-xl shadow-md active:scale-95 transition-all text-[12px] font-bold uppercase tracking-wide"
             >
               <i className="fas fa-home"></i>
               Home
             </button>
             <button 
               onClick={onClose} 
               className="text-hb-gold font-black text-[12px] uppercase tracking-widest px-4 py-2 hover:bg-orange-50 rounded-xl transition-colors"
             >
               Close
             </button>
           </div>
           <div className="flex items-center justify-between opacity-40">
              <span className="text-[10px] font-black text-hb-muted italic">V 3.0.1 STABLE</span>
              <div className="flex gap-2">
                <i className="fab fa-telegram-plane"></i>
                <i className="fas fa-shield-alt"></i>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const SidebarLink: React.FC<{ icon: string; color: string; bg: string; label: string; onClick: () => void }> = ({ icon, color, bg, label, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-5 py-3.5 text-hb-navy hover:text-hb-brand-grey transition-all group rounded-2xl px-3 hover:bg-white hover:shadow-sm border border-transparent hover:border-hb-border/50">
    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all shadow-inner ${bg} ${color} group-hover:text-white`}>
      <i className={`fas ${icon} text-lg`}></i>
    </div>
    <span className="font-bold text-base tracking-tight">{label}</span>
  </button>
);

const LangBtn: React.FC<{ children: React.ReactNode; active: boolean; onClick: () => void }> = ({ children, active, onClick }) => (
  <button 
    onClick={onClick} 
    className={`p-4 rounded-2xl text-[13px] font-black text-left transition-all border-2 ${active ? 'bg-white text-hb-brand-grey border-hb-brand-grey/20 shadow-sm' : 'bg-gray-50 text-hb-muted border-transparent hover:border-gray-200'}`}
  >
    {children}
  </button>
);

export default Sidebar;