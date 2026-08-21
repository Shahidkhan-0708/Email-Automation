import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1419] px-4">
      <div className="w-full max-w-sm animate-[fadeInUp_0.6s_cubic-bezier(0.22,1,0.36,1)_both]">
        {/* Back to home */}
        <a href="/" className="flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition-colors animate-[fadeInUp_0.5s_cubic-bezier(0.22,1,0.36,1)_0.1s_both]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to home
        </a>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <svg width="32" height="32" viewBox="0 0 26 26" fill="none">
            <circle cx="13" cy="13" r="12" fill="#fff"/>
            <path d="M13 4a9 9 0 0 0 0 18c-3.2-2.2-5-5.4-5-9s1.8-6.8 5-9Z" fill="#141d26"/>
            <path d="M13 7.5a6.8 6.8 0 0 0 0 11c-1.9-1.5-3-3.4-3-5.5s1.1-4 3-5.5Z" fill="#141d26" opacity="0.55"/>
          </svg>
          <span className="text-white text-xl font-bold tracking-tight">Outreach</span>
        </div>

        <h1 className="text-white text-2xl font-semibold mb-2 animate-[fadeInUp_0.5s_cubic-bezier(0.22,1,0.36,1)_0.3s_both]">Welcome back</h1>
        <p className="text-white/50 text-sm mb-8 animate-[fadeInUp_0.5s_cubic-bezier(0.22,1,0.36,1)_0.4s_both]">Sign in to your outreach dashboard.</p>

        <form onSubmit={handleSubmit} className="space-y-4 animate-[fadeInUp_0.5s_cubic-bezier(0.22,1,0.36,1)_0.5s_both]">
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-white/70 text-sm font-medium mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-white text-[#141d26] font-semibold py-2.5 rounded-lg text-sm hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:transform-none"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-white/40 text-sm text-center mt-6">
          Don't have an account?{' '}
          <a href="/signup" className="text-white/70 hover:text-white transition-colors">Sign up</a>
        </p>
      </div>
    </div>
  );
}
