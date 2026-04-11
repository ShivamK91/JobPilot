import { useState, FormEvent } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const inputClass =
  'w-full bg-white border text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg px-4 py-2.5 text-sm transition focus:outline-none focus:ring-0';

const RegisterPage = (): JSX.Element => {
  const { register, isLoading, error } = useAuth();
  const [email, setEmail]     = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirm, setConfirm]   = useState<string>('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirm) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      await register(email, password);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        if (err.code === 'ERR_NETWORK') {
          setLocalError('Cannot connect to server. Make sure the server is running on port 5000.');
        } else {
          setLocalError((err.response?.data as { message?: string })?.message ?? 'Registration failed');
        }
      } else {
        setLocalError('An unexpected error occurred.');
      }
    }
  };

  const displayError = localError ?? error;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-slate-900">Job</span>
            <span style={{ color: '#534AB7' }}>Pilot</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">Start your job search journey</p>
        </div>

        {/* Card */}
        <div
          className="bg-white rounded-2xl p-8 shadow-sm"
          style={{ border: '1px solid var(--border)' }}
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
              <label htmlFor="register-email" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Email address
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="register-password" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputClass}
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="register-confirm" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                Confirm password
              </label>
              <input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-semibold rounded-lg px-4 py-2.5 text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ background: '#534AB7' }}
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          {/* Footer link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#534AB7' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
