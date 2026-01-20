import { Container } from '@/components/common';

const footerLinks = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
  { label: 'Contact', href: '#' },
];

export function Footer() {
  return (
    <footer className="border-t border-ivory/5 bg-obsidian py-12">
      <Container>
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="relative h-6 w-6">
              <div className="absolute inset-0 rotate-45 border border-copper/60" />
              <div className="absolute inset-1.5 rotate-45 border border-copper/30" />
            </div>
            <span className="font-display text-lg tracking-widest text-ivory/60">
              REMODLY
            </span>
          </a>

          {/* Links */}
          <div className="flex gap-8">
            {footerLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-ivory/40 transition-colors hover:text-copper"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-sm text-ivory/30">
            &copy; {new Date().getFullYear()} Remodly
          </p>
        </div>
      </Container>
    </footer>
  );
}
