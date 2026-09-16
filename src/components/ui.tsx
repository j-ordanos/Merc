'use client';
import { Field, useField } from 'formik';
import { ArrowRight, LoaderCircle, Minus, Plus } from 'lucide-react';
import Link from 'next/link';
export function Spinner() {
  return <LoaderCircle className="spin" size={18} aria-hidden="true" />;
}
export function EmptyState({
  title,
  description,
  href = '/products',
  action = 'Explore the collection',
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-symbol">m.</span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button" href={href}>
        {action}
        <ArrowRight size={17} />
      </Link>
    </div>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div className={`notice ${error ? 'notice-error' : ''}`} role={error ? 'alert' : 'status'}>
      {children}
    </div>
  );
}
export function FormField({
  label,
  name,
  as,
  ...props
}: {
  label: string;
  name: string;
  as?: string;
  type?: string;
  autoComplete?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const [, meta] = useField(name);
  const invalid = Boolean(meta.touched && meta.error);
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      <Field
        id={name}
        name={name}
        as={as}
        {...props}
        aria-invalid={invalid}
        aria-describedby={invalid ? `${name}-error` : undefined}
      />
      {invalid && (
        <span id={`${name}-error`} className="field-error">
          {meta.error}
        </span>
      )}
    </div>
  );
}
export function Quantity({
  quantity,
  onChange,
  name,
}: {
  quantity: number;
  onChange: (n: number) => void;
  name: string;
}) {
  return (
    <div className="quantity">
      <button
        aria-label={`Decrease ${name} quantity`}
        disabled={quantity <= 1}
        onClick={() => onChange(quantity - 1)}
      >
        <Minus size={14} />
      </button>
      <span aria-live="polite">{quantity}</span>
      <button
        aria-label={`Increase ${name} quantity`}
        disabled={quantity >= 10}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}
