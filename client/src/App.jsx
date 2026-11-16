import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// ==========================================
// 1. LOGIN COMPONENT
// ==========================================
function Login({ setAuth }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        localStorage.setItem('fiveforge_user', JSON.stringify(data.user));
        localStorage.setItem('fiveforge_token', data.access_token);
        setAuth(data.user);
        navigate('/dashboard');
      } else {
        setError(data.detail || 'Login failed');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B2447] p-4">
      <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="FiveForge" className="w-48 mb-4" />
          <h1 className="text-2xl font-bold text-[#0B2447] text-center">ERP Portal Login</h1>
          <p className="text-gray-500 text-sm mt-2">Enter your corporate credentials</p>
        </div>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-center text-sm font-medium">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Corporate Email</label>
            <input type="email" required placeholder="admin@gmail.com" 
              className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B2447]"
              value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" required placeholder="••••••••"
              className="mt-1 block w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0B2447]"
              value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading} />
          </div>
          <button type="submit" disabled={isLoading} 
            className={`w-full font-bold py-3 rounded-lg transition text-white ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#0B2447] hover:bg-blue-900'}`}>
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
// ==========================================
// 2. MAIN DASHBOARD LAYOUT
// ==========================================
function Dashboard({ user, setAuth }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [showMessage, setShowMessage] = useState(!!user.message);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const navigate = useNavigate();
  const token = localStorage.getItem('fiveforge_token');
  
  const displayRole = user.role === 'Super Admin' ? 'Admin' : user.role;

  const handleLogout = () => {
    localStorage.removeItem('fiveforge_user');
    localStorage.removeItem('fiveforge_token');
    setAuth(null);
    navigate('/');
  };

  const handleAcknowledge = async () => {
    await fetch(`${API_URL}/api/users/acknowledge-message?user_id=${user.id}`, { method: 'POST' });
    setShowMessage(false);
    const updatedUser = { ...user, message: null };
    localStorage.setItem('fiveforge_user', JSON.stringify(updatedUser));
  };

  const icons = {
    Dashboard: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>,
    HR: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
    Finance: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
    Production: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>,
    Sales: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>,
    Users: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>,
    Broadcast: <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
  };

  const menuItems = [
    { name: 'Dashboard', permission: 'VIEW_DASHBOARD' },
    { name: 'HR', permission: 'VIEW_HR' },
    { name: 'Finance', permission: 'VIEW_FINANCE' },
    { name: 'Production', permission: 'VIEW_PRODUCTION' },
    { name: 'Sales', permission: 'VIEW_SALES' },
    { name: 'User Management', permission: 'MANAGE_USERS' },
    { name: 'Broadcast', permission: 'MANAGE_USERS' },
  ];

  const allowedMenu = menuItems.filter(item => user.permissions.includes(item.permission));

  return (
    <div className="min-h-screen flex bg-slate-50 relative overflow-hidden">
      {showMessage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border-t-8 border-red-500">
            <div className="bg-red-50 p-6 text-center border-b">
              <h2 className="text-2xl font-extrabold text-red-600">IMPORTANT MESSAGE FROM ADMIN</h2>
            </div>
            <div className="p-8">
              <p className="text-gray-700 text-lg leading-relaxed">{user.message}</p>
            </div>
            <div className="p-6 bg-gray-50 flex justify-end">
              <button onClick={handleAcknowledge} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-8 rounded-lg shadow-md transition">I Understand</button>
            </div>
          </div>
        </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className={`w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="h-24 bg-white flex items-center justify-between px-4 border-b-4 border-blue-600 shadow-md">
          <img src="/logo.png" alt="FiveForge" className="w-40" />
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-800 p-2">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-6">Enterprise Menu</p>
          <ul className="space-y-2">
            {allowedMenu.map((item) => (
              <li key={item.name}>
                <button onClick={() => { setActiveTab(item.name); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === item.name ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}>
                  {icons[item.name] || icons.Dashboard}
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full bg-slate-800 hover:bg-red-600 text-white py-3 rounded-lg font-bold transition-colors">
            Logout
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen overflow-hidden w-full">
        <header className="bg-white shadow-sm p-4 md:p-8 flex justify-between items-center z-0 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-slate-600 hover:text-blue-600">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <h2 className="text-xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="font-bold text-slate-800">{user.name}</p>
              <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">{displayRole}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl border-2 border-blue-500">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8 flex-1 overflow-y-auto">
          {activeTab === 'Dashboard' && <DashboardView user={user} displayRole={displayRole} />}
          {activeTab === 'HR' && <HRView token={token} />}
          {activeTab === 'Finance' && <FinanceView token={token} />}
          {activeTab === 'Production' && <ProductionView token={token} user={user} />}
          {activeTab === 'Sales' && <SalesView token={token} />}
          {activeTab === 'User Management' && <UserManagementView token={token} />}
          {activeTab === 'Broadcast' && <BroadcastView token={token} />}
        </main>
      </div>
    </div>
  );
}
// ==========================================
// 3. MODULE VIEWS
// ==========================================
function DashboardView({ user, displayRole }) {
  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-6 md:p-10 rounded-2xl shadow-xl text-white flex flex-col md:flex-row justify-between items-center relative overflow-hidden">
        <div className="relative z-10 text-center md:text-left">
          <h3 className="text-2xl md:text-4xl font-extrabold mb-3">Welcome back, {user.name}</h3>
          <p className="text-blue-200 text-base md:text-lg">You are logged in as an <span className="font-bold text-white uppercase">{displayRole}</span>.</p>
        </div>
        <img src="/logo.png" alt="FiveForge" className="h-16 md:h-20 bg-white p-2 rounded-xl mt-6 md:mt-0 relative z-10 shadow-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col justify-center">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">System Status</p>
          <div className="flex items-center gap-3 mt-2">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse border-2 border-green-200"></div>
            <h3 className="text-xl md:text-2xl font-extrabold text-slate-800">Operational</h3>
          </div>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col justify-center">
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-2">Your Clearance</p>
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 mt-2 flex items-center gap-2">
            Level {displayRole === 'Admin' ? '5' : '3'} 
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded">
              {displayRole === 'Admin' ? 'Highest' : 'Standard'}
            </span>
          </h3>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col justify-center">
          <div className="flex justify-between items-center mb-2">
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">Company Performance</p>
            <span className="text-blue-600 font-extrabold text-lg">72%</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Monthly Target</p>
          <div className="w-full bg-slate-100 rounded-full h-4">
            <div className="bg-blue-600 h-4 rounded-full shadow-inner" style={{ width: '72%' }}></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Activities</h3>
        <div className="space-y-6">
          <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
            <div className="w-2.5 h-2.5 mt-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
            <div>
              <h4 className="font-bold text-slate-800">Production batch completed</h4>
              <p className="text-sm text-slate-500 mt-1">PET water bottles · Batch #PF102</p>
            </div>
          </div>
          <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
            <div className="w-2.5 h-2.5 mt-1.5 bg-amber-500 rounded-full flex-shrink-0"></div>
            <div>
              <h4 className="font-bold text-slate-800">New purchase request</h4>
              <p className="text-sm text-slate-500 mt-1">PET resin · Awaiting approval</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-2.5 h-2.5 mt-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
            <div>
              <h4 className="font-bold text-slate-800">Low inventory alert</h4>
              <p className="text-sm text-slate-500 mt-1">Bottle caps · Reorder required</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HRView({ token }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch(`${API_URL}/api/hr/employees?token=${token}`)
      .then(res => res.json())
      .then(d => setData(d.data))
      .catch(() => alert("Access Denied"));
  }, [token]);

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="text-xl font-bold mb-6 text-slate-800">Employee Records</h3>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-100 text-slate-600 text-sm uppercase">
              <th className="p-4 border-b">Name</th>
              <th className="p-4 border-b">Role</th>
              <th className="p-4 border-b">Department</th>
            </tr>
          </thead>
          <tbody>
            {data.map((emp, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="p-4 border-b font-semibold text-slate-800">{emp.name}</td>
                <td className="p-4 border-b text-slate-600">{emp.role}</td>
                <td className="p-4 border-b text-slate-600">{emp.department}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinanceView({ token }) {
  const [financeData, setFinanceData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('2025');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/finance/records?token=${token}`)
      .then(res => res.json())
      .then(d => {
        setFinanceData(d);
        setIsLoading(false);
      });
  }, [token]);

  const formatMoney = (amount) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);

  if (isLoading) return <div className="p-10 text-center font-bold text-slate-500">Loading...</div>;
  if (!financeData) return <div className="p-10 text-center text-red-500 font-bold">Error loading data</div>;

  const is2025 = selectedYear === '2025';
  const data = is2025 ? financeData.data_2025 : financeData.data_2026;
  const totals = is2025 ? financeData.totals_2025 : financeData.totals_2026;

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setSelectedYear('2025')} className={`px-6 md:px-8 py-2 md:py-3 rounded-xl font-bold text-base md:text-lg transition-all ${selectedYear === '2025' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}>2025</button>
        <button onClick={() => setSelectedYear('2026')} className={`px-6 md:px-8 py-2 md:py-3 rounded-xl font-bold text-base md:text-lg transition-all ${selectedYear === '2026' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-50'}`}>2026</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-l-4 border-l-blue-500">
          <p className="text-slate-500 text-xs md:text-sm font-bold uppercase mb-1">Total Revenue</p>
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 truncate">{formatMoney(totals.revenue)}</h3>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-l-4 border-l-red-500">
          <p className="text-slate-500 text-xs md:text-sm font-bold uppercase mb-1">Total Expenses</p>
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 truncate">{formatMoney(totals.expenses)}</h3>
        </div>
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border-l-4 border-l-amber-500">
          <p className="text-slate-500 text-xs md:text-sm font-bold uppercase mb-1">Total Payroll</p>
          <h3 className="text-xl md:text-2xl font-extrabold text-slate-800 truncate">{formatMoney(totals.payroll)}</h3>
        </div>
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 md:p-6 rounded-2xl shadow-lg border border-slate-700">
          <p className="text-slate-300 text-xs md:text-sm font-bold uppercase mb-1">Net Profit</p>
          <h3 className="text-xl md:text-2xl font-extrabold text-white truncate">{formatMoney(totals.net_profit)}</h3>
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-lg md:text-2xl font-extrabold text-slate-800 tracking-tight">Company Breakdown ({selectedYear})</h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 md:p-5 font-bold">Month</th>
                <th className="p-4 md:p-5 font-bold">Revenue</th>
                <th className="p-4 md:p-5 font-bold">Expenses</th>
                <th className="p-4 md:p-5 font-bold">Payroll</th>
                <th className="p-4 md:p-5 font-bold text-right">Net Income</th>
                <th className="p-4 md:p-5 font-bold">Performance Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((row, index) => {
                const net = row.revenue - (row.expenses + row.payroll);
                const ratio = Math.min((row.expenses / row.revenue) * 100, 100);
                return (
                  <tr key={index} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 md:p-5 font-semibold text-slate-700">{row.month}</td>
                    <td className="p-4 md:p-5 text-green-600 font-bold whitespace-nowrap">{formatMoney(row.revenue)}</td>
                    <td className="p-4 md:p-5 text-red-500 font-medium whitespace-nowrap">{formatMoney(row.expenses)}</td>
                    <td className="p-4 md:p-5 text-amber-500 font-medium whitespace-nowrap">{formatMoney(row.payroll)}</td>
                    <td className={`p-4 md:p-5 text-right font-extrabold whitespace-nowrap ${net > 0 ? 'text-slate-800' : 'text-red-600'}`}>{formatMoney(net)}</td>
                    <td className="p-4 md:p-5">
                      <div className="w-full bg-slate-200 rounded-full h-2.5 min-w-[100px]">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${ratio}%` }}></div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-800 text-white">
                <td className="p-4 md:p-5 font-bold uppercase tracking-wider text-xs md:text-sm">{selectedYear} Total</td>
                <td className="p-4 md:p-5 font-extrabold text-green-400 whitespace-nowrap">{formatMoney(totals.revenue)}</td>
                <td className="p-4 md:p-5 font-extrabold text-red-400 whitespace-nowrap">{formatMoney(totals.expenses)}</td>
                <td className="p-4 md:p-5 font-extrabold text-amber-400 whitespace-nowrap">{formatMoney(totals.payroll)}</td>
                <td className="p-4 md:p-5 text-right font-extrabold text-white whitespace-nowrap">{formatMoney(totals.net_profit)}</td>
                <td className="p-4 md:p-5 text-xs text-slate-400 uppercase font-semibold">End of Year</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
// --- PRODUCTION ---
function ProductionView({ token, user }) {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({ name: '', stock_quantity: '', image_url: '' });
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = () => {
    fetch(`${API_URL}/api/production/products?token=${token}`)
      .then(res => res.json())
      .then(d => setProducts(d.products));
  };

  useEffect(() => { loadProducts(); }, [token]);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    await fetch(`${API_URL}/api/production/products?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formData, stock_quantity: parseInt(formData.stock_quantity) })
    });
    setFormData({ name: '', stock_quantity: '', image_url: '' });
    setShowForm(false);
    loadProducts();
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    await fetch(`${API_URL}/api/production/products/${productId}?token=${token}`, { method: 'DELETE' });
    loadProducts();
  };

  const canEdit = user.role === 'Production Manager';
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-xl font-bold text-slate-800 w-full md:w-auto">Manufacturing Inventory</h3>
        
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <input 
            type="text" 
            placeholder="Search products..." 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          />
          {canEdit && <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold whitespace-nowrap w-full md:w-auto">{showForm ? 'Cancel' : 'Add Product'}</button>}
        </div>
      </div>

      {showForm && canEdit && (
        <form onSubmit={handleAddProduct} className="mb-8 p-4 md:p-6 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" placeholder="Product Name" required className="p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          <input type="number" placeholder="Initial Stock" required className="p-2 border rounded-lg" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
          <input type="text" placeholder="Image URL (e.g. bottle.jpg)" required className="p-2 border rounded-lg" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
          <button type="submit" className="col-span-1 md:col-span-3 bg-slate-800 text-white py-2 rounded-lg font-bold">Save Product (Notify Sales)</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {filteredProducts.length === 0 ? <p className="text-slate-500 col-span-full">No products found.</p> : filteredProducts.map(p => {
          const isWideProduct = ['pvc_pipe.jpg', 'chair.jpg', 'tank.jpg'].includes(p.image_url);

          return (
            <div key={p.id} className="border p-4 rounded-xl shadow-sm bg-white hover:shadow-md transition flex flex-col">
              <div className="h-40 md:h-48 bg-white border border-slate-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden p-2 md:p-4">
                <img 
                  src={`/products/${p.image_url}`} 
                  alt={p.name} 
                  className={`object-contain h-full w-full ${isWideProduct ? 'scale-x-150' : ''}`} 
                  onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerText = 'No Image'; }} 
                />
              </div>
              <h4 className="font-bold text-lg text-slate-800">{p.name}</h4>
              <p className="text-slate-500 mt-1 mb-4 text-sm md:text-base">Stock: <span className="font-bold text-blue-600">{p.stock_quantity}</span> units</p>
              
              {canEdit && (
                <button onClick={() => handleDeleteProduct(p.id)} className="mt-auto w-full bg-red-100 text-red-700 hover:bg-red-200 font-bold py-2 rounded-lg transition">
                  Delete Product
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- SALES ---
function SalesView({ token }) {
  const [products, setProducts] = useState([]);
  const [dispatchProduct, setDispatchProduct] = useState(null);
  const [updatePriceProduct, setUpdatePriceProduct] = useState(null);
  const [quantity, setQuantity] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = () => {
    fetch(`${API_URL}/api/sales/products?token=${token}`)
      .then(res => res.json())
      .then(d => setProducts(d.products));
  };

  useEffect(() => { loadProducts(); }, [token]);

  const handleDispatch = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/sales/dispatch?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: dispatchProduct.id, quantity: parseInt(quantity) })
    });
    const data = await res.json();
    
    if (res.ok) {
      alert(data.message);
      setDispatchProduct(null);
      setQuantity('');
      loadProducts();
    } else {
      alert(data.detail);
    }
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/sales/products/${updatePriceProduct.id}?token=${token}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ price: parseFloat(newPrice) })
    });
    if (res.ok) {
      setUpdatePriceProduct(null);
      setNewPrice('');
      loadProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h3 className="text-xl font-bold text-slate-800 w-full md:w-auto">Finished Goods for Dispatch</h3>
        <input 
          type="text" 
          placeholder="Search products..." 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      
      {dispatchProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-sm">
            <h4 className="font-bold text-xl mb-4 text-slate-800">Dispatch: {dispatchProduct.name}</h4>
            <form onSubmit={handleDispatch}>
              <label className="block text-sm font-bold mb-2">Quantity to Dispatch (Max: {dispatchProduct.stock_quantity})</label>
              <input type="number" min="1" max={dispatchProduct.stock_quantity} required className="w-full border p-2 rounded mb-4" value={quantity} onChange={e => setQuantity(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setDispatchProduct(null)} className="w-full bg-slate-200 py-2 rounded font-bold">Cancel</button>
                <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded font-bold">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {updatePriceProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-sm">
            <h4 className="font-bold text-xl mb-4 text-slate-800">Set Price: {updatePriceProduct.name}</h4>
            <form onSubmit={handleUpdatePrice}>
              <label className="block text-sm font-bold mb-2">Price (₦)</label>
              <input type="number" min="0" required className="w-full border p-2 rounded mb-4" value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              <div className="flex gap-2">
                <button type="button" onClick={() => setUpdatePriceProduct(null)} className="w-full bg-slate-200 py-2 rounded font-bold">Cancel</button>
                <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-bold">Save Price</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        {filteredProducts.length === 0 ? <p className="text-slate-500 col-span-full">No products found.</p> : filteredProducts.map(p => {
          const isWideProduct = ['pvc_pipe.jpg', 'chair.jpg', 'tank.jpg'].includes(p.image_url);

          return (
            <div key={p.id} className="border p-4 rounded-xl shadow-sm flex flex-col justify-between bg-white hover:shadow-md transition border-slate-200">
              <div className="h-40 md:h-48 bg-white border border-slate-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden p-2 md:p-4">
                <img 
                  src={`/products/${p.image_url}`} 
                  alt={p.name} 
                  className={`object-contain h-full w-full ${isWideProduct ? 'scale-x-150' : ''}`} 
                  onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerText = 'No Image'; }} 
                />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-800">{p.name}</h4>
                <p className="text-slate-500 text-sm mt-1 mb-2">Available: {p.stock_quantity} units</p>
                <p className={`font-extrabold text-lg md:text-xl ${Number(p.price) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {Number(p.price) > 0 ? `₦${Number(p.price).toLocaleString()}` : 'Price Not Set'}
                </p>
              </div>
              
              <div className="mt-4 flex flex-col gap-2">
                {Number(p.price) === 0 && (
                  <button onClick={() => { setUpdatePriceProduct(p); setNewPrice(''); }} className="w-full bg-green-100 text-green-700 hover:bg-green-200 font-bold py-2 rounded-lg transition text-sm">
                    Update Price
                  </button>
                )}
                <button onClick={() => setDispatchProduct(p)} disabled={p.stock_quantity === 0} className={`w-full font-bold py-2 rounded-lg transition text-sm ${p.stock_quantity === 0 ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                  {p.stock_quantity === 0 ? 'Out of Stock' : 'Create Dispatch'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
              }
// ==========================================
// 4. ADMIN: USER MANAGEMENT & BROADCAST
// ==========================================
function UserManagementView({ token }) {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role_id: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/roles`).then(res => res.json()).then(data => setRoles(data));
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault(); setMessage(''); setError('');
    try {
      const res = await fetch(`${API_URL}/api/admin/users?token=${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role_id: parseInt(formData.role_id) })
      });
      const data = await res.json();
      if (res.ok) { setMessage(data.message); setFormData({ full_name: '', email: '', password: '', role_id: '' }); }
      else { setError(data.detail); }
    } catch (err) { setError("Failed"); }
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto w-full">
      <h3 className="text-xl md:text-2xl font-bold mb-6 text-slate-800">Provision New Employee</h3>
      {message && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 font-bold">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 font-bold">{error}</div>}
      <form onSubmit={handleCreateUser} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <input type="text" placeholder="Full Name" required className="w-full px-4 py-2 border rounded-lg" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
          <input type="email" placeholder="Email" required className="w-full px-4 py-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <input type="text" placeholder="Temporary Password" required className="w-full px-4 py-2 border rounded-lg" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          <select required className="w-full px-4 py-2 border rounded-lg bg-white" value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}>
            <option value="">-- Select Role --</option>
            {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
          </select>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg">Create User</button>
      </form>
    </div>
  );
}

