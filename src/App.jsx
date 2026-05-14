// --- SISTEM KLASIFIKASI KOMPEN - KELOMPOK 7 ---

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { 
  Network, Moon, Sun, Activity, Users, Target, CheckCircle2, 
  MinusCircle, HelpCircle, GitMerge, Database, User, History, 
  Loader2, ChevronRight, Sparkles, Lightbulb, AlertTriangle
} from 'lucide-react';

// --- FIREBASE SETUP ---
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

// --- LIST PROGRAM STUDI ---
const prodiList = [
  "Teknik Elektronika", "Teknik Listrik", "Teknik Mesin", 
  "Teknologi Rekayasa Jaringan Telekomunikasi", "Teknologi Rekayasa Sistem Elktronika", 
  "Teknologi Rekayasa Mekatronika", "Kecerdasan buatan dan robotika", 
  "Teknik Informatika", "Sistem Informasi", "Teknologi Rekayasa Komputer", 
  "Animasi", "Akuntansi Perpajakan", 
  "Hubungan Masyarakat dan Komunikasi Digital", "Bisnis Digital"
];

// --- LIST GENERASI ---
const generasiList = ["22", "23", "24", "25"];

// --- DEFINISI CLUSTER ---
const clusterInfo = {
  0: { 
    label: "Pendukung Sistem Kompensasi", color: "emerald", bgLight: "bg-emerald-50", textDark: "text-emerald-500",
    icon: <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />,
    desc: "Anda setuju bahwa kompensasi memberikan efek jera yang positif dan terbukti mampu meningkatkan kedisiplinan mahasiswa."
  },
  1: { 
    label: "Tidak Merasakan Dampak Signifikan", color: "blue", bgLight: "bg-blue-50", textDark: "text-blue-500",
    icon: <MinusCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />,
    desc: "Anda merasa bahwa sistem kompensasi cenderung bersifat sanksi semata dan belum memberikan perubahan kebiasaan yang berarti."
  },
  2: { 
    label: "Netral / Adaptif", color: "amber", bgLight: "bg-amber-50", textDark: "text-amber-500",
    icon: <HelpCircle className="w-8 h-8 text-amber-600 dark:text-amber-400" />,
    desc: "Anda memiliki pandangan yang seimbang. Anda memahami adanya sisi positif dari kompensasi, namun juga merasa masih ada aspek yang perlu dievaluasi."
  }
};

const questions = [
  { id: 'q1', label: "Kompensasi akademik memberikan efek jera bagi saya." },
  { id: 'q2', label: "Kompensasi indisipliner memberikan efek jera bagi saya." },
  { id: 'q3', label: "Setelah mendapatkan kompensasi, saya berusaha mengurangi pelanggaran." },
  { id: 'q4', label: "Kompensasi membentuk saya menjadi lebih bertanggung jawab terhadap tugas." },
  { id: 'q5', label: "Kompensasi mendorong saya untuk lebih disiplin dalam kehadiran kelas." },
  { id: 'q6', label: "Saya lebih memilih sanksi kompensasi akademik dibandingkan indisipliner." }
];

