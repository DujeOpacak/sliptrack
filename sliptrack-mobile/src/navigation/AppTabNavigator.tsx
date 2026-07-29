import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import DashboardScreen from "../screens/app/DashboardScreen";
import PaymentSlipListScreen from "../screens/app/PaymentSlipListScreen";
import PropertyListScreen from "../screens/app/PropertyListScreen";
import ProfileScreen from "../screens/app/ProfileScreen";
import CenterAddButton from "../components/CenterAddButton";
import { colors } from "../theme/colors";
import type { AppTabParamList, AppStackParamList } from "./types";

export type AppTabScreenProps<T extends keyof AppTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;

const Tab = createBottomTabNavigator<AppTabParamList>();

function EmptyScreen() {
  return <View />;
}

export default function AppTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PaymentSlipList"
        component={PaymentSlipListScreen}
        options={{
          title: "Uplatnice",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AddPaymentSlip"
        component={EmptyScreen}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => <CenterAddButton onPress={props.onPress} />,
        }}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.getParent<NativeStackScreenProps<AppStackParamList>["navigation"]>()?.navigate(
              "PaymentSlipForm",
              undefined,
            );
          },
        })}
      />
      <Tab.Screen
        name="PropertyList"
        component={PropertyListScreen}
        options={{
          title: "Nekretnine",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
