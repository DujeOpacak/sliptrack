import { apiClient } from "./client";
import type { Category, SubCategory } from "../types/category";

export const categoryApi = {
  async getAll() {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data;
  },
  async getSubCategories(categoryId?: number) {
    const response = await apiClient.get<SubCategory[]>("/subcategories", {
      params: categoryId ? { categoryId } : undefined,
    });
    return response.data;
  },
};
