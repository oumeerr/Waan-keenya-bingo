
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from '../types';
import { generateCard, generateMiniCard } from '../constants';
import { APP_CONFIG } from '../config';

interface GameViewProps {
  cardIds: number[];
  betAmount: number;
  mode: 'classic' | 'mini';
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  matchStartTime: number;
  onClose: () => void;
}

const GameView: React.FC<GameViewProps> = ({ cardIds, betAmount, mode, user, setUser, matchStartTime, onClose }) => {
  const [gameState, setGameState] = useState<'matchmaking' | 'playing' | 'finished'>('matchmaking');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  
  // Deterministic remaining time calculation
  const getRemainingTime = useCallback(() => {
    const elapsed = Math.floor((Date.now() - matchStartTime) / 1000);
    const remaining = APP_CONFIG.GAME.MATCHMAKING_SECONDS - elapsed;
    return Math.max(0, remaining);
  }, [matchStartTime]);

  const [countdown, setCountdown] = useState(getRemainingTime());
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [markedByCard, setMarkedByCard] = useState<Record<number, Set<number>>>(
    cardIds.reduce((acc, id) => ({ ...acc, [id]: new Set([0]) }), {})
  );
  const [winner, setWinner] = useState<string | null>(null);
  const [winningCardIds, setWinningCardIds] = useState<number[]>([]);
  const [winnings, setWinnings] = useState(0);

  // Generate hard combinations on load using improved constants
  const allCardsData = useRef<Record<number, number[][]>>(
    cardIds.reduce((acc, id) => ({ ...acc, [id]: mode === 'mini' ? generateMiniCard(id) : generateCard(id) }), {})
  );
  
  const callInterval = useRef<number | null>(null);

  const checkWinForCard = useCallback((id: number, currentMarked: Set<number>) => {
    const grid = allCardsData.current[id];
    const isMarked = (n: number) => currentMarked.has(n);
    const size = mode === 'mini' ? 3 : 5;

    // Row Check
    for (let r = 0; r < size; r++) if (grid[r].every(num => isMarked(num))) return true;
    
    // Column Check
    for (let c = 0; c < size; c++) {
      let colMarked = true;
      for (let r = 0; r < size; r++) if (!isMarked(grid[r][c])) colMarked = false;
      if (colMarked) return true;
    }

    // Diagonal Check
    let d1 = true, d2 = true;
    for (let i = 0; i < size; i++) {
      if (!isMarked(grid[i][i])) d1 = false;
      if (!isMarked(grid[i][size - 1 - i])) d2 = false;
    }
    if (d1 || d2) return true;

    // Special Patterns for Classic Mode
    if (mode === 'classic') {
      const topLeft = isMarked(grid[0][0]);
      const topRight = isMarked(grid[0][4]);
      const bottomLeft = isMarked(grid[4][0]);
      const bottomRight = isMarked(grid[4][4]);
      if (topLeft && topRight && bottomLeft && bottomRight) return true;
    }
    return false;
  }, [mode]);

  const winningCardsList = cardIds.filter(id => checkWinForCard(id, markedByCard[id]));
  const isAnyWinning = winningCardsList.length > 0;

  const handleCallBingo = useCallback(() => {
    if (callInterval.current) clearInterval(callInterval.current);
    
    if (!isAnyWinning) {
      setWinnings(0);
      setWinningCardIds([]);
      setWinner("HOUSE (FALSE BINGO)");
      setGameState('finished');
      return;
    }
    
    const totalStake = betAmount * 2;
    const winAmount = Math.floor(totalStake * (1 - APP_CONFIG.GAME.HOUSE_FEE_PERCENT));
    setWinnings(winAmount);
    setWinningCardIds(winningCardsList);
    setWinner(user.username);
    setUser(prev => ({ ...prev, balance: prev.balance + winAmount }));
    setGameState('finished');
  }, [isAnyWinning, betAmount, winningCardsList, user.username, setUser]);

  // Matchmaking Timer Sync - Ensures game starts NO MATTER WHAT
  useEffect(() => {
    if (gameState === 'matchmaking') {
      const initialRemaining = getRemainingTime();
      if (initialRemaining <= 0) {
        setGameState('playing');
        return;
      }
      
      setCountdown(initialRemaining);

      const timer = setInterval(() => {
        const remaining = getRemainingTime();
        setCountdown(remaining);
        if (remaining <= 0) {
          clearInterval(timer);
          setGameState('playing');
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [gameState, getRemainingTime]);

  // Autoplayer Effect
  useEffect(() => {
    if (gameState === 'playing' && isAutoPlay && isAnyWinning) {
      handleCallBingo();
    }
  }, [gameState, isAutoPlay, isAnyWinning, handleCallBingo]);

  useEffect(() => {
    if (gameState === 'playing') {
      const poolSize = mode === 'mini' ? 30 : 75;
      const pool = Array.from({ length: poolSize }, (_, i) => i + 1);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      let idx = 0;

      const intervalMs = mode === 'mini' ? APP_CONFIG.GAME.CALL_INTERVAL_MINI_MS : APP_CONFIG.GAME.CALL_INTERVAL_CLASSIC_MS;

      callInterval.current = window.setInterval(() => {
        if (idx >= poolSize) {
          if (callInterval.current) clearInterval(callInterval.current);
          setGameState('finished');
          setWinner('DRAW (NO WINNERS)');
          return;
        }

        const num = shuffled[idx++];
        setDrawnNumbers(prev => [...prev, num]);

        setMarkedByCard(prev => {
          const next = { ...prev };
          cardIds.forEach(id => {
            if (allCardsData.current[id].flat().includes(num)) {
              next[id] = new Set([...prev[id], num]);
            }
          });
          return next;
        });
      }, intervalMs);

      return () => {
        if (callInterval.current) clearInterval(callInterval.current);
      };
    }
  }, [gameState, mode, cardIds]);

  const getCardProgress = (id: number) => {
    const grid = allCardsData.current[id];
    const marked = markedByCard[id];
    const size = mode === 'mini' ? 3 : 5;
    let max = 0;
    for (let r = 0; r < size; r++) {
      const count = grid[r].filter(n => marked.has(n)).length;
      if (count > max) max = count;
    }
    for (let c = 0; c < size; c++) {
      let count = 0;
      for (let r = 0; r < size; r++) if (marked.has(grid[r][c])) count++;
      if (count > max) max = count;
    }
    return { current: max, total: size };
  };

  const getBallStyle = (num: number) => {
    if (num === 0) return 'from-emerald-400 to-emerald-600 text-white';
    return 'from-blue-900 to-hb-navy text-white shadow-[0_0_8px_rgba(15,23,42,0.4)]';
  };

  return (
    <div className="min-h-full flex flex-col items-center pt-4 px-2 pb-20">
      {gameState === 'matchmaking' && (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
          <div className="bg-white p-6 rounded-[24px] shadow-lg flex flex-col items-center justify-center text-center w-full max-w-[340px] border border-hb-border mb-4">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 border-[4px] border-hb-blue border-t-hb-gold rounded-full animate-spin"></div>
               <div className="text-left">
                  <h3 className="text-[16px] font-black text-hb-navy uppercase tracking-tight leading-none">Arena Initialization</h3>
                  <p className="text-[11px] text-hb-muted font-bold uppercase mt-1">Match will start always</p>
               </div>
            </div>
            <div className="flex items-center gap-3 bg-hb-bg px-5 py-3 rounded-2xl border border-hb-border w-full justify-center">
              <span className="text-[12px] font-black text-hb-muted uppercase">Engine Launch:</span>
              <span className="text-[24px] font-black text-hb-gold tabular-nums tracking-tighter">{countdown}s</span>
            </div>
          </div>
          
          <div className="w-full mb-2 max-w-[400px]">
             <div className="flex items-center gap-2 mb-3 px-2">
                <i className="fas fa-microchip text-hb-blue text-[10px]"></i>
                <span className="text-[9px] font-black uppercase text-hb-muted tracking-widest">Seeding Secure Match Deck</span>
             </div>
             <div className="grid grid-cols-2 gap-2 w-full max-h-[50vh] overflow-y-auto no-scrollbar pb-6 px-1">
               {cardIds.map(id => (
                  <div key={id} className="bg-white p-2 rounded-xl border border-hb-border shadow-sm relative overflow-hidden group">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-hb-navy bg-hb-bg px-1.5 py-0.5 rounded-md border border-hb-border">ID #{id}</span>
                        <div className="w-2 h-2 rounded-full bg-hb-emerald animate-pulse"></div>
                     </div>
                     <div className={`grid ${mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity`}>
                        {allCardsData.current[id].flat().map((n, i) => (
                           <div key={i} className={`aspect-square flex items-center justify-center text-[7px] font-black rounded-sm ${n===0 ? 'bg-hb-emerald/10 text-hb-emerald' : 'bg-hb-bg text-hb-brand-grey border border-hb-border/30'}`}>
                             {n===0 ? '★' : n}
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-[440px] animate-in slide-in-from-bottom-5 duration-500">
          <div className="flex justify-between items-center mb-4 bg-white px-5 py-4 rounded-3xl shadow-sm border border-hb-border mx-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-hb-muted uppercase tracking-widest mb-1">Session Pot</span>
              <span className="text-[22px] font-black text-hb-emerald leading-none">{(betAmount * 2 * (1 - APP_CONFIG.GAME.HOUSE_FEE_PERCENT)).toLocaleString()} <span className="text-[12px] opacity-60">ETB</span></span>
            </div>
            <div className="bg-hb-navy text-white px-4 py-2 rounded-2xl flex items-center gap-2 shadow-lg">
               <i className="fas fa-server text-[10px] text-hb-gold animate-pulse"></i>
               <span className="text-[11px] font-black uppercase tracking-tight">Live Server</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8 justify-center h-[60px]">
             {drawnNumbers.length > 0 ? (
               <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                  <div className="text-[32px] font-black text-hb-navy px-8 py-2 bg-white rounded-2xl border-[3px] border-hb-navy shadow-xl scale-110 relative">
                    {drawnNumbers[drawnNumbers.length - 1]}
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-hb-gold text-white text-[9px] rounded-full flex items-center justify-center">
                      {drawnNumbers.length}
                    </div>
                  </div>
                  <div className="text-[9px] font-black text-hb-muted uppercase tracking-[0.3em] mt-3 opacity-40 italic">Sequential Call Active</div>
               </div>
             ) : (
               <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-hb-gold rounded-full animate-bounce"></div>
                  <span className="text-hb-muted italic text-[14px] uppercase tracking-[0.2em] font-black">Syncing Draw Feed...</span>
               </div>
             )}
          </div>

          <div className="px-3 mb-3 flex items-center justify-between">
            <span className="text-[11px] font-black text-hb-navy uppercase tracking-widest italic">In-Game Deck</span>
            <button 
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-full border-2 transition-all ${isAutoPlay ? 'bg-hb-emerald text-white border-white/20 shadow-md scale-105' : 'bg-white text-hb-muted border-hb-border'}`}
            >
              <i className={`fas ${isAutoPlay ? 'fa-robot' : 'fa-hand-pointer'} text-[12px]`}></i>
              <span className="text-[11px] font-black uppercase tracking-tighter">{isAutoPlay ? 'Auto-Daub On' : 'Manual Mode'}</span>
            </button>
          </div>

          <div className={`grid ${cardIds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-3 px-2`}>
            {cardIds.map((id) => {
              const progress = getCardProgress(id);
              const isWinning = checkWinForCard(id, markedByCard[id]);
              return (
                <div key={id} className={`bg-white p-2.5 rounded-[22px] border transition-all duration-300 shadow-lg relative overflow-hidden flex flex-col h-fit
                  ${isWinning ? 'ring-4 ring-hb-gold scale-[1.03] border-hb-gold z-10' : 'border-hb-border opacity-95'}`}>
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-[10px] font-black text-hb-navy tracking-tight">#{id} <span className="text-[8px] opacity-40">CARTELLA</span></span>
                    <div className="flex items-center gap-1.5">
                      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-hb-blue transition-all duration-500" 
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-[8px] font-black text-hb-muted">{progress.current}/{progress.total}</span>
                    </div>
                  </div>
                  <div className={`grid ${mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-1 justify-items-center`}>
                    {allCardsData.current[id].flat().map((num, i) => (
                      <div key={i} className={`aspect-square w-full flex items-center justify-center rounded-lg font-black text-[11px] transition-all duration-300
                        ${num === 0 ? 'bg-hb-emerald/10 text-hb-emerald border-2 border-hb-emerald/10' : 
                          markedByCard[id].has(num) 
                            ? `bingo-ball-3d ${getBallStyle(num)}` 
                            : 'bg-hb-bg text-hb-navy border border-hb-border/30'}`}
                      >
                        {num === 0 ? '★' : num}
                      </div>
                    ))}
                  </div>
                  {isWinning && (
                    <div className="absolute inset-0 bg-hb-gold/15 flex items-center justify-center pointer-events-none backdrop-blur-[1px] animate-pulse">
                       <div className="bg-hb-gold text-white text-[12px] font-black px-4 py-1.5 rounded-full shadow-2xl uppercase tracking-widest border-2 border-white/20">
                         WINNER!
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 px-3 flex flex-col gap-4">
            <button 
              onClick={handleCallBingo}
              disabled={isAutoPlay && isAnyWinning}
              className={`w-full h-[76px] rounded-[28px] font-black text-[26px] shadow-2xl transition-all uppercase tracking-tight border-b-[6px] flex items-center justify-center gap-4 active:scale-95 bg-hb-gold border-[#d97706] text-white hover:brightness-110 ${isAutoPlay && isAnyWinning ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              <i className="fas fa-crown text-[20px]"></i>
              {isAutoPlay && isAnyWinning ? 'Processing...' : 'BINGO!'}
            </button>
            <button onClick={onClose} className="text-[11px] font-black text-hb-muted uppercase tracking-[0.4em] hover:text-red-500 py-3 transition-colors">Abandom Match</button>
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="fixed inset-0 z-[100] bg-hb-navy flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
           <div className="w-32 h-32 mb-8 bingo-ball-3d from-hb-gold to-[#d97706] rounded-full flex items-center justify-center text-[56px] shadow-[0_0_50px_rgba(249,115,22,0.4)] relative">
             {winner === user.username ? '🏆' : '💀'}
             <div className="absolute -top-4 -right-4 bg-white text-hb-navy text-[12px] font-black px-4 py-1.5 rounded-2xl border-4 border-hb-gold uppercase shadow-xl">
               {winner === user.username ? 'Victory' : 'Defeat'}
             </div>
           </div>
           
           <div className="mb-10">
             <h2 className="text-[40px] font-black italic tracking-tighter uppercase leading-tight text-white">
               {winner === user.username ? 'LEGENDARY!' : 'TOUGH LUCK'}
             </h2>
             <div className="text-[18px] font-black text-hb-gold mt-2 uppercase tracking-widest">{winner}</div>
           </div>

           <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 w-full max-w-[340px] shadow-2xl mb-12">
              <div className="text-[12px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-3 italic">Match Analytics</div>
              <div className="flex justify-between items-center mb-6">
                 <span className="text-[14px] font-bold text-white/60">Winning Cartellas:</span>
                 <div className="flex gap-2">
                    {winningCardIds.length > 0 ? winningCardIds.map(id => (
                      <span key={id} className="bg-hb-gold text-white text-[12px] font-black px-3 py-1.5 rounded-xl shadow-lg">#{id}</span>
                    )) : <span className="text-red-400 font-black text-[12px] uppercase tracking-widest">NONE</span>}
                 </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                 <span className="text-[14px] font-bold text-white/60">Final Payout:</span>
                 <span className={`${winner === user.username ? 'text-hb-emerald' : 'text-white/40'} text-[32px] font-black tracking-tighter`}>{winnings.toLocaleString()} <span className="text-[12px]">ETB</span></span>
              </div>
           </div>

           <button onClick={onClose} className="w-full max-w-[280px] h-[64px] bg-white text-hb-navy font-black rounded-3xl shadow-2xl active:scale-95 uppercase tracking-widest text-[16px] hover:bg-hb-gold hover:text-white transition-all">
             Return Home
           </button>
        </div>
      )}
      
      <div className="mt-auto pt-8 text-hb-muted font-black text-[10px] opacity-10 uppercase tracking-[0.5em] italic">
        ENTROPY ENGINE 5.0.1 • HARDMODE ACTIVE
      </div>
    </div>
  );
};

export default GameView;
