import { motion } from 'framer-motion';
import { Tooltip } from './Tooltip';

interface IconButtonProps {
  icon: 'reprocess' | 'delete';
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  variant?: 'default' | 'danger';
}

const icons = {
  reprocess: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  ),
  delete: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  ),
};

export function IconButton({
  icon,
  onClick,
  disabled = false,
  tooltip,
  variant = 'default',
}: IconButtonProps) {
  const baseClasses =
    'w-9 h-9 flex items-center justify-center rounded-lg transition-colors';

  const variantClasses = {
    default: 'text-body hover:text-copper hover:bg-copper/10',
    danger: 'text-body hover:text-red-400 hover:bg-red-500/10',
  };

  const disabledClasses = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : 'cursor-pointer';

  const button = (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      {icons[icon]}
    </motion.button>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{button}</Tooltip>;
  }

  return button;
}
