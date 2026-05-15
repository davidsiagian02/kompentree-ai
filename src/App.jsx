import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, serverTimestamp
} from 'firebase/firestore';
import { 
  Network, Moon, Sun, Activity, Users, Target, CheckCircle2, 
  MinusCircle, HelpCircle, GitMerge, Database, User, History, 
  Loader2, ChevronRight, Sparkles, Lightbulb, AlertTriangle,
  Home, FileText, LayoutDashboard, ArrowRight, PieChart, BrainCircuit
} from 'lucide-react';

// SETUP FIREBASE
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
    label: "Pendukung Sistem Kompensasi", color: "emerald",
    icon: <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" />,
    desc: "Anda setuju bahwa kompensasi memberikan efek jera yang positif dan terbukti mampu meningkatkan kedisiplinan mahasiswa."
  },
  1: { 
    label: "Tidak Merasakan Dampak Signifikan", color: "blue",
    icon: <MinusCircle className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />,
    desc: "Anda merasa bahwa sistem kompensasi cenderung bersifat sanksi semata dan belum memberikan perubahan kebiasaan yang berarti."
  },
  2: { 
    label: "Netral / Adaptif", color: "amber",
    icon: <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-amber-400" />,
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

// Custom Hook untuk Animasi Angka
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [formData, setFormData] = useState({ name: "", prodi: "", generasi: "", gender: "" });
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [savedData, setSavedData] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // State untuk Fitur Paginasi Tabel
  const [currentTablePage, setCurrentTablePage] = useState(1);
  const itemsPerPage = 10;

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

  // Efek untuk reset page jika total page berkurang
  useEffect(() => {
    const maxPage = Math.ceil(savedData.length / itemsPerPage);
    if (currentTablePage > maxPage && maxPage > 0) {
      setCurrentTablePage(maxPage);
    }
  }, [savedData.length, currentTablePage, itemsPerPage]);

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
          if (q4 <= 3.5) { path.push("Peningkatan Tanggung Jawab rendah (<= 3.5) → BENAR"); cluster = 2; } 
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
          // Saat berhasil mengisi data, kembalikan tabel ke halaman 1
          setCurrentTablePage(1);
        } catch (error) {
          console.error("Gagal menyimpan:", error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 1500); 
  };

  const resetAndGoToForm = () => {
    setAnswers({});
    setResult(null);
    setFormData({ name: "", prodi: "", generasi: "", gender: "" });
    setCurrentPage('form');
  };

  const handleGoToDashboard = () => {
    setShowSuccess(false);
    setCurrentPage('dashboard');
  };

  // Kalkulasi Smart Dashboard
  const totalResp = savedData.length;
  const c0Count = savedData.filter(d => d.clusterId === 0).length;
  const c1Count = savedData.filter(d => d.clusterId === 1).length;
  const c2Count = savedData.filter(d => d.clusterId === 2).length;

  const c0Pct = totalResp > 0 ? (c0Count / totalResp) * 100 : 0;
  const c1Pct = totalResp > 0 ? (c1Count / totalResp) * 100 : 0;
  const c2Pct = totalResp > 0 ? (c2Count / totalResp) * 100 : 0;

  const gradientString = totalResp > 0
    ? `conic-gradient(#10b981 0% ${c0Pct}%, #3b82f6 ${c0Pct}% ${c0Pct + c1Pct}%, #f59e0b ${c0Pct + c1Pct}% 100%)`
    : (isDarkMode ? `conic-gradient(#1e293b 0% 100%)` : `conic-gradient(#e2e8f0 0% 100%)`);

  // Data Tabel Paginasi
  const totalPages = Math.ceil(savedData.length / itemsPerPage);
  const indexOfLastItem = currentTablePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = savedData.slice(indexOfFirstItem, indexOfLastItem);

  // --- KOMPONEN BANTUAN CSS ---
  const glassPanelClass = isDarkMode 
    ? "bg-slate-900/60 border-slate-700/50 backdrop-blur-xl shadow-2xl shadow-black/40" 
    : "bg-white/70 border-white/60 backdrop-blur-xl shadow-xl shadow-blue-900/5";

  // --- RENDER HALAMAN ---
  const renderLandingPage = () => (
    <div className="flex flex-col items-center justify-center py-10 sm:py-20 animate-in fade-in zoom-in-95 duration-700 relative z-10 px-4">
      
      {/* --- SECTION LOGO PCR & IDEAL --- */}
      <div className="flex flex-col items-center justify-center w-full px-4 mb-6 sm:mb-10 animate-in fade-in slide-in-from-top-10 duration-1000">
        <div className={`group flex flex-col items-center justify-center p-3 sm:p-4 gap-2 sm:gap-3 w-auto rounded-[1rem] sm:rounded-[1.5rem] transition-all duration-500 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] ${isDarkMode ? 'bg-white/5 backdrop-blur-xl border border-white/10' : 'bg-white/60 backdrop-blur-xl border border-slate-200 shadow-lg shadow-slate-200/50'}`}>
          
          <img 
            src="/logo-utama.png" 
            alt="Akreditasi Unggul Politeknik Caltex Riau" 
            className="h-8 sm:h-9 md:h-11 w-auto object-contain rounded-md sm:rounded-lg mix-blend-multiply dark:mix-blend-normal transition-transform duration-500 group-hover:scale-105"
          />
          
          <div className={`w-3/4 h-[1px] rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>

          <img 
            src="/ideal.png" 
            alt="Nilai Inti IDEAL PCR" 
            className="h-3 sm:h-4 md:h-5 w-auto object-contain drop-shadow-sm filter contrast-125 transition-transform duration-500 group-hover:scale-105"
          />
          
        </div>
      </div>

      {/* Badge Atas */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 sm:px-5 sm:py-2.5 rounded-full text-[10px] sm:text-xs font-bold mb-8 sm:mb-10 border transition-transform hover:scale-105 ${isDarkMode ? 'bg-indigo-950/50 border-indigo-500/30 text-indigo-300' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
        <BrainCircuit className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> AI Research Project • Kelompok 7
      </div>
      
      {/* Judul Utama */}
      <h1 className="text-3xl sm:text-6xl md:text-7xl font-black mb-6 sm:mb-8 tracking-tighter leading-tight text-center max-w-5xl relative">
        <span className={`block ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Sistem Klasifikasi</span>
        <span className="relative inline-block mt-1 sm:mt-2">
          <span className="absolute -inset-1 blur-lg sm:blur-xl opacity-30 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></span>
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
            Persepsi Kompensasi
          </span>
        </span>
      </h1>
      
      <p className={`text-base sm:text-xl leading-relaxed text-center max-w-3xl mb-10 sm:mb-14 font-medium px-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
        Sistem cerdas kami akan menganalisis perspektif anda terkait efektivitas kebijakan kedisiplinan di lingkungan kampus secara (real-time).
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 w-full sm:w-auto mb-10 sm:mb-16">
        <button 
          onClick={() => setCurrentPage('form')}
          className="group relative px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl font-extrabold text-white text-base sm:text-lg transition-all duration-300 bg-indigo-600 hover:bg-indigo-500 w-full sm:w-auto overflow-hidden shadow-lg shadow-indigo-500/30"
        >
          <div className="absolute inset-0 w-1/4 h-full bg-white/20 skew-x-[-20deg] group-hover:animate-[shine_1.5s_ease-in-out_infinite] -translate-x-[200%]"></div>
          <span className="relative flex items-center justify-center gap-2 sm:gap-3">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" /> Mulai Klasifikasi
          </span>
        </button>
        <button 
          onClick={() => setCurrentPage('dashboard')}
          className={`px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl font-extrabold text-base sm:text-lg transition-all duration-300 flex items-center justify-center gap-2 sm:gap-3 border w-full sm:w-auto ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-white/50 border-slate-300 text-slate-700 hover:bg-white hover:text-indigo-600'}`}
        >
          <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" /> Lihat Dashboard
        </button>
      </div>
      
    </div>
  );

  const renderFormPage = () => (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 animate-in slide-in-from-bottom-8 fade-in duration-500 relative z-10 px-4 sm:px-6">
      
      <div className="text-center mb-8 sm:mb-10">
        <h2 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-2 sm:mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Form Klasifikasi Kompen</h2>
        <p className={`text-xs sm:text-base font-medium px-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Data anda akan digunakan murni untuk keperluan riset pengujian sistem Decision Tree kami.
        </p>
      </div>

      <div className={`p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-500 ${glassPanelClass}`}>
        
        {result && result.error && (
          <div className={`mb-6 sm:mb-8 p-4 sm:p-5 rounded-xl sm:rounded-2xl flex items-start gap-3 sm:gap-4 border animate-in fade-in slide-in-from-top-2 ${isDarkMode ? 'bg-red-950/50 border-red-900/50 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-bold leading-relaxed">{result.error}</p>
          </div>
        )}

        <div className={`mb-8 sm:mb-10 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50/60 border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
              <User className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className={`font-extrabold text-base sm:text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Profil Responden</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className={`block text-[10px] sm:text-[11px] font-black mb-1.5 sm:mb-2 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Nama Lengkap</label>
              <input type="text" name="name" value={formData.name} onChange={handleFormChange} disabled={result !== null && !result.error} placeholder="Masukkan nama..." className={`w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600 disabled:opacity-40' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 disabled:bg-slate-100'}`}/>
            </div>
            <div className="sm:col-span-2">
              <label className={`block text-[10px] sm:text-[11px] font-black mb-1.5 sm:mb-2 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Program Studi</label>
              <select name="prodi" value={formData.prodi} onChange={handleFormChange} disabled={result !== null && !result.error} className={`w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-white disabled:opacity-40' : 'bg-white border-slate-200 text-slate-900 disabled:bg-slate-100'}`}>
                <option value="" disabled>Pilih program studi...</option>
                {prodiList.map((prodi, idx) => <option key={idx} value={prodi}>{prodi}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-[10px] sm:text-[11px] font-black mb-1.5 sm:mb-2 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Angkatan</label>
              <select name="generasi" value={formData.generasi} onChange={handleFormChange} disabled={result !== null && !result.error} className={`w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-white disabled:opacity-40' : 'bg-white border-slate-200 text-slate-900 disabled:bg-slate-100'}`}>
                <option value="" disabled>Pilih angkatan...</option>
                {generasiList.map((gen, idx) => <option key={idx} value={gen}>20{gen}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-[10px] sm:text-[11px] font-black mb-1.5 sm:mb-2 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Jenis Kelamin</label>
              <select name="gender" value={formData.gender} onChange={handleFormChange} disabled={result !== null && !result.error} className={`w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-white disabled:opacity-40' : 'bg-white border-slate-200 text-slate-900 disabled:bg-slate-100'}`}>
                <option value="" disabled>Pilih identitas...</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <h3 className={`font-extrabold text-base sm:text-lg px-1 sm:px-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Evaluasi Kebijakan</h3>
          {questions.map((q, index) => (
            <div key={q.id} className={`p-5 sm:p-8 rounded-2xl sm:rounded-3xl border transition-all duration-300 group ${isDarkMode ? 'bg-slate-900/30 border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-900/60' : 'bg-white/50 border-slate-200 hover:border-indigo-300 hover:bg-white'}`}>
              <p className={`font-semibold text-sm sm:text-lg mb-5 sm:mb-8 leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                <span className="text-indigo-500 font-black mr-2">Q{index + 1}.</span> {q.label}
              </p>
              
              <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                
                <div className="flex justify-between w-full sm:hidden px-1">
                  <span className={`text-[9px] font-black uppercase tracking-widest text-left ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sangat<br/>Tidak Setuju</span>
                  <span className={`text-[9px] font-black uppercase tracking-widest text-right ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sangat<br/>Setuju</span>
                </div>

                <span className={`hidden sm:block w-20 text-[10px] font-black uppercase tracking-widest text-left leading-tight shrink-0 mr-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Sangat<br/>Tidak Setuju
                </span>
                
                <div className="flex justify-between w-full sm:w-auto gap-1 sm:gap-4 shrink-0 relative px-0 sm:px-0">
                  <div className={`hidden sm:block absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 z-0 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                  
                  {[1, 2, 3, 4, 5].map(val => (
                    <button 
                      key={val} 
                      onClick={() => handleAnswer(q.id, val)} 
                      disabled={result !== null && !result.error} 
                      className={`relative z-10 h-10 w-10 sm:h-14 sm:w-14 rounded-full text-sm sm:text-lg font-black transition-all duration-300 flex items-center justify-center shrink-0 border-[2px] sm:border-[3px] 
                        ${answers[q.id] === val 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110' 
                          : isDarkMode 
                            ? 'bg-slate-900 border-slate-700 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-30' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 disabled:opacity-40'}`}
                    >
                      {val}
                    </button>
                  ))}
                </div>

                <span className={`hidden sm:block w-20 text-[10px] font-black uppercase tracking-widest text-right leading-tight shrink-0 ml-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Sangat<br/>Setuju
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 sm:mt-12">
          {(!result || result.error) ? (
            <button 
              onClick={evaluateDecisionTreeAndSave} 
              disabled={isAnalyzing || isSaving} 
              className={`w-full py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-extrabold text-white text-base sm:text-lg transition-all duration-500 flex items-center justify-center gap-2 sm:gap-3 overflow-hidden relative group
                ${(isAnalyzing || isSaving) 
                  ? 'bg-slate-800 cursor-not-allowed text-slate-400' 
                  : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] hover:-translate-y-1'}`}
            >
               {!(isAnalyzing || isSaving) && <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-[100%] group-hover:animate-[shine_2s_ease-in-out_infinite]"></div>}
              {isAnalyzing || isSaving ? (
                <><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-indigo-500" /> {isSaving ? 'Menyinkronkan...' : 'Menganalisis...'}</>
              ) : (
                <><BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6" /> Klasifikasikan</>
              )}
            </button>
          ) : (
            <button onClick={resetAndGoToForm} className={`w-full py-4 sm:py-5 rounded-2xl sm:rounded-[2rem] font-extrabold transition-all duration-300 flex items-center justify-center gap-2 border-2 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-indigo-400 hover:bg-slate-800' : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-50'}`}>
              Reset Form
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDashboardPage = () => (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-500 py-6 relative z-10 px-4 sm:px-6">
      
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {[
          { title: "Total Data", icon: Users, count: countTotal, color: "blue", hex: "text-blue-500" },
          { title: "Total Responden", icon: Database, count: savedData.length, color: "indigo", highlight: true, hex: "text-indigo-400" },
          { title: "Level Model", icon: GitMerge, count: countLevel, color: "emerald", suffix: " Lvl", hex: "text-emerald-500" },
          { title: "Akurasi Model", icon: Target, count: countAccuracy, color: "amber", suffix: "%", hex: "text-amber-500" }
        ].map((item, idx) => (
          <div key={idx} className={`relative p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] border overflow-hidden group transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${glassPanelClass}`}>
            <div className={`absolute -top-10 -right-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full opacity-10 filter blur-2xl transition-all group-hover:opacity-30 bg-${item.color}-500`}></div>
            <div className={`text-[9px] sm:text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {item.title} 
              <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <item.icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 ${item.hex}`} />
              </div>
            </div>
            <div className={`text-2xl sm:text-4xl lg:text-5xl font-black tracking-tighter ${item.highlight ? 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500' : (isDarkMode ? 'text-white' : 'text-slate-800')}`}>
              {item.count}{item.suffix || ''}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start">
        
        <div className={`${result && !result.error ? 'xl:col-span-7' : 'xl:col-span-12'} space-y-6 sm:space-y-8 transition-all duration-700`}>
          
          <section className={`rounded-3xl sm:rounded-[2.5rem] border overflow-hidden transition-all duration-500 ${glassPanelClass}`}>
            <div className={`p-5 sm:p-8 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/40 border-slate-200'}`}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                  <PieChart className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className={`font-black text-lg sm:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Smart Dashboard</h3>
                  <p className={`text-xs sm:text-sm font-semibold mt-0.5 sm:mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Pembagian kelompok responden secara otomatis.</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 sm:p-10 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
              <div className="relative flex items-center justify-center w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-full shrink-0 shadow-lg transition-all duration-1000" style={{ background: gradientString }}>
                <div className={`w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full flex flex-col items-center justify-center shadow-inner ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                  <p className={`text-[10px] sm:text-xs font-black uppercase tracking-widest mb-0.5 sm:mb-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Total Data</p>
                  <p className={`text-4xl sm:text-5xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{totalResp}</p>
                </div>
              </div>

              <div className="flex-1 w-full max-w-md space-y-3 sm:space-y-4">
                {[
                  { id: 0, label: clusterInfo[0].label, count: c0Count, pct: c0Pct, hex: '#10b981', bg: 'bg-emerald-500', text: 'text-emerald-400' },
                  { id: 1, label: clusterInfo[1].label, count: c1Count, pct: c1Pct, hex: '#3b82f6', bg: 'bg-blue-500', text: 'text-blue-400' },
                  { id: 2, label: clusterInfo[2].label, count: c2Count, pct: c2Pct, hex: '#f59e0b', bg: 'bg-amber-500', text: 'text-amber-400' }
                ].map(item => (
                  <div key={item.id} className={`flex items-center justify-between p-3 sm:p-5 rounded-xl sm:rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-950/50 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-1.5 h-8 sm:h-10 rounded-full ${item.bg}`}></div>
                      <div>
                        <p className={`text-xs sm:text-sm font-black tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Cluster {item.id}</p>
                        <p className={`text-[10px] sm:text-xs font-semibold mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg sm:text-xl font-black tracking-tight ${isDarkMode ? item.text : 'text-slate-800'}`}>{item.pct.toFixed(1)}%</p>
                      <p className={`text-[10px] sm:text-xs font-bold mt-0.5 opacity-60 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{item.count} Orang</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={`rounded-3xl sm:rounded-[2.5rem] border overflow-hidden transition-all duration-500 shadow-xl flex flex-col ${glassPanelClass}`}>
            <div className={`p-5 sm:p-8 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-5 shrink-0 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/40 border-slate-200'}`}>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl ${isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  <History className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className={`font-black text-lg sm:text-xl tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Log Pengujian Sistem</h3>
                  <p className={`text-xs sm:text-sm font-semibold mt-0.5 sm:mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Data di bawah ini tersimpan secara otomatis secara (real-time).</p>
                </div>
              </div>
              <button onClick={() => setCurrentPage('form')} className="px-4 py-2.5 sm:px-5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 text-white transition-all active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto">
                <Users className="w-4 h-4"/> Input Form Baru
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">
                <thead className={`uppercase font-black tracking-widest ${isDarkMode ? 'bg-slate-950/50 text-slate-500 border-b border-slate-800' : 'bg-slate-50 text-slate-500 border-b border-slate-200'}`}>
                  <tr>
                    <th className="px-4 py-4 sm:px-6 sm:py-5">Nama Lengkap</th>
                    <th className="px-4 py-4 sm:px-6 sm:py-5">Jurusan</th>
                    <th className="px-4 py-4 sm:px-6 sm:py-5 text-center">Angk.</th>
                    <th className="px-4 py-4 sm:px-6 sm:py-5 text-center">L/P</th>
                    <th className="px-4 py-4 sm:px-6 sm:py-5">Label Klasifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {currentItems.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-12 sm:py-16 text-center text-sm sm:text-base font-semibold opacity-50">Sistem belum menerima data riwayat pengujian.</td></tr>
                  ) : (
                    currentItems.map((data, index) => {
                      const clusterDef = clusterInfo[data.clusterId] || clusterInfo[2];
                      const isNew = index === 0 && currentTablePage === 1 && !isSaving && result; 
                      return (
                        <tr key={data.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'} ${isNew ? (isDarkMode ? 'bg-indigo-950/40' : 'bg-blue-50/50') : ''}`}>
                          <td className={`px-4 py-4 sm:px-6 sm:py-5 font-bold flex items-center gap-2 sm:gap-3 text-sm sm:text-base ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            {isNew && <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-indigo-500 animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>}
                            {data.name}
                          </td>
                          <td className={`px-4 py-4 sm:px-6 sm:py-5 font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {data.prodi}
                          </td>
                          <td className={`px-4 py-4 sm:px-6 sm:py-5 text-center font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                            {/* REVISI FORMAT ANGKATAN (cth: 2022) */}
                            20{data.generasi}
                          </td>
                          <td className={`px-4 py-4 sm:px-6 sm:py-5 text-center font-black ${data.gender === 'Laki-laki' ? 'text-blue-500' : 'text-pink-500'}`}>
                            {data.gender === 'Laki-laki' ? 'L' : data.gender === 'Perempuan' ? 'P' : '-'}
                          </td>
                          <td className="px-4 py-4 sm:px-6 sm:py-5">
                            <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-bold border ${isDarkMode ? `bg-${clusterDef.color}-950/50 text-${clusterDef.color}-400 border-${clusterDef.color}-900/50` : `bg-${clusterDef.color}-50 text-${clusterDef.color}-700 border-${clusterDef.color}-200`}`}>
                              <span className={`w-1.5 h-1.5 rounded-full bg-${clusterDef.color}-500`}></span>
                              Cluster {data.clusterId}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* --- REVISI PAGINATION TABEL --- */}
            {totalPages > 1 && (
              <div className={`p-4 sm:p-5 border-t flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50/40 border-slate-200'}`}>
                <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  Data {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, savedData.length)} dari total {savedData.length}
                </span>
                
                <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto justify-between sm:justify-end">
                  <button 
                    onClick={() => setCurrentTablePage(prev => Math.max(prev - 1, 1))}
                    disabled={currentTablePage === 1}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${currentTablePage === 1 ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-slate-700 bg-slate-800 text-slate-300' : 'hover:bg-slate-200 bg-slate-100 text-slate-700'}`}
                  >
                    Sebelumnya
                  </button>
                  
                  {/* Daftar Halaman Angka (Muncul jika ada space di Desktop) */}
                  <div className="hidden sm:flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(num => num === 1 || num === totalPages || Math.abs(currentTablePage - num) <= 1)
                      .map((num, idx, arr) => (
                        <React.Fragment key={num}>
                          {idx > 0 && num - arr[idx - 1] > 1 && <span className={`text-xs px-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>...</span>}
                          <button
                            onClick={() => setCurrentTablePage(num)}
                            className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${currentTablePage === num ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' : isDarkMode ? 'hover:bg-slate-700 bg-slate-800 text-slate-400' : 'hover:bg-slate-200 bg-slate-100 text-slate-600'}`}
                          >
                            {num}
                          </button>
                        </React.Fragment>
                    ))}
                  </div>

                  <button 
                    onClick={() => setCurrentTablePage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentTablePage === totalPages}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${currentTablePage === totalPages ? 'opacity-30 cursor-not-allowed' : isDarkMode ? 'hover:bg-slate-700 bg-slate-800 text-slate-300' : 'hover:bg-slate-200 bg-slate-100 text-slate-700'}`}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {result && !result.error && (
          <div className="xl:col-span-5 relative transition-all duration-700 animate-in slide-in-from-right-8 fade-in">
            <div className={`sticky top-24 p-5 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border shadow-2xl ${isDarkMode ? 'bg-slate-800/90 border-indigo-500/30 shadow-indigo-900/20 backdrop-blur-xl' : 'bg-white/95 border-indigo-200 shadow-indigo-100 backdrop-blur-xl'}`}>
              
              <div className="text-center mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-slate-200 dark:border-slate-700/50">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-4 sm:mb-6 ${isDarkMode ? 'bg-indigo-950/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Klasifikasi Anda
                </div>
                <div className="flex flex-col items-center justify-center mb-4 sm:mb-5">
                  <div className="inline-flex items-center justify-center p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-inner mb-3 sm:mb-4" style={{ backgroundColor: `var(--color-${clusterInfo[result.clusterId].color}-500, rgba(120,120,120,0.1))` }}>
                    {clusterInfo[result.clusterId].icon}
                  </div>
                  <h3 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-1 sm:mb-2 tracking-tighter text-${clusterInfo[result.clusterId].color}-500`}>
                    Cluster {result.clusterId}
                  </h3>
                </div>
                
                <p className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  "{clusterInfo[result.clusterId].label}"
                </p>
                <p className={`text-xs sm:text-sm font-semibold leading-relaxed px-1 sm:px-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{clusterInfo[result.clusterId].desc}</p>
              </div>

              <div className="flex-1">
                <h4 className={`text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-2 sm:gap-3 mb-5 sm:mb-6 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
                  <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" /> Hasil Eksekusi Logika (Trace Route)
                </h4>
                <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-slate-200 dark:before:bg-slate-700">
                  {result.rulesPassed.map((rule, idx) => {
                    const isLast = idx === result.rulesPassed.length - 1;
                    return (
                      <div key={idx} className="relative pl-8 group">
                        <div className={`absolute left-0 top-1 sm:top-1.5 w-6 h-6 rounded-full border-4 flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800 group-hover:border-indigo-500' : 'bg-white border-slate-100 group-hover:border-indigo-300'} ${isLast ? 'border-indigo-500 bg-indigo-500/20' : ''}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${isLast ? 'bg-indigo-500' : (isDarkMode ? 'bg-slate-600' : 'bg-slate-300')}`}></div>
                        </div>
                        <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-[10px] sm:text-xs font-semibold shadow-sm transition-all ${isLast ? (isDarkMode ? 'bg-indigo-950/30 border-indigo-500/50 text-indigo-300' : 'bg-indigo-50/50 border-indigo-200 text-indigo-700') : (isDarkMode ? 'bg-slate-900/50 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600')}`}>
                          {rule}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <button onClick={() => setResult(null)} className={`w-full mt-6 sm:mt-8 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}>
                Tutup Analisis
              </button>

            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 relative font-sans ${isDarkMode ? 'bg-[#0b1120] text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* --- INJEKSI CSS ANIMASI PARTIKEL LATAR BELAKANG --- */}
      <style>{`
        @keyframes float-slow {
          0% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(15px); }
          66% { transform: translateY(15px) translateX(-20px); }
          100% { transform: translateY(0px) translateX(0px); }
        }
        .animate-float { animation: float-slow 12s infinite ease-in-out; }
        .animate-float-delayed { animation: float-slow 15s infinite ease-in-out 3s; }
        .animate-float-slow { animation: float-slow 18s infinite ease-in-out 1s; }
        .animate-float-fast { animation: float-slow 10s infinite ease-in-out 2s; }
      `}</style>

      {/* --- PARTIKEL BERGERAK RINGAN --- */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className={`absolute top-[15%] left-[20%] w-2 h-2 rounded-full opacity-40 animate-float blur-[1px] ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-300'}`}></div>
        <div className={`absolute top-[60%] left-[10%] w-3 h-3 rounded-full opacity-30 animate-float-delayed blur-[2px] ${isDarkMode ? 'bg-blue-500' : 'bg-blue-300'}`}></div>
        <div className={`absolute top-[30%] right-[20%] w-1.5 h-1.5 rounded-full opacity-50 animate-float-slow blur-[1px] ${isDarkMode ? 'bg-purple-400' : 'bg-purple-300'}`}></div>
        <div className={`absolute bottom-[25%] right-[15%] w-2.5 h-2.5 rounded-full opacity-30 animate-float-fast blur-[1px] ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-300'}`}></div>
        <div className={`absolute top-[80%] right-[40%] w-2 h-2 rounded-full opacity-40 animate-float blur-[1px] ${isDarkMode ? 'bg-blue-400' : 'bg-blue-200'}`}></div>
      </div>

      <div className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className={`absolute top-[-10%] left-[-10%] w-[80vw] h-[80vw] sm:w-[50vw] sm:h-[50vw] rounded-full mix-blend-screen filter blur-[80px] sm:blur-[100px] opacity-20 animate-[pulse_8s_ease-in-out_infinite] ${isDarkMode ? 'bg-indigo-600' : 'bg-blue-300 mix-blend-multiply'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[70vw] h-[70vw] sm:w-[40vw] sm:h-[40vw] rounded-full mix-blend-screen filter blur-[80px] sm:blur-[100px] opacity-20 animate-[pulse_10s_ease-in-out_infinite_reverse] ${isDarkMode ? 'bg-purple-600' : 'bg-indigo-300 mix-blend-multiply'}`}></div>
        <div className={`absolute top-[40%] left-[50%] w-[60vw] h-[60vw] sm:w-[30vw] sm:h-[30vw] rounded-full mix-blend-screen filter blur-[60px] sm:blur-[80px] opacity-10 animate-[pulse_12s_ease-in-out_infinite] ${isDarkMode ? 'bg-blue-500' : 'bg-purple-200 mix-blend-multiply'}`}></div>
        
        <div className={`absolute inset-0 opacity-[0.03] ${isDarkMode ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,#00000012_1px,transparent_1px),linear-gradient(to_bottom,#00000012_1px,transparent_1px)]'} bg-[size:24px_24px]`}></div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-300">
          <div className={`max-w-md w-full p-8 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center border relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
            <div className={`relative inline-flex items-center justify-center p-5 sm:p-6 rounded-full mb-5 sm:mb-6 shadow-inner ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-500 border border-emerald-100'}`}>
              <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16" />
            </div>
            <h3 className={`text-2xl sm:text-3xl font-black mb-2 sm:mb-3 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Terimakasih!
            </h3>
            <p className={`text-sm sm:text-base font-medium mb-8 sm:mb-10 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Respons pengujian anda telah dienkripsi dan diintegrasikan ke dalam model sistem cerdas kami.
            </p>
            <button 
              onClick={handleGoToDashboard} 
              className="w-full px-5 py-4 sm:px-6 sm:py-5 text-base sm:text-lg font-extrabold rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] hover:shadow-[0_0_30px_rgba(79,70,229,0.6)] hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 sm:gap-3"
            >
              Lihat Hasil Klasifikasi <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>
      )}

      <nav className={`sticky top-0 z-40 border-b backdrop-blur-2xl transition-colors ${isDarkMode ? 'bg-[#0b1120]/70 border-slate-800/80' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          
          <div className="flex items-center gap-2.5 sm:gap-4 cursor-pointer group" onClick={() => setCurrentPage('landing')}>
            <div className="relative flex items-center justify-center p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-indigo-500/30 text-white overflow-hidden transition-transform group-hover:scale-105">
              <div className="absolute inset-0 w-full h-full bg-white/20 skew-x-[-20deg] group-hover:animate-[shine_1.5s_ease-in-out_infinite] -translate-x-[150%]"></div>
              <Network className="w-4 h-4 sm:w-6 sm:h-6 relative z-10" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-2xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                KompenTree
              </span>
              <span className="hidden sm:block text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase opacity-50 mt-0.5">Politeknik Caltex Riau</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-6">
            
            <div className={`hidden md:flex items-center p-1.5 rounded-full border shadow-inner ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setCurrentPage('landing')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black transition-all duration-300 ${currentPage === 'landing' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                Beranda
              </button>
              <button onClick={() => setCurrentPage('form')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black transition-all duration-300 ${currentPage === 'form' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                Pengujian
              </button>
              <button onClick={() => setCurrentPage('dashboard')} className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-black transition-all duration-300 ${currentPage === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
                Dashboard
              </button>
            </div>

            <div className={`flex md:hidden items-center gap-0.5 p-1 rounded-[1rem] border shadow-inner ${isDarkMode ? 'bg-slate-900/80 border-slate-700/50' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setCurrentPage('landing')} className={`p-2.5 rounded-xl transition-all ${currentPage === 'landing' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}><Home className="w-3.5 h-3.5"/></button>
              <button onClick={() => setCurrentPage('form')} className={`p-2.5 rounded-xl transition-all ${currentPage === 'form' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}><FileText className="w-3.5 h-3.5"/></button>
              <button onClick={() => setCurrentPage('dashboard')} className={`p-2.5 rounded-xl transition-all ${currentPage === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}><LayoutDashboard className="w-3.5 h-3.5"/></button>
            </div>

            <div className="w-px h-6 sm:h-8 bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1"></div>

            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 sm:p-3 rounded-full transition-all hover:scale-110 shadow-sm shrink-0 border ${isDarkMode ? 'bg-slate-800 text-amber-400 border-slate-700 hover:bg-slate-700 hover:text-amber-300' : 'bg-white text-indigo-600 border-slate-200 hover:bg-slate-50'}`}>
              {isDarkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full relative z-10">
        {currentPage === 'landing' && renderLandingPage()}
        {currentPage === 'form' && renderFormPage()}
        {currentPage === 'dashboard' && renderDashboardPage()}
      </main>

      <footer className={`border-t mt-auto py-8 sm:py-10 transition-colors relative z-10 ${isDarkMode ? 'border-slate-800/80 bg-[#0b1120]/80 backdrop-blur-xl text-slate-500' : 'border-slate-200 bg-white/80 backdrop-blur-xl text-slate-500'}`}>
        <div className="max-w-6xl mx-auto px-4 text-center flex flex-col items-center justify-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 opacity-50 mb-1 sm:mb-2">
            <BrainCircuit className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-black tracking-widest uppercase text-[10px] sm:text-xs">AI Research Project</span>
          </div>
          <p className="text-xs sm:text-sm font-bold tracking-wide">
            © {new Date().getFullYear()} KompenTree - Kelompok 7
          </p>
          <p className="text-[10px] sm:text-xs font-semibold opacity-70">
            Politeknik Caltex Riau. Dibuat khusus untuk keperluan tugas dan riset.
          </p>
        </div>
      </footer>
    </div>
  );
}