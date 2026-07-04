import { db } from "../database";
import type { NotificationRecord, SystemMetrics, TaskRecord } from "../models/domain";

const mapTask = (row: Record<string, unknown>) =>
  ({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    priority: row.priority,
    category: row.category,
    reminderAt: row.reminderAt ?? undefined,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }) as TaskRecord;

export const taskRepository = {
  metrics(): SystemMetrics {
    const taskCount = (
      db.query("SELECT COUNT(*) as count FROM tasks WHERE status != 'concluída'").get() as {
        count: number;
      }
    ).count;
    const connectedDevices = (
      db
        .query("SELECT COUNT(*) as count FROM devices WHERE connected = 1 AND revoked = 0")
        .get() as { count: number }
    ).count;
    const pc = db
      .query("SELECT last_sync as lastSync FROM devices WHERE id = 'hermes-pc-local'")
      .get() as { lastSync?: string } | null;
    return {
      cpu: 18,
      ram: 42,
      disk: 67,
      gpu: 24,
      hermesStatus: "Ativo",
      lastSync: pc?.lastSync ?? "nunca",
      taskCount,
      connectedDevices,
    };
  },
  listTasks(): TaskRecord[] {
    return (
      db
        .query(
          "SELECT id, title, description, priority, category, reminder_at as reminderAt, status, created_at as createdAt, updated_at as updatedAt FROM tasks ORDER BY created_at DESC",
        )
        .all() as Record<string, unknown>[]
    ).map(mapTask);
  },
  createTask(input: {
    title: string;
    description?: string;
    priority?: string;
    category?: string;
    reminderAt?: string;
  }) {
    const id = `task-${crypto.randomUUID()}`;
    db.prepare(
      "INSERT INTO tasks (id, title, description, priority, category, reminder_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(
      id,
      input.title,
      input.description ?? null,
      input.priority ?? "média",
      input.category ?? "Geral",
      input.reminderAt ?? null,
    );
    return this.listTasks().find((task) => task.id === id)!;
  },
  updateTask(id: string, input: Partial<TaskRecord>) {
    const current = this.listTasks().find((task) => task.id === id);
    if (!current) return null;
    db.prepare(
      "UPDATE tasks SET title = ?, description = ?, priority = ?, category = ?, reminder_at = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    ).run(
      input.title ?? current.title,
      input.description ?? current.description ?? null,
      input.priority ?? current.priority,
      input.category ?? current.category,
      input.reminderAt ?? current.reminderAt ?? null,
      input.status ?? current.status,
      id,
    );
    return this.listTasks().find((task) => task.id === id)!;
  },
  deleteTask(id: string) {
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
  },
  listNotifications(): NotificationRecord[] {
    return (
      db
        .query(
          "SELECT id, title, description, read, created_at as createdAt FROM notifications ORDER BY created_at DESC",
        )
        .all() as Array<Omit<NotificationRecord, "read"> & { read: number }>
    ).map((item) => ({ ...item, read: Boolean(item.read) }));
  },
  markNotificationRead(id: string) {
    db.prepare("UPDATE notifications SET read = 1 WHERE id = ?").run(id);
  },
};
