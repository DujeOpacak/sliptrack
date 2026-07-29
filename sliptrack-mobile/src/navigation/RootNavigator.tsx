import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import AppTabNavigator from "./AppTabNavigator";
import PropertyFormScreen from "../screens/app/PropertyFormScreen";
import PaymentSlipFormScreen from "../screens/app/PaymentSlipFormScreen";
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
    <AppStack.Navigator>
      <AppStack.Screen
        name="AppTabs"
        component={AppTabNavigator}
        options={{ headerShown: false }}
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
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
