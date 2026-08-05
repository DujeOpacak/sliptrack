import { apiClient } from "./client";
import type { Category, CategoryRequest, SubCategory, SubCategoryRequest } from "../types/category";

export const categoryApi = {
  async getAll() {
    const response = await apiClient.get<Category[]>("/categories");
    return response.data;
  },
  async create(request: CategoryRequest) {
    const response = await apiClient.post<Category>("/categories", request);
    return response.data;
  },
  async update(id: number, request: CategoryRequest) {
    const response = await apiClient.put<Category>(`/categories/${id}`, request);
    return response.data;
  },
  async delete(id: number) {
    await apiClient.delete(`/categories/${id}`);
  },

  async getSubCategories(categoryId?: number) {
    const response = await apiClient.get<SubCategory[]>("/subcategories", {
      params: categoryId ? { categoryId } : undefined,
    });
    return response.data;
  },
  async createSubCategory(request: SubCategoryRequest) {
    const response = await apiClient.post<SubCategory>("/subcategories", request);
    return response.data;
  },
  async updateSubCategory(id: number, request: SubCategoryRequest) {
    const response = await apiClient.put<SubCategory>(`/subcategories/${id}`, request);
    return response.data;
  },
  async deleteSubCategory(id: number) {
    await apiClient.delete(`/subcategories/${id}`);
  },
};
