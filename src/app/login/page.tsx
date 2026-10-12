'use client';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Invalid username or password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F0F4F8' }}>

      {/* Top utility bar */}
      <div className="flex items-center justify-between px-6 py-1.5 text-xs text-white"
        style={{ background: '#2A618D' }}>
        <span className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white/20 font-bold text-[10px] border border-white/30">
            CA
          </span>
          <span className="opacity-80">State of California</span>
          <span className="opacity-40 mx-0.5 hidden sm:inline">|</span>
          <a href="https://ca.gov" target="_blank" rel="noopener noreferrer"
            className="hidden sm:inline hover:underline opacity-80">ca.gov</a>
        </span>
        <span className="font-medium opacity-90">FI$Cal Programme Management Office</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          {/* Logo card */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 shadow-md"
              style={{ background: '#2A618D' }}>
              <svg viewBox="0 0 40 40" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                <g fill="white">
                  <ellipse cx="20" cy="25" rx="8" ry="7"/>
                  <circle cx="20" cy="15.5" r="5.5"/>
                  <circle cx="15.5" cy="11.5" r="2.5"/>
                  <circle cx="24.5" cy="11.5" r="2.5"/>
                  <ellipse cx="20" cy="17.5" rx="3" ry="2"/>
                  <rect x="12" y="28" width="3" height="5" rx="1.5"/>
                  <rect x="25" y="28" width="3" height="5" rx="1.5"/>
                </g>
                <text x="20" y="7" textAnchor="middle" fontSize="5" fill="#FFD700" fontFamily="serif">★</text>
              </svg>
            </div>
            <div className="text-3xl font-black tracking-tight leading-none">
              <span style={{ color: '#C4872B' }}>FI$</span><span style={{ color: '#1B3A6B' }}>Cal</span>
            </div>
            <div className="text-sm text-gray-500 mt-1 font-medium">Schedule &amp; Gantt Builder</div>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100"
              style={{ background: 'linear-gradient(135deg, #1B3A6B 0%, #2C5AA0 100%)' }}>
              <h1 className="text-base font-bold text-white">Sign in to your account</h1>
              <p className="text-xs text-blue-200 mt-0.5">Access is granted by your PMO administrator</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="Enter your username"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:border-blue-400 transition-all"
                  style={{ '--tw-ring-color': '#2A618D' } as React.CSSProperties}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:ring-2 focus:border-blue-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  <span className="shrink-0">⚠</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                style={{ background: '#C4872B' }}
              >
                <LogIn size={15} />
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Don&apos;t have access? Contact your PMO administrator.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="py-3 text-center text-xs text-gray-400 border-t border-gray-200 bg-white">
        State of California · FI$Cal Programme Management · Restricted Access
      </div>
    </div>
  );
}
