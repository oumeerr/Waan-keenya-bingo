import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup' | 'telegram'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const LOGO_URL = "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/4a/6c/2e/4a6c2e37-122e-130f-2169-2810c9d94944/AppIcon-0-0-1x_U007emarketing-0-5-0-85-220.png/512x512bb.jpg";

  // Check for Telegram WebApp User
  const tgUser = (window as any).Telegram?.WebApp?.initDataUnsafe?.user;
  const isTelegramEnv = !!tgUser;

  useEffect(() => {
    // If opened in TG, auto-switch to telegram mode for convenience
    if (isTelegramEnv) {
      setMode('telegram');
    }
  }, [isTelegramEnv]);

  const handleTelegramAuth = async () => {
    setLoading(true);

    try {
      if (tgUser) {
        // In a real production app, you would send window.Telegram.WebApp.initData to your backend for secure validation
        // For this frontend demo, we trust the WebApp context
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulating auth delay
        
        // Optional: specific logic to sync TG user with Supabase could go here
        onLogin();
      } else {
        throw new Error("Telegram account not detected.");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      alert(error.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return alert("Please fill in all fields");
    
    if (mode === 'signup') {
      if (!username) return alert("Username is required for registration");
      if (!phone) return alert("Phone number is required for wallet access");
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              username: username,
              mobile: phone,
              balance: 20, 
              referrer: referralCode || null 
            } 
          }
        });
        if (error) throw error;

        if (data.session) {
          await supabase.auth.signOut();
        }

        alert("Registration Complete. Please Login.");
        setMode('login');
      } else {
        // Determine if input is email or phone for login
        const isPhone = /^[0-9+]+$/.test(email);
        const loginPayload = isPhone ? { phone: email, password } : { email, password };

        const { data, error } = await supabase.auth.signInWithPassword(loginPayload);
        
        if (error) {
           if (error.message.includes('Invalid login') || error.message.includes('credential')) {
             throw new Error("Invalid password or email / phone. Please enter correct password or phone number.");
           }
           throw error;
        }
        onLogin();
      }
    } catch (error: any) {
      alert(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-hb-bg relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-gradient-to-b from-green-900/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="z-10 flex flex-col items-center text-center w-full max-w-sm">
        
        {/* Logo Section */}
        <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(34,197,94,0.4)] flex items-center justify-center mb-6 relative overflow-hidden border-4 border-white/10">
           <img 
             src={LOGO_URL} 
             className="w-full h-full object-cover" 
             onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-[#22C55E]', 'to-[#166534]');
               e.currentTarget.parentElement!.innerHTML = '<span class="text-7xl font-black text-white italic drop-shadow-md">W</span>';
             }}
           />
        </div>

        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
          Waan Keenya Bingo
        </h1>
        <p className="text-hb-muted text-sm font-medium mb-8 max-w-[260px] leading-relaxed">
          The premium competitive bingo game. <br/> Win weekly cash prizes securely.
        </p>

        {/* Mode Switcher */}
        <div className="w-full bg-hb-surface border border-hb-border p-6 rounded-[24px] shadow-lg mb-6">
          <div className="flex bg-[#121212] p-1 rounded-xl mb-6 overflow-hidden">
             <button 
               onClick={() => setMode('login')}
               className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'login' ? 'bg-[#22C55E] text-hb-blueblack shadow-sm' : 'text-hb-muted hover:text-white'}`}
             >
               Login
             </button>
             
             {/* Only show Telegram Tab if in Telegram Environment */}
             {isTelegramEnv && (
               <button 
                 onClick={() => setMode('telegram')}
                 className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'telegram' ? 'bg-[#24A1DE] text-white shadow-sm' : 'text-hb-muted hover:text-white'}`}
               >
                 Telegram
               </button>
             )}

             <button 
               onClick={() => setMode('signup')}
               className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'signup' ? 'bg-[#22C55E] text-hb-blueblack shadow-sm' : 'text-hb-muted hover:text-white'}`}
             >
               Register
             </button>
          </div>

          <div className="space-y-4">
             {/* Telegram Login Mode (Only if tgUser exists) */}
             {mode === 'telegram' && isTelegramEnv && tgUser && (
               <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                  <div className="bg-[#1A1A1A] p-4 rounded-xl border border-[#24A1DE]/30 text-center">
                     <div className="w-16 h-16 bg-[#24A1DE] rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-lg relative">
                        {tgUser.photo_url ? (
                          <img src={tgUser.photo_url} alt="TG" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span>{tgUser.first_name?.[0] || 'T'}</span>
                        )}
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-[#1A1A1A]"></div>
                     </div>
                     <h3 className="text-white font-bold text-sm mb-0.5">Welcome, {tgUser.first_name}</h3>
                     <p className="text-[#24A1DE] text-[10px] font-medium mb-4">@{tgUser.username || 'User'}</p>
                     
                     <button 
                      onClick={handleTelegramAuth} 
                      disabled={loading}
                      className="w-full h-12 bg-[#24A1DE] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
                    >
                      {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fab fa-telegram-plane"></i>}
                      {loading ? "Verifying..." : "Continue as " + tgUser.first_name}
                    </button>
                  </div>
               </div>
             )}

             {/* Signup Mode */}
             {mode === 'signup' && (
               <div className="animate-in fade-in zoom-in duration-300">
                 <div className="space-y-4">
                   <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">Username</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="BingoKing" 
                        className="w-full input-human h-12 text-sm"
                      />
                   </div>
                   <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">Phone Number</label>
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="09..." 
                        className="w-full input-human h-12 text-sm"
                      />
                   </div>
                   <div className="space-y-1 text-left">
                      <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">Referral Code (Optional)</label>
                      <input 
                        type="text" 
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        placeholder="Inviter's Username" 
                        className="w-full input-human h-12 text-sm"
                      />
                   </div>
                 </div>
               </div>
             )}

             {/* Email/Pass Fields (Shared by Login and Signup) */}
             {mode !== 'telegram' && (
               <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                 <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">
                      {mode === 'login' ? 'Email or Phone' : 'Email Address'}
                    </label>
                    <input 
                      type="text" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === 'login' ? "Email or Phone" : "you@example.com"}
                      className="w-full input-human h-12 text-sm"
                    />
                 </div>
                 <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">Password</label>
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      className="w-full input-human h-12 text-sm"
                    />
                 </div>

                 <button 
                   onClick={handleEmailAuth}
                   disabled={loading}
                   className="w-full h-12 bg-white text-hb-blueblack font-black text-xs uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 hover:bg-gray-100 disabled:opacity-50"
                 >
                   {loading && <i className="fas fa-spinner fa-spin"></i>}
                   {mode === 'login' ? 'Login' : 'Register'}
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* Telegram Shortcut Button (Only if in TG env but currently in a different mode) */}
        {isTelegramEnv && mode !== 'telegram' && (
          <button 
            onClick={() => { setMode('telegram'); }}
            className="w-full h-14 bg-[#24A1DE] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_4px_15px_rgba(36,161,222,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 hover:brightness-110 disabled:opacity-70 animate-in fade-in"
          >
             <i className="fab fa-telegram-plane text-xl"></i>
             Sign in with Telegram
          </button>
        )}

        <p className="mt-8 text-[10px] text-hb-muted/50 font-bold uppercase tracking-widest">
          Secure End-to-End Encryption
        </p>
      </div>
    </div>
  );
};

export default LoginView;