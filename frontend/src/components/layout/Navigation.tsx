import { motion } from 'framer-motion';
import { useState } from 'react';
import { useScrollPosition } from '@/hooks/useScrollPosition';
import { Button, Container } from '@/components/common';

const navLinks = [
  { label: 'How It Works', href: '#solution' },
  { label: 'Features', href: '#demo' },
  { label: 'For Contractors', href: '#contractors' },
];

function Logo() {
  return (
    <a href="#" className="flex items-center gap-3">
      {/* Diamond icon */}
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rotate-45 border border-amber" />
        <div className="absolute inset-2 rotate-45 border border-amber/50" />
      </div>
      <span className="font-display text-xl tracking-widest text-ivory">REMODLY</span>
    </a>
  );
}

export function Navigation() {
  const scrollY = useScrollPosition();
  const isScrolled = scrollY > 50;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <motion.header
      className={`fixed left-0 right-0 top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-charcoal/80 backdrop-blur-lg'
          : 'bg-transparent'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container>
        <nav className="flex h-20 items-center justify-between">
          <Logo />

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm uppercase tracking-wider text-ivory/60 transition-colors hover:text-amber"
              >
                {link.label}
              </a>
            ))}
            <Button variant="outline" size="sm">
              Join Waitlist
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-ivory p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden border-t border-ivory/5 py-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-3 text-sm uppercase tracking-wider text-ivory/60 transition-colors hover:text-amber"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-4">
              <Button variant="outline" size="sm" className="w-full">
                Join Waitlist
              </Button>
            </div>
          </motion.div>
        )}
      </Container>
    </motion.header>
  );
}
