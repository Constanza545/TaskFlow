import { Role } from '../types';

const STYLES: Record<Role, string> = {
  admin: 'bg-pink-100 text-pink-700',
  miembro: 'bg-purple-100 text-purple-700',
  invitado: 'bg-gray-100 text-gray-600',
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STYLES[role]}`}>
      {role}
    </span>
  );
}
