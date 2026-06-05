import React, { useState, useEffect } from 'react';
import { 
  RefreshCw,
  Search,
  Lock,
  Unlock,
  Trash2,
  X,
  Moon,
  Sun,
  LineChart,
  UserCheck,
  Users,
  Info,
  CircleDot,
  Eye,
  EyeOff
} from 'lucide-react';

const FIREBASE_URL = "https://lineas-impares-2026-default-rtdb.firebaseio.com/pagos.json";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [globalUsername, setGlobalUsername] = useState('');
  const [globalPassword, setGlobalPassword] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [showGlobalPassword, setShowGlobalPassword] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme_modo');
      return savedTheme === 'dark';
    }
    return false;
  });

  const [filterBank, setFilterBank] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [adminPeriod, setAdminPeriod] = useState('diario');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [confirmingTxId, setConfirmingTxId] = useState(null);
  const [assessorName, setAssessorName] = useState('');
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchPagos = async () => {
      try {
        const response = await fetch(`${FIREBASE_URL}?_=${new Date().getTime()}`, { cache: 'no-store' });
        const data = await response.json();
        if (data && typeof data === 'object') {
          const txArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
          txArray.sort((a, b) => new Date(b.date) - new Date(a.date));
          setTransactions(txArray);
        } else {
          setTransactions([]); 
        }
      } catch (error) { console.error(error); } finally { setIsLoading(false); }
    };
    fetchPagos(); 
    const interval = setInterval(fetchPagos, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const parseAmount = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return Number(val.toString().replace(/[^0-9]/g, '')) || 0;
  };

  const handleGlobalLogin = (e) => {
    e.preventDefault();
    if (globalUsername.toLowerCase().trim() === 'admin' && globalPassword === 'admin123') {
      setIsAuthenticated(true); setIsAdmin(true);
    } else if (globalUsername.toLowerCase().trim() === 'asesor' && globalPassword === 'asesor123') {
      setIsAuthenticated(true); setIsAdmin(false);
    } else { setGlobalError('Usuario o contraseña incorrectos'); }
  };

  const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'number' ? amount : parseAmount(amount);
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(numericAmount));
  };

  const filteredTransactions = transactions
    .filter(t => isAdmin ? true : new Date(t.date).toLocaleDateString() === new Date().toLocaleDateString())
    .filter(t => filterBank === 'Todos' || t.bank === filterBank)
    .filter(t => (t.ref && t.ref.toLowerCase().includes(searchTerm.toLowerCase())) || (t.amount && t.amount.toString().includes(searchTerm)));

  if (!isAuthenticated) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-900 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
            <form onSubmit={handleGlobalLogin} className="space-y-5">
              <input type="text" value={globalUsername} onChange={e => setGlobalUsername(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Usuario" required />
              <input type="password" value={globalPassword} onChange={e => setGlobalPassword(e.target.value)} className="w-full p-3 border rounded-xl" placeholder="Contraseña" required />
              <button type="submit" className="w-full bg-[#0033a0] text-white font-bold py-3 rounded-xl">Ingresar</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-[#f3f4f6] dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="px-6 py-4">Fecha</th>
                    <th className="px-6 py-4">Origen</th>
                    <th className="px-6 py-4">Referencia / Nombre</th>
                    <th className="px-6 py-4 text-right">Valor</th>
                    <th className="px-6 py-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 font-bold">{new Date(tx.date).toLocaleDateString()}</td>
                      <td className="px-6 py-5 font-semibold">{tx.bank || 'BBVA'}</td>
                      <td className="px-6 py-5 font-medium max-w-[400px] break-words">{tx.ref}</td>
                      <td className="px-6 py-5 text-right font-bold text-lg">{formatCurrency(tx.amount)}</td>
                      <td className="px-6 py-5 text-center">
                        <button onClick={() => setConfirmingTxId(tx.id)} className="px-5 py-2 bg-blue-50 text-[#0033a0] font-bold rounded-lg">Validar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
