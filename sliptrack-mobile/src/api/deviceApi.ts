import { apiClient } from "./client";
import type { UserDevice, UserDeviceRequest } from "../types/device";

export const deviceApi = {
  async register(request: UserDeviceRequest) {
    const response = await apiClient.post<UserDevice>("/devices", request);
    return response.data;
  },
  async delete(id: number) {
    await apiClient.delete(`/devices/${id}`);
  },
};
