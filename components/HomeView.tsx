import React from 'react';

interface HomeViewProps {
  onQuickPlay: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onQuickPlay }) => {
  return (
    <div className="p-6">
      <div className="bg-gradient-to-br from-hb-brand-grey to-hb-blueblack rounded-[2rem] p-8 text-white mb-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-[20px] font-black mb-2 italic tracking-tight uppercase">Dashboard</h2>
          <p className="text-[13px] text-white/80 mb-6 leading-relaxed font-medium">Ready to win? Select a table and start your session.</p>
          <div className="inline-flex items-center gap-3 bg-hb-gold px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-wider shadow-lg border border-white/10">
            <i className="fas fa-gift"></i> 10,000 ETB Weekly Prize
          </div>
        </div>
        <i className="fas fa-crown absolute -right-6 -top-6 text-white/5 text-[12rem] rotate-12"></i>
      </div>

      <div className="flex flex-col gap-5">
        <button 
          onClick={onQuickPlay}
          className="w-full bg-white border border-hb-border p-8 rounded-[2rem] shadow-sm flex items-center justify-between hover:border-hb-brand-grey/20 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-100 text-hb-blueblack rounded-[1.2rem] flex items-center justify-center text-3xl">
              <i className="fas fa-bolt"></i>
            </div>
            <div className="text-left">
              <div className="font-black text-hb-navy text-lg">Quick Play</div>
              <div className="text-[12px] text-hb-muted font-bold uppercase tracking-wide">Instant Matchmaking</div>
            </div>
          </div>
          <i className="fas fa-chevron-right text-hb-blueblack opacity-20 text-xl"></i>
        </button>

        <div className="bg-white border border-hb-border p-8 rounded-[2rem] shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-[12px] font-black text-hb-muted uppercase tracking-widest">Card Explorer</h3>
              <span className="text-[12px] text-hb-brand-grey font-bold px-3 py-1 bg-slate-50 rounded-lg">1-150 Range</span>
           </div>
           <p className="text-[13px] text-hb-navy opacity-70 mb-6 font-medium leading-relaxed">Select your lucky numbers. Browse the full collection of available cards.</p>
           <button 
             onClick={onQuickPlay}
             className="w-full py-5 bg-hb-bg rounded-[1.5rem] text-[12px] font-black text-hb-brand-grey uppercase hover:bg-slate-50 border border-hb-border transition-colors shadow-inner"
           >
             View Available Cards
           </button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;