function useCountUp(endValue, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * endValue));
      if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
  }, [endValue, duration]);
  return count;
}

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: "", prodi: "", generasi: "", gender: "" });
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedData, setSavedData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // State untuk mengontrol pop-up sukses
  const [showSuccess, setShowSuccess] = useState(false);

  // Animasi angka untuk dashboard
  const countTotal = useCountUp(107);
  const countAccuracy = useCountUp(92);
  const countLevel = useCountUp(5);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    signInAnonymously(auth).catch(error => console.error("Auth error:", error));
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'decision_tree_results'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const data = [];
      querySnapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
      setSavedData(data);
    }, (error) => console.error("Error fetching data:", error));
    return () => unsubscribe();
  }, [user]);

  const handleFormChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleAnswer = (questionId, value) => setAnswers(prev => ({ ...prev, [questionId]: value }));

  const evaluateDecisionTreeAndSave = () => {
    if (!formData.name.trim() || !formData.prodi || !formData.generasi || !formData.gender) {
      setResult({ error: "Mohon lengkapi seluruh kolom identitas responden (Nama, Program Studi, Angkatan, dan Jenis Kelamin)." });
      setTimeout(() => setResult(null), 4000);
      return;
    }
    if (Object.keys(answers).length < questions.length) {
      setResult({ error: "Mohon berikan penilaian pada skala 1-5 untuk seluruh pernyataan kuesioner yang tersedia." });
      setTimeout(() => setResult(null), 4000);
      return;
    }

    setIsAnalyzing(true);
    
    setTimeout(async () => {
      const { q1, q2, q3, q4, q5, q6 } = answers;
      let cluster = null;
      let path = [];

      if (q1 <= 3.5) {
        path.push("Efek Jera Akademik rendah (<= 3.5) → YA");
        if (q2 <= 3.5) {
          path.push("Efek Jera Indisipliner rendah (<= 3.5) → YA");
          if (q3 <= 2.5) {
            path.push("Tingkat Pengurangan Pelanggaran sangat rendah (<= 2.5) → YA"); cluster = 1; 
          } else {
            path.push("Tingkat Pengurangan Pelanggaran sangat rendah (<= 2.5) → TIDAK");
            if (q4 <= 3.5) {
              path.push("Peningkatan Tanggung Jawab rendah (<= 3.5) → YA");
              if (q5 <= 1.5) { path.push("Peningkatan Disiplin Hadir sangat rendah (<= 1.5) → YA"); cluster = 1; } 
              else { path.push("Peningkatan Disiplin Hadir sangat rendah (<= 1.5) → TIDAK"); cluster = 2; }
            } else {
              path.push("Peningkatan Tanggung Jawab rendah (<= 3.5) → TIDAK"); cluster = 1;
            }
          }
        } else {
          path.push("Efek Jera Indisipliner rendah (<= 3.5) → TIDAK");
          if (q6 <= 3.5) {
            path.push("Preferensi Pemilihan Kompen Akademik rendah (<= 3.5) → YA");
            if (q4 <= 4.5) { path.push("Peningkatan Tanggung Jawab menengah (<= 4.5) → YA"); cluster = 2; } 
            else { path.push("Peningkatan Tanggung Jawab menengah (<= 4.5) → TIDAK"); cluster = 0; }
          } else {
            path.push("Preferensi Pemilihan Kompen Akademik rendah (<= 3.5) → TIDAK");
            if (q5 <= 3.5) { path.push("Peningkatan Disiplin Hadir rendah (<= 3.5) → YA"); cluster = 2; } 
            else { path.push("Peningkatan Disiplin Hadir rendah (<= 3.5) → TIDAK"); cluster = 0; }
          }
        }
      } else {
        path.push("Efek Jera Akademik rendah (<= 3.5) → TIDAK");
        if (q3 <= 3.5) {
          path.push("Tingkat Pengurangan Pelanggaran menengah (<= 3.5) → YA"); cluster = 2;
        } else {
          path.push("Tingkat Pengurangan Pelanggaran menengah (<= 3.5) → TIDAK");
          if (q4 <= 3.5) { path.push("Peningkatan Tanggung Jawab rendah (<= 3.5) → YA"); cluster = 2; } 
          else { path.push("Peningkatan Tanggung Jawab rendah (<= 3.5) → TIDAK"); cluster = 0; }
        }
      }

      setResult({ clusterId: cluster, rulesPassed: path });
      setIsAnalyzing(false);

      if (user) {
        setIsSaving(true);
        try {
          await addDoc(collection(db, 'decision_tree_results'), {
            name: formData.name,
            prodi: formData.prodi,
            generasi: formData.generasi,
            gender: formData.gender,
            clusterId: cluster,
            clusterLabel: clusterInfo[cluster].label,
            answers: answers,
            userId: user.uid,
            timestamp: serverTimestamp()
          });
          setShowSuccess(true);
        } catch (error) {
          console.error("Gagal menyimpan:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1200);
  };

  const reset = () => {
    setAnswers({});
    setResult(null);
    setFormData({ name: "", prodi: "", generasi: "", gender: "" });
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 relative overflow-hidden ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Background Animasi Elegan (Blob) */}
      <div className="absolute top-0 left-0 w-full h-[600px] md:h-[800px] overflow-hidden pointer-events-none z-0" style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}>
        <div className={`absolute top-[-5%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse ${isDarkMode ? 'bg-indigo-900' : 'bg-blue-200'}`}></div>
        <div className={`absolute top-[10%] right-[-10%] w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700 ${isDarkMode ? 'bg-purple-900' : 'bg-indigo-200'}`}></div>
      </div>

      {/* Pop-up Sukses Disimpan */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`max-w-sm w-full p-8 rounded-3xl shadow-2xl text-center border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className={`inline-flex items-center justify-center p-4 rounded-full mb-5 ${isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className={`text-2xl font-extrabold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Terima Kasih!
            </h3>
            <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              Respons pengujian Anda telah berhasil disimpan ke dalam database sistem kami.
            </p>
            <button 
              onClick={() => setShowSuccess(false)} 
              className="w-full px-5 py-3.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              Tutup Pesan
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-colors ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/70 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-1.5 sm:p-2 rounded-xl shadow-sm text-white">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-extrabold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
              KompenTree AI
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-inner ${isDarkMode ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span className="truncate max-w-[120px] sm:max-w-none">Politeknik Caltex Riau</span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 sm:p-2.5 rounded-full transition-all hover:scale-110 shadow-sm shrink-0 ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-white text-slate-600 border border-slate-200'}`}>
              {isDarkMode ? <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 relative z-10">
        
        {/* Header Teks Komunikatif */}
        <section className="text-center max-w-3xl mx-auto pt-4 pb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 border bg-white/50 backdrop-blur-md shadow-sm border-slate-200 dark:border-slate-800 dark:bg-slate-800/50 dark:text-blue-400 text-blue-600">
            <Sparkles className="w-4 h-4" /> Riset Mata Kuliah Artificial Intelligence
          </div>
          <h1 className={`text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Klasifikasi Persepsi <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">Kompensasi</span> Mahasiswa
          </h1>
          <p className={`text-base sm:text-lg leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Silakan lengkapi kuesioner di bawah ini. Sistem kami akan menganalisis perspektif anda terkait efektivitas kebijakan kedisiplinan di lingkungan kampus.
          </p>
        </section>

        {/* Dashboard Angka dgn Hover & Animasi */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {[
            { title: "Total Data Training", icon: Users, count: countTotal, color: "blue" },
            { title: "Total Responden", icon: Database, count: savedData.length, color: "indigo", highlight: true },
            { title: "Level Model", icon: GitMerge, count: countLevel, color: "emerald", suffix: " Level" },
            { title: "Akurasi Klasifikasi", icon: Target, count: countAccuracy, color: "amber", suffix: "%" }
          ].map((item, idx) => (
            <div key={idx} className={`p-5 rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDarkMode ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600 shadow-lg shadow-black/20' : 'bg-white/80 border-slate-200 hover:border-blue-200 shadow-lg shadow-slate-200/50 backdrop-blur-md'}`}>
              <div className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase mb-3 flex items-center justify-between">
                {item.title} <item.icon className={`w-4 h-4 text-${item.color}-500`} />
              </div>
              <div className={`text-3xl font-black tracking-tight ${item.highlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>
                {item.count}{item.suffix || ''}
              </div>
            </div>
          ))}
        </section>

        {/* Kotak Form & Kuesioner */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          <div className="lg:col-span-7 space-y-6">
            <div className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 hover:shadow-lg ${isDarkMode ? 'bg-slate-800/80 border-slate-700 backdrop-blur-xl' : 'bg-white/80 border-slate-200 shadow-xl shadow-slate-200/40 backdrop-blur-xl'}`}>
              
              {result && result.error && (
                <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-red-900/30 text-red-400 border border-red-900/50' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold">{result.error}</p>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-2xl font-extrabold mb-2">Form Pengujian Sistem</h2>
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Data anda akan digunakan murni untuk keperluan riset pengujian model Decision Tree kami.
                </p>
              </div>

              {/* Form Data Diri */}
              <div className={`mb-8 p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-slate-50 border-slate-100'}`}>
                <div className="flex items-center gap-2 mb-4 border-b pb-2 border-slate-200 dark:border-slate-700">
                  <User className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  <h3 className="font-extrabold text-base">Informasi Responden</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nama Lengkap</label>
                    <input type="text" name="name" value={formData.name} onChange={handleFormChange} disabled={result !== null && !result.error} placeholder="Masukkan nama Anda" className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 disabled:opacity-50' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 disabled:bg-slate-100'}`}/>
                  </div>
                  <div className="md:col-span-2">
                    <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Program Studi</label>
                    <select name="prodi" value={formData.prodi} onChange={handleFormChange} disabled={result !== null && !result.error} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white disabled:opacity-50' : 'bg-white border-slate-200 text-slate-900 disabled:bg-slate-100'}`}>
                      <option value="" disabled>Pilih program studi...</option>
                      {prodiList.map((prodi, idx) => <option key={idx} value={prodi}>{prodi}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tahun Angkatan</label>
                    <select name="generasi" value={formData.generasi} onChange={handleFormChange} disabled={result !== null && !result.error} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white disabled:opacity-50' : 'bg-white border-slate-200 text-slate-900 disabled:bg-slate-100'}`}>
                      <option value="" disabled>Pilih angkatan...</option>
                      {generasiList.map((gen, idx) => <option key={idx} value={gen}>Angkatan 20{gen}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Jenis Kelamin</label>
                    <select name="gender" value={formData.gender} onChange={handleFormChange} disabled={result !== null && !result.error} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white disabled:opacity-50' : 'bg-white border-slate-200 text-slate-900 disabled:bg-slate-100'}`}>
                      <option value="" disabled>Pilih jenis kelamin...</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Kuesioner Skala Likert */}
              <div className="space-y-6">
                {questions.map((q, index) => (
                  <div key={q.id} className="pb-6 border-b border-slate-100 dark:border-slate-700/50 last:border-0 group">
                    <p className="font-semibold text-sm sm:text-base mb-5 leading-relaxed transition-colors group-hover:text-indigo-500 dark:group-hover:text-indigo-400">
                      <span className="text-slate-400 mr-1">{index + 1}.</span> {q.label}
                    </p>
                    
                    <div className="w-full max-w-lg mx-auto sm:mx-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                      
                      {/* Label Mobile (Muncul di atas tombol khusus HP) */}
                      <div className="flex justify-between w-full sm:hidden px-1">
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest text-left leading-tight ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sangat<br/>Tidak Setuju</span>
                        <span className={`text-[10px] font-extrabold uppercase tracking-widest text-right leading-tight ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sangat<br/>Setuju</span>
                      </div>

                      {/* Label Desktop Kiri */}
                      <span className={`hidden sm:block w-20 text-[10px] font-extrabold uppercase tracking-widest text-left leading-tight shrink-0 mr-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Sangat<br/>Tidak Setuju
                      </span>
                      
                      {/* Tombol Angka 1-5 */}
                      <div className="flex justify-between w-full sm:w-auto gap-2 sm:gap-3 shrink-0 px-2 sm:px-0">
                        {[1, 2, 3, 4, 5].map(val => (
                          <button key={val} onClick={() => handleAnswer(q.id, val)} disabled={result !== null && !result.error} className={`h-10 w-10 sm:h-11 sm:w-11 rounded-full text-sm font-extrabold transition-all duration-200 flex items-center justify-center border-2 shrink-0 ${answers[q.id] === val ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/40 scale-110' : isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:border-indigo-500 disabled:opacity-30' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-40'}`}>
                            {val}
                          </button>
                        ))}
                      </div>

                      {/* Label Desktop Kanan */}
                      <span className={`hidden sm:block w-20 text-[10px] font-extrabold uppercase tracking-widest text-right leading-tight shrink-0 ml-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        Sangat<br/>Setuju
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tombol Utama */}
              <div className="mt-8 pt-4">
                {(!result || result.error) ? (
                  <button onClick={evaluateDecisionTreeAndSave} disabled={isAnalyzing || isSaving} className={`w-full py-4 rounded-2xl font-extrabold text-white text-base transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${(isAnalyzing || isSaving) ? 'bg-indigo-400 shadow-none cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-indigo-500/30 hover:-translate-y-1'}`}>
                    {isAnalyzing || isSaving ? <><Loader2 className="w-5 h-5 animate-spin" /> {isSaving ? 'Menyimpan data ke sistem...' : 'Mengeksekusi model AI...'}</> : <><Sparkles className="w-5 h-5" /> Klasifikasikan</>}
                  </button>
                ) : (
                  <button onClick={reset} className={`w-full py-4 rounded-2xl font-extrabold transition-all duration-300 flex items-center justify-center gap-2 border-2 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-indigo-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50 hover:border-indigo-200 hover:-translate-y-1'}`}>
                    Lakukan Pengujian Baru
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Kotak Hasil & Penjelasan */}
          <div className="lg:col-span-5 relative">
            <div className={`sticky top-24 p-6 sm:p-8 rounded-3xl border transition-all duration-500 min-h-[500px] flex flex-col hover:shadow-lg ${isDarkMode ? 'bg-slate-800/80 border-slate-700 backdrop-blur-xl' : 'bg-white/80 border-slate-200 shadow-xl shadow-slate-200/40 backdrop-blur-xl'}`}>
              
              {(!result || result.error) && !isAnalyzing && (
                <div className="text-center opacity-60 flex-1 flex flex-col items-center justify-center">
                  <div className={`p-4 rounded-full mb-4 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <Activity className={`w-12 h-12 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`} />
                  </div>
                  <p className="font-bold text-lg">Hasil Klasifikasi</p>
                  <p className={`text-sm mt-2 max-w-xs leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Sistem akan menampilkan hasil klasifikasi beserta aturan (rules based) setelah pengisian form selesai.</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center flex-1 flex flex-col items-center justify-center animate-in zoom-in duration-300">
                  <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
                  <p className="font-extrabold text-xl mb-2">Memproses Data...</p>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Mengevaluasi parameter untuk penentuan klasifikasi.</p>
                </div>
              )}

              {result && !result.error && !isAnalyzing && (
                <div className="flex-1 flex flex-col animate-in slide-in-from-right-8 fade-in duration-500">
                  
                  {/* Bagian Hasil Besar */}
                  <div className="text-center mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
                    <p className={`text-xs font-extrabold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>Hasil Klasifikasi Sistem:</p>
                    <div className="inline-flex items-center justify-center p-4 rounded-full mb-4 bg-opacity-20 relative animate-bounce shadow-lg" style={{ backgroundColor: `var(--color-${clusterInfo[result.clusterId].color}-500, rgba(120,120,120,0.1))` }}>
                      {clusterInfo[result.clusterId].icon}
                    </div>
                    <h3 className={`text-3xl font-black mb-2 text-${clusterInfo[result.clusterId].color}-600 dark:${clusterInfo[result.clusterId].textDark}`}>
                      Cluster {result.clusterId}
                    </h3>
                    <p className={`text-lg font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                      {clusterInfo[result.clusterId].label}
                    </p>
                    <p className={`text-sm font-medium leading-relaxed px-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{clusterInfo[result.clusterId].desc}</p>
                  </div>

                  {/* Penjelasan Edukatif AI */}
                  <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 ${isDarkMode ? 'bg-blue-900/20 border border-blue-900/50' : 'bg-blue-50 border border-blue-100'}`}>
                    <Lightbulb className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className={`text-xs font-bold mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Bagaimana Sistem Kami Menentukan Hasil Ini?</p>
                      <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Model algoritma (Decision Tree) kami mengevaluasi matriks respons anda tahap demi tahap berdasarkan parameter pola data training dari 107 mahasiswa lainnya. Berikut adalah penelusuran logika (Trace Route) sistem:</p>
                    </div>
                  </div>

                  {/* Jejak Rules */}
                  <div className="flex-1">
                    <h4 className="text-sm font-extrabold flex items-center gap-2 mb-4">
                      <GitMerge className="w-4 h-4 text-indigo-500" /> Hasil Eksekusi Logika (Trace Route)
                    </h4>
                    <div className="space-y-2.5">
                      {result.rulesPassed.map((rule, idx) => (
                        <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border text-xs font-semibold shadow-sm transition-all hover:translate-x-1 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-500' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'}`}>
                          <div className="mt-0.5 text-indigo-500"><ChevronRight className="w-4 h-4" /></div>
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

        {/* Tabel Data */}
        <section className={`rounded-3xl border overflow-hidden transition-all duration-300 hover:shadow-xl ${isDarkMode ? 'bg-slate-800/80 border-slate-700 backdrop-blur-xl shadow-black/20' : 'bg-white/80 border-slate-200 shadow-slate-200/50 backdrop-blur-xl'}`}>
          <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50/80 border-slate-200'}`}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg">Log Pengujian Sistem Terkini</h3>
                <p className={`text-xs font-medium mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Data di bawah ini tersimpan secara otomatis (Realtime Database)</p>
              </div>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm ${isDarkMode ? 'bg-slate-800 text-indigo-400 border-slate-700' : 'bg-white border-slate-200 text-indigo-600'}`}>
              Total {savedData.length} Responden
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className={`text-xs uppercase font-extrabold tracking-wider ${isDarkMode ? 'bg-slate-900/80 text-slate-400 border-b border-slate-700' : 'bg-white text-slate-500 border-b border-slate-200'}`}>
                <tr>
                  <th className="px-6 py-4">Nama Lengkap</th>
                  <th className="px-6 py-4">Jurusan</th>
                  <th className="px-6 py-4 text-center">Angkatan</th>
                  <th className="px-6 py-4 text-center">L/P</th>
                  <th className="px-6 py-4">Kategori Klasifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {savedData.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-10 text-center font-medium opacity-50">Belum ada riwayat pengujian yang terekam pada sistem.</td></tr>
                ) : (
                  savedData.map((data, index) => {
                    const clusterDef = clusterInfo[data.clusterId] || clusterInfo[2];
                    const isNew = index === 0 && !isSaving;
                    return (
                      <tr key={data.id} className={`transition-colors group ${isDarkMode ? 'hover:bg-slate-700/30' : 'hover:bg-slate-50'} ${isNew ? (isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50/50') : ''}`}>
                        <td className="px-6 py-4 font-bold flex items-center gap-3">
                          {isNew && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>}
                          {data.name}
                        </td>
                        <td className={`px-6 py-4 font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                          {data.prodi}
                        </td>
                        <td className={`px-6 py-4 text-center font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          20{data.generasi}
                        </td>
                        <td className={`px-6 py-4 text-center font-bold ${data.gender === 'Laki-laki' ? 'text-blue-500' : 'text-pink-500'}`}>
                          {data.gender === 'Laki-laki' ? 'L' : data.gender === 'Perempuan' ? 'P' : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm border ${isDarkMode ? `bg-${clusterDef.color}-900/30 text-${clusterDef.color}-400 border-${clusterDef.color}-800/50` : `bg-${clusterDef.color}-50 text-${clusterDef.color}-700 border-${clusterDef.color}-200`}`}>
                            Cluster {data.clusterId}: {clusterDef.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Footer Akademik */}
      <footer className={`border-t mt-12 py-8 transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-950 text-slate-500' : 'border-slate-200 bg-white text-slate-500'}`}>
        <div className="max-w-6xl mx-auto px-4 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-semibold tracking-wide">
            © {new Date().getFullYear()} Artificial Intelligence - Kelompok 7
          </p>
          <p className="text-xs">
            Politeknik Caltex Riau. Dibuat khusus untuk keperluan tugas dan riset.
          </p>
        </div>
      </footer>
    </div>
  );
}