import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User } from '../types';
import { generateCard, generateMiniCard } from '../constants';
import { APP_CONFIG } from '../config';
import { supabase } from '../services/supabase';

interface GameViewProps {
  cardIds: number[];
  betAmount: number;
  mode: 'classic' | 'mini';
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  matchStartTime: number;
  onClose: () => void;
}

// Backend-style Logic for Payout Calculation
const calculateWinnerPayout = (totalBets: number) => {
  const feePercentage = 0.20;
  const feeAmount = totalBets * feePercentage;
  const winnerPayout = totalBets - feeAmount;
  
  return { winnerPayout: Math.floor(winnerPayout), feeAmount: Math.floor(feeAmount) };
};

// Sub-component: Audio Controller
const BingoAudioController: React.FC<{ currentNumber: number | null }> = ({ currentNumber }) => {
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('/call-sound.mp3');
  }, []);

  useEffect(() => {
    if (!isMuted && currentNumber !== null && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [currentNumber, isMuted]);

  return (
    <div className="absolute top-4 right-4 z-20">
      <button 
        onClick={() => setIsMuted(!isMuted)} 
        className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all shadow-md ${isMuted ? 'bg-hb-surface text-hb-muted border-hb-border' : 'bg-white text-hb-blue border-white'}`}
      >
        <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'} text-sm`}></i>
      </button>
    </div>
  );
};

