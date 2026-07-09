import { ButtonHTMLAttributes } from 'react';

/** Botón de acción primaria: pill con degradado púrpura→fucsia. */
export function Button({ className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white px-5 py-2
        rounded-full text-sm font-semibold shadow-md shadow-fuchsia-500/30
        hover:from-purple-700 hover:to-fuchsia-600 transition-colors
        disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
