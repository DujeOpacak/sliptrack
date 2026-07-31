import { apiClient } from "./client";
import type { Notification } from "../types/notification";

export const notificationApi = {
  async getAll() {
    const response = await apiClient.get<Notification[]>("/notifications");
    return response.data;
  },
  async markAsRead(id: number) {
    const response = await apiClient.patch<Notification>(
      `/notifications/${id}/read`,
    );
    return response.data;
  },
};
