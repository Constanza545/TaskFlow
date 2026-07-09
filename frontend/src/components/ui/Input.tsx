import { InputHTMLAttributes } from 'react';

/** Input de texto estándar; el ancho lo decide quien lo usa (`w-full`, `flex-1`, etc.). */
export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white
        focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
        transition-shadow ${className}`}
      {...props}
    />
  );
}