function BroadcastView({ token }) {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({ role_id: '', message: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/roles`).then(res => res.json()).then(data => setRoles(data));
  }, []);

  const handleBroadcast = async (e) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/api/admin/broadcast?token=${token}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: parseInt(formData.role_id), message: formData.message })
    });
    const data = await res.json();
    setStatus(data.message);
    setFormData({ role_id: '', message: '' });
  };

  return (
    <div className="bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto w-full">
      <h3 className="text-xl md:text-2xl font-bold mb-6 text-slate-800">Broadcast Message</h3>
      <p className="text-slate-500 mb-6 text-sm md:text-base">Send a popup alert to an entire department (e.g., Ask Production to delete a product).</p>
      {status && <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 font-bold">{status}</div>}
      <form onSubmit={handleBroadcast} className="space-y-5">
        <select required className="w-full px-4 py-2 border rounded-lg bg-white" value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}>
          <option value="">-- Select Department --</option>
          {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
        </select>
        <textarea required placeholder="Type your message here..." className="w-full px-4 py-2 border rounded-lg h-32 resize-none" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
        <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700">Send Broadcast</button>
      </form>
    </div>
  );
}

// ==========================================
// 5. APP ROUTER
// ==========================================
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('fiveforge_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Login setAuth={setUser} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} setAuth={setUser} /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
                                                                                                      }
