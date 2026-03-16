import React, { useState, useEffect } from 'react';
import { 
  Play, Activity, TrendingUp, Shield, Globe, AlertTriangle, 
  ChevronRight, Image as ImageIcon, Map, Landmark, Users, 
  Settings, Briefcase, DollarSign, PieChart, Save
} from 'lucide-react';

// Senin API anahtarın entegre edildi
const apiKey = "AIzaSyCnsjsS2FlUlBlbK4uz0oka4L7PsDGtPLc";

const SYSTEM_PROMPT = `
Sen bir siyasi simülasyon motorusun. 
Görevin: Bir devlet başkanının kararlarını simüle etmek.
SADECE GEÇERLİ BİR JSON YANITI VER. METİN EKLEME.

JSON ŞEMASI:
{
  "visualPrompt": "Sahne tasviri (İngilizce).",
  "story": "Durum özeti (Türkçe).",
  "stats": {
    "approval": 50,
    "inflation": 15.0,
    "loyalty": 80,
    "treasury": 100.0,
    "growth": 3.0
  },
  "cabinetStatus": "Kabine yorumu.",
  "agenda": ["Madde 1", "Madde 2"],
  "options": {
    "A": "Seçenek A",
    "B": "Seçenek B",
    "C": "Seçenek C"
  }
}
`;

