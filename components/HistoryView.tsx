
import React from 'react';
import { generateCard, generateMiniCard } from '../constants';

const HistoryView: React.FC = () => {
  // Enhanced history mock data to include full called sequence
  const history = [
    { 
      id: '#HB-9921', 
      date: '2024-05-20 14:20', 
      players: 12, 
      stake: 50, 
      win: 0, 
      status: 'lost' as const,
      cardId: 42,
      mode: 'classic' as const,
      calledNumbers: [14, 55, 32, 10, 67, 4, 21, 39, 48, 12, 5]
    },
    { 
      id: '#HB-9915', 
      date: '2024-05-20 13:05', 
      players: 8, 
      stake: 50, 
      win: 180, 
      status: 'won' as const,
      cardId: 105,
      mode: 'classic' as const,
      winNumbers: [5, 12, 0, 44, 72],
      calledNumbers: [8, 19, 22, 5, 12, 31, 0, 44, 72]
    },
    { 
      id: '#HB-9892', 
      date: '2024-05-19 22:15', 
      players: 15, 
      stake: 50, 
      win: 0, 
      status: 'lost' as const,
      cardId: 12,
      mode: 'mini' as const,
      calledNumbers: [2, 15, 28, 9, 11, 30]
    },
    { 
      id: '#HB-9880', 
      date: '2024-05-19 20:00', 
      players: 22, 
      stake: 100, 
      win: 420, 
      status: 'won' as const,
      cardId: 88,
      mode: 'classic' as const,
      winNumbers: [1, 15, 30, 45, 60],
      calledNumbers: [1, 9, 74, 15, 30, 45, 2, 60]
    },
  ];

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-hb-brand-grey italic tracking-tight uppercase">Activity Logs</h2>
          <p className="text-[11px] text-hb-muted font-bold uppercase tracking-widest mt-1">Detailed Match History</p>
        </div>
        <div className="bg-hb-bg border border-hb-border px-3 py-1.5 rounded-xl text-[10px] font-black text-hb-blueblack uppercase shadow-sm">
          30 Days
        </div>
      </div>

      <div className="space-y-8">
        {history.map((h, i) => {
          const grid = h.mode === 'mini' ? generateMiniCard(h.cardId) : generateCard(h.cardId);
          const flatGrid = grid.flat();
          const calledSet = new Set(h.calledNumbers);
          
          return (
            <div key={i} className="bg-white rounded-[2.5rem] border border-hb-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header Info */}
              <div className="p-5 flex items-center justify-between bg-hb-bg/40 border-b border-hb-border">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[13px] font-black text-hb-navy tracking-tight">{h.id}</span>
                    <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${h.mode === 'mini' ? 'bg-hb-gold/10 text-hb-gold border-hb-gold/20' : 'bg-hb-blue/10 text-hb-blue border-hb-blue/20'}`}>
                      {h.mode}
                    </span>
                  </div>
                  <span className="text-[9px] text-hb-muted font-bold uppercase tracking-wider">{h.date}</span>
                </div>
                <div className="text-right">
                  <div className={`text-[18px] font-black leading-none mb-1 ${h.status === 'won' ? 'text-hb-emerald' : 'text-red-500'}`}>
                    {h.status === 'won' ? `+${h.win.toLocaleString()}` : `-${h.stake.toLocaleString()}`}
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${h.status === 'won' ? 'bg-hb-emerald/10 text-hb-emerald' : 'bg-red-50 text-red-400'}`}>
                    {h.status}
                  </span>
                </div>
              </div>
              
              {/* Vertical Side-by-Side: Cartela vs Call Log */}
              <div className="p-5 grid grid-cols-12 gap-6">
                
                {/* Left: The Cartela Grid (History Stage) */}
                <div className="col-span-7">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[9px] font-black text-hb-muted uppercase tracking-widest">Match Card #{h.cardId}</span>
                  </div>
                  <div className={`grid ${h.mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-1 bg-hb-bg p-2 rounded-2xl border border-hb-border shadow-inner`}>
                    {flatGrid.map((num, idx) => {
                      const isMarked = num === 0 || calledSet.has(num);
                      const isWinningNum = h.winNumbers?.includes(num);
                      return (
                        <div 
                          key={idx} 
                          className={`aspect-square flex items-center justify-center text-[10px] font-black rounded-lg border transition-all
                            ${isWinningNum 
                              ? 'bg-hb-emerald text-white border-hb-emerald shadow-sm' 
                              : isMarked 
                                ? 'bg-hb-navy text-white border-hb-navy' 
                                : 'bg-white text-hb-navy/40 border-hb-border/50'}`}
                        >
                          {num === 0 ? '★' : num}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Vertical Call History Log */}
                <div className="col-span-5 flex flex-col">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-[9px] font-black text-hb-muted uppercase tracking-widest">Call Log</span>
                  </div>
                  <div className="flex-1 bg-slate-50 border border-hb-border/50 rounded-2xl overflow-hidden flex flex-col max-h-[160px]">
                    <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                      {h.calledNumbers.map((num, idx) => {
                        const isWinningNum = h.winNumbers?.includes(num);
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-2 p-1.5 rounded-xl border transition-all
                              ${isWinningNum 
                                ? 'bg-hb-emerald text-white border-hb-emerald shadow-sm' 
                                : 'bg-white text-hb-navy border-hb-border shadow-sm'}`}
                          >
                            <span className={`w-5 h-5 shrink-0 rounded-lg flex items-center justify-center text-[8px] font-black border ${isWinningNum ? 'bg-white/20 border-white/30 text-white' : 'bg-hb-bg border-hb-border text-hb-muted'}`}>
                              {idx + 1}
                            </span>
                            <span className="text-[11px] font-black tracking-tight">
                              {num === 0 ? 'FREE' : `Ball ${num}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="p-2 bg-hb-bg/80 border-t border-hb-border/50 text-center">
                      <span className="text-[8px] font-black text-hb-muted uppercase tracking-tighter">End of Session</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Footer */}
              <div className="px-5 pb-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-hb-muted uppercase">Opponents</span>
                    <span className="text-[11px] font-black text-hb-navy">{h.players}</span>
                  </div>
                  <div className="w-px h-6 bg-hb-border"></div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-hb-muted uppercase">Stake</span>
                    <span className="text-[11px] font-black text-hb-navy">{h.stake} ETB</span>
                  </div>
                </div>
                {h.status === 'won' && (
                  <div className="flex items-center gap-1.5 bg-hb-emerald/10 text-hb-emerald px-3 py-1 rounded-lg border border-hb-emerald/20">
                    <i className="fas fa-crown text-[10px]"></i>
                    <span className="text-[10px] font-black uppercase tracking-tight">Pot Claimed</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-hb-border border-dashed text-center">
        <i className="fas fa-receipt text-hb-brand-grey/20 text-4xl mb-4"></i>
        <h4 className="text-[13px] font-black text-hb-brand-grey uppercase mb-2">Immutable Ledger</h4>
        <p className="text-[11px] text-hb-muted font-bold leading-relaxed px-4">
          Match logs are securely stored for 30 days. For dispute resolution or technical assistance, contact HB Support.
        </p>
      </div>
    </div>
  );
};

export default HistoryView;
