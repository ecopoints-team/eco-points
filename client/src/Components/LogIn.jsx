"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Accept the onClose prop so we can close the modal
export default function LogIn({ onClose }) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === "admin" && password === "admin123") {
        router.push('/admin');
    } else {
        setError("Invalid credentials! Try 'admin' and 'admin123'");
    }
  };

  return (
    // 1. OVERLAY WRAPPER (The dark background)
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      
      {/* 2. THE MODAL BOX */}
      <div className="bg-lime-900/90 border border-lime-500/30 p-8 rounded-2xl shadow-2xl w-full max-w-md relative">
        
        {/* Close Button (X) */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-lime-300 hover:text-white font-bold text-xl"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold text-center mb-6 text-white">Admin Login</h2>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-sm text-lime-300 font-bold ml-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded bg-black/40 text-white border border-lime-500/30 focus:border-lime-400 focus:outline-none placeholder-gray-500"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="text-sm text-lime-300 font-bold ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-black/40 text-white border border-lime-500/30 focus:border-lime-400 focus:outline-none placeholder-gray-500"
              placeholder="Enter password"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center font-bold">{error}</p>}

          <button 
            type="submit" 
            className="mt-4 bg-lime-500 hover:bg-lime-400 text-black font-bold py-3 rounded transition-all shadow-[0_0_15px_rgba(132,204,22,0.5)]"
          >
            Access Dashboard
          </button>
        </form>
        
        <p className="text-xs text-center text-gray-400 mt-4">
          (Prototype Hint: User: <strong>admin</strong> | Pass: <strong>admin123</strong>)
        </p>
      </div>
    </div>
  );
}