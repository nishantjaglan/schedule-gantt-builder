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
    <div className="min-h-screen flex flex-col" style={{ background: '#F5F5F5' }}>

      {/* Top utility bar — Accenture black */}
      <div className="flex items-center justify-between px-6 py-1.5 text-xs text-white"
        style={{ background: '#1a1a1a' }}>
        <span className="flex items-center gap-2">
          <span className="font-black text-sm leading-none" style={{ color: '#A100FF' }}>&gt;</span>
          <span className="opacity-70 hidden sm:inline">Accenture</span>
          <span className="opacity-30 mx-0.5 hidden sm:inline">|</span>
          <a href="https://accenture.com" target="_blank" rel="noopener noreferrer"
            className="hidden sm:inline hover:underline opacity-60">accenture.com</a>
        </span>
        <span className="font-medium opacity-70 hidden sm:block text-[11px]">
          FI$Cal Programme Management Office
        </span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">

          {/* Logo */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded mb-3 shadow-md"
              style={{ background: '#1a1a1a' }}>
              <span className="font-black text-4xl leading-none" style={{ color: '#A100FF' }}>&gt;</span>
            </div>
            <div className="text-2xl font-black tracking-tight leading-none text-black">
              Accenture
            </div>
            <div className="text-sm text-gray-500 mt-1 font-medium">
              Schedule &amp; Gantt Builder
            </div>
          </div>

          {/* Login card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100" style={{ background: '#1a1a1a' }}>
              <h1 className="text-base font-bold text-white">Sign in to your account</h1>
              <p className="text-xs mt-0.5" style={{ color: '#A100FF' }}>
                Access is granted by your PMO administrator
              </p>
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
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
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
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm text-gray-800 outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all"
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
                style={{ background: '#A100FF' }}
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
        Accenture · FI$Cal Programme Management · Restricted Access
      </div>
    </div>
  );
}
