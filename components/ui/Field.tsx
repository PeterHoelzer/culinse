"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import Icon, { type IconName } from "./Icon";

/*
  Formularfelder (DESIGN.md §5): 44 px hoch, Rahmen line-strong, Radius 4,
  sichtbares Label, Fehler unter dem Feld per aria-describedby.
*/

const fieldBase =
  "w-full rounded-1 border bg-surface text-ink placeholder:text-ink-3 transition-colors duration-150 " +
  "focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30 disabled:bg-surface-soft disabled:text-ink-3";

function borderFor(error?: string) {
  return error ? "border-error" : "border-line-strong";
}

interface WrapperProps {
  id: string;
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Label nur für Screenreader (z. B. Suchfeld mit Platzhalter und Icon) */
  hideLabel?: boolean;
  className?: string;
  children: ReactNode;
}

function Wrapper({ id, label, hint, error, hideLabel, className = "", children }: WrapperProps) {
  return (
    <div className={["flex flex-col gap-1.5", className].join(" ")}>
      {label && (
        <label htmlFor={id} className={hideLabel ? "sr-only" : "text-base font-semibold text-ink"}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-caption text-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="flex items-start gap-1.5 text-sm text-error">
          <Icon name="alert" size={18} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, hint?: ReactNode, error?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "size"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  hideLabel?: boolean;
  leadingIcon?: IconName;
  className?: string;
  inputClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, hideLabel, leadingIcon, className, inputClassName = "", id: givenId, ...rest },
  ref
) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} className={className}>
      <div className="relative">
        {leadingIcon && (
          <Icon name={leadingIcon} size={20} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
        )}
        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...rest}
          className={[fieldBase, borderFor(error), "h-11 text-base", leadingIcon ? "pl-11 pr-3.5" : "px-3.5", inputClassName].join(" ")}
        />
      </div>
    </Wrapper>
  );
});

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  hideLabel?: boolean;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, hideLabel, className, id: givenId, rows = 4, ...rest },
  ref
) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} className={className}>
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        {...rest}
        className={[fieldBase, borderFor(error), "px-3.5 py-2.5 text-base leading-relaxed"].join(" ")}
      />
    </Wrapper>
  );
});

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "className"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  hideLabel?: boolean;
  className?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, hideLabel, className, id: givenId, children, ...rest },
  ref
) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} hideLabel={hideLabel} className={className}>
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          {...rest}
          className={[fieldBase, borderFor(error), "h-11 appearance-none pl-3.5 pr-10 text-base"].join(" ")}
        >
          {children}
        </select>
        <Icon name="chevronDown" size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3" />
      </div>
    </Wrapper>
  );
});

/** Checkbox mit Label rechts, 20 px, grüner Haken (Zutatenliste, Einstellungen) */
export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type"> {
  label: ReactNode;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox({ label, className = "", id: givenId, ...rest }, ref) {
  const autoId = useId();
  const id = givenId ?? autoId;
  return (
    <label htmlFor={id} className={["flex cursor-pointer items-start gap-3 text-base text-ink", className].join(" ")}>
      <input ref={ref} id={id} type="checkbox" {...rest} className="mt-[3px] h-5 w-5 shrink-0 cursor-pointer rounded-1 border-line-strong accent-green" />
      <span>{label}</span>
    </label>
  );
});
