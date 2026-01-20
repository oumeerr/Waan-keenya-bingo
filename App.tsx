
import React, { useState } from 'react';
import { View, Language, User } from './types';
import { TRANSLATIONS } from './constants';
import Sidebar from './components/Sidebar';
import WalletView from './components/WalletView';
import HomeView from './components/HomeView';
import LeaderboardView from './components/LeaderboardView';
import HistoryView from './components/HistoryView';
import ProfileView from './components/ProfileView';
import HowToPlayView from './components/HowToPlayView';
import BettingListView from './components/BettingListView';
import CardSelectionView from './components/CardSelectionView';
import GameView from './components/GameView';
import PromoGenerator from './components/PromoGenerator';
import SettingsView from './components/SettingsView';
import AllCardsView from './components/AllCardsView';

const App: React.FC = () => {
  const [viewStack, setViewStack] = useState<View[]>(['home']);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState<Language>(Language.ENGLISH);
  const [currentBet, setCurrentBet] = useState<number>(50);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [gameMode, setGameMode] = useState<'classic' | 'mini'>('classic');
  const [isGameActive, setIsGameActive] = useState(false);
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null);

  const [user, setUser] = useState<User>({
    username: 'BingoMaster2024',
    mobile: '0939814648',
    balance: 1500,
    referrals: 12,
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bingo',
  });

  const currentView = viewStack[viewStack.length - 1];
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;

  const navigateTo = (view: View, reset = false) => {
    if (reset) {
      if (view === 'home') {
        setViewStack(['home']);
      } else {
        setViewStack(['home', view]);
      }
    } else {
      setViewStack(prev => [...prev, view]);
    }
    setSidebarOpen(false);
  };

  const goBack = () => {
    if (viewStack.length > 1) {
      setViewStack(prev => prev.slice(0, -1));
    }
  };

  const handleStartGame = (cardIds: number[]) => {
    const totalStake = cardIds.length * currentBet;
    if (user.balance < totalStake) {
      alert(`Insufficient balance! Total stake for ${cardIds.length} cards is ${totalStake} ETB.`);
      return;
    }
    setUser(prev => ({ ...prev, balance: prev.balance - totalStake }));
    setSelectedCardIds(cardIds);
    setMatchStartTime(Date.now());
    setIsGameActive(true);
    navigateTo('game');
  };

  const handleQuickPlayFromGallery = (cardId: number, mode: 'classic' | 'mini') => {
    setGameMode(mode);
    setCurrentBet(50);
    setSelectedCardIds([cardId]);
    navigateTo('betting-list');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-game-gradient shadow-2xl overflow-hidden relative font-sans text-hb-navy">
      {/* Header Container */}
      <div className="z-30 shadow-sm sticky top-0 w-full bg-hb-brand-grey border-b border-white/5">
        <div className="max-w-md mx-auto">
          <header className="text-white px-5 py-4 flex items-center justify-between h-[70px]">
            <div className="w-12 flex justify-start">
              {viewStack.length > 1 ? (
                <button onClick={goBack} className="touch-target -ml-2 text-2xl active:scale-90 transition-transform hover:text-hb-gold">
                  <i className="fas fa-arrow-left"></i>
                </button>
              ) : (
                <button onClick={() => setSidebarOpen(true)} className="touch-target -ml-2 text-2xl active:scale-90 transition-transform">
                  <i className="fas fa-bars"></i>
                </button>
              )}
            </div>
            
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div className="flex items-center justify-center">
                <img 
                  src="logo.png" 
                  alt="Hulumbingo" 
                  className="h-10 w-auto object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] transform transition-transform hover:scale-105" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.innerHTML = '<span class="font-black text-xl italic tracking-tighter text-white">HULUMBINGO</span>';
                  }}
                />
              </div>
              <div className="bg-hb-gold/90 text-white px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border border-white/10 shadow-sm">
                10k Weekly Prize Pool
              </div>
            </div>

            <div className="flex flex-col items-end w-12 min-w-[85px]">
              <span className="text-[9px] opacity-70 uppercase font-bold tracking-widest mb-1">Wallet</span>
              <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md">
                <span className="font-bold text-hb-emerald text-[14px] drop-shadow-sm">{user.balance.toLocaleString()}</span>
              </div>
            </div>
          </header>
        </div>

        {/* Persistent Active Match Banner */}
        {isGameActive && currentView !== 'game' && (
          <button 
            onClick={() => navigateTo('game', true)}
            className="w-full bg-hb-gold text-white py-2.5 px-5 flex items-center justify-between animate-pulse shadow-lg border-t border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>
              <span className="text-[11px] font-black uppercase tracking-widest">Live Arena Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase opacity-80">Re-enter Arena</span>
              <i className="fas fa-external-link-alt text-[10px]"></i>
            </div>
          </button>
        )}

        {/* Marquee Container */}
        {!isGameActive && (
          <div className="bg-hb-blueblack text-white/50 overflow-hidden py-1.5 border-t border-white/5">
            <div className="max-w-md mx-auto overflow-hidden">
               <div className="animate-marquee whitespace-nowrap inline-block text-[10px] font-medium uppercase tracking-widest italic">
                 🏆 WEEKLY 10,000 ETB PRIZE POOL • SAFE & SECURE • 150 UNIQUE CARDS • 🏆 WEEKLY 10,000 ETB PRIZE POOL • SAFE & SECURE • 150 UNIQUE CARDS
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-28 w-full bg-transparent">
        <div className="max-w-md mx-auto min-h-full">
          {currentView === 'home' && <HomeView onQuickPlay={() => navigateTo('betting-list')} />}
          {currentView === 'wallet' && <WalletView user={user} setUser={setUser} />}
          {currentView === 'leaderboard' && <LeaderboardView />}
          {currentView === 'history' && <HistoryView />}
          {currentView === 'profile' && <ProfileView user={user} setUser={setUser} />}
          {currentView === 'how-to-play' && <HowToPlayView />}
          {currentView === 'all-cards' && <AllCardsView onQuickPlay={handleQuickPlayFromGallery} />}
          {currentView === 'betting-list' && (
            <BettingListView 
              mode={gameMode}
              onModeChange={setGameMode}
              onSelectBet={(amt) => {
                setCurrentBet(amt);
                navigateTo('card-selection');
              }} 
            />
          )}
          {currentView === 'card-selection' && (
            <CardSelectionView 
              betAmount={currentBet}
              mode={gameMode}
              onSelectCard={handleStartGame} 
            />
          )}
          {currentView === 'game' && selectedCardIds.length > 0 && matchStartTime !== null && (
            <GameView 
              cardIds={selectedCardIds} 
              betAmount={currentBet}
              mode={gameMode}
              user={user} 
              setUser={setUser}
              matchStartTime={matchStartTime}
              onClose={() => {
                setIsGameActive(false);
                setMatchStartTime(null);
                navigateTo('home', true);
              }} 
            />
          )}
          {currentView === 'promo' && <PromoGenerator />}
          {currentView === 'settings' && <SettingsView />}
        </div>
      </main>

      {/* Footer Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 w-full bg-white/98 backdrop-blur-xl border-t border-hb-border z-40 pb-safe shadow-[0_-10px_25px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto flex items-center justify-around px-2 py-4">
          <FooterItem icon="fa-wallet" label={t('wallet')} active={currentView === 'wallet'} onClick={() => navigateTo('wallet', true)} />
          <FooterItem icon="fa-trophy" label={t('leaderboard')} active={currentView === 'leaderboard'} onClick={() => navigateTo('leaderboard', true)} />
          
          <div className="relative -mt-14">
            <button 
              onClick={() => {
                if (isGameActive) {
                  navigateTo('game', true);
                } else {
                  navigateTo('betting-list', true);
                }
              }}
              className={`w-[56px] h-[56px] bg-hb-gold rounded-full border-[6px] border-hb-bg shadow-xl flex items-center justify-center text-white text-2xl transition-all active:scale-90 hover:bg-[#B45309] ${currentView === 'betting-list' || isGameActive ? 'ring-8 ring-hb-gold/10' : ''}`}
            >
              <i className={`fas ${isGameActive ? 'fa-external-link-alt' : 'fa-play'} ${!isGameActive && 'ml-1'}`}></i>
            </button>
          </div>

          <FooterItem icon="fa-history" label={t('history')} active={currentView === 'history'} onClick={() => navigateTo('history', true)} />
          <FooterItem icon="fa-question-circle" label={t('howToPlay')} active={currentView === 'how-to-play'} onClick={() => navigateTo('how-to-play', true)} />
        </div>
      </nav>

      {isSidebarOpen && (
        <Sidebar 
          currentLang={lang} 
          onLangChange={setLang} 
          onClose={() => setSidebarOpen(false)} 
          onNavigate={(v) => navigateTo(v, true)} 
        />
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 0);
        }
      `}</style>
    </div>
  );
};

const FooterItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 transition-all ${active ? `text-hb-blueblack scale-105` : 'text-hb-muted hover:text-hb-blueblack'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-0.5 transition-all ${active ? 'bg-hb-blueblack/5' : 'bg-transparent'}`}>
      <i className={`fas ${icon} text-[24px]`}></i>
    </div>
    <span className="text-[10px] font-bold uppercase tracking-tight">{label}</span>
  </button>
);

export default App;
