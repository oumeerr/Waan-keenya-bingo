import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ETHIOPIAN_BANKS } from '../constants';
import { APP_CONFIG } from '../config';

interface WalletViewProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

type PaymentMethod = 'telebirr' | 'cbe' | 'ebirr' | 'kacha';

interface MethodButtonProps {
  id: PaymentMethod;
  selected: boolean;
  label: string;
  theme: 'blue' | 'purple' | 'orange' | 'green';
  onClick: (id: PaymentMethod) => void;
  children: React.ReactNode;
}

const MethodButton: React.FC<MethodButtonProps> = ({ 
  id, 
  selected, 
  label, 
  theme,
  onClick, 
  children 
}) => {
  const themeColors = {
    blue: selected ? 'bg-hb-blue border-hb-blue text-white' : 'bg-blue-50 border-blue-100 text-hb-blue',
    purple: selected ? 'bg-purple-600 border-purple-600 text-white' : 'bg-purple-50 border-purple-100 text-purple-600',
    orange: selected ? 'bg-orange-500 border-orange-500 text-white' : 'bg-orange-50 border-orange-100 text-orange-600',
    green: selected ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-emerald-50 border-emerald-100 text-emerald-600',
  };

  return (
    <button 
      onClick={() => onClick(id)}
      className={`min-w-[80px] flex-1 flex flex-col items-center p-3 rounded-2xl border-2 transition-all group shadow-sm active:scale-95 ${themeColors[theme]} ${selected ? 'shadow-md' : 'hover:border-current'}`}
    >
      <div className={`w-full h-10 mb-2 flex items-center justify-center transition-transform group-active:scale-95 overflow-hidden rounded-lg bg-white/20`}>
        {children}
      </div>
      <span className={`text-[10px] font-black uppercase ${selected ? 'text-white' : 'text-current opacity-80'}`}>{label}</span>
    </button>
  );
};

