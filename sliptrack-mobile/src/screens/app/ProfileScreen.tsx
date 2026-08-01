import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { colors } from "../../theme/colors";
import type { AppTabScreenProps } from "../../navigation/AppTabNavigator";

type Props = AppTabScreenProps<"Profile">;

export default function ProfileScreen({ navigation }: Props) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bok, {user?.firstName}!</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>
      <Pressable
        style={styles.secondaryButton}
        onPress={() => navigation.navigate("Notifications")}
      >
        <Text style={styles.secondaryButtonText}>
          Obavijesti{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Text>
      </Pressable>
      <Pressable style={styles.button} onPress={() => logout()}>
        <Text style={styles.buttonText}>Odjava</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 32 },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  button: {
    backgroundColor: colors.critical,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
