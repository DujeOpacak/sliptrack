import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import AppTabNavigator from "./AppTabNavigator";
import PropertyFormScreen from "../screens/app/PropertyFormScreen";
import PaymentSlipFormScreen from "../screens/app/PaymentSlipFormScreen";
import AddChoiceScreen from "../screens/app/AddChoiceScreen";
import ScanScreen from "../screens/app/ScanScreen";
import OcrScanScreen from "../screens/app/OcrScanScreen";
import NotificationListScreen from "../screens/app/NotificationListScreen";
import { navigationRef } from "./navigationRef";
import type { AuthStackParamList, AppStackParamList } from "./types";

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <NotificationProvider>
      <AppNavigatorStack />
    </NotificationProvider>
  );
}

function AppNavigatorStack() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen
        name="AppTabs"
        component={AppTabNavigator}
        options={{ headerShown: false }}
      />
      <AppStack.Screen
        name="AddChoice"
        component={AddChoiceScreen}
        options={{ title: "Nova uplatnica", presentation: "modal" }}
      />
      <AppStack.Screen
        name="ScanPaymentSlip"
        component={ScanScreen}
        options={{ title: "Skeniranje", presentation: "modal" }}
      />
      <AppStack.Screen
        name="OcrScanPaymentSlip"
        component={OcrScanScreen}
        options={{ title: "OCR skeniranje", presentation: "modal" }}
      />
      <AppStack.Screen
        name="PropertyForm"
        component={PropertyFormScreen}
        options={{ title: "Nekretnina", presentation: "modal" }}
      />
      <AppStack.Screen
        name="PaymentSlipForm"
        component={PaymentSlipFormScreen}
        options={{ title: "Uplatnica", presentation: "modal" }}
      />
      <AppStack.Screen
        name="Notifications"
        component={NotificationListScreen}
        options={{ title: "Obavijesti" }}
      />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
