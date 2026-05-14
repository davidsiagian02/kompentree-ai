import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Network, Moon, Sun, Activity, Users, Target, CheckCircle2, 
  MinusCircle, HelpCircle, GitMerge, Database, User, History, 
  Loader2, ChevronRight 
} from 'lucide-react';

// FIREBASE SETUP
const firebaseConfig = {
  apiKey: "AIzaSyDsVZg_TB7O6Yg9hWYGZPjEFY3Xg2sfAcc",
  authDomain: "kompentree-ai.firebaseapp.com",
  projectId: "kompentree-ai",
  storageBucket: "kompentree-ai.firebasestorage.app",
  messagingSenderId: "434351733505",
  appId: "1:434351733505:web:ea795379aa83f56284f900"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- DATA DROPDOWN ---
const prodiList = [
  "Teknik Elektronika", "Teknik Listrik", "Teknik Mesin", 
  "Teknologi Rekayasa Jaringan Telekomunikasi", "Teknologi Rekayasa Sistem Elktronika", 
  "Teknologi Rekayasa Mekatronika", "Kecerdasan buatan dan robotika", 
  "Teknik Informatika", "Sistem Informasi", "Teknologi Rekayasa Komputer", 
  "Animasi", "Akuntansi Perpajakan", 
  "Hubungan Masyarakat dan Komunikasi Digital", "Bisnis Digital"
];

const generasiList = ["22", "23", "24", "25"];

// --- DEFINISI CLUSTER ---
const clusterInfo = {
  0: { 
    label: "Mendukung Sistem Kompen", color: "emerald", bgLight: "bg-emerald-50", textDark: "text-emerald-500",
    icon: <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
  },
  1: { 
    label: "Tidak Terasa Dampak", color: "blue", bgLight: "bg-blue-50", textDark: "text-blue-500",
    icon: <MinusCircle className="w-7 h-7 text-blue-600 dark:text-blue-400" />
  },
  2: { 
    label: "Netral / Ambigu", color: "amber", bgLight: "bg-amber-50", textDark: "text-amber-500",
    icon: <HelpCircle className="w-7 h-7 text-amber-600 dark:text-amber-400" />
  }
};

const questions = [
  { id: 'q1', label: "Kompen akad memberikan efek jera." },
  { id: 'q2', label: "Kompen indis memberikan efek jera." },
  { id: 'q3', label: "Setelah kompen, saya mengurangi pelanggaran." },
  { id: 'q4', label: "Kompen membuat saya lebih bertanggung jawab." },
  { id: 'q5', label: "Kompen membuat saya lebih disiplin kehadiran." },
  { id: 'q6', label: "Saya lebih memilih kompen akad dibanding indis." }
];

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", prodi: "", generasi: "" });
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedData, setSavedData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Firebase Auth (Anonymous)
  useEffect(() => {
    signInAnonymously(auth).catch(error => console.error("Auth error:", error));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // Fetch Database Realtime
  useEffect(() => {
    if (!user) return;
    // Mengambil data dari collection 'decision_tree_results'
    const q = query(collection(db, 'decision_tree_results'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      data.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeB - timeA;
      });
      setSavedData(data);
    }, (error) => console.error("Error fetching data:", error));

    return () => unsubscribe();
  }, [user]);

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAnswer = (questionId, value) => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const evaluateDecisionTreeAndSave = () => {
    if (!formData.name.trim() || !formData.prodi || !formData.generasi) {
      alert("Mohon lengkapi seluruh form identitas (Nama, Program Studi, dan Angkatan).");
      return;
    }
    if (Object.keys(answers).length < questions.length) {
      alert("Mohon jawab seluruh pertanyaan kuesioner pada skala 1-5.");
      return;
    }

    setIsAnalyzing(true);
    
    setTimeout(async () => {
      const { q1, q2, q3, q4, q5, q6 } = answers;
      let cluster = null;
      let path = [];

      // Logic Decision Tree C4.5
      if (q1 <= 3.5) {
        path.push("Efek Jera Akad (<= 3.5) → YA");
        if (q2 <= 3.5) {
          path.push("Efek Jera Indis (<= 3.5) → YA");
          if (q3 <= 2.5) {
            path.push("Kurangi Pelanggaran (<= 2.5) → YA"); cluster = 1; 
          } else {
            path.push("Kurangi Pelanggaran (<= 2.5) → TIDAK");
            if (q4 <= 3.5) {
              path.push("Bertanggung Jawab (<= 3.5) → YA");
              if (q5 <= 1.5) { path.push("Disiplin Hadir (<= 1.5) → YA"); cluster = 1; } 
              else { path.push("Disiplin Hadir (<= 1.5) → TIDAK"); cluster = 2; }
            } else {
              path.push("Bertanggung Jawab (<= 3.5) → TIDAK"); cluster = 1;
            }
          }
        } else {
          path.push("Efek Jera Indis (<= 3.5) → TIDAK");
          if (q6 <= 3.5) {
            path.push("Pilih Kompen Akad (<= 3.5) → YA");
            if (q4 <= 4.5) { path.push("Bertanggung Jawab (<= 4.5) → YA"); cluster = 2; } 
            else { path.push("Bertanggung Jawab (<= 4.5) → TIDAK"); cluster = 0; }
          } else {
            path.push("Pilih Kompen Akad (<= 3.5) → TIDAK");
            if (q5 <= 3.5) { path.push("Disiplin Hadir (<= 3.5) → YA"); cluster = 2; } 
            else { path.push("Disiplin Hadir (<= 3.5) → TIDAK"); cluster = 0; }
          }
        }
      } else {
        path.push("Efek Jera Akad (<= 3.5) → TIDAK");
        if (q3 <= 3.5) {
          path.push("Kurangi Pelanggaran (<= 3.5) → YA"); cluster = 2;
        } else {
          path.push("Kurangi Pelanggaran (<= 3.5) → TIDAK");
          if (q4 <= 3.5) { path.push("Bertanggung Jawab (<= 3.5) → YA"); cluster = 2; } 
          else { path.push("Bertanggung Jawab (<= 3.5) → TIDAK"); cluster = 0; }
        }
      }

      setResult({ clusterId: cluster, rulesPassed: path });
      setIsAnalyzing(false);

      // Save to Firebase (Lokal & Vercel)
      if (user) {
        setIsSaving(true);
        try {
          await addDoc(collection(db, 'decision_tree_results'), {
            name: formData.name,
            prodi: formData.prodi,
            generasi: formData.generasi,
            clusterId: cluster,
            clusterLabel: clusterInfo[cluster].label,
            answers: answers,
            userId: user.uid,
            timestamp: serverTimestamp()
          });
        } catch (error) {
          console.error("Gagal menyimpan:", error);
          alert("Gagal menyimpan ke database. Cek koneksi atau rules Firebase.");
        } finally {
          setIsSaving(false);
        }
      }
    }, 800);
  };

  const reset = () => {
    setAnswers({});
    setResult(null);
    setFormData({ name: "", prodi: "", generasi: "" });
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 pb-20 ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      <nav className={`sticky top-0 z-30 border-b transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className={`w-6 h-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <span className="font-bold text-lg tracking-tight">Sistem Klasifikasi <span className="font-normal opacity-80">Kompen</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium border ${isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              <Database className="w-3.5 h-3.5" />
              <span>Database Terhubung</span>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              title="Ganti Tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        <section className="text-center max-w-3xl mx-auto py-6">
          <h1 className={`text-3xl sm:text-4xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Analisis Kompensasi Mahasiswa
          </h1>
          <p className={`text-base sm:text-lg leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Sistem untuk mengklasifikasikan respons mahasiswa terhadap efektivitas kebijakan disiplin akademik.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Activity className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            <h2 className="text-lg font-semibold">Dashboard Model</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-5 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="text-slate-500 text-xs font-semibold uppercase mb-1 flex items-center justify-between">Total Dataset <Users className="w-4 h-4" /></div>
              <div className="text-2xl font-bold">108</div>
            </div>
            <div className={`p-5 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="text-slate-500 text-xs font-semibold uppercase mb-1 flex items-center justify-between">Data Masuk <Database className="w-4 h-4" /></div>
              <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{savedData.length}</div>
            </div>
            <div className={`p-5 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="text-slate-500 text-xs font-semibold uppercase mb-1 flex items-center justify-between">Level Tree <GitMerge className="w-4 h-4" /></div>
              <div className="text-2xl font-bold">5 Level</div>
            </div>
            <div className={`p-5 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="text-slate-500 text-xs font-semibold uppercase mb-1 flex items-center justify-between">Akurasi Model <Target className="w-4 h-4" /></div>
              <div className="text-2xl font-bold">92.4%</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-6 sm:p-8 rounded-xl border transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1">Form Pengujian</h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Silakan isi identitas dan jawab pernyataan di bawah ini (1 = Sangat Tidak Setuju, 5 = Sangat Setuju).
                </p>
              </div>

              <div className={`mb-8 p-5 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-2 mb-4 border-b pb-2 border-slate-200 dark:border-slate-700">
                  <User className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className="font-semibold text-sm">Informasi Responden</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Nama Lengkap</label>
                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} disabled={result !== null} placeholder="Masukkan nama Anda" className={`w-full px-3 py-2 rounded border text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white disabled:opacity-50' : 'bg-white border-slate-300 text-slate-900 disabled:bg-slate-100'}`}/>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Program Studi</label>
                    <select name="prodi" value={formData.prodi} onChange={handleFormChange} disabled={result !== null} className={`w-full px-3 py-2 rounded border text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white disabled:opacity-50' : 'bg-white border-slate-300 text-slate-900 disabled:bg-slate-100'}`}>
                      <option value="" disabled>Pilih Program Studi...</option>
                      {prodiList.map((prodi, idx) => <option key={idx} value={prodi}>{prodi}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Angkatan</label>
                    <select name="generasi" value={formData.generasi} onChange={handleFormChange} disabled={result !== null} className={`w-full px-3 py-2 rounded border text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white disabled:opacity-50' : 'bg-white border-slate-300 text-slate-900 disabled:bg-slate-100'}`}>
                      <option value="" disabled>Pilih Angkatan...</option>
                      {generasiList.map((gen, idx) => <option key={idx} value={gen}>Angkatan 20{gen}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {questions.map((q, index) => (
                  <div key={q.id} className="pb-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                    <p className="font-medium text-sm mb-3">{index + 1}. {q.label}</p>
                    <div className="flex justify-between items-center max-w-sm">
                      <span className={`text-[10px] font-semibold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Tidak Setuju</span>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button key={val} onClick={() => handleAnswer(q.id, val)} disabled={result !== null} className={`h-9 w-9 rounded text-sm font-medium transition-all flex items-center justify-center border ${answers[q.id] === val ? 'bg-blue-600 border-blue-600 text-white' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-blue-500 disabled:opacity-50' : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50 disabled:bg-slate-50'}`}>
                            {val}
                          </button>
                        ))}
                      </div>
                      <span className={`text-[10px] font-semibold uppercase ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Setuju</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                {!result ? (
                  <button onClick={evaluateDecisionTreeAndSave} disabled={isAnalyzing || isSaving} className={`w-full py-3 rounded font-semibold text-white transition-all flex items-center justify-center gap-2 ${(isAnalyzing || isSaving) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99]'}`}>
                    {isAnalyzing || isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> {isSaving ? 'Menyimpan...' : 'Memproses...'}</> : <><Activity className="w-5 h-5" /> Sistem sedang memproses</>}
                  </button>
                ) : (
                  <button onClick={reset} className={`w-full py-3 rounded font-semibold transition-all flex items-center justify-center gap-2 border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-blue-400 hover:bg-slate-700' : 'bg-white border-slate-300 text-blue-600 hover:bg-slate-50'}`}>
                    Input Data Baru
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className={`sticky top-20 p-6 sm:p-8 rounded-xl border transition-colors min-h-[450px] flex flex-col ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              {!result && !isAnalyzing && (
                <div className="text-center opacity-60 flex-1 flex flex-col items-center justify-center">
                  <Network className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-slate-700' : 'text-slate-300'}`} />
                  <p className={`text-sm mt-1 max-w-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sistem akan menampilkan hasil klasifikasi dan rules yang digunakan setelah form dikirim.</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center flex-1 flex flex-col items-center justify-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                  <p className="font-semibold mb-1">Mengevaluasi...</p>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sedang menelusuri data Anda</p>
                </div>
              )}

              {result && !isAnalyzing && (
                <div className="flex-1 flex flex-col">
                  <div className="text-center mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="inline-flex items-center justify-center p-3 rounded-full mb-3 bg-opacity-10 relative" style={{ backgroundColor: `var(--color-${clusterInfo[result.clusterId].color}-500, rgba(120,120,120,0.1))` }}>
                      {clusterInfo[result.clusterId].icon}
                    </div>
                    <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Hasil Klasifikasi</p>
                    <h3 className={`text-2xl font-bold mb-1 text-${clusterInfo[result.clusterId].color}-600 dark:${clusterInfo[result.clusterId].textDark}`}>
                      Cluster {result.clusterId}
                    </h3>
                    <p className="font-semibold text-lg">{clusterInfo[result.clusterId].label}</p>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-4">
                      <GitMerge className="w-4 h-4 text-blue-500" /> Rules (Trace Route)
                    </h4>
                    <div className="space-y-2">
                      {result.rulesPassed.map((rule, idx) => (
                        <div key={idx} className={`flex items-start gap-3 p-2.5 rounded border text-xs font-medium ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                          <div className="mt-0.5 text-blue-500"><ChevronRight className="w-3.5 h-3.5" /></div>
                          <span>{rule}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className={`rounded-xl border overflow-hidden transition-colors ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <History className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <div>
                <h3 className="font-semibold">Log Sistem</h3>
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Data tersimpan secara otomatis (Real-time Database)</p>
              </div>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded border ${isDarkMode ? 'bg-blue-900/20 text-blue-400 border-blue-800/50' : 'bg-white border-slate-200 text-slate-600'}`}>
              Total {savedData.length} Data
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className={`text-xs uppercase font-semibold ${isDarkMode ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-white text-slate-500 border-b border-slate-200'}`}>
                <tr>
                  <th className="px-5 py-3">Responden</th>
                  <th className="px-5 py-3">Program Studi</th>
                  <th className="px-5 py-3 text-center">Angkatan</th>
                  <th className="px-5 py-3">Hasil Keputusan</th>
                  <th className="px-5 py-3">Waktu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {savedData.length === 0 ? (
                  <tr><td colSpan="5" className="px-5 py-8 text-center text-sm opacity-60">Belum ada data pengujian yang tersimpan.</td></tr>
                ) : (
                  savedData.map((data, index) => {
                    const timeString = data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'}) : "Menyimpan...";
                    const clusterDef = clusterInfo[data.clusterId] || clusterInfo[2];
                    return (
                      <tr key={data.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-900/80' : 'hover:bg-slate-50'} ${index === 0 && !isSaving ? (isDarkMode ? 'bg-blue-900/10' : 'bg-blue-50/30') : ''}`}>
                        <td className="px-5 py-3.5 font-medium flex items-center gap-2">
                          {index === 0 && !isSaving && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                          {data.name}
                        </td>
                        <td className={`px-5 py-3.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{data.prodi}</td>
                        <td className={`px-5 py-3.5 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>20{data.generasi}</td>
                        <td className="px-5 py-3.5"><span className={`px-2 py-1 rounded text-xs font-semibold ${isDarkMode ? `bg-${clusterDef.color}-900/20 text-${clusterDef.color}-400 border border-${clusterDef.color}-800/50` : `bg-${clusterDef.color}-50 text-${clusterDef.color}-700 border border-${clusterDef.color}-100`}`}>Cluster {data.clusterId}: {clusterDef.label}</span></td>
                        <td className={`px-5 py-3.5 text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{timeString}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}