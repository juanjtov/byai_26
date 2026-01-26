import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Container } from '@/components/common';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, resendConfirmation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Email confirmation states
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signup(email, password, organizationName);
      if (result.requiresEmailConfirmation) {
        setSubmittedEmail(email);
        setEmailConfirmationSent(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');

    try {
      await resendConfirmation(submittedEmail);
      setCooldownSeconds(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend email');
    } finally {
      setResending(false);
    }
  };

  const handleGoBack = () => {
    setEmailConfirmationSent(false);
    setError('');
    setCooldownSeconds(0);
  };

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center py-12 px-4">
      <Container className="relative max-w-md w-full">
        {/* Close button */}
        <button
          onClick={() => navigate('/')}
          className="absolute right-4 top-4 text-ivory/40 hover:text-ivory transition-colors"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group mb-8">
            <div className="relative h-8 w-8 transition-all duration-300 group-hover:glow-signal">
              <div className="absolute inset-0 rotate-45 border border-copper transition-colors group-hover:border-signal" />
              <div className="absolute inset-2 rotate-45 border border-copper/50 transition-colors group-hover:border-signal/50" />
            </div>
            <span className="font-display text-xl tracking-widest text-ivory">REMODLY</span>
          </Link>
        </div>

        <AnimatePresence mode="wait">
          {!emailConfirmationSent ? (
            <motion.div
              key="signup-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl text-ivory">Create your account</h1>
                <p className="mt-2 text-body">Start generating instant estimates</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="organizationName" className="block text-sm text-ivory/80 mb-2">
                    Company Name
                  </label>
                  <input
                    id="organizationName"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors disabled:opacity-50"
                    placeholder="Your Company LLC"
                  />
                </div>

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
                    disabled={loading}
                    className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors disabled:opacity-50"
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
                    disabled={loading}
                    minLength={6}
                    className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors disabled:opacity-50"
                    placeholder="At least 6 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-copper text-obsidian font-medium rounded-lg hover:bg-copper/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating account...' : 'Create account'}
                </button>
              </form>

              <p className="mt-8 text-center text-body">
                Already have an account?{' '}
                <Link to="/login" className="text-copper hover:text-copper/80 transition-colors">
                  Sign in
                </Link>
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="confirmation-screen"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-center"
            >
              {/* Email Icon */}
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-copper/10 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-copper"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>

              {/* Heading */}
              <h1 className="font-display text-3xl text-ivory mb-4">Check your inbox</h1>

              {/* Message */}
              <p className="text-body mb-2">
                We've sent a confirmation link to
              </p>
              <p className="text-copper font-medium mb-4">
                {submittedEmail}
              </p>

              {/* Helper text */}
              <p className="text-ivory/50 text-sm mb-8">
                Click the link in the email to verify your account.
                <br />
                Don't forget to check your spam folder.
              </p>

              {/* Error message for resend failures */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm mb-6">
                  {error}
                </div>
              )}

              {/* Resend button */}
              <button
                onClick={handleResend}
                disabled={resending || cooldownSeconds > 0}
                className="w-full py-3 px-4 bg-copper/10 border border-copper/50 text-copper font-medium rounded-lg hover:bg-copper/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {resending
                  ? 'Sending...'
                  : cooldownSeconds > 0
                    ? `Resend available in ${cooldownSeconds}s`
                    : 'Resend email'
                }
              </button>

              {/* Go back link */}
              <button
                onClick={handleGoBack}
                className="text-ivory/60 hover:text-ivory transition-colors text-sm"
              >
                Wrong email? Go back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </div>
  );
}
