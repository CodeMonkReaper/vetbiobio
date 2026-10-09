import type {
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';

export interface FieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  htmlFor,
  required = false,
  hint,
  error,
  children,
  className = '',
}: FieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1 text-sm font-semibold text-ink"
      >
        <span>{label}</span>
        {required && (
          <span
            aria-hidden="true"
            className="text-status-danger-text font-bold select-none"
            title="Campo obligatorio"
          >
            *
          </span>
        )}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-ink-mute">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-xs font-medium text-rose-800"
        >
          {error}
        </p>
      )}
    </div>
  );
}

const BASE_INPUT =
  'w-full min-h-[44px] rounded-md border bg-surface px-3 py-2 text-ink placeholder:text-ink-mute text-base sm:text-sm transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-1 disabled:bg-surface-alt disabled:text-ink-mute disabled:cursor-not-allowed';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export function Input({ hasError = false, className = '', ...props }: InputProps) {
  const borderStyles = hasError
    ? 'border-rose-400 focus-visible:outline-rose-700'
    : 'border-border hover:border-border-hover focus-visible:outline-brand-700';

  return (
    <input
      aria-invalid={hasError || undefined}
      className={`${BASE_INPUT} ${borderStyles} ${className}`}
      {...props}
    />
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export function Select({ hasError = false, className = '', children, ...props }: SelectProps) {
  const borderStyles = hasError
    ? 'border-rose-400 focus-visible:outline-rose-700'
    : 'border-border hover:border-border-hover focus-visible:outline-brand-700';

  return (
    <select
      aria-invalid={hasError || undefined}
      className={`${BASE_INPUT} ${borderStyles} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export function Textarea({ hasError = false, className = '', ...props }: TextareaProps) {
  const borderStyles = hasError
    ? 'border-rose-400 focus-visible:outline-rose-700'
    : 'border-border hover:border-border-hover focus-visible:outline-brand-700';

  return (
    <textarea
      aria-invalid={hasError || undefined}
      className={`w-full min-h-[96px] rounded-md border bg-surface p-3 text-ink placeholder:text-ink-mute text-base sm:text-sm transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-1 disabled:bg-surface-alt disabled:text-ink-mute ${borderStyles} ${className}`}
      {...props}
    />
  );
}

export interface CheckboxProps {
  id: string;
  label: string;
  description?: string;
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

/**
 * Checkbox accesible con touch target garantizado (min 44px) y área de interacción ampliada.
 */
export function Checkbox({
  id,
  label,
  description,
  checked,
  disabled = false,
  name,
  value,
  onChange,
  className = '',
}: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`inline-flex min-h-[44px] cursor-pointer items-start gap-3 select-none py-1.5 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'hover:text-brand-900'
      } ${className}`}
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-brand-600 accent-brand-600 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      />
      <div className="flex flex-col text-sm">
        <span className="font-medium text-ink leading-snug">{label}</span>
        {description && <span className="text-xs text-ink-mute leading-snug">{description}</span>}
      </div>
    </label>
  );
}
