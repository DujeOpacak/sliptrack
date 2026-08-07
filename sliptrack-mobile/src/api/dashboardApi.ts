import { apiClient } from "./client";
import type {
  CategoryAmount,
  DashboardSummary,
  PropertySubCategoryAmount,
  ProviderAmount,
  SubCategoryAmount,
  TimelinePoint,
} from "../types/dashboard";

export interface SubCategoryBreakdownFilters {
  categoryId?: number;
  propertyId?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface PropertyComparisonFilters {
  dueDateFrom?: string;
  dueDateTo?: string;
}

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
  async getBySubCategory(filters?: SubCategoryBreakdownFilters) {
    const response = await apiClient.get<SubCategoryAmount[]>(
      "/dashboard/by-subcategory",
      { params: filters },
    );
    return response.data;
  },
  async getPropertyComparison(filters?: PropertyComparisonFilters) {
    const response = await apiClient.get<PropertySubCategoryAmount[]>(
      "/dashboard/property-comparison",
      { params: filters },
    );
    return response.data;
  },
  async getByProvider() {
    const response = await apiClient.get<ProviderAmount[]>(
      "/dashboard/by-provider",
    );
    return response.data;
  },
  async getTimeline(months?: number) {
    const response = await apiClient.get<TimelinePoint[]>(
      "/dashboard/timeline",
      { params: { months } },
    );
    return response.data;
  },
};
