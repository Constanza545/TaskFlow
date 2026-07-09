import { FormEvent, useEffect, useState } from 'react';
import { api, getApiErrorMessage } from '../services/api';
import { getSocket } from '../services/socket';
import { useApiQuery } from '../hooks/useApiQuery';
import { useAuth } from '../hooks/useAuth';
import { Button, Card, Input } from './ui';
import { Task, TaskStatus } from '../types';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'pendiente', label: 'Pendiente' },
  { status: 'en_progreso', label: 'En progreso' },
  { status: 'completada', label: 'Completada' },
];

export function TaskBoard() {
  const { user } = useAuth();
  const { data: tasks, refetch } = useApiQuery<Task[]>('/tasks');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const canWrite = user?.role === 'admin' || user?.role === 'miembro';
  const canDelete = user?.role === 'admin';

  useEffect(() => {
    // Cualquier acción de otro usuario (crear, cambiar estado, eliminar)
    // emite "activity:new"; recargamos para ver el tablero siempre al día.
    const socket = getSocket();
    if (!socket) return;
    socket.on('activity:new', refetch);
    return () => {
      socket.off('activity:new', refetch);
    };
  }, [refetch]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return;
    try {
      await api.post('/tasks', { title });
      setTitle('');
      refetch();
    } catch (err) {
      setError(getApiErrorMessage(err) ?? 'No se pudo crear la tarea');
    }
  }

  async function handleStatusChange(id: number, status: TaskStatus) {
    await api.patch(`/tasks/${id}/status`, { status });
    refetch();
  }

  async function handleDelete(id: number) {
    await api.delete(`/tasks/${id}`);
    refetch();
  }

  return (
    <Card title="Tablero de tareas">
      {canWrite && (
        <form onSubmit={handleCreate} className="flex gap-2 mb-4">
          <Input
            className="flex-1"
            placeholder="Nueva tarea..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Button>Agregar</Button>
        </form>
      )}
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {!canWrite && (
        <p className="text-xs text-gray-400 mb-3">Tu rol (invitado) solo tiene permiso de lectura.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.status} className="bg-[#f7f6fb] rounded-xl p-3">
            <h3 className="text-sm font-medium text-gray-600 mb-2">{col.label}</h3>
            <div className="space-y-2">
              {(tasks ?? [])
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <div key={task.id} className="bg-white border rounded p-2 text-sm shadow-sm">
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-500">{task.description}</p>
                    )}
                    {canWrite && (
                      <div className="flex items-center justify-between mt-2">
                        <select
                          className="text-xs border rounded px-1 py-0.5"
                          value={task.status}
                          onChange={(e) =>
                            handleStatusChange(task.id, e.target.value as TaskStatus)
                          }
                        >
                          {COLUMNS.map((c) => (
                            <option key={c.status} value={c.status}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="text-xs text-red-500 hover:underline"
                          >
                            eliminar
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
