import { db } from "../database";

export interface NotificationPreferences {
  batterySaver: boolean;
  limitMobileData: boolean;
  quietHoursEnabled: boolean;
  quietStart: string;
  quietEnd: string;
  syncFrequency: "manual" | "15m" | "30m" | "1h" | "6h";
  notificationsEnabled: boolean;
}

const defaults: NotificationPreferences = {
  batterySaver: false,
  limitMobileData: true,
  quietHoursEnabled: true,
  quietStart: "22:00",
  quietEnd: "07:00",
  syncFrequency: "30m",
  notificationsEnabled: false,
};

export const nativeRepository = {
  preferences(userId: string): NotificationPreferences {
    const row = db
      .query(
        "SELECT battery_saver AS batterySaver,limit_mobile_data AS limitMobileData,quiet_hours_enabled AS quietHoursEnabled,quiet_start AS quietStart,quiet_end AS quietEnd,sync_frequency AS syncFrequency,notifications_enabled AS notificationsEnabled FROM notification_preferences WHERE user_id=?",
      )
      .get(userId) as
      | (Omit<
          NotificationPreferences,
          "batterySaver" | "limitMobileData" | "quietHoursEnabled" | "notificationsEnabled"
        > & {
          batterySaver: number;
          limitMobileData: number;
          quietHoursEnabled: number;
          notificationsEnabled: number;
        })
      | null;
    return row
      ? {
          ...row,
          batterySaver: Boolean(row.batterySaver),
          limitMobileData: Boolean(row.limitMobileData),
          quietHoursEnabled: Boolean(row.quietHoursEnabled),
          notificationsEnabled: Boolean(row.notificationsEnabled),
        }
      : defaults;
  },
  savePreferences(userId: string, input: Partial<NotificationPreferences>) {
    const value = { ...this.preferences(userId), ...input };
    db.prepare(
      `INSERT INTO notification_preferences (user_id,battery_saver,limit_mobile_data,quiet_hours_enabled,quiet_start,quiet_end,sync_frequency,notifications_enabled)
      VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET battery_saver=excluded.battery_saver,limit_mobile_data=excluded.limit_mobile_data,quiet_hours_enabled=excluded.quiet_hours_enabled,quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end,sync_frequency=excluded.sync_frequency,notifications_enabled=excluded.notifications_enabled,updated_at=CURRENT_TIMESTAMP`,
    ).run(
      userId,
      Number(value.batterySaver),
      Number(value.limitMobileData),
      Number(value.quietHoursEnabled),
      value.quietStart,
      value.quietEnd,
      value.syncFrequency,
      Number(value.notificationsEnabled),
    );
    return this.preferences(userId);
  },
  createNotification(input: {
    title: string;
    description: string;
    type?: string;
    scheduledFor?: string;
  }) {
    const id = `notification-${crypto.randomUUID()}`;
    db.prepare(
      "INSERT INTO notifications (id,title,description,type,scheduled_for) VALUES (?,?,?,?,?)",
    ).run(id, input.title, input.description, input.type ?? "general", input.scheduledFor ?? null);
    return { id, ...input };
  },
  createNativeAction(input: {
    userId: string;
    action: string;
    payload?: unknown;
    confirmationStatus: string;
  }) {
    const id = `native-action-${crypto.randomUUID()}`;
    db.prepare(
      "INSERT INTO native_action_requests (id,user_id,action,payload,confirmation_status) VALUES (?,?,?,?,?)",
    ).run(
      id,
      input.userId,
      input.action,
      input.payload ? JSON.stringify(input.payload) : null,
      input.confirmationStatus,
    );
    return { id, status: "recorded" };
  },
};
