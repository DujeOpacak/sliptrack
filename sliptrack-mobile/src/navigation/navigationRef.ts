import { createNavigationContainerRef } from "@react-navigation/native";
import type { AppStackParamList } from "./types";

// Lets code outside a screen component (e.g. NotificationContext's push-tap handler)
// navigate without a `navigation` prop — the officially recommended pattern for
// responding to events like push notifications. Attached via `ref` on
// <NavigationContainer> in RootNavigator.tsx.
export const navigationRef = createNavigationContainerRef<AppStackParamList>();
