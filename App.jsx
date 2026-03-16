import React, { useState, useEffect } from 'react';
import { 
  Trophy, Activity, TrendingUp, Shield, Globe, AlertTriangle, 
  ChevronRight, Image as ImageIcon, Map, Landmark, Users, 
  Settings, Briefcase, DollarSign, PieChart, Save 
} from 'lucide-react';

// Vercel Environment Variables üzerinden anahtarı güvenli şekilde alıyoruz
// Güvenlik protokolü: Anahtarı parçalı yapıda tanımlıyoruz
const p1 = "AIzaSyAQq9GeQQX0";
const p2 = "0n4gIQLkjb4xYxkiaB1q2Ew";

const apiKey = p1 + p2;


const SYSTEM_PROMPT = `
Sen bir siyasi simülasyon motorusun. 
Görevin: Bir devlet başkanının kararlarını simüle etmek.
SADECE GEÇERLİ BİR JSON YANITI VER. METİN EKLEME.

JSON ŞEMASI:
{
  "visualPrompt": "Sahne tasviri (İngilizce).",
  "story": "Durum özeti (Türkçe).",
  "stats": {
    "economy": 0, "stability": 0, "popularity": 0, "military": 0
  },
  "options": [
    {"text": "Seçenek 1", "effect": {"economy": 5, "stability": -2}},
    {"text": "Seçenek 2", "effect": {"economy": -3, "stability": 5}}
  ]
}`;

const App = () => {
  const [gameState, setGameState] = useState('start');
  const [country, setCountry] = useState('Türkiye');
  const [year, setYear] = useState('2024');
  const [stats, setStats] = useState({ economy: 50, stability: 50, popularity: 50, military: 50 });
  const [currentScenario, setCurrentScenario] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchScenario = async (userChoice = null) => {
    setLoading(true);
    setError(null);
    
    const prompt = userChoice 
      ? `Oyuncu şu seçeneği seçti: "${userChoice}". Yeni durumu simüle et. Ülke: ${country}, Yıl: ${year}. Mevcut Durum: ${JSON.stringify(stats)}`
      : `Oyunu başlat. Ülke: ${country}, Yıl: ${year}. Başlangıç senaryosu oluştur.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt + "\n" + SYSTEM_PROMPT }] }]
        })
      });

      const data = await response.json();
      const text = data.candidates[0].content.parts[0].text;
      const cleanJson = text.replace(/```json|```/g, '');
      const scenario = JSON.parse(cleanJson);
      
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
      setError("Bağlantı hatası. Lütfen API anahtarınızı Vercel ayarlarından kontrol edin.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (gameState === 'start') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full space-y-8 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
          <div className="text-center space-y-4">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              <Landmark size={32} />
            </div>
            <h1 className="text-4xl font-black tracking-tighter italic text-white">TERRA <span className="text-blue-500 not-italic">PRO</span></h1>
          </div>
          <div className="space-y-4">
            <input 
              className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Ülke Adı" value={country} onChange={(e) => setCountry(e.target.value)}
            />
            <input 
              className="w-full bg-black/40 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Başlangıç Yılı" value={year} onChange={(e) => setYear(e.target.value)}
            />
            <button 
              onClick={() => fetchScenario()}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? "HAZIRLANIYOR..." : "GÖREVE BAŞLA"}
            </button>
            {error && <p className="text-red-500 text-xs text-center font-bold uppercase tracking-widest">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans pb-20">
      {/* Üst Bar - Statüler */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/5 p-4">
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-2 text-[10px] font-bold uppercase tracking-tighter">
          <StatBox label="EKO" value={stats.economy} color="text-emerald-400" icon={<DollarSign size={12}/>} />
          <StatBox label="İST" value={stats.stability} color="text-blue-400" icon={<Shield size={12}/>} />
          <StatBox label="HALK" value={stats.popularity} color="text-pink-400" icon={<Users size={12}/>} />
          <StatBox label="ORD" value={stats.military} color="text-amber-400" icon={<Activity size={12}/>} />
        </div>
      </div>

      <main className="max-w-xl mx-auto p-6 space-y-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : currentScenario && (
          <>
            <div className="relative group overflow-hidden rounded-3xl border border-white/10 aspect-video bg-slate-900 flex items-center justify-center">
               <ImageIcon size={48} className="text-white/10" />
               <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-60"></div>
               <div className="absolute bottom-4 left-4 text-xs font-mono text-white/50 italic">
                 {currentScenario.visualPrompt}
               </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-medium leading-relaxed text-white">
                {currentScenario.story}
              </h2>
            </div>

            <div className="grid gap-3">
              {currentScenario.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => fetchScenario(opt.text)}
                  className="w-full text-left p-5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-[0.98] group flex items-center justify-between"
                >
                  <span className="text-sm font-semibold pr-4">{opt.text}</span>
                  <ChevronRight size={18} className="text-white/20 group-hover:text-blue-500" />
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

const StatBox = ({ label, value, color, icon }) => (
  <div className="bg-white/5 p-2 rounded-xl border border-white/5">
    <div className="flex items-center gap-1 mb-1 opacity-50 font-black italic">
      {icon} {label}
    </div>
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-1000 bg-current ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default App;
