import { apiClient } from "./client";
import type { Property, PropertyRequest } from "../types/property";

export const propertyApi = {
  async getAll() {
    const response = await apiClient.get<Property[]>("/properties");
    return response.data;
  },
  async getById(id: number) {
    const response = await apiClient.get<Property>(`/properties/${id}`);
    return response.data;
  },
  async create(request: PropertyRequest) {
    const response = await apiClient.post<Property>("/properties", request);
    return response.data;
  },
  async update(id: number, request: PropertyRequest) {
    const response = await apiClient.put<Property>(`/properties/${id}`, request);
    return response.data;
  },
  async delete(id: number) {
    await apiClient.delete(`/properties/${id}`);
  },
};
