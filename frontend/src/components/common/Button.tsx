import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  type = 'button',
  disabled,
  onClick,
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium tracking-wider uppercase transition-all duration-300';

  const variants = {
    primary: 'bg-copper text-obsidian hover:bg-copper-hover',
    secondary:
      'bg-tungsten text-ivory border border-ivory/10 hover:border-copper/30',
    outline: 'bg-transparent text-copper border border-copper hover:bg-copper/10',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-sm',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
