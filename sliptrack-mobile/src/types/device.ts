export type DevicePlatform = "ANDROID" | "IOS";

export interface UserDevice {
  id: number;
  deviceToken: string;
  platform: DevicePlatform;
  createdAt: string;
  updatedAt: string;
}

export interface UserDeviceRequest {
  deviceToken: string;
  platform: DevicePlatform;
}
