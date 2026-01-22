"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Shield, Building2, Users } from "lucide-react";

// Test accounts for demo login
const TEST_ACCOUNTS = [
  { id: 'ADM-SUPER-001', name: 'System Administrator', email: 'superadmin@ecopoints.com', role: 'Super Admin', location: 'All Locations', color: 'red' },
  { id: 'ADM-A-001', name: 'Maria Santos', email: 'headadmin.schoola@ecopoints.com', role: 'Head Admin', location: 'School A', color: 'purple' },
  { id: 'ADM-A-002', name: 'Carlos Reyes', email: 'auditor.schoola@ecopoints.com', role: 'Auditor', location: 'School A', color: 'blue' },
  { id: 'ADM-A-003', name: 'Ana Lim', email: 'inventory.schoola@ecopoints.com', role: 'Inventory Officer', location: 'School A', color: 'emerald' },
  { id: 'ADM-B-001', name: 'Juan Dela Cruz', email: 'headadmin.schoolb@ecopoints.com', role: 'Head Admin', location: 'School B', color: 'purple' },
  { id: 'ADM-B-002', name: 'Patricia Tan', email: 'auditor.schoolb@ecopoints.com', role: 'Auditor', location: 'School B', color: 'blue' },
  { id: 'ADM-B-003', name: 'Roberto Garcia', email: 'inventory.schoolb@ecopoints.com', role: 'Inventory Officer', location: 'School B', color: 'emerald' },
];

// Role badge colors
const roleColors = {
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function LogIn({ onClose }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();

    // Check for traditional admin login
    if (username === "admin" && password === "admin123") {
      // Store selected account ID in localStorage (or just use Super Admin if none selected)
      const accountId = selectedAccount?.id || 'ADM-SUPER-001';
      localStorage.setItem('ecopoints_current_user', accountId);
      router.push("/admin");
      return;
    }

    // Check if they selected a test account and just clicked login
    if (selectedAccount) {
      localStorage.setItem('ecopoints_current_user', selectedAccount.id);
      router.push("/admin");
      return;
    }

    setError("Invalid credentials! Try 'admin' and 'admin123'");
  };

  const handleQuickLogin = (account) => {
    localStorage.setItem('ecopoints_current_user', account.id);
    router.push("/admin");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="primary-color border border-lime-500/30 p-8 rounded-2xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-lime-300 hover:text-white font-bold text-xl"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold text-center mb-6 text-white">
          Admin Login
        </h2>

        {/* Test Account Quick Select */}
        <div className="mb-6">
          <p className="text-xs text-lime-400 font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
            <Users size={14} />
            Quick Login (Demo Accounts)
          </p>

          <button
            type="button"
            onClick={() => setShowAccountPicker(!showAccountPicker)}
            className="w-full p-3 rounded-lg bg-black/40 text-white border border-lime-500/30 
              hover:border-orange-400 transition-all flex items-center justify-between"
          >
            {selectedAccount ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-lime-500/20 flex items-center justify-center text-xs font-bold text-lime-400">
                  {selectedAccount.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{selectedAccount.name}</p>
                  <p className="text-xs text-gray-400">{selectedAccount.role} • {selectedAccount.location}</p>
                </div>
              </div>
            ) : (
              <span className="text-gray-400">Select a test account...</span>
            )}
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showAccountPicker ? 'rotate-180' : ''}`} />
          </button>

          {/* Account Picker Dropdown */}
          {showAccountPicker && (
            <div className="mt-2 rounded-lg bg-black/80 border border-lime-500/30 overflow-hidden">
              {TEST_ACCOUNTS.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    setSelectedAccount(account);
                    setShowAccountPicker(false);
                  }}
                  onDoubleClick={() => handleQuickLogin(account)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-lime-900/30 transition-colors border-b border-lime-500/10 last:border-0
                    ${selectedAccount?.id === account.id ? 'bg-lime-900/40' : ''}`}
                >
                  <div className="w-10 h-10 rounded-full bg-lime-500/20 flex items-center justify-center text-xs font-bold text-lime-400">
                    {account.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-white">{account.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${roleColors[account.color]}`}>
                        {account.role}
                      </span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Building2 size={10} />
                        {account.location}
                      </span>
                    </div>
                  </div>
                  {selectedAccount?.id === account.id && (
                    <div className="w-2 h-2 rounded-full bg-lime-400"></div>
                  )}
                </button>
              ))}
            </div>
          )}

          <p className="text-[10px] text-gray-500 mt-2 text-center">
            Double-click an account for instant login
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 border-t border-lime-500/20"></div>
          <span className="text-xs text-gray-500 uppercase tracking-wider">or use credentials</span>
          <div className="flex-1 border-t border-lime-500/20"></div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-white font-bold ml-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded bg-black/40 text-white border border-lime-500/30 focus:border-orange-400 focus:outline-none placeholder-gray-400"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="text-sm text-white font-bold ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-black/40 text-white border border-lime-500/30 focus:border-orange-400 focus:outline-none placeholder-gray-400"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center font-bold">{error}</p>
          )}

          <button
            type="submit"
            className="mt-4 accent-color-background hover:bg-orange-400 text-black font-bold py-3 rounded transition-all shadow-[0_0_15px_rgba(132,204,22,0.5)]"
          >
            {selectedAccount ? `Login as ${selectedAccount.name}` : 'Access Dashboard'}
          </button>
        </form>

        <p className="text-xs text-center text-gray-300 mt-4">
          (Prototype Hint: User: <strong>admin</strong> | Pass: <strong>admin123</strong>)
        </p>
      </div>
    </div>
  );
}
