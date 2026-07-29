import { apiClient } from "./client";
import type {
  CategoryAmount,
  DashboardSummary,
  ProviderAmount,
  TimelinePoint,
} from "../types/dashboard";

export const dashboardApi = {
  async getSummary() {
    const response = await apiClient.get<DashboardSummary>(
      "/dashboard/summary",
    );
    return response.data;
  },
  async getByCategory() {
    const response = await apiClient.get<CategoryAmount[]>(
      "/dashboard/by-category",
    );
    return response.data;
  },
  async getByProvider() {
    const response = await apiClient.get<ProviderAmount[]>(
      "/dashboard/by-provider",
    );
    return response.data;
  },
  async getTimeline() {
    const response = await apiClient.get<TimelinePoint[]>(
      "/dashboard/timeline",
    );
    return response.data;
  },
};
