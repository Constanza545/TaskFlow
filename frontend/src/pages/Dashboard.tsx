import { useAuth } from '../hooks/useAuth';
import { TaskBoard } from '../components/TaskBoard';

export function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name.split(' ')[0] ?? '';

  return (
    <>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Hola, {firstName} 👋</h2>
        <p className="text-sm text-gray-500">
          Organizá las tareas del equipo; los cambios se sincronizan en tiempo real.
        </p>
      </div>
      <TaskBoard />
    </>
  );
}
