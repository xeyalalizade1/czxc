import React, { useState } from 'react';
import { Trophy, Shield, Globe, Image as ImageIcon, ChevronRight, Landmark, Users, Activity, DollarSign, Key } from 'lucide-react';

const SYSTEM_PROMPT = `Sen bir siyasi simülasyon motorusun. SADECE GEÇERLİ BİR JSON YANITI VER. METİN EKLEME.`;

const App = () => {
  const [apiKey, setApiKey] = useState('');
  const [isKeyEntered, setIsKeyEntered] = useState(false);
  const [gameState, setGameState] = useState('start');
  const [country, setCountry] = useState('Türkiye');
  const [year, setYear] = useState('2024');
  const [stats, setStats] = useState({ economy: 50, stability: 50, popularity: 50, military: 50 });
  const [currentScenario, setCurrentScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchScenario = async (userChoice = null) => {
    setLoading(true);
    setError(null);
    const prompt = userChoice 
      ? `Seçim: "${userChoice}". Durum: ${JSON.stringify(stats)}. Ülke: ${country}, Yıl: ${year}.`
      : `Oyunu başlat. Ülke: ${country}, Yıl: ${year}. Başlangıç senaryosu oluştur.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt + "\n" + SYSTEM_PROMPT }] }] })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates[0].content.parts[0].text;
      const scenario = JSON.parse(text.replace(/```json|```/g, ''));
      setCurrentScenario(scenario);
      if (userChoice) {
        setStats(prev => ({
          economy: Math.min(100, Math.max(0, prev.economy + (scenario.stats?.economy || 0))),
          stability: Math.min(100, Math.max(0, prev.stability + (scenario.stats?.stability || 0))),
          popularity: Math.min(100, Math.max(0, prev.popularity + (scenario.stats?.popularity || 0))),
          military: Math.min(100, Math.max(0, prev.military + (scenario.stats?.military || 0)))
        }));
      }
      setGameState('playing');
    } catch (err) {
      setError("Anahtar hatalı veya geçersiz. Lütfen kontrol edin.");
    } finally {
      setLoading(false);
    }
  };

  if (!isKeyEntered) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <div className="text-center"><Key className="mx-auto text-blue-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold">API Girişi</h2>
          <p className="text-slate-400 text-sm mt-2">Güvenlik için API anahtarını buraya yapıştırın. Bu anahtar sadece sizin tarayıcınızda tutulur.</p></div>
          <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="AIzaSy..." />
          <button onClick={() => apiKey.length > 10 && setIsKeyEntered(true)}
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition-all">DEVAM ET</button>
        </div>
      </div>
    );
  }

  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full space-y-8 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl text-center">
          <Landmark className="mx-auto text-blue-500" size={64} />
          <h1 className="text-4xl font-black italic">TERRA <span className="text-blue-500 not-italic">PRO</span></h1>
          <div className="space-y-4">
            <input className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-white outline-none"
              placeholder="Ülke" value={country} onChange={(e) => setCountry(e.target.value)} />
            <input className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-white outline-none"
              placeholder="Yıl" value={year} onChange={(e) => setYear(e.target.value)} />
            <button onClick={() => fetchScenario()} disabled={loading} className="w-full bg-blue-600 py-4 rounded-xl font-bold uppercase tracking-widest">{loading ? "Yükleniyor..." : "Göreve Başla"}</button>
            {error && <p className="text-red-500 text-xs font-bold uppercase">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="grid grid-cols-4 gap-2">
          <StatBox label="EKO" value={stats.economy} color="text-emerald-400" icon={<DollarSign size={12}/>} />
          <StatBox label="İST" value={stats.stability} color="text-blue-400" icon={<Shield size={12}/>} />
          <StatBox label="HALK" value={stats.popularity} color="text-pink-400" icon={<Users size={12}/>} />
          <StatBox label="ORD" value={stats.military} color="text-amber-400" icon={<Activity size={12}/>} />
        </div>
        {loading ? <div className="text-center p-20 animate-pulse">Yeni rapor hazırlanıyor...</div> : (
          <>
            <div className="bg-slate-900 rounded-3xl p-6 border border-white/5 space-y-4">
              <p className="text-lg leading-relaxed">{currentScenario?.story}</p>
            </div>
            <div className="grid gap-3">
              {currentScenario?.options?.map((opt, i) => (
                <button key={i} onClick={() => fetchScenario(opt.text)} className="w-full text-left p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 flex justify-between items-center group">
                  <span className="font-medium">{opt.text}</span>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatBox = ({ label, value, color, icon }) => (
  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
    <div className={`flex items-center gap-1 mb-1 text-[10px] font-bold ${color}`}>{icon} {label}</div>
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full bg-current ${color}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default App;