// Sub-component: Stats Display
const BingoStats: React.FC<{ betAmount: number, playerCount: number, possibleWin: number, balance: number }> = ({ betAmount, playerCount, possibleWin, balance }) => {
  return (
    <div className="w-full max-w-[440px] px-2 mb-4">
      <div className="bg-hb-surface border border-hb-border rounded-[20px] p-4 flex flex-col gap-3 shadow-lg">
        {/* Main Balance */}
        <div className="flex justify-between items-center border-b border-hb-border pb-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-hb-gold rounded-lg flex items-center justify-center text-hb-blueblack shadow-sm">
              <i className="fas fa-coins text-sm"></i>
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-hb-muted uppercase tracking-widest">My Balance</span>
              <span className="text-[16px] font-black text-white leading-none">{balance.toLocaleString()} ETB</span>
            </div>
          </div>
          <div className="bg-hb-emerald/10 text-hb-emerald px-3 py-1 rounded-full border border-hb-emerald/20 text-[10px] font-black uppercase tracking-tight">
            Live
          </div>
        </div>

        {/* Win Calculator / Stats Row */}
        <div className="flex flex-col gap-1 bg-black/30 p-3 rounded-lg mt-1">
           <div className="flex justify-between text-[11px] leading-relaxed">
              <span className="font-bold text-hb-muted">BET:</span>
              <span className="font-mono text-white">{betAmount} ETB</span>
           </div>
           
           <div className="flex justify-between text-[11px] leading-relaxed">
              <span className="font-bold text-hb-muted">PLAYERS:</span>
              <span className="font-mono text-white">{playerCount}</span>
           </div>

           <div className="flex justify-between text-[11px] leading-relaxed">
              <span className="font-bold text-hb-emerald">POSSIBLE WIN:</span>
              <span className="font-mono font-bold text-hb-emerald">
                {possibleWin.toLocaleString()} ETB
                <span className="text-[9px] text-hb-muted ml-1 font-normal">(after 20% fee)</span>
              </span>
           </div>
        </div>
      </div>
    </div>
  );
};

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

  // Mock player count based on pool size or simple random
  const playerCount = useMemo(() => Math.floor(Math.random() * 50) + 12, []);

  // Calculate the total pot available using the backend logic helper
  const { winnerPayout: sessionPot } = useMemo(() => {
    const totalPool = betAmount * playerCount;
    return calculateWinnerPayout(totalPool);
  }, [betAmount, playerCount]);

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

  // --- Game Termination Logic (History & Balance) ---

  const completeGameSession = async (status: 'won' | 'lost' | 'abandoned', payout: number, winCards: number[] = []) => {
    if (callInterval.current) clearInterval(callInterval.current);
    
    const userStake = betAmount * cardIds.length;
    const newBalance = user.balance + payout;
    const newWins = status === 'won' ? user.wins + 1 : user.wins;

    setWinnings(payout);
    setWinningCardIds(winCards);
    setWinner(status === 'won' ? user.username : (status === 'abandoned' ? 'SURRENDER' : 'HOUSE'));
    setGameState('finished');
    
    if (status === 'won') {
       setUser(prev => ({ ...prev, balance: newBalance, wins: newWins }));
    }

    if (user.id !== 'guest') {
       try {
         if (status === 'won') {
           await supabase
            .from('profiles')
            .update({ balance: newBalance, wins: newWins })
            .eq('id', user.id);
         }

         await supabase.from('game_history').insert({
            user_id: user.id,
            game_mode: mode,
            card_ids: cardIds,
            stake: userStake,
            payout: payout,
            status: status,
            called_numbers: drawnNumbers
         });
       } catch (err) {
         console.error("Failed to save game history:", err);
       }
    }
  };

  const handleCallBingo = useCallback(async () => {
    if (!isAnyWinning) {
      completeGameSession('lost', 0);
      return;
    }
    // Final check using strict payout calculation
    const totalPool = betAmount * playerCount;
    const { winnerPayout } = calculateWinnerPayout(totalPool);
    completeGameSession('won', winnerPayout, winningCardsList);
  }, [isAnyWinning, betAmount, playerCount, winningCardsList, drawnNumbers, cardIds.length]);

  const handleLeaveMatch = async () => {
     await completeGameSession('abandoned', 0);
     onClose(); 
  };

  // --- Effects ---

  // Matchmaking Timer
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

  // Auto-Play
  useEffect(() => {
    if (gameState === 'playing' && isAutoPlay) {
      setMarkedByCard(prev => {
        const next = { ...prev };
        let hasChanges = false;
        cardIds.forEach(id => {
          const cardGrid = allCardsData.current[id].flat();
          const currentMarks = next[id];
          const missingMarks = drawnNumbers.filter(n => n !== 0 && cardGrid.includes(n) && !currentMarks.has(n));
          if (missingMarks.length > 0) {
            next[id] = new Set([...currentMarks, ...missingMarks]);
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });

      if (isAnyWinning) {
        handleCallBingo();
      }
    }
  }, [gameState, isAutoPlay, drawnNumbers, isAnyWinning, handleCallBingo, cardIds]);

  // Manual Click
  const handleManualDaub = (cardId: number, num: number) => {
    // Allows marking during play; during matchmaking cards are visible but interaction is usually disabled or irrelevant
    if (gameState !== 'playing') return; 
    if (num === 0) return;
    if (!drawnNumbers.includes(num)) return;
    setMarkedByCard(prev => {
      const currentMarks = prev[cardId];
      if (currentMarks.has(num)) return prev;
      return { ...prev, [cardId]: new Set([...currentMarks, num]) };
    });
  };

  // Game Loop (Drawing Numbers)
  useEffect(() => {
    if (gameState === 'playing') {
      const poolSize = mode === 'mini' ? 30 : 75;
      const pool = Array.from({ length: poolSize }, (_, i) => i + 1);
      
      // Seeded shuffle for fairness simulation (based on match start)
      let seed = matchStartTime;
      const seededRandom = () => {
          const x = Math.sin(seed++) * 10000;
          return x - Math.floor(x);
      };
      
      const shuffled = [...pool].sort(() => seededRandom() - 0.5);
      
      let idx = 0;
      const intervalMs = mode === 'mini' ? APP_CONFIG.GAME.CALL_INTERVAL_MINI_MS : APP_CONFIG.GAME.CALL_INTERVAL_CLASSIC_MS;

      callInterval.current = window.setInterval(() => {
        if (idx >= poolSize) {
          if (callInterval.current) clearInterval(callInterval.current);
          completeGameSession('lost', 0);
          return;
        }
        const num = shuffled[idx++];
        setDrawnNumbers(prev => [...prev, num]);
      }, intervalMs);

      return () => {
        if (callInterval.current) clearInterval(callInterval.current);
      };
    }
  }, [gameState, mode]);

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

  const lastCalledNumber = drawnNumbers.length > 0 ? drawnNumbers[drawnNumbers.length - 1] : null;

  return (
    <div className="min-h-full flex flex-col items-center pt-4 px-2 pb-20 relative">
      <BingoAudioController currentNumber={lastCalledNumber} />

      {/* MATCHMAKING OVERLAY (Cards are visible underneath) */}
      {gameState === 'matchmaking' && (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-500 mb-4 z-10 relative">
          <div className="bg-white p-4 rounded-[24px] shadow-xl flex flex-col items-center justify-center text-center w-full max-w-[340px] border-2 border-hb-gold/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-hb-gold animate-pulse"></div>
            <div className="flex items-center gap-3 mb-2">
               <div className="w-6 h-6 border-[3px] border-hb-blue border-t-hb-gold rounded-full animate-spin"></div>
               <h3 className="text-[14px] font-black text-hb-navy uppercase tracking-tight">Game Starting</h3>
            </div>
            <p className="text-[10px] text-hb-muted font-bold uppercase mb-3">Cards Locked • Waiting for Players</p>
            <div className="flex items-center gap-2 bg-hb-bg px-4 py-2 rounded-xl border border-hb-border">
              <span className="text-[10px] font-black text-hb-muted uppercase">Starting In:</span>
              <span className="text-[18px] font-black text-hb-gold tabular-nums">{countdown}s</span>
            </div>
          </div>
        </div>
      )}

      {/* GAME CONTENT (Visible during matchmaking and playing) */}
      <div className={`w-full max-w-[440px] flex flex-col items-center transition-opacity duration-500 ${gameState === 'matchmaking' ? 'opacity-50 pointer-events-none grayscale-[0.5]' : 'opacity-100'}`}>
        
        <BingoStats 
          betAmount={betAmount} 
          playerCount={playerCount} 
          possibleWin={sessionPot} 
          balance={user.balance} 
        />

        {/* Drawn Number Display */}
        <div className="flex items-center gap-3 mb-8 justify-center h-[60px]">
           {lastCalledNumber ? (
             <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                <div className="text-[32px] font-black text-hb-blueblack px-8 py-2 bg-hb-gold rounded-2xl border-[3px] border-white shadow-xl scale-110 relative">
                  {lastCalledNumber}
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-hb-blue text-white text-[9px] rounded-full flex items-center justify-center border border-white">
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

        {/* Controls */}
        <div className="w-full px-3 mb-3 flex items-center justify-between">
          <span className="text-[11px] font-black text-hb-navy uppercase tracking-widest italic">In-Game Deck</span>
          <button 
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-full border-2 transition-all ${isAutoPlay ? 'bg-hb-emerald text-white border-white/20 shadow-md scale-105' : 'bg-white text-hb-muted border-hb-border'}`}
          >
            <i className={`fas ${isAutoPlay ? 'fa-robot' : 'fa-hand-pointer'} text-[12px]`}></i>
            <span className="text-[11px] font-black uppercase tracking-tighter">{isAutoPlay ? 'Auto-Daub On' : 'Manual Mode'}</span>
          </button>
        </div>

        {/* The Cards Grid */}
        <div className={`grid ${cardIds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-3 px-2 w-full`}>
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
                    <div 
                      key={i} 
                      onClick={() => handleManualDaub(id, num)}
                      className={`aspect-square w-full flex items-center justify-center rounded-lg font-black text-[11px] transition-all duration-300 cursor-pointer select-none
                      ${num === 0 ? 'bg-hb-emerald/10 text-hb-emerald border-2 border-hb-emerald/10' : 
                        markedByCard[id].has(num) 
                          ? 'bg-hb-gold text-hb-blueblack border-2 border-hb-gold shadow-lg scale-105' 
                          : 'bg-[#1E1E1E] text-white border border-white/10 hover:border-hb-gold/50 active:scale-90'}`}
                    >
                      {num === 0 ? '★' : num}
                    </div>
                  ))}
                </div>
                {isWinning && (
                  <div className="absolute inset-0 bg-hb-gold/15 flex items-center justify-center pointer-events-none backdrop-blur-[1px] animate-pulse">
                     <div className="bg-hb-gold text-hb-blueblack text-[12px] font-black px-4 py-1.5 rounded-full shadow-2xl uppercase tracking-widest border-2 border-hb-blueblack/20">
                       WINNER!
                     </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 px-3 flex flex-col gap-4 w-full">
          <button 
            onClick={handleCallBingo}
            disabled={isAutoPlay && isAnyWinning} 
            className={`w-full h-[76px] rounded-[28px] font-black text-[26px] shadow-2xl transition-all uppercase tracking-tight border-b-[6px] flex items-center justify-center gap-4 active:scale-95 bg-hb-gold border-[#d97706] text-hb-blueblack hover:brightness-110 ${isAutoPlay && isAnyWinning ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
          >
            <i className="fas fa-crown text-[20px]"></i>
            {isAutoPlay && isAnyWinning ? 'Processing...' : 'BINGO!'}
          </button>
          <button onClick={handleLeaveMatch} className="text-[11px] font-black text-hb-muted uppercase tracking-[0.4em] hover:text-red-500 py-3 transition-colors">Leave Match</button>
        </div>
      </div>

      {gameState === 'finished' && (
        <div className="fixed inset-0 z-[100] bg-hb-navy flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
           <div className="w-32 h-32 mb-8 bg-gradient-to-br from-hb-gold to-orange-500 rounded-full flex items-center justify-center text-[56px] shadow-[0_0_50px_rgba(249,115,22,0.4)] relative">
             {winner === user.username ? '🏆' : '💀'}
             <div className="absolute -top-4 -right-4 bg-white text-hb-navy text-[12px] font-black px-4 py-1.5 rounded-2xl border-4 border-hb-gold uppercase shadow-xl">
               {winner === user.username ? 'Victory' : 'Defeat'}
             </div>
           </div>
           
           <div className="mb-6">
             <h2 className="text-[40px] font-black italic tracking-tighter uppercase leading-tight text-white">
               {winner === user.username ? 'LEGENDARY!' : 'TOUGH LUCK'}
             </h2>
             <div className="text-[18px] font-black text-hb-gold mt-2 uppercase tracking-widest">{winner}</div>
           </div>

           {/* Winning Card Display */}
           {winningCardIds.length > 0 && (
              <div className="mb-6 animate-in zoom-in slide-in-from-bottom-5">
                 <div className="text-[10px] font-black text-hb-muted uppercase tracking-widest mb-2">Winning Combination</div>
                 <div className="bg-white p-2 rounded-xl border-4 border-hb-gold shadow-2xl inline-block">
                    <div className={`grid ${mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-1 w-[140px]`}>
                      {allCardsData.current[winningCardIds[0]].flat().map((num, i) => (
                        <div key={i} className={`aspect-square flex items-center justify-center text-[9px] font-black rounded ${markedByCard[winningCardIds[0]].has(num) || num === 0 ? 'bg-hb-gold text-hb-blueblack' : 'bg-hb-bg text-hb-muted'}`}>
                          {num === 0 ? '★' : num}
                        </div>
                      ))}
                    </div>
                    <div className="mt-1 text-[9px] font-black text-hb-navy uppercase">Card #{winningCardIds[0]}</div>
                 </div>
              </div>
           )}

           <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 w-full max-w-[340px] shadow-2xl mb-12">
              <div className="text-[12px] font-black text-white/40 uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-3 italic">Match Analytics</div>
              <div className="flex justify-between items-center mb-6">
                 <span className="text-[14px] font-bold text-white/60">House Fee (20%):</span>
                 <span className="text-[14px] font-bold text-red-400">-{Math.floor(betAmount * playerCount * APP_CONFIG.GAME.HOUSE_FEE_PERCENT).toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                 <span className="text-[14px] font-bold text-white/60">Final Payout:</span>
                 <span className={`${winner === user.username ? 'text-hb-emerald' : 'text-white/40'} text-[32px] font-black tracking-tighter`}>{winnings.toLocaleString()} <span className="text-[12px]">ETB</span></span>
              </div>
           </div>

           <button onClick={onClose} className="w-full max-w-[280px] h-[64px] bg-white text-hb-navy font-black rounded-3xl shadow-2xl active:scale-95 uppercase tracking-widest text-[16px] hover:bg-hb-gold hover:text-white transition-all">
             Play Again
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