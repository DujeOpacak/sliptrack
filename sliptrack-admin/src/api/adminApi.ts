import { apiClient } from "./client";
import type { AdminCategoryCount, AdminStats, AdminSubCategoryCount, AdminUser } from "../types/admin";

export const adminApi = {
  async getUsers() {
    const response = await apiClient.get<AdminUser[]>("/admin/users");
    return response.data;
  },
  async activate(id: number) {
    const response = await apiClient.patch<AdminUser>(`/admin/users/${id}/activate`);
    return response.data;
  },
  async deactivate(id: number) {
    const response = await apiClient.patch<AdminUser>(`/admin/users/${id}/deactivate`);
    return response.data;
  },
  async getStats() {
    const response = await apiClient.get<AdminStats>("/admin/stats");
    return response.data;
  },
  async getCategoryStats() {
    const response = await apiClient.get<AdminCategoryCount[]>("/admin/categories/stats");
    return response.data;
  },
  async getSubCategoryStats() {
    const response = await apiClient.get<AdminSubCategoryCount[]>("/admin/subcategories/stats");
    return response.data;
  },
};
