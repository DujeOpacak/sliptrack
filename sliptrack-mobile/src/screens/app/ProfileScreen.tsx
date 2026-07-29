import { View, Text, Pressable, StyleSheet } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/colors";

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bok, {user?.firstName}!</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>
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
  button: {
    backgroundColor: colors.critical,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
