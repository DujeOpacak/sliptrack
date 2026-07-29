import { apiClient } from "./client";
import type {
  PaymentSlip,
  PaymentSlipRequest,
  PaymentStatus,
} from "../types/paymentSlip";

export const paymentSlipApi = {
  async getAll() {
    const response = await apiClient.get<PaymentSlip[]>("/payment-slips");
    return response.data;
  },
  async getById(id: number) {
    const response = await apiClient.get<PaymentSlip>(`/payment-slips/${id}`);
    return response.data;
  },
  async create(request: PaymentSlipRequest) {
    const response = await apiClient.post<PaymentSlip>(
      "/payment-slips",
      request,
    );
    return response.data;
  },
  async update(id: number, request: PaymentSlipRequest) {
    const response = await apiClient.put<PaymentSlip>(
      `/payment-slips/${id}`,
      request,
    );
    return response.data;
  },
  async delete(id: number) {
    await apiClient.delete(`/payment-slips/${id}`);
  },
  async updateStatus(id: number, status: PaymentStatus, paidAt?: string) {
    const response = await apiClient.patch<PaymentSlip>(
      `/payment-slips/${id}/status`,
      { status, paidAt },
    );
    return response.data;
  },
  async uploadImage(
    id: number,
    image: { uri: string; mimeType?: string; fileName?: string },
  ) {
    const fileName = image.fileName ?? image.uri.split("/").pop() ?? "photo.jpg";
    const formData = new FormData();
    formData.append("file", {
      uri: image.uri,
      name: fileName,
      type: image.mimeType ?? "image/jpeg",
    } as any);

    const response = await apiClient.post<PaymentSlip>(
      `/payment-slips/${id}/image`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return response.data;
  },
};
