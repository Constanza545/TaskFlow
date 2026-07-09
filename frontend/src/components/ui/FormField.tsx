import { InputHTMLAttributes } from 'react';
import { Input } from './Input';

/** Campo de formulario: label accesible + input a ancho completo. */
export function FormField({
  label,
  id,
  ...inputProps
}: { label: string; id: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      <Input id={id} className="w-full" {...inputProps} />
    </div>
  );
}
