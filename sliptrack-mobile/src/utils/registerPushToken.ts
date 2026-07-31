import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import type { DevicePlatform } from "../types/device";

export interface PushRegistration {
  deviceToken: string;
  platform: DevicePlatform;
}

export async function getExpoPushRegistration(): Promise<PushRegistration | null> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  if (!projectId) {
    return null;
  }

  const { data: deviceToken } = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  return {
    deviceToken,
    platform: Platform.OS === "ios" ? "IOS" : "ANDROID",
  };
}
