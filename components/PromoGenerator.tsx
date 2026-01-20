
import React, { useState } from 'react';
import { generatePromoDescription } from '../services/geminiService';

const PromoGenerator: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [promo, setPromo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setLoading(true);
    const result = await generatePromoDescription(topic);
    setPromo(result || "");
    setLoading(false);
  };

  return (
    <div className="p-4">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white mb-6 shadow-xl">
        <h2 className="text-xl font-black mb-2 flex items-center gap-2">
          <i className="fas fa-magic"></i> AI PROMO CREATOR
        </h2>
        <p className="text-xs opacity-80">Use Gemini to generate viral promotional text for your bingo streaks!</p>
      </div>

      <div className="space-y-4">
        <textarea 
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What's the highlight? e.g., Just won 500 ETB! or Join my team for the 10k prize!"
          className="w-full bg-white border border-gray-200 p-4 rounded-2xl font-medium outline-none focus:border-purple-500 h-24 text-sm"
        />
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl shadow-lg hover:bg-purple-700 transition-all disabled:opacity-50"
        >
          {loading ? 'GENERATING...' : 'CREATE PROMO SCRIPT'}
        </button>

        {promo && (
          <div className="bg-white p-5 rounded-2xl border-2 border-purple-50 shadow-inner mt-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="text-[10px] font-black text-purple-400 uppercase mb-2">Script Suggestion</div>
            <p className="text-sm text-gray-700 italic leading-relaxed whitespace-pre-wrap">{promo}</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(promo);
                alert("Copied to clipboard!");
              }}
              className="mt-4 text-xs font-bold text-purple-600 flex items-center gap-1"
            >
              <i className="fas fa-copy"></i> Copy Script
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromoGenerator;
