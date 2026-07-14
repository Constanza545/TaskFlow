import { FormEvent, ReactNode, useEffect, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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

function TaskCard({
  task,
  canWrite,
  canDelete,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  canWrite: boolean;
  canDelete: boolean;
  onStatusChange: (id: number, status: TaskStatus) => void;
  onDelete: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !canWrite,
  });

  return (
    <div
      ref={setNodeRef}
      style={
        transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined
      }
      {...listeners}
      {...attributes}
      className={`bg-white border rounded p-2 text-sm shadow-sm ${
        canWrite ? 'cursor-grab active:cursor-grabbing touch-none' : ''
      } ${isDragging ? 'relative z-10 shadow-lg ring-2 ring-brand-200' : ''}`}
    >
      <p className="font-medium">{task.title}</p>
      {task.description && <p className="text-xs text-gray-500">{task.description}</p>}
      {canWrite && (
        // Los controles no deben iniciar un arrastre
        <div
          className="flex items-center justify-between mt-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <select
            className="text-xs border rounded px-1 py-0.5"
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          >
            {COLUMNS.map((c) => (
              <option key={c.status} value={c.status}>
                {c.label}
              </option>
            ))}
          </select>
          {canDelete && (
            <button
              onClick={() => onDelete(task.id)}
              className="text-xs text-red-500 hover:underline"
            >
              eliminar
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Column({
  status,
  label,
  children,
}: {
  status: TaskStatus;
  label: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl p-3 transition-colors ${
        isOver ? 'bg-brand-50 ring-2 ring-brand-200' : 'bg-[#f7f6fb]'
      }`}
    >
      <h3 className="text-sm font-medium text-gray-600 mb-2">{label}</h3>
      {/* min-h para que una columna vacía siga siendo zona de drop */}
      <div className="space-y-2 min-h-[2.5rem]">{children}</div>
    </div>
  );
}

export function TaskBoard() {
  const { user } = useAuth();
  const { data: tasks, refetch } = useApiQuery<Task[]>('/tasks');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  // Estado optimista: la tarjeta se mueve al soltarla y se revierte si la API falla
  const [optimistic, setOptimistic] = useState<Record<number, TaskStatus>>({});
  const canWrite = user?.role === 'admin' || user?.role === 'miembro';
  const canDelete = user?.role === 'admin';

  // El arrastre se activa tras 5px de movimiento, así los clics normales
  // (select, botones) siguen funcionando dentro de la tarjeta.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

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

  // Cuando el servidor ya refleja un movimiento, descartamos su override
  useEffect(() => {
    if (!tasks) return;
    setOptimistic((prev) => {
      const confirmed = Object.keys(prev).filter(
        (id) => tasks.find((t) => t.id === Number(id))?.status === prev[Number(id)],
      );
      if (confirmed.length === 0) return prev;
      const next = { ...prev };
      for (const id of confirmed) delete next[Number(id)];
      return next;
    });
  }, [tasks]);

  const shownTasks = (tasks ?? []).map((t) =>
    optimistic[t.id] ? { ...t, status: optimistic[t.id] } : t,
  );

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

  async function moveTask(id: number, status: TaskStatus) {
    setError(null);
    setOptimistic((prev) => ({ ...prev, [id]: status }));
    try {
      await api.patch(`/tasks/${id}/status`, { status });
      refetch();
    } catch (err) {
      setOptimistic((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setError(getApiErrorMessage(err) ?? 'No se pudo mover la tarea');
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const task = shownTasks.find((t) => t.id === Number(active.id));
    const status = over.id as TaskStatus;
    if (!task || task.status === status) return;
    void moveTask(task.id, status);
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
      {canWrite ? (
        <p className="text-xs text-gray-400 mb-3">
          Arrastra las tarjetas entre columnas para cambiar su estado.
        </p>
      ) : (
        <p className="text-xs text-gray-400 mb-3">
          Tu rol (invitado) solo tiene permiso de lectura.
        </p>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <Column key={col.status} status={col.status} label={col.label}>
              {shownTasks
                .filter((t) => t.status === col.status)
                .map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    canWrite={canWrite}
                    canDelete={canDelete}
                    onStatusChange={moveTask}
                    onDelete={handleDelete}
                  />
                ))}
            </Column>
          ))}
        </div>
      </DndContext>
    </Card>
  );
}
