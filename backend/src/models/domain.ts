export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}
export interface AuthSession {
  token: string;
  user: AuthUser;
}
export interface DeviceRecord {
  id: string;
  name: string;
  type: string;
  connected: boolean;
  ip?: string;
  lastSync?: string;
  revoked: boolean;
  publicKey?: string;
  metadata?: unknown;
  approvalStatus?: "pending" | "approved" | "revoked";
  status?: "connected" | "offline" | "pending_approval" | "revoked";
  pairedAt?: string;
}
export interface PairingToken {
  id: string;
  code: string;
  publicKey: string;
  expiresAt: string;
  status: "waiting" | "expired" | "claimed";
}
export interface SystemMetrics {
  cpu: number;
  ram: number;
  disk: number;
  gpu: number;
  hermesStatus: string;
  lastSync: string;
  taskCount: number;
  connectedDevices: number;
}
export interface TaskRecord {
  id: string;
  title: string;
  description?: string;
  priority: "baixa" | "média" | "alta";
  category: string;
  reminderAt?: string;
  status: "pendente" | "em andamento" | "concluída" | "cancelada";
  createdAt: string;
  updatedAt: string;
}
export interface NotificationRecord {
  id: string;
  title: string;
  description: string;
  read: boolean;
  createdAt: string;
}
