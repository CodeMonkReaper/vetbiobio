import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-brand-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none',
  secondary:
    'bg-surface text-ink border border-border shadow-sm hover:bg-surface-alt hover:border-border-hover active:bg-slate-200 focus-visible:outline-brand-700 disabled:opacity-50 disabled:border-border-subtle',
  outline:
    'bg-transparent text-brand-700 border border-brand-600 hover:bg-brand-50 active:bg-brand-100 focus-visible:outline-brand-700 disabled:opacity-50',
  ghost:
    'bg-transparent text-brand-700 hover:bg-brand-50 active:bg-brand-100 focus-visible:outline-brand-700 disabled:opacity-50',
  danger:
    'bg-rose-50 text-rose-900 border border-rose-300 hover:bg-rose-100 active:bg-rose-200 focus-visible:outline-rose-700 disabled:opacity-50',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-sm',
  md: 'min-h-[44px] px-4 py-2 text-base',
  lg: 'min-h-[48px] px-6 py-3 text-lg font-semibold',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    type = 'button',
    isLoading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    className = '',
    children,
    ...rest
  },
  ref
) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors select-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {isLoading ? (
        <svg
          className="h-4 w-4 animate-spin motion-reduce:animate-none"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
});

Button.displayName = 'Button';
