import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const inputClass =
  'w-full bg-white border text-slate-800 placeholder-slate-400 rounded-lg px-4 py-2.5 text-sm transition focus:outline-none focus:ring-0';

const LoginPage = (): JSX.Element => {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail]         = useState<string>('');
  const [password, setPassword]   = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLocalError(null);
    try {
      await login(email, password);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        setLocalError('Cannot connect to server. Make sure the server is running on port 5000.');
      } else {
        setLocalError(error.response?.data?.message || 'Login failed');
      }
    }
  };

  const displayError = localError ?? error;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#f1f5f9' }}
    >
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-slate-900">Job</span>
            <span style={{ color: '#534AB7' }}>Pilot</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Your AI-powered job search co-pilot</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-8 shadow-sm"
          style={{ border: '1px solid #e2e8f0' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Error banner */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {displayError}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                style={{ borderColor: '#e2e8f0' }}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                style={{ borderColor: '#e2e8f0' }}
              />
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-semibold rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ background: '#534AB7' }}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#534AB7' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
