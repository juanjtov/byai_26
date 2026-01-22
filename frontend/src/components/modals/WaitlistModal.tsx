import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/common';
import { waitlistApi } from '@/lib/api';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
}

export function WaitlistModal({ isOpen, onClose, source = 'hero_cta' }: WaitlistModalProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSubmitted(false);
      setError('');
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setLoading(true);

    try {
      await waitlistApi.join(email, source);
      setSubmitted(true);
      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join waitlist';
      if (message.includes('already on the waitlist')) {
        setSubmitted(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-obsidian/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="relative rounded-2xl border border-ivory/10 bg-obsidian p-8 shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-ivory/40 hover:text-ivory transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {!submitted ? (
                <>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-copper/20 flex items-center justify-center">
                      <svg className="h-6 w-6 text-copper" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h2 className="font-display text-2xl text-ivory">Get Early Access</h2>
                    <p className="mt-2 text-sm text-body">
                      Be among the first contractors to transform how you sell renovations.
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                      <div className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                        {error}
                      </div>
                    )}

                    <div>
                      <label htmlFor="modal-email" className="block text-sm text-ivory/80 mb-2">
                        Email address
                      </label>
                      <input
                        id="modal-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 bg-ivory/5 border border-ivory/10 rounded-lg text-ivory placeholder:text-ivory/40 focus:outline-none focus:border-copper transition-colors disabled:opacity-50"
                      />
                    </div>

                    <Button type="submit" variant="primary" size="lg" className="w-full" disabled={loading}>
                      {loading ? 'Joining...' : 'Join the Waitlist'}
                    </Button>

                    <p className="text-center text-xs text-ivory/40">
                      We'll reach out within 48 hours with your access details.
                    </p>
                  </form>
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-signal/20 flex items-center justify-center">
                    <svg className="h-8 w-8 text-signal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="font-display text-2xl text-ivory">You're on the list!</h2>
                  <p className="mt-2 text-body">
                    We'll be in touch soon with your early access details.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