const WalletView: React.FC<WalletViewProps> = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [refId, setRefId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('telebirr');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // Reset form when tab changes
  useEffect(() => {
    setAmount('');
    setRefId('');
    setBank('');
    setRecipientPhone('');
    setAccountNumber('');
    setAccountHolder('');
  }, [activeTab]);

  const getDepositNumbers = () => {
    if (selectedMethod === 'ebirr' || selectedMethod === 'kacha') {
      return APP_CONFIG.WALLET.DEPOSIT_PHONES.MERCHANT;
    }
    return APP_CONFIG.WALLET.DEPOSIT_PHONES.STANDARD;
  };

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    alert(`Phone number ${num} copied to clipboard!`);
  };

  const isWithdrawActive = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= APP_CONFIG.WALLET.WITHDRAWAL_START_HOUR && hour < APP_CONFIG.WALLET.WITHDRAWAL_END_HOUR;
  };

  const handleSubmitTransaction = () => {
    if (!amount || !refId) {
      alert("Please enter both amount and transaction reference ID.");
      return;
    }
    const methodLabel = selectedMethod.toUpperCase();
    alert(`Transaction Submitted!\nMethod: ${methodLabel}\nAmount: ${amount} ETB\nRef ID: ${refId}\n\nOur system is verifying your deposit...`);
    setAmount('');
    setRefId('');
  };

  const handleTransfer = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return alert("Invalid transfer amount");
    if (!recipientPhone) return alert("Recipient number required");
    
    const fee = val * APP_CONFIG.WALLET.TRANSFER_FEE_PERCENT;
    const totalDeduction = val + fee;

    if (user.balance < totalDeduction) {
      alert(`Insufficient Funds!\n\nTransfer: ${val} ETB\nFee (5%): ${fee} ETB\nTotal Needed: ${totalDeduction} ETB\n\nBalance: ${user.balance} ETB`);
      return;
    }

    // Process Transfer
    const confirmMsg = `Confirm P2P Transfer?\n\nTo: ${recipientPhone}\nAmount: ${val} ETB\nFee (5%): ${fee} ETB\n\nTotal Deduction: ${totalDeduction} ETB`;
    if (window.confirm(confirmMsg)) {
        setUser(prev => ({ ...prev, balance: prev.balance - totalDeduction }));
        alert("Transfer Successful!");
        setAmount('');
        setRecipientPhone('');
    }
  };

  // High quality Telebirr logo
  const telebirrLogoUrl = "https://th.bing.com/th/id/OIP.4yM-zK_zR0Y9y3zKz9z9zAHaHa?rs=1&pid=ImgDetMain"; 

  // Calculations for Transfer View
  const transferValue = parseFloat(amount) || 0;
  const transferFee = transferValue * APP_CONFIG.WALLET.TRANSFER_FEE_PERCENT;
  const totalTransferDeduction = transferValue + transferFee;

  return (
    <div className="p-5">
      <div className="bg-gradient-to-br from-[#2563EB] to-[#0F172A] p-8 rounded-[24px] text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase opacity-60 mb-1.5 tracking-widest">Available Balance</p>
          <h2 className="text-[32px] font-black mb-4 text-white drop-shadow-sm leading-none">
            {user.balance.toLocaleString()} <span className="text-[16px] opacity-70 font-bold">ETB</span>
          </h2>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase border border-white/5">Secured Vault</div>
            <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold uppercase border border-white/5">Verified Player</div>
          </div>
        </div>
        <i className="fas fa-wallet absolute -right-6 -bottom-6 text-white/5 text-[9rem] -rotate-12"></i>
      </div>

      <div className="flex bg-hb-border/50 p-1.5 rounded-2xl mb-8">
        {['deposit', 'withdraw', 'transfer'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase transition-all ${activeTab === tab ? 'bg-white text-hb-blue shadow-md' : 'text-hb-muted'}`}
          >
            {tab === 'deposit' ? 'Deposit' : tab === 'withdraw' ? 'Withdraw' : 'Transfer'}
          </button>
        ))}
      </div>

      {activeTab === 'deposit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-2">
            <MethodButton id="telebirr" selected={selectedMethod === 'telebirr'} theme="blue" label="Telebirr" onClick={setSelectedMethod}>
              <img src={telebirrLogoUrl} alt="Telebirr" className="h-full object-contain mix-blend-multiply scale-110" />
            </MethodButton>
            
            <MethodButton id="cbe" selected={selectedMethod === 'cbe'} theme="purple" label="CBE Birr" onClick={setSelectedMethod}>
              <span className="font-black text-[12px] tracking-tighter uppercase leading-none text-center">CBE</span>
            </MethodButton>

            <MethodButton id="ebirr" selected={selectedMethod === 'ebirr'} theme="orange" label="E-Birr" onClick={setSelectedMethod}>
                 <span className="font-black text-[10px] tracking-tighter uppercase leading-none text-center">E-BIRR</span>
            </MethodButton>

            <MethodButton id="kacha" selected={selectedMethod === 'kacha'} theme="green" label="Kacha" onClick={setSelectedMethod}>
                 <span className="font-black text-[10px] tracking-tighter uppercase leading-none text-center">KACHA</span>
            </MethodButton>
          </div>

          <div className="bg-white p-7 rounded-[24px] border border-hb-border shadow-sm space-y-6">
            <div className="text-center space-y-3">
              <h3 className="font-bold text-hb-navy text-[16px] uppercase tracking-tight">
                Deposit Funds
              </h3>
              <p className="text-[12px] text-hb-muted font-medium">Transfer your stake to the following merchant account:</p>
              
              <div className="space-y-3">
                {getDepositNumbers().map((num) => (
                  <div key={num} className="bg-hb-bg border border-hb-border py-4 px-6 rounded-2xl flex items-center justify-between group hover:border-hb-blue/30 transition-colors">
                    <span className="text-[18px] font-black text-hb-navy tracking-wider font-mono">{num}</span>
                    <button 
                      onClick={() => handleCopy(num)}
                      className="w-10 h-10 bg-hb-blue/10 text-hb-blue rounded-xl flex items-center justify-center hover:bg-hb-blue hover:text-white transition-all active:scale-90 shadow-sm"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-hb-border/50">
              <h3 className="font-bold text-hb-navy text-[16px] uppercase tracking-tight text-center">
                Verify Transaction
              </h3>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-hb-muted ml-1 uppercase tracking-tighter italic">Deposit Amount (ETB)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full input-human shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-hb-muted ml-1 uppercase tracking-tighter italic">Transaction Reference ID</label>
                <input 
                  type="text" 
                  placeholder="Ref/Txn code"
                  value={refId}
                  onChange={(e) => setRefId(e.target.value)}
                  className="w-full input-human shadow-sm"
                />
              </div>

              <button 
                onClick={handleSubmitTransaction}
                className="w-full h-[54px] bg-hb-blue text-white font-bold rounded-xl text-[14px] uppercase shadow-lg active:scale-[0.98] mt-4 flex items-center justify-center gap-2 transition-all hover:bg-hb-navy"
              >
                <i className="fas fa-check-circle"></i>
                Submit Deposit
              </button>
            </div>

            <div className="bg-hb-bg/50 p-4 rounded-2xl border border-dashed border-hb-border">
              <div className="flex items-start gap-3">
                <i className="fas fa-clock text-hb-blue mt-0.5"></i>
                <p className="text-[11px] text-hb-muted font-medium italic leading-relaxed">
                  Our automated system verifies transactions in real-time. Balance updates usually within <strong>5-10 minutes</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'withdraw' && (
        <div className="bg-white p-7 rounded-[24px] border border-hb-border shadow-sm space-y-6">
           <div className="text-center">
              <h3 className="font-bold text-hb-navy text-[18px] mb-1 italic">Withdraw Funds</h3>
              <p className="text-[12px] text-hb-muted font-medium">Window: {APP_CONFIG.WALLET.WITHDRAWAL_START_HOUR} AM to {APP_CONFIG.WALLET.WITHDRAWAL_END_HOUR - 12} PM.</p>
           </div>

           <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Withdrawal Amount (Min {APP_CONFIG.WALLET.MIN_WITHDRAWAL_ETB})</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00 ETB"
                  className="w-full input-human"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Withdrawal Method</label>
                <select 
                  className="w-full input-human appearance-none bg-no-repeat bg-[right_16px_center]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%2364748B\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundSize: '20px' }}
                  value={bank} onChange={e => setBank(e.target.value)}
                >
                  <option value="">Select Bank/Wallet...</option>
                  {ETHIOPIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Account Number</label>
                <input 
                  type="text" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1000..."
                  className="w-full input-human"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Account Holder Name</label>
                <input 
                  type="text" 
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Full Name"
                  className="w-full input-human"
                />
              </div>

              <button 
                disabled={!isWithdrawActive()}
                className="w-full h-[54px] bg-hb-blue text-white font-bold rounded-xl text-[14px] uppercase shadow-lg active:scale-[0.98] disabled:opacity-40 transition-all mt-4"
              >
                Request Withdrawal
              </button>
              {!isWithdrawActive() && (
                <p className="text-[10px] text-red-500 font-bold text-center italic">Withdrawals paused. Resume at {APP_CONFIG.WALLET.WITHDRAWAL_START_HOUR} AM.</p>
              )}
           </div>
        </div>
      )}

      {activeTab === 'transfer' && (
        <div className="bg-white p-7 rounded-[24px] border border-hb-border shadow-sm space-y-6">
           <div className="text-center">
              <h3 className="font-bold text-hb-navy text-[18px] mb-1 italic">P2P Transfer</h3>
              <p className="text-[12px] text-hb-muted font-medium">Move funds to another player's account.</p>
           </div>

           <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Recipient Mobile</label>
                <input 
                  type="tel" 
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="09..."
                  className="w-full input-human"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Transfer Amount</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00 ETB"
                  className="w-full input-human"
                />
              </div>

              {transferValue > 0 && (
                <div className="bg-hb-bg p-4 rounded-xl border border-hb-border text-[12px] animate-in fade-in slide-in-from-top-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-hb-muted font-bold">Transfer Amount</span>
                    <span className="font-bold">{transferValue.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between mb-2 text-hb-gold">
                    <span className="font-bold">Fee (5%)</span>
                    <span className="font-bold">+{transferFee.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-hb-border/50 font-black text-hb-navy text-[14px]">
                    <span>Total Deductible</span>
                    <span>{totalTransferDeduction.toFixed(2)} ETB</span>
                  </div>
                </div>
              )}

              <button 
                onClick={handleTransfer}
                disabled={user.balance < totalTransferDeduction}
                className="w-full h-[54px] bg-hb-navy text-white font-bold rounded-xl text-[14px] uppercase shadow-lg active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user.balance < totalTransferDeduction ? 'Insufficient Funds' : 'Transfer Funds'}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default WalletView;