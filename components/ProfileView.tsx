
import React, { useState } from 'react';
import { User } from '../types';

interface ProfileViewProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, setUser }) => {
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user.username);

  const handleSave = () => {
    setUser(prev => ({ ...prev, username: newUsername }));
    setEditing(false);
  };

  return (
    <div className="p-4">
      <div className="flex flex-col items-center text-center py-8">
        <div className="relative mb-4">
          <img 
            src={user.photo} 
            alt="Profile" 
            className="w-24 h-24 rounded-full border-4 border-white shadow-xl"
          />
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-hb-gold text-white rounded-full flex items-center justify-center shadow-lg">
            <i className="fas fa-camera text-xs"></i>
          </button>
        </div>
        
        {editing ? (
          <div className="flex flex-col items-center gap-3">
            <input 
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-white border-2 border-hb-blue px-4 py-2 rounded-xl text-center font-bold outline-none"
            />
            <div className="flex gap-2">
               <button onClick={handleSave} className="text-xs font-bold text-green-600">SAVE</button>
               <button onClick={() => setEditing(false)} className="text-xs font-bold text-gray-400">CANCEL</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-hb-blue">{user.username}</h2>
            <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-gray-500">
              <i className="fas fa-edit text-sm"></i>
            </button>
          </div>
        )}
        <p className="text-gray-400 font-bold text-xs mt-1 uppercase tracking-tighter">{user.mobile}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Referrals</span>
          <span className="text-2xl font-black text-hb-blue">{user.referrals}</span>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Win Rate</span>
          <span className="text-2xl font-black text-hb-gold">64%</span>
        </div>
      </div>

      <div className="bg-hb-gold p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <h3 className="text-lg font-black mb-2 italic relative z-10">REFER & EARN</h3>
        <p className="text-xs opacity-90 mb-6 leading-relaxed relative z-10">Share your link and get 5% commission on every stake your referrals make. Forever!</p>
        <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between border border-white/20 relative z-10 backdrop-blur-sm">
           <span className="text-[10px] font-mono truncate mr-2">hulumbingo.t.me?start=ref_2024</span>
           <button className="bg-white text-hb-gold px-3 py-1.5 rounded-xl text-[10px] font-bold">COPY LINK</button>
        </div>
        <i className="fas fa-coins absolute -right-4 -bottom-4 text-white/10 text-7xl rotate-12"></i>
      </div>
    </div>
  );
};

export default ProfileView;