export default function App() {
  const [gameState, setGameState] = useState('setup'); 
  const [activeTab, setActiveTab] = useState('summary'); 
  const [country, setCountry] = useState('Türkiye');
  const [year, setYear] = useState('2024');
  const [turn, setTurn] = useState(1);
  const [taxRate, setTaxRate] = useState(25);
  const [spendRate, setSpendRate] = useState(30);
  const [cabinet, setCabinet] = useState([]);
  const [currentScenario, setCurrentScenario] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mobil Cihaz Uyumluluğu (Notch/Çentik Kontrolü)
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1, viewport-fit=cover";
    document.getElementsByTagName('head')[0].appendChild(meta);
  }, []);

  const fetchWithRetry = async (url, options, retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        return await res.json();
      } catch (e) {
        if (i === retries - 1) throw e;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  };

  const generateImage = async (prompt) => {
    setImageLoading(true);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`;
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: `Cinematic wide shot, political atmosphere, ${prompt}` }],
          parameters: { sampleCount: 1 }
        })
      };
      const result = await fetchWithRetry(url, options);
      if (result.predictions?.[0]?.bytesBase64Encoded) {
        setCurrentImage(`data:image/png;base64,${result.predictions[0].bytesBase64Encoded}`);
      }
    } catch (e) {
      console.error("Görsel hatası:", e);
    } finally {
      setImageLoading(false);
    }
  };

  const callEngine = async (userPrompt) => {
    setLoading(true);
    setError(null);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: { responseMimeType: "application/json" }
        })
      };

      const result = await fetchWithRetry(url, options);
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) throw new Error("API boş yanıt döndürdü.");

      const cleanJson = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      setCurrentScenario(parsed);
      setGameState('playing');
      if (parsed.visualPrompt) generateImage(parsed.visualPrompt);
    } catch (e) {
      console.error("Engine Error:", e);
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    const initialCabinet = [
      { id: 1, role: 'Ekonomi', name: "M. Şimşek", skill: 88 },
      { id: 2, role: 'Savunma', name: "Y. Güler", skill: 85 },
      { id: 3, role: 'İçişleri', name: "A. Yerlikaya", skill: 90 },
      { id: 4, role: 'Dışişleri', name: "H. Fidan", skill: 94 },
    ];
    setCabinet(initialCabinet);
    callEngine(`${country} başkanı olarak ${year} yılında göreve başlıyorum. Durum raporu ver.`);
  };

  const handleAction = (choice) => {
    setTurn(t => t + 1);
    callEngine(`Kararım: ${choice}. Vergi: %${taxRate}, Harcama: %${spendRate}. Simüle et.`);
  };

  // GİRİŞ EKRANI (Setup)
  if (gameState === 'setup') {
    return (
      <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center p-6" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="w-full max-w-sm bg-zinc-900 border border-white/10 rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg rotate-3">
              <Landmark size={32} />
            </div>
            <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">TERRA <span className="text-blue-500 text-sm">PRO</span></h1>
          </div>
          <div className="space-y-4">
            <input type="text" placeholder="Ülke" value={country} onChange={e=>setCountry(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-blue-500" />
            <input type="text" placeholder="Yıl" value={year} onChange={e=>setYear(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white outline-none focus:border-blue-500" />
            <button onClick={handleStart} disabled={loading} className="w-full bg-blue-600 py-4 rounded-xl font-black text-white tracking-widest active:scale-95 disabled:opacity-50">
              {loading ? "BAĞLANILIYOR..." : "GÖREVE BAŞLA"}
            </button>
            {error && <p className="text-red-500 text-[10px] text-center uppercase font-bold">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  // OYUN EKRANI
  return (
    <div className="fixed inset-0 bg-zinc-950 text-zinc-300 flex flex-col overflow-hidden" 
         style={{ 
           paddingTop: 'env(safe-area-inset-top)', 
           paddingBottom: 'env(safe-area-inset-bottom)',
           paddingLeft: 'env(safe-area-inset-left)',
           paddingRight: 'env(safe-area-inset-right)' 
         }}>
      
      {/* Üst Bar */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-white/5 bg-zinc-900/50">
        <div className="flex flex-col">
          <span className="text-white font-black text-xs uppercase">{country}</span>
          <span className="text-[9px] text-zinc-500 font-bold uppercase">Tur {turn} • {year}</span>
        </div>
        <div className="bg-blue-600/10 px-3 py-1 rounded-full border border-blue-500/20">
          <span className="text-[10px] font-black text-white">ONAY: %{currentScenario?.stats?.approval || 50}</span>
        </div>
      </div>

      {/* Menü Sekmeleri */}
      <div className="flex gap-1 p-1 bg-zinc-900 mx-4 mt-4 rounded-xl border border-white/5">
        {['summary', 'cabinet', 'budget'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === tab ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}>
            {tab === 'summary' ? 'Rapor' : tab === 'cabinet' ? 'Kabine' : 'Bütçe'}
          </button>
        ))}
      </div>

      {/* İçerik Alanı */}
      <div className="flex-1 overflow-y-auto p-4 pb-72 space-y-4">
        {activeTab === 'summary' && (
          <div className="space-y-4">
            <div className="bg-zinc-900 rounded-3xl border border-white/5 overflow-hidden shadow-xl">
              <div className="aspect-video bg-zinc-800 relative">
                {imageLoading ? (
                  <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
                ) : currentImage ? (
                  <img src={currentImage} className="w-full h-full object-cover" alt="State" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 text-white"><ImageIcon size={48} /></div>
                )}
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-white leading-relaxed font-medium italic">"{currentScenario?.story}"</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-black/50 p-3 rounded-2xl border border-white/5">
                    <p className="text-[8px] text-zinc-500 font-bold uppercase">Enflasyon</p>
                    <p className="text-xs font-black text-red-400">%{currentScenario?.stats?.inflation}</p>
                  </div>
                  <div className="bg-black/50 p-3 rounded-2xl border border-white/5">
                    <p className="text-[8px] text-zinc-500 font-bold uppercase">Hazine</p>
                    <p className="text-xs font-black text-emerald-400">${currentScenario?.stats?.treasury}B</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Gündem Maddeleri */}
            <div className="bg-orange-600/5 border border-orange-500/10 p-4 rounded-2xl">
              <h4 className="text-[9px] font-black text-orange-500 uppercase mb-2">İstihbarat Notları</h4>
              {currentScenario?.agenda?.map((item, i) => (
                <div key={i} className="text-[10px] text-zinc-400 mb-1 flex gap-2"><span>•</span> {item}</div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cabinet' && (
          <div className="space-y-2">
            {cabinet.map(m => (
              <div key={m.id} className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                <div><p className="text-[9px] text-zinc-500 font-bold uppercase">{m.role}</p><p className="text-xs font-bold text-white">{m.name}</p></div>
                <p className="text-xs font-black text-blue-500">%{m.skill}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="bg-zinc-900 p-6 rounded-3xl border border-white/5 space-y-8">
            <div className="space-y-4">
               <label className="flex justify-between text-[10px] font-black uppercase text-zinc-500"><span>Vergi Yükü</span><span>%{taxRate}</span></label>
               <input type="range" min="10" max="60" value={taxRate} onChange={e=>setTaxRate(e.target.value)} className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-blue-600" />
               
               <label className="flex justify-between text-[10px] font-black uppercase text-zinc-500 pt-4"><span>Kamu Harcaması</span><span>%{spendRate}</span></label>
               <input type="range" min="10" max="60" value={spendRate} onChange={e=>setSpendRate(e.target.value)} className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none accent-emerald-600" />
            </div>
          </div>
        )}
      </div>

      {/* Karar Paneli (En Altta) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur-xl border-t border-white/5 shadow-2xl" 
           style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
        <div className="max-w-md mx-auto space-y-2">
          {['A', 'B', 'C'].map((opt) => (
            <button key={opt} disabled={loading} onClick={() => handleAction(opt)} className="w-full bg-zinc-900 hover:bg-zinc-800 p-4 rounded-2xl border border-white/5 flex items-center gap-4 transition-all active:scale-95 disabled:opacity-50">
              <div className="w-8 h-8 rounded-lg bg-black border border-white/10 flex items-center justify-center font-black text-blue-500 text-[10px] shrink-0">{opt}</div>
              <span className="flex-1 text-[11px] font-bold text-zinc-200 text-left leading-snug">
                {currentScenario?.options?.[opt] || "Veri bekleniyor..."}
              </span>
              {loading && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
