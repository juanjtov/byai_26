import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Container } from '@/components/common';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center py-12 px-4">
      <Container className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group mb-8">
            <div className="relative h-8 w-8 transition-all duration-300 group-hover:glow-signal">
              <div className="absolute inset-0 rotate-45 border border-copper transition-colors group-hover:border-signal" />
              <div className="absolute inset-2 rotate-45 border border-copper/50 transition-colors group-hover:border-signal/50" />
            </div>
            <span className="font-display text-xl tracking-widest text-ivory">REMODLY</span>
          </Link>
          <h1 className="font-display text-3xl text-ivory">Welcome back</h1>
          <p className="mt-2 text-body">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm text-ivory/80 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-ivory/80 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="mt-8 text-center text-body">
          Don't have an account?{' '}
          <Link to="/signup" className="text-copper hover:text-copper/80 transition-colors">
            Sign up
          </Link>
        </p>
      </Container>
    </div>
  );
}
