import React from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import HomeScreen from "../screens/app/HomeScreen";
import PropertyListScreen from "../screens/app/PropertyListScreen";
import PropertyFormScreen from "../screens/app/PropertyFormScreen";
import PaymentSlipListScreen from "../screens/app/PaymentSlipListScreen";
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
      <AppStack.Screen name="Home" component={HomeScreen} />
      <AppStack.Screen
        name="PropertyList"
        component={PropertyListScreen}
        options={{ title: "Nekretnine" }}
      />
      <AppStack.Screen
        name="PropertyForm"
        component={PropertyFormScreen}
        options={{ title: "Nekretnina" }}
      />
      <AppStack.Screen
        name="PaymentSlipList"
        component={PaymentSlipListScreen}
        options={{ title: "Uplatnice" }}
      />
      <AppStack.Screen
        name="PaymentSlipForm"
        component={PaymentSlipFormScreen}
        options={{ title: "Uplatnica" }}
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
