import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Mail, 
  Smartphone, 
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Trash2,
  Lock,
  Unlock,
  BarChart3,
  X,
  Moon,
  Sun,
  LineChart,
  UserCheck,
  Store,
  MapPin,
  Users,
  QrCode,
  Info,
  CircleDot,
  Eye,
  EyeOff
} from 'lucide-react';

// URL DE LA NUEVA BASE DE DATOS: LÍNEAS IMPARES 2026
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
  const [activeTab, setActiveTab] = useState('detalle');

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
        const response = await fetch(`${FIREBASE_URL}?_=${new Date().getTime()}`, {
          cache: 'no-store'
        });
        const data = await response.json();
        
        if (data && typeof data === 'object') {
          const txArray = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));
          txArray.sort((a, b) => new Date(b.date) - new Date(a.date));
          setTransactions(txArray);
        } else {
          setTransactions([]); 
        }
      } catch (error) {
        console.error("Error conectando a Firebase:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPagos(); 
    const interval = setInterval(fetchPagos, 10000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('theme_modo', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const parseAmount = (val) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return Number(val.toString().replace(/[^0-9]/g, '')) || 0;
  };

  const handleGlobalLogin = (e) => {
    e.preventDefault();
    const user = globalUsername.toLowerCase().trim();
    const pass = globalPassword;

    if (user === 'admin' && pass === 'admin123') {
      setIsAuthenticated(true);
      setIsAdmin(true);
      setGlobalError('');
    } else if (user === 'asesor' && pass === 'asesor123') {
      setIsAuthenticated(true);
      setIsAdmin(false);
      setGlobalError('');
    } else {
      setGlobalError('Usuario o contraseña incorrectos');
    }
  };

  const handleGlobalLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setGlobalUsername('');
    setGlobalPassword('');
  };

  const getStats = (period) => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const todayStr = currentDate.toLocaleDateString();

    let filtered = transactions;

    if (period === 'diario') {
      filtered = transactions.filter(t => new Date(t.date).toLocaleDateString() === todayStr);
    } else if (period === 'mensual') {
      filtered = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });
    } else if (period === 'anual') {
      filtered = transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
    }

    const count = filtered.length;
    const total = filtered.reduce((sum, t) => sum + parseAmount(t.amount), 0);
    const avg = count > 0 ? total / count : 0;

    return { count, total, avg };
  };

  const adminStats = getStats(adminPeriod);

  const getChartData = (period, txs) => {
    const currentDate = new Date();
    let data = [];

    if (period === 'diario') {
      const hourly = Array(24).fill(0);
      txs.forEach(t => {
        const d = new Date(t.date);
        if (d.toLocaleDateString() === currentDate.toLocaleDateString()) {
          hourly[d.getHours()] += parseAmount(t.amount);
        }
      });
      data = hourly.map((val, i) => ({ label: `${i}h`, value: val })).filter((_, i) => i >= 6 && i <= 22);
    } else if (period === 'mensual') {
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const daily = Array(daysInMonth).fill(0);
      txs.forEach(t => {
        const d = new Date(t.date);
        if (d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()) {
          daily[d.getDate() - 1] += parseAmount(t.amount);
        }
      });
      data = daily.map((val, i) => ({ label: `${i + 1}`, value: val }));
    } else if (period === 'anual') {
      const monthly = Array(12).fill(0);
      txs.forEach(t => {
        const d = new Date(t.date);
        if (d.getFullYear() === currentDate.getFullYear()) {
          monthly[d.getMonth()] += parseAmount(t.amount);
        }
      });
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      data = monthly.map((val, i) => ({ label: months[i], value: val }));
    }
    return data;
  };

  const chartData = getChartData(adminPeriod, transactions);
  const maxChartValue = Math.max(...chartData.map(d => d.value), 1);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'admin123') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setPasswordInput('');
      setLoginError('');
    } else {
      setLoginError('Contraseña incorrecta');
    }
  };
  
  const handleAdminLogout = () => {
    setIsAdmin(false);
  };

  const today = new Date().toLocaleDateString();

  const filteredTransactions = transactions
    .filter(t => {
      if (!isAdmin) {
        const txDate = new Date(t.date).toLocaleDateString();
        return txDate === today; 
      }
      return true; 
    })
    .filter(t => filterBank === 'Todos' || (t.bank && t.bank.trim() === filterBank))
    .filter(t => (t.ref && t.ref.toLowerCase().includes(searchTerm.toLowerCase())) || (t.amount && t.amount.toString().includes(searchTerm)))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const clearHistory = async () => {
    if (window.confirm('¿Estás segura de borrar todo el historial en la nube? Esto es irreversible.')) {
      setTransactions([]);
      try {
        await fetch(FIREBASE_URL, { method: 'DELETE' });
      } catch (error) {
        console.error("Error borrando base de datos:", error);
      }
    }
  };

  const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'number' ? amount : parseAmount(amount);
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(Math.round(numericAmount));
  };

  const getBankColor = (bank) => {
    if (!bank) return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
    
    const lowerBank = bank.toLowerCase().trim();
    if (lowerBank.includes('nequi')) return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800/50';
    if (lowerBank.includes('daviplata')) return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/50';
    if (lowerBank.includes('bbva')) return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800/50';
    if (lowerBank.includes('bancolombia')) return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-800/50';
    
    return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700';
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (assessorName.trim() === '') {
      setConfirmError('Debes ingresar tu nombre o iniciales');
      return;
    }
    
    const confirmationTime = new Date().toISOString();
    const idToUpdate = confirmingTxId;
    
    setTransactions(prev => prev.map(tx => 
      tx.id === idToUpdate ? { ...tx, confirmedBy: assessorName.trim(), confirmedAt: confirmationTime } : tx
    ));
    setConfirmingTxId(null);
    setAssessorName('');
    setConfirmError('');

    try {
      await fetch(`https://lineas-impares-2026-default-rtdb.firebaseio.com/pagos/${idToUpdate}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmedBy: assessorName.trim(),
          confirmedAt: confirmationTime
        })
      });
    } catch (error) {
      console.error("Error guardando validación en Firebase:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={isDarkMode ? 'dark' : ''}>
        <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-900 transition-colors duration-300 p-4">
          
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="absolute top-6 right-6 p-2.5 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
          </button>

          <div className="bg-white dark:bg-slate-800 p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-[#0033a0] text-white flex items-center justify-center font-black text-3xl shadow-lg">
                GM
              </div>
            </div>
            <p className="text-center text-slate-500 dark:text-slate-400 mb-8 font-medium text-lg">Panel de Verificación - Líneas Impares</p>
            
            <form onSubmit={handleGlobalLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Usuario</label>
                <div className="relative">
                  <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={globalUsername} 
                    onChange={e => setGlobalUsername(e.target.value)} 
                    className="w-full pl-10 pr-4 py-3 text-sm border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0033a0] transition-shadow"
                    placeholder="Ej. admin"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Contraseña</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type={showGlobalPassword ? "text" : "password"}
                    value={globalPassword} 
                    onChange={e => setGlobalPassword(e.target.value)} 
                    className="w-full pl-10 pr-12 py-3 text-sm border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0033a0] transition-shadow"
                    placeholder="••••••••"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowGlobalPassword(!showGlobalPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors z-10 p-2"
                  >
                    {showGlobalPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {globalError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium text-center">{globalError}</p>
                </div>
              )}
              
              <button type="submit" className="w-full bg-[#0033a0] hover:bg-blue-800 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2">
                Ingresar al Sistema
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="flex h-screen bg-[#f3f4f6] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans overflow-hidden transition-colors duration-300">
        
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          <header className="bg-[#0033a0] dark:bg-slate-950 text-white px-6 md:px-10 py-4 flex flex-col sm:flex-row sm:items-center justify-between shadow-md z-10 gap-4">
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex w-12 h-12 rounded-xl bg-white items-center justify-center text-[#0033a0] font-black text-2xl shadow-lg">
                GM
              </div>
              <div>
                <div className="text-sm text-blue-200 font-medium mb-1 flex items-center gap-1.5">
                  Inicio / Detalle y Movimiento
                  <Info size={14} className="cursor-pointer hover:text-white" />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                  Líneas Impares
                  {isAdmin && <span className="text-xs font-bold bg-white text-[#0033a0] px-2.5 py-1 rounded-full uppercase tracking-widest shadow-sm">Admin</span>}
                </h1>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2.5 text-blue-200 hover:bg-blue-800 hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
              </button>

              {isAdmin ? (
                <>
                  <button onClick={clearHistory} className="p-2.5 text-blue-200 hover:bg-blue-800 hover:text-white dark:hover:bg-slate-800 rounded-lg transition-colors" title="Limpiar historial">
                    <Trash2 size={22} />
                  </button>
                  <button onClick={handleAdminLogout} className="flex items-center gap-2 px-4 py-2.5 text-blue-100 bg-blue-800/50 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-700 border border-blue-700 dark:border-slate-600 rounded-lg transition-colors font-medium">
                    <Unlock size={20} /> <span className="hidden sm:inline">Modo Asesor</span>
                  </button>
                </>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="flex items-center gap-2 px-4 py-2.5 text-blue-100 bg-blue-800/50 hover:bg-blue-800 dark:bg-slate-800 dark:hover:bg-slate-700 border border-blue-700 dark:border-slate-600 rounded-lg transition-colors font-medium">
                  <Lock size={20} /> <span className="hidden sm:inline">Administrador</span>
                </button>
              )}
              
              <button 
                onClick={handleGlobalLogout}
                className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 border border-transparent dark:border-slate-600 rounded-lg font-bold shadow-sm transition-all"
              >
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

              {isAdmin && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-8">
                  <div className="border-b border-slate-200 dark:border-slate-700 p-1 flex bg-slate-50 dark:bg-slate-900/50">
                    {['diario', 'mensual', 'anual'].map((period) => (
                      <button 
                        key={period}
                        onClick={() => setAdminPeriod(period)}
                        className={`flex-1 py-3 text-base font-bold capitalize transition-colors ${
                          adminPeriod === period 
                            ? 'bg-white dark:bg-slate-800 text-[#0033a0] dark:text-blue-400 shadow-sm rounded-lg border border-slate-200 dark:border-slate-700' 
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        {period === 'diario' ? 'Hoy' : period === 'mensual' ? 'Este Mes' : 'Este Año'}
                      </button>
                    ))}
                  </div>

                  <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-6">
                      <div>
                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total valor en ventas</p>
                        <h2 className="text-4xl md:text-5xl font-black text-[#0033a0] dark:text-white tracking-tight">{formatCurrency(adminStats.total)}</h2>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cantidad</p>
                          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{adminStats.count}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ticket Promedio</p>
                          <p className="text-2xl font-bold text-slate-800 dark:text-slate-200">{formatCurrency(adminStats.avg)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-slate-100 dark:border-slate-700 pt-6 lg:pt-0 lg:pl-8">
                      <div className="flex items-center gap-2 mb-6">
                        <LineChart size={20} className="text-[#0033a0] dark:text-blue-400" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Comportamiento de Recaudo</h3>
                      </div>
                      
                      <div className="h-48 w-full flex items-end justify-between gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-700 pb-1">
                        {chartData.map((item, index) => {
                          const heightPercentage = (item.value / maxChartValue) * 100;
                          return (
                            <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                              <div className="opacity-0 group-hover:opacity-100 absolute -top-10 bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap transition-opacity z-10">
                                {formatCurrency(item.value)}
                              </div>
                              <div 
                                className={`w-full max-w-[32px] rounded-t transition-all duration-500 min-h-[4px] ${item.value > 0 ? 'bg-[#0033a0] hover:bg-blue-700 dark:bg-blue-600' : 'bg-slate-100 dark:bg-slate-800'}`}
                                style={{ height: `${item.value === 0 ? 0 : Math.max(heightPercentage, 2)}%` }}
                              />
                              <span className="text-[10px] text-slate-500 mt-2 absolute -bottom-5 w-full text-center truncate">{item.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Transacciones Recientes</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Verificando en tiempo real con la nube.</p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar referencia..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033a0] transition-shadow"
                      />
                    </div>
                    <select 
                      value={filterBank}
                      onChange={(e) => setFilterBank(e.target.value)}
                      className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033a0] cursor-pointer"
                    >
                      <option value="Todos">Todas las plataformas</option>
                      <option value="Nequi">Nequi</option>
                      <option value="Daviplata">Daviplata</option>
                      <option value="Bancolombia">Bancolombia</option>
                      <option value="BBVA">BBVA</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto min-h-[200px]">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                      <RefreshCw size={32} className="animate-spin mb-3 text-blue-500" />
                      <p className="text-sm font-medium">Conectando con el banco...</p>
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 text-base font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <th className="px-6 py-4">Fecha / Hora</th>
                          <th className="px-6 py-4">Origen</th>
                          <th className="px-6 py-4">Referencia / Nombre</th>
                          <th className="px-6 py-4">Estado</th>
                          <th className="px-6 py-4 text-right">Valor</th>
                          <th className="px-6 py-4 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="px-6 py-16 text-center text-slate-500">
                              <div className="flex flex-col items-center justify-center">
                                <Search size={40} className="mb-3 text-slate-300" />
                                <p className="text-base font-medium">No se encontraron pagos recientes.</p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredTransactions.map((tx) => {
                            const txDate = new Date(tx.date);
                            const isToday = txDate.toLocaleDateString() === today;

                            return (
                              <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                                <td className="px-6 py-5">
                                  <div className="text-base font-bold text-slate-800 dark:text-slate-200">
                                    {isToday ? 'Hoy' : txDate.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })}
                                  </div>
                                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    {txDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-base font-semibold ${getBankColor(tx.bank)}`}>
                                    {tx.bank ? tx.bank.trim() : 'Desconocido'}
                                  </span>
                                </td>
                               <td className="px-6 py-5 text-base text-slate-600 dark:text-slate-400 font-mono font-medium truncate max-w-[200px]">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-800 dark:text-slate-200">
                                      {tx.name || tx.assessorName || 'Sin Nombre'}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      ****{tx.ref ? tx.ref.slice(-4) : '0000'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2 text-base font-semibold text-slate-700 dark:text-slate-300">
                                    <CircleDot size={16} className="text-green-500 fill-green-500" />
                                    {tx.status || 'Aceptada'}
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                                    {formatCurrency(tx.amount)}
                                  </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                  {tx.confirmedBy ? (
                                    <div className="flex flex-col items-center justify-center">
                                      <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Validado por</span>
                                      <span className="text-base font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                                        <UserCheck size={18} />
                                        {tx.confirmedBy}
                                      </span>
                                      {tx.confirmedAt && (
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded-full">
                                          {new Date(tx.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => setConfirmingTxId(tx.id)}
                                      className="px-5 py-2.5 bg-blue-50 text-[#0033a0] hover:bg-[#0033a0] hover:text-white dark:bg-slate-700 dark:text-blue-300 dark:hover:bg-blue-600 dark:hover:text-white font-semibold text-base rounded-md transition-colors shadow-sm"
                                    >
                                      Validar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

            </div>
          </main>
        </div>

        {confirmingTxId && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <UserCheck size={20} className="text-[#0033a0] dark:text-blue-400" />
                  Validación de Pago
                </h3>
                <button onClick={() => { setConfirmingTxId(null); setConfirmError(''); setAssessorName(''); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleConfirmPayment} className="p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Ingresa tu código o nombre para firmar la validación de este comprobante.</p>
                <input 
                  type="text" 
                  placeholder="Nombre / Código del Asesor"
                  value={assessorName}
                  onChange={(e) => setAssessorName(e.target.value)}
                  className="w-full px-4 py-3 text-base border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033a0] mb-2 transition-shadow"
                  autoFocus
                />
                {confirmError && <p className="text-sm text-red-500 mb-4 font-medium">{confirmError}</p>}
                <div className="mt-6 flex justify-end gap-3">
                  <button type="button" onClick={() => setConfirmingTxId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancelar</button>
                  <button type="submit" className="px-6 py-2 bg-[#0033a0] hover:bg-blue-800 text-white font-medium rounded-lg transition-colors shadow-sm">Firmar</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showLoginModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Lock size={20} className="text-[#0033a0] dark:text-blue-400" />
                  Acceso Administrativo
                </h3>
                <button onClick={() => { setShowLoginModal(false); setLoginError(''); }} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAdminLogin} className="p-6 bg-slate-50/50 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Ingresa tus credenciales para ver reportes financieros.</p>
                <div className="relative mb-2">
                  <input 
                    type={showAdminPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-3 pr-12 text-base border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0033a0] transition-shadow"
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors z-10 p-2"
                  >
                    {showAdminPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {loginError && <p className="text-sm text-red-500 mb-4 font-medium">{loginError}</p>}
                <button type="submit" className="w-full mt-4 bg-[#0033a0] hover:bg-blue-800 text-white font-medium py-3 rounded-lg transition-colors shadow-sm">Ingresar</button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